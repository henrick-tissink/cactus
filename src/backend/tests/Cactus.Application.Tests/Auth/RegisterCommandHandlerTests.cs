using Cactus.Application.Common.Interfaces;
using Cactus.Application.Features.Auth.Commands;
using Cactus.Application.Tests._Common;
using Cactus.Domain.Entities;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Cactus.Application.Tests.Auth;

public class RegisterCommandHandlerTests : HandlerTestBase
{
    private readonly IPasswordHasher _passwordHasher = Substitute.For<IPasswordHasher>();
    private readonly IJwtService _jwtService = Substitute.For<IJwtService>();
    private readonly IEmailService _emailService = Substitute.For<IEmailService>();

    private RegisterCommandHandler BuildHandler()
    {
        _passwordHasher.Hash(Arg.Any<string>()).Returns("hashed-password");
        _jwtService.GenerateAccessToken(Arg.Any<User>()).Returns("access-token");
        _jwtService.GenerateRefreshToken().Returns("refresh-token-value");
        return new RegisterCommandHandler(Context, _passwordHasher, _jwtService, _emailService);
    }

    [Fact]
    public async Task Register_with_new_email_persists_user_and_returns_tokens()
    {
        var handler = BuildHandler();

        var result = await handler.Handle(
            new RegisterCommand("new@example.test", "Password123!", "Alice", "Adams"),
            CancellationToken.None);

        // Handler lowercases the email before persisting and returning
        result.Email.Should().Be("new@example.test");
        result.AccessToken.Should().Be("access-token");
        result.RefreshToken.Should().Be("refresh-token-value");
        Context.Users.Should().ContainSingle(u => u.Email == "new@example.test");
        await _emailService.Received(1).SendEmailVerificationAsync(
            "new@example.test", Arg.Any<string>(), Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Register_with_existing_email_throws_invalid_operation()
    {
        Context.Users.Add(TestDataFactory.User("dup@example.test"));
        await Context.SaveChangesAsync(default);
        var handler = BuildHandler();

        var act = () => handler.Handle(
            new RegisterCommand("dup@example.test", "Password123!", null, null),
            CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("Email already registered");
    }
}
