using Cactus.Application.Common.Interfaces;
using Cactus.Application.Features.Goals.Commands;
using Cactus.Application.Tests._Common;
using Cactus.Domain.Entities;
using Cactus.Domain.Enums;
using FluentAssertions;
using Microsoft.EntityFrameworkCore;
using NSubstitute;
using Xunit;

namespace Cactus.Application.Tests.Goals;

public class UpdateGoalProgressCommandHandlerTests : HandlerTestBase
{
    private readonly ICurrentUserService _currentUser = Substitute.For<ICurrentUserService>();

    private async Task<(Domain.Entities.User user, Goal goal)> SeedUserWithGoal(
        decimal targetAmount, decimal currentAmount = 0m)
    {
        var user = TestDataFactory.User();
        Context.Users.Add(user);
        await Context.SaveChangesAsync(default);

        var goal = TestDataFactory.Goal(user.Id);
        goal.TargetAmount = targetAmount;
        goal.CurrentAmount = currentAmount;
        Context.Goals.Add(goal);

        // Add default milestones so the handler's milestone-check loop works
        Context.GoalMilestones.AddRange(
            new GoalMilestone { GoalId = goal.Id, Name = "25% Complete", TargetAmount = targetAmount * 0.25m },
            new GoalMilestone { GoalId = goal.Id, Name = "50% Complete", TargetAmount = targetAmount * 0.50m },
            new GoalMilestone { GoalId = goal.Id, Name = "75% Complete", TargetAmount = targetAmount * 0.75m },
            new GoalMilestone { GoalId = goal.Id, Name = "Goal Reached!", TargetAmount = targetAmount }
        );

        await Context.SaveChangesAsync(default);
        return (user, goal);
    }

    [Fact]
    public async Task UpdateGoalProgress_happy_path_updates_current_amount_and_records_progress_row()
    {
        // Arrange
        var (user, goal) = await SeedUserWithGoal(targetAmount: 10000m, currentAmount: 0m);
        _currentUser.UserId.Returns(user.Id);

        var handler = new UpdateGoalProgressCommandHandler(Context, _currentUser);
        var command = new UpdateGoalProgressCommand(GoalId: goal.Id, Amount: 1000m);

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert — goal current amount updated
        var updatedGoal = await Context.Goals.FindAsync(goal.Id);
        updatedGoal!.CurrentAmount.Should().Be(1000m);
        updatedGoal.IsCompleted.Should().BeFalse();

        // Assert — progress row recorded
        var progressRows = Context.GoalProgress.Where(p => p.GoalId == goal.Id).ToList();
        progressRows.Should().ContainSingle();
        progressRows[0].Amount.Should().Be(1000m);
        progressRows[0].RunningTotal.Should().Be(1000m);
    }

    [Fact]
    public async Task UpdateGoalProgress_completing_goal_sets_IsCompleted_and_CompletedAt()
    {
        // Arrange: goal is at 9000 out of 10000 target
        var (user, goal) = await SeedUserWithGoal(targetAmount: 10000m, currentAmount: 9000m);
        _currentUser.UserId.Returns(user.Id);

        var handler = new UpdateGoalProgressCommandHandler(Context, _currentUser);
        var command = new UpdateGoalProgressCommand(GoalId: goal.Id, Amount: 1000m);

        // Act
        await handler.Handle(command, CancellationToken.None);

        // Assert — goal is now completed
        var updatedGoal = await Context.Goals.FindAsync(goal.Id);
        updatedGoal!.CurrentAmount.Should().Be(10000m);
        updatedGoal.IsCompleted.Should().BeTrue();
        updatedGoal.CompletedAt.Should().NotBeNull();
    }
}
