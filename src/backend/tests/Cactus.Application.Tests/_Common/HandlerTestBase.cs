using Cactus.Infrastructure.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

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

        var options = new DbContextOptionsBuilder<CactusDbContext>()
            .UseSqlite(_connection)
            .Options;

        Context = new TestCactusDbContext(options);
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
}
