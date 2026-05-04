using Cactus.Application.Common.Interfaces;
using Cactus.Application.Features.Insights.Queries;
using Cactus.Application.Tests._Common;
using Cactus.Domain.Enums;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Cactus.Application.Tests.Insights;

public class GetInsightsQueryHandlerTests : HandlerTestBase
{
    private readonly ICurrentUserService _currentUser = Substitute.For<ICurrentUserService>();

    [Fact]
    public async Task GetInsights_returns_six_monthly_breakdowns_with_stable_trend_when_no_data()
    {
        // Arrange: user with no accounts or transactions
        var user = TestDataFactory.User();
        Context.Users.Add(user);
        await Context.SaveChangesAsync(default);

        _currentUser.UserId.Returns(user.Id);

        var handler = new GetInsightsQueryHandler(Context, _currentUser);

        // Act
        var result = await handler.Handle(new GetInsightsQuery(), CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result.MonthlyBreakdowns.Should().HaveCount(6);
        result.TrendDirection.Should().Be(TrendDirection.Stable);
        result.AverageNeedsPercent.Should().Be(0m);
        result.AverageWantsPercent.Should().Be(0m);
        result.AverageGoalsPercent.Should().Be(0m);
        result.CategoryAverages.Should().BeEmpty();
    }
}
