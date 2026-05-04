using System.Net;
using System.Net.Http.Json;
using Cactus.Api.Tests._Common;
using Cactus.Api.Tests.Fixtures;
using FluentAssertions;
using Xunit;

namespace Cactus.Api.Tests.Auth;

public class AuthEndpointTests : ApiTestBase
{
    public AuthEndpointTests(CactusApiFactory factory) : base(factory) { }

    [Fact]
    public async Task Register_with_valid_input_returns_200_and_access_token()
    {
        var response = await Client.PostAsJsonAsync("/api/auth/register", new
        {
            email = "henrick+test@cactus.app",
            password = "Password123!",
            firstName = "Henrick",
            lastName = "Tissink",
        });

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        var body = await response.Content.ReadFromJsonAsync<RegisterResponse>();
        body.Should().NotBeNull();
        body!.Email.Should().Be("henrick+test@cactus.app");
        body.AccessToken.Should().NotBeNullOrWhiteSpace();
    }

    private record RegisterResponse(string UserId, string Email, string AccessToken);
}
