using Cactus.Application.Common.Interfaces;
using Cactus.Application.Features.SpendingPlans.Commands;
using Cactus.Application.Tests._Common;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Cactus.Application.Tests.SpendingPlans;

public class UpdateSpendingPlanCommandHandlerTests : HandlerTestBase
{
    private readonly ICurrentUserService _currentUser = Substitute.For<ICurrentUserService>();

    [Fact]
    public async Task UpdateSpendingPlan_creates_new_plan_when_none_exists_for_current_month()
    {
        // Arrange
        var user = TestDataFactory.User();
        Context.Users.Add(user);
        await Context.SaveChangesAsync(default);

        _currentUser.UserId.Returns(user.Id);

        var handler = new UpdateSpendingPlanCommandHandler(Context, _currentUser);
        var command = new UpdateSpendingPlanCommand(
            MonthlyIncome: 15_000m,
            NeedsPercentage: 50m,
            WantsPercentage: 30m,
            GoalsPercentage: 20m
        );

        // Act
        var planId = await handler.Handle(command, CancellationToken.None);

        // Assert
        var plan = Context.SpendingPlans.FirstOrDefault(p => p.Id == planId);
        plan.Should().NotBeNull();
        plan!.UserId.Should().Be(user.Id);
        plan.MonthlyIncome.Should().Be(15_000m);
        plan.NeedsPercentage.Should().Be(50m);
        plan.IsActive.Should().BeTrue();
    }
}
