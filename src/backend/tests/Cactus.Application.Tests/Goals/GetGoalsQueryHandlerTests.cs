using Cactus.Application.Common.Interfaces;
using Cactus.Application.Features.Goals.Queries;
using Cactus.Application.Tests._Common;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Cactus.Application.Tests.Goals;

public class GetGoalsQueryHandlerTests : HandlerTestBase
{
    private readonly ICurrentUserService _currentUser = Substitute.For<ICurrentUserService>();

    [Fact]
    public async Task GetGoals_returns_only_goals_belonging_to_requesting_user()
    {
        // Arrange: two users, each with one goal
        var u1 = TestDataFactory.User();
        var u2 = TestDataFactory.User();
        Context.Users.AddRange(u1, u2);
        await Context.SaveChangesAsync(default);

        var goalU1 = TestDataFactory.Goal(u1.Id);
        var goalU2 = TestDataFactory.Goal(u2.Id);
        Context.Goals.AddRange(goalU1, goalU2);
        await Context.SaveChangesAsync(default);

        // Current user is u1
        _currentUser.UserId.Returns(u1.Id);

        var handler = new GetGoalsQueryHandler(Context, _currentUser);

        // Act
        var result = await handler.Handle(new GetGoalsQuery(), CancellationToken.None);

        // Assert: only u1's goal is returned
        result.Should().ContainSingle();
        result[0].Id.Should().Be(goalU1.Id);
        result[0].Name.Should().Be(goalU1.Name);
    }
}
