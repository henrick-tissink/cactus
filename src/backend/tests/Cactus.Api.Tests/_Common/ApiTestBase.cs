using Cactus.Api.Tests.Fixtures;
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
