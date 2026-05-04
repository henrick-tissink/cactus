using Cactus.Application.Common.Interfaces;
using Cactus.Application.Features.Transactions.Queries;
using Cactus.Application.Tests._Common;
using Cactus.Domain.Entities;
using Cactus.Domain.Enums;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Cactus.Application.Tests.Transactions;

public class GetSimilarTransactionsCountQueryHandlerTests : HandlerTestBase
{
    private readonly ICurrentUserService _currentUser = Substitute.For<ICurrentUserService>();

    [Fact]
    public async Task GetSimilarTransactionsCount_returns_count_of_matching_unclassified_transactions()
    {
        // Arrange
        var user = TestDataFactory.User();
        Context.Users.Add(user);
        await Context.SaveChangesAsync(default);

        var account = TestDataFactory.Account(user.Id);
        Context.Accounts.Add(account);
        await Context.SaveChangesAsync(default);

        var targetTx = new Transaction
        {
            AccountId       = account.Id,
            Amount          = 50m,
            Type            = TransactionType.Debit,
            Description     = "Netflix",
            MerchantName    = "NETFLIX.COM",
            TransactionDate = DateTime.UtcNow,
            IsClassified    = true,
            IsManual        = true,
        };

        // Two similar unclassified transactions with same merchant
        var similar1 = new Transaction
        {
            AccountId       = account.Id,
            Amount          = 50m,
            Type            = TransactionType.Debit,
            Description     = "Netflix",
            MerchantName    = "NETFLIX.COM",
            TransactionDate = DateTime.UtcNow.AddDays(-30),
            IsClassified    = false,
            IsManual        = true,
        };

        var similar2 = new Transaction
        {
            AccountId       = account.Id,
            Amount          = 50m,
            Type            = TransactionType.Debit,
            Description     = "Netflix",
            MerchantName    = "NETFLIX.COM",
            TransactionDate = DateTime.UtcNow.AddDays(-60),
            IsClassified    = false,
            IsManual        = true,
        };

        // Unrelated transaction
        var unrelated = new Transaction
        {
            AccountId       = account.Id,
            Amount          = 200m,
            Type            = TransactionType.Debit,
            Description     = "Groceries",
            TransactionDate = DateTime.UtcNow.AddDays(-5),
            IsClassified    = false,
            IsManual        = true,
        };

        Context.Transactions.AddRange(targetTx, similar1, similar2, unrelated);
        await Context.SaveChangesAsync(default);

        _currentUser.UserId.Returns(user.Id);

        var handler = new GetSimilarTransactionsCountQueryHandler(Context, _currentUser);
        var query   = new GetSimilarTransactionsCountQuery(targetTx.Id);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.Count.Should().Be(2);
        result.MatchPattern.Should().Be("NETFLIX.COM");
    }
}
