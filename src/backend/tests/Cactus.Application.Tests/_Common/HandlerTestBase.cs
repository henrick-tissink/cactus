using Cactus.Infrastructure.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

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

        Context = new CactusDbContext(options);
        Context.Database.EnsureCreated();
    }

    public void Dispose()
    {
        Context.Dispose();
        _connection.Dispose();
        GC.SuppressFinalize(this);
    }
}
