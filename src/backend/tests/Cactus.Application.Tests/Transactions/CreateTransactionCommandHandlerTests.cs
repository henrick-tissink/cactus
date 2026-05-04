using Cactus.Application.Common.Interfaces;
using Cactus.Application.Features.Transactions.Commands;
using Cactus.Application.Tests._Common;
using Cactus.Domain.Enums;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Cactus.Application.Tests.Transactions;

public class CreateTransactionCommandHandlerTests : HandlerTestBase
{
    private readonly ICurrentUserService _currentUser = Substitute.For<ICurrentUserService>();
    private readonly IAutoClassificationService _autoClassifier = Substitute.For<IAutoClassificationService>();

    [Fact]
    public async Task CreateTransaction_persists_transaction_scoped_to_users_account()
    {
        // Arrange
        var user = TestDataFactory.User();
        Context.Users.Add(user);
        await Context.SaveChangesAsync(default);

        var account = TestDataFactory.Account(user.Id);
        Context.Accounts.Add(account);
        await Context.SaveChangesAsync(default);

        _currentUser.UserId.Returns(user.Id);
        _autoClassifier.ClassifyAsync(default, default!, default, default)
            .ReturnsForAnyArgs((AutoClassificationResult?)null);

        var handler = new CreateTransactionCommandHandler(Context, _currentUser, _autoClassifier);
        var command = new CreateTransactionCommand(
            AccountId: account.Id,
            Amount: 250m,
            Type: TransactionType.Debit,
            Description: "Grocery store purchase",
            TransactionDate: DateTime.UtcNow
        );

        // Act
        var transactionId = await handler.Handle(command, CancellationToken.None);

        // Assert
        var transactions = Context.Transactions.Where(t => t.AccountId == account.Id).ToList();
        transactions.Should().ContainSingle();
        transactions[0].Id.Should().Be(transactionId);
        transactions[0].Amount.Should().Be(250m);
        transactions[0].Description.Should().Be("Grocery store purchase");
        transactions[0].Type.Should().Be(TransactionType.Debit);
        transactions[0].IsManual.Should().BeTrue();
    }
}
