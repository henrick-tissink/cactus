using Cactus.Application.Common.Interfaces;
using Cactus.Application.Features.Accounts.Queries;
using Cactus.Application.Tests._Common;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Cactus.Application.Tests.Accounts;

public class GetAccountsQueryHandlerTests : HandlerTestBase
{
    private readonly ICurrentUserService _currentUser = Substitute.For<ICurrentUserService>();

    [Fact]
    public async Task GetAccounts_returns_only_accounts_belonging_to_requesting_user()
    {
        // Arrange: two users, each with one account
        var u1 = TestDataFactory.User();
        var u2 = TestDataFactory.User();
        Context.Users.AddRange(u1, u2);
        await Context.SaveChangesAsync(default);

        var accountU1 = TestDataFactory.Account(u1.Id);
        var accountU2 = TestDataFactory.Account(u2.Id);
        Context.Accounts.AddRange(accountU1, accountU2);
        await Context.SaveChangesAsync(default);

        // Current user is u1
        _currentUser.UserId.Returns(u1.Id);

        var handler = new GetAccountsQueryHandler(Context, _currentUser);

        // Act
        var result = await handler.Handle(new GetAccountsQuery(), CancellationToken.None);

        // Assert: only u1's account is returned
        result.Should().ContainSingle();
        result[0].Id.Should().Be(accountU1.Id);
        result[0].Name.Should().Be(accountU1.Name);
    }
}
