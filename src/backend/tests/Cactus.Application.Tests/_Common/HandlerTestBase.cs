using Cactus.Infrastructure.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Query;
using Microsoft.EntityFrameworkCore.Query.SqlExpressions;
using Microsoft.EntityFrameworkCore.Storage;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using Microsoft.Extensions.DependencyInjection;
using System.Reflection;

namespace Cactus.Application.Tests._Common;

/// <summary>
/// Base class for handler unit tests. Owns a SQLite in-memory database for the
/// lifetime of the test class instance. EF schema is created via
/// <c>EnsureCreated</c> from the model (no migrations applied — Postgres-specific
/// migration SQL is intentionally bypassed).
/// </summary>
public abstract class HandlerTestBase : IDisposable
{
    private readonly SqliteConnection _connection;
    protected CactusDbContext Context { get; }

    protected HandlerTestBase()
    {
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var optionsBuilder = new DbContextOptionsBuilder<CactusDbContext>()
            .UseSqlite(_connection);

        // Register the Math.Abs → SQLite abs() plugin so that GROUP BY + Sum(Math.Abs(...))
        // queries (used in GetCurrentSpendingPlanQueryHandler) translate correctly.
        var extension = optionsBuilder.Options.FindExtension<MathAbsExtension>() ?? new MathAbsExtension();
        ((IDbContextOptionsBuilderInfrastructure)optionsBuilder).AddOrUpdateExtension(extension);

        Context = new TestCactusDbContext(optionsBuilder.Options);
        Context.Database.EnsureCreated();
    }

    public void Dispose()
    {
        Context.Dispose();
        _connection.Dispose();
        GC.SuppressFinalize(this);
    }

    /// <summary>
    /// Test-only subclass that remaps all decimal properties to REAL (double) so
    /// SQLite can ORDER BY them inside correlated Include subqueries.
    /// </summary>
    private sealed class TestCactusDbContext : CactusDbContext
    {
        public TestCactusDbContext(DbContextOptions<CactusDbContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // SQLite maps decimal+HasPrecision as TEXT, which cannot be ordered inside
            // correlated Include subqueries. Override all decimal properties to use
            // double (REAL) so ORDER BY works in test queries.
            var decimalConverter = new ValueConverter<decimal, double>(
                v => (double)v,
                v => (decimal)v);

            foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            {
                foreach (var property in entityType.GetProperties())
                {
                    if (property.ClrType == typeof(decimal) || property.ClrType == typeof(decimal?))
                    {
                        property.SetValueConverter(decimalConverter);
                    }
                }
            }
        }
    }

    /// <summary>
    /// Custom EF options extension that injects <see cref="MathAbsTranslatorPlugin"/>
    /// into the provider service collection so the SQLite method-call translator chain
    /// picks up the Math.Abs(decimal/double) → abs() mapping.
    /// </summary>
    private sealed class MathAbsExtension : IDbContextOptionsExtension
    {
        public DbContextOptionsExtensionInfo Info => new ExtensionInfo(this);

        public void ApplyServices(IServiceCollection services)
        {
            // Register as an instance (no DI dependencies needed) to avoid
            // EF's internal service provider circular dependency issues.
            services.AddSingleton<IMethodCallTranslatorPlugin>(new MathAbsTranslatorPlugin());
        }

        public void Validate(IDbContextOptions options) { }

        private sealed class ExtensionInfo : DbContextOptionsExtensionInfo
        {
            public ExtensionInfo(IDbContextOptionsExtension ext) : base(ext) { }
            public override bool IsDatabaseProvider => false;
            public override string LogFragment => "MathAbsPlugin";
            public override int GetServiceProviderHashCode() => 12345;
            public override bool ShouldUseSameServiceProvider(DbContextOptionsExtensionInfo other)
                => other is ExtensionInfo;
            public override void PopulateDebugInfo(IDictionary<string, string> debugInfo)
                => debugInfo["MathAbsPlugin:Enabled"] = "1";
        }
    }

    /// <summary>
    /// EF Core IMethodCallTranslatorPlugin that maps Math.Abs(decimal/double/...)
    /// to the SQLite built-in abs() SQL function. Constructs <see cref="SqlFunctionExpression"/>
    /// directly (no ISqlExpressionFactory needed) to avoid circular DI issues.
    /// </summary>
    private sealed class MathAbsTranslatorPlugin : IMethodCallTranslatorPlugin
    {
        public MathAbsTranslatorPlugin() { }

        public IEnumerable<IMethodCallTranslator> Translators => new[] { new Translator() };

        private sealed class Translator : IMethodCallTranslator
        {
            public SqlExpression? Translate(
                SqlExpression? instance,
                MethodInfo method,
                IReadOnlyList<SqlExpression> arguments,
                IDiagnosticsLogger<DbLoggerCategory.Query> logger)
            {
                if (method.DeclaringType == typeof(Math)
                    && method.Name == nameof(Math.Abs)
                    && arguments.Count == 1)
                {
                    // Use SqlFunctionExpression directly — no ISqlExpressionFactory needed.
                    // Constructor: (string name, IEnumerable<SqlExpression> arguments,
                    //   bool nullable, IEnumerable<bool> argumentsPropagateNullability,
                    //   Type type, RelationalTypeMapping? typeMapping)
                    // typeMapping = null lets EF infer the mapping from the return type.
                    return new SqlFunctionExpression(
                        "abs",
                        arguments,
                        true,
                        new[] { true },
                        typeof(double),
                        null);
                }
                return null;
            }
        }
    }
}
