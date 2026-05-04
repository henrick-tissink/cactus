using Cactus.Application.Common.Interfaces;
using Cactus.Application.Features.SpendingPlans.Queries;
using Cactus.Application.Tests._Common;
using Cactus.Domain.Entities;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Cactus.Application.Tests.SpendingPlans;

public class GetCurrentSpendingPlanQueryHandlerTests : HandlerTestBase
{
    private readonly ICurrentUserService _currentUser = Substitute.For<ICurrentUserService>();

    [Fact]
    public async Task GetCurrentSpendingPlan_returns_active_plan_for_current_month_and_skips_inactive()
    {
        // Arrange
        var user = TestDataFactory.User();
        Context.Users.Add(user);
        await Context.SaveChangesAsync(default);

        var now = DateTime.UtcNow;

        // Active plan for the current month — should be returned
        var activePlan = new SpendingPlan
        {
            UserId           = user.Id,
            Year             = now.Year,
            Month            = now.Month,
            MonthlyIncome    = 10_000m,
            NeedsPercentage  = 50m,
            WantsPercentage  = 30m,
            GoalsPercentage  = 20m,
            IsActive         = true,
        };

        // Plan for a different user — must be ignored (also avoids (user,year,month) unique conflict)
        var otherUser = TestDataFactory.User();
        Context.Users.Add(otherUser);
        await Context.SaveChangesAsync(default);

        var inactivePlan = new SpendingPlan
        {
            UserId           = otherUser.Id,
            Year             = now.Year,
            Month            = now.Month,
            MonthlyIncome    = 5_000m,
            NeedsPercentage  = 50m,
            WantsPercentage  = 30m,
            GoalsPercentage  = 20m,
            IsActive         = false,
        };

        Context.SpendingPlans.AddRange(activePlan, inactivePlan);
        await Context.SaveChangesAsync(default);

        _currentUser.UserId.Returns(user.Id);

        var handler = new GetCurrentSpendingPlanQueryHandler(Context, _currentUser);

        // Act
        var result = await handler.Handle(new GetCurrentSpendingPlanQuery(), CancellationToken.None);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(activePlan.Id);
        result.MonthlyIncome.Should().Be(10_000m);
        result.Year.Should().Be(now.Year);
        result.Month.Should().Be(now.Month);
        result.NeedsPercentage.Should().Be(50m);
    }
}
