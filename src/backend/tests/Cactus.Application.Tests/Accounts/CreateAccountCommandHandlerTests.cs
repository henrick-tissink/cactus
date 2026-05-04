using Cactus.Application.Common.Interfaces;
using Cactus.Application.Features.Accounts.Commands;
using Cactus.Application.Tests._Common;
using Cactus.Domain.Enums;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Cactus.Application.Tests.Accounts;

public class CreateAccountCommandHandlerTests : HandlerTestBase
{
    private readonly ICurrentUserService _currentUser = Substitute.For<ICurrentUserService>();

    [Fact]
    public async Task CreateAccount_persists_exactly_one_account_scoped_to_requesting_user()
    {
        // Arrange
        var user = TestDataFactory.User();
        Context.Users.Add(user);
        await Context.SaveChangesAsync(default);
        _currentUser.UserId.Returns(user.Id);

        var handler = new CreateAccountCommandHandler(Context, _currentUser);
        var command = new CreateAccountCommand(
            Name: "My Cheque Account",
            AccountType: AccountType.Cheque,
            Balance: 5000m,
            Currency: "ZAR"
        );

        // Act
        var accountId = await handler.Handle(command, CancellationToken.None);

        // Assert
        var accounts = Context.Accounts.Where(a => a.UserId == user.Id).ToList();
        accounts.Should().ContainSingle();
        accounts[0].Id.Should().Be(accountId);
        accounts[0].Name.Should().Be("My Cheque Account");
        accounts[0].Balance.Should().Be(5000m);
        accounts[0].AccountType.Should().Be(AccountType.Cheque);
    }
}
