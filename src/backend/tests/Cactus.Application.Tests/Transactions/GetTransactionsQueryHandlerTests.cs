using Cactus.Application.Common.Interfaces;
using Cactus.Application.Features.Transactions.Queries;
using Cactus.Application.Tests._Common;
using Cactus.Domain.Entities;
using Cactus.Domain.Enums;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Cactus.Application.Tests.Transactions;

public class GetTransactionsQueryHandlerTests : HandlerTestBase
{
    private readonly ICurrentUserService _currentUser = Substitute.For<ICurrentUserService>();

    [Fact]
    public async Task GetTransactions_date_range_filter_returns_only_transactions_within_window()
    {
        // Arrange
        var user = TestDataFactory.User();
        Context.Users.Add(user);
        await Context.SaveChangesAsync(default);

        var account = TestDataFactory.Account(user.Id);
        Context.Accounts.Add(account);
        await Context.SaveChangesAsync(default);

        var windowStart = new DateTime(2025, 3, 1, 0, 0, 0, DateTimeKind.Utc);
        var windowEnd   = new DateTime(2025, 3, 31, 23, 59, 59, DateTimeKind.Utc);

        // Transaction inside the requested window
        var txInWindow = new Transaction
        {
            AccountId       = account.Id,
            Amount          = 100m,
            Type            = TransactionType.Debit,
            Description     = "In-window purchase",
            TransactionDate = new DateTime(2025, 3, 15, 12, 0, 0, DateTimeKind.Utc),
            IsManual        = true,
        };

        // Transaction outside the requested window (February)
        var txOutside = new Transaction
        {
            AccountId       = account.Id,
            Amount          = 200m,
            Type            = TransactionType.Debit,
            Description     = "Out-of-window purchase",
            TransactionDate = new DateTime(2025, 2, 10, 12, 0, 0, DateTimeKind.Utc),
            IsManual        = true,
        };

        Context.Transactions.AddRange(txInWindow, txOutside);
        await Context.SaveChangesAsync(default);

        _currentUser.UserId.Returns(user.Id);

        var handler = new GetTransactionsQueryHandler(Context, _currentUser);
        var query   = new GetTransactionsQuery(StartDate: windowStart, EndDate: windowEnd);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.TotalCount.Should().Be(1);
        result.Items.Should().ContainSingle();
        result.Items[0].Id.Should().Be(txInWindow.Id);
        result.Items[0].Description.Should().Be("In-window purchase");
    }
}
