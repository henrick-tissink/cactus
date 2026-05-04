using Cactus.Application.Common.Interfaces;
using Cactus.Application.Features.SpendingPlans.Queries;
using Cactus.Application.Tests._Common;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Cactus.Application.Tests.SpendingPlans;

public class GetSpendingPlanSuggestionQueryHandlerTests : HandlerTestBase
{
    private readonly ICurrentUserService _currentUser = Substitute.For<ICurrentUserService>();

    [Fact]
    public async Task GetSpendingPlanSuggestion_returns_defaults_when_user_has_no_plan_or_history()
    {
        // Arrange: user with no accounts, spending plan, or transactions
        var user = TestDataFactory.User();
        Context.Users.Add(user);
        await Context.SaveChangesAsync(default);

        _currentUser.UserId.Returns(user.Id);

        var handler = new GetSpendingPlanSuggestionQueryHandler(Context, _currentUser);

        // Act
        var result = await handler.Handle(new GetSpendingPlanSuggestionQuery(), CancellationToken.None);

        // Assert: defaults to 50/30/20 when no data exists
        result.Should().NotBeNull();
        result.CurrentNeeds.Should().Be(50m);
        result.CurrentWants.Should().Be(30m);
        result.CurrentGoals.Should().Be(20m);
        // 50/30/20 is already balanced — no suggestion needed
        result.HasSuggestion.Should().BeFalse();
    }
}
