using Cactus.Application.Common.Interfaces;
using Cactus.Application.Features.Auth.Commands;
using Cactus.Application.Tests._Common;
using Cactus.Domain.Entities;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Cactus.Application.Tests.Auth;

public class LoginCommandHandlerTests : HandlerTestBase
{
    private readonly IPasswordHasher _passwordHasher = Substitute.For<IPasswordHasher>();
    private readonly IJwtService _jwtService = Substitute.For<IJwtService>();

    private LoginCommandHandler BuildHandler()
    {
        _jwtService.GenerateAccessToken(Arg.Any<User>()).Returns("access-token");
        _jwtService.GenerateRefreshToken().Returns("refresh-token-value");
        return new LoginCommandHandler(Context, _passwordHasher, _jwtService);
    }

    [Fact]
    public async Task Login_with_valid_credentials_returns_tokens()
    {
        var user = TestDataFactory.User("alice@example.test");
        Context.Users.Add(user);
        await Context.SaveChangesAsync(default);

        // IPasswordHasher.Verify(string password, string hash) — plain-text first, hash second
        _passwordHasher.Verify("Password123!", user.PasswordHash).Returns(true);
        var handler = BuildHandler();

        var result = await handler.Handle(
            new LoginCommand("alice@example.test", "Password123!"),
            CancellationToken.None);

        result.AccessToken.Should().Be("access-token");
        // Handler lowercases email before returning
        result.Email.Should().Be("alice@example.test");
    }

    [Fact]
    public async Task Login_with_wrong_password_throws_unauthorized()
    {
        var user = TestDataFactory.User("alice@example.test");
        Context.Users.Add(user);
        await Context.SaveChangesAsync(default);

        // IPasswordHasher.Verify(string password, string hash) — plain-text first, hash second
        _passwordHasher.Verify("WrongPassword!", Arg.Any<string>()).Returns(false);
        var handler = BuildHandler();

        var act = () => handler.Handle(
            new LoginCommand("alice@example.test", "WrongPassword!"),
            CancellationToken.None);

        await act.Should().ThrowAsync<UnauthorizedAccessException>();
    }
}
