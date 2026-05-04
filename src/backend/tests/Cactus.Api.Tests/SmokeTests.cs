using System.Net;
using Cactus.Api.Tests.Fixtures;
using FluentAssertions;
using Xunit;

namespace Cactus.Api.Tests;

[Collection(CactusCollection.Name)]
public class SmokeTests
{
    private readonly CactusApiFactory _factory;

    public SmokeTests(CactusApiFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Health_endpoint_returns_200()
    {
        var client = _factory.CreateClient();

        var response = await client.GetAsync("/health");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }
}
