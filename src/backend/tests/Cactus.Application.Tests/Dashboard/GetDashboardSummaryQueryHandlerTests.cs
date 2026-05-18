using Cactus.Application.Common.Interfaces;
using Cactus.Application.Features.Dashboard.Queries;
using Cactus.Application.Tests._Common;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Cactus.Application.Tests.Dashboard;

public class GetDashboardSummaryQueryHandlerTests : HandlerTestBase
{
    private readonly ICurrentUserService _currentUser = Substitute.For<ICurrentUserService>();

    [Fact]
    public async Task GetDashboardSummary_returns_empty_result_when_user_has_no_data()
    {
        // Arrange: user with no accounts, transactions, or spending plans
        var user = TestDataFactory.User();
        Context.Users.Add(user);
        await Context.SaveChangesAsync(default);

        _currentUser.UserId.Returns(user.Id);

        var handler = new GetDashboardSummaryQueryHandler(Context, _currentUser);

        // Act
        var result = await handler.Handle(new GetDashboardSummaryQuery(), CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.MonthlyIncome.Should().Be(0m);
        result.TotalSpent.Should().Be(0m);
        result.UnclassifiedCount.Should().Be(0);
        result.RecentTransactions.Should().BeEmpty();
        result.Buckets.Should().BeEmpty(); // no macro categories seeded
        result.LastSyncAt.Should().BeNull();
    }
}
