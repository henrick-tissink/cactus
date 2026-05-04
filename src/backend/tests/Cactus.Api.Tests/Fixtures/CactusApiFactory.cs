using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Testcontainers.PostgreSql;
using Xunit;

namespace Cactus.Api.Tests.Fixtures;

/// <summary>
/// Boots a real Postgres container and a TestServer running the full Cactus.Api
/// pipeline. Shared across the test assembly via <see cref="CactusCollection"/>.
/// </summary>
public class CactusApiFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16-alpine")
        .WithDatabase("cactus_test")
        .WithUsername("cactus")
        .WithPassword("cactus_test")
        .Build();

    public string ConnectionString => _postgres.GetConnectionString();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        builder.ConfigureAppConfiguration((_, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = ConnectionString,
                ["Jwt:Key"] = "TestOnlyJwtKey_AtLeast32Characters_NeverUseInProduction!",
                ["Jwt:Issuer"] = "Cactus",
                ["Jwt:Audience"] = "CactusApp",
                ["Cors:AllowedOrigins:0"] = "http://localhost",
            });
        });
    }

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
    }

    public new async Task DisposeAsync()
    {
        await _postgres.DisposeAsync();
        await base.DisposeAsync();
    }
}
