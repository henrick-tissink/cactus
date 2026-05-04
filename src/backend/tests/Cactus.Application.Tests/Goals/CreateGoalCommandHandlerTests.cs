using Cactus.Application.Common.Interfaces;
using Cactus.Application.Features.Goals.Commands;
using Cactus.Application.Tests._Common;
using Cactus.Domain.Enums;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Cactus.Application.Tests.Goals;

public class CreateGoalCommandHandlerTests : HandlerTestBase
{
    private readonly ICurrentUserService _currentUser = Substitute.For<ICurrentUserService>();

    [Fact]
    public async Task CreateGoal_persists_goal_scoped_to_requesting_user()
    {
        // Arrange
        var user = TestDataFactory.User();
        Context.Users.Add(user);
        await Context.SaveChangesAsync(default);
        _currentUser.UserId.Returns(user.Id);

        var handler = new CreateGoalCommandHandler(Context, _currentUser);
        var command = new CreateGoalCommand(
            Name: "Emergency Fund",
            GoalType: GoalType.EmergencyFund,
            TargetAmount: 10000m
        );

        // Act
        var goalId = await handler.Handle(command, CancellationToken.None);

        // Assert
        var goal = Context.Goals.SingleOrDefault(g => g.Id == goalId);
        goal.Should().NotBeNull();
        goal!.UserId.Should().Be(user.Id);
        goal.Name.Should().Be("Emergency Fund");
        goal.TargetAmount.Should().Be(10000m);
        goal.GoalType.Should().Be(GoalType.EmergencyFund);

        // Handler should also have created 4 default milestones
        Context.GoalMilestones
            .Where(m => m.GoalId == goalId)
            .Should().HaveCount(4);
    }
}
