using Cactus.Api.Tests.Fixtures;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Respawn;
using Xunit;

namespace Cactus.Api.Tests._Common;

[Collection(CactusCollection.Name)]
public abstract class ApiTestBase : IAsyncLifetime
{
    protected CactusApiFactory Factory { get; }
    protected HttpClient Client { get; }

    private Respawner? _respawner;

    protected ApiTestBase(CactusApiFactory factory)
    {
        Factory = factory;
        Client = factory.CreateClient();
    }

    public async Task InitializeAsync()
    {
        // Defense-in-depth: assert the configured DB is the testcontainer.
        // Prevents future config-source reordering from silently letting tests hit a live DB.
        var configured = Factory.Services.GetRequiredService<IConfiguration>().GetConnectionString("DefaultConnection");
        if (configured != Factory.ConnectionString)
        {
            throw new InvalidOperationException(
                $"Refusing to run: configured DefaultConnection does not match the testcontainer. " +
                $"Got '{configured}', expected '{Factory.ConnectionString}'.");
        }

        await using var connection = new NpgsqlConnection(Factory.ConnectionString);
        await connection.OpenAsync();

        _respawner ??= await Respawner.CreateAsync(connection, new RespawnerOptions
        {
            DbAdapter = DbAdapter.Postgres,
            SchemasToInclude = new[] { "public" },
            TablesToIgnore = new Respawn.Graph.Table[] { "__EFMigrationsHistory" },
        });

        await _respawner.ResetAsync(connection);
    }

    public Task DisposeAsync() => Task.CompletedTask;
}
