using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Formatters;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
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

        // When running under .NET 10 runtime (DOTNET_ROLL_FORWARD=LatestMajor on a machine
        // without .NET 8), System.Text.Json's async PipeWriter path requires PipeWriter.UnflushedBytes
        // which the .NET 8 TestServer's ResponseBodyPipeWriter does not implement.
        // Replacing SystemTextJsonOutputFormatter with a stream-based wrapper avoids the PipeWriter
        // code path entirely. CI (which installs .NET 8 cleanly) is unaffected.
        builder.ConfigureServices(services =>
        {
            services.Configure<MvcOptions>(options =>
            {
                var existingFormatter = options.OutputFormatters
                    .OfType<SystemTextJsonOutputFormatter>()
                    .FirstOrDefault();

                if (existingFormatter is not null)
                {
                    var index = options.OutputFormatters.IndexOf(existingFormatter);
                    options.OutputFormatters[index] = new StreamCompatibleSystemTextJsonOutputFormatter(
                        existingFormatter.SerializerOptions);
                }
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

/// <summary>
/// A drop-in replacement for <see cref="SystemTextJsonOutputFormatter"/> that writes
/// JSON to the response <see cref="System.IO.Stream"/> rather than the PipeWriter.
/// This avoids the <c>PipeWriter.UnflushedBytes</c> requirement introduced in .NET 10's
/// System.Text.Json when running net8.0 tests under a newer runtime.
/// </summary>
internal sealed class StreamCompatibleSystemTextJsonOutputFormatter : TextOutputFormatter
{
    private readonly System.Text.Json.JsonSerializerOptions _options;

    public StreamCompatibleSystemTextJsonOutputFormatter(System.Text.Json.JsonSerializerOptions options)
    {
        _options = options;
        SupportedMediaTypes.Add("application/json");
        SupportedMediaTypes.Add("text/json");
        SupportedMediaTypes.Add("application/*+json");
        SupportedEncodings.Add(System.Text.Encoding.UTF8);
        SupportedEncodings.Add(System.Text.Encoding.Unicode);
    }

    public override async Task WriteResponseBodyAsync(
        OutputFormatterWriteContext context, System.Text.Encoding selectedEncoding)
    {
        var httpContext = context.HttpContext;
        var json = System.Text.Json.JsonSerializer.Serialize(context.Object, context.ObjectType!, _options);
        await httpContext.Response.WriteAsync(json, selectedEncoding);
    }
}
