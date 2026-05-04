using Cactus.Application.Common.Interfaces;
using Cactus.Application.Features.Onboarding.Commands;
using Cactus.Application.Tests._Common;
using FluentAssertions;
using NSubstitute;
using Xunit;

namespace Cactus.Application.Tests.Onboarding;

public class CompleteOnboardingCommandHandlerTests : HandlerTestBase
{
    private readonly ICurrentUserService _currentUser = Substitute.For<ICurrentUserService>();

    [Fact]
    public async Task CompleteOnboarding_marks_user_as_complete_and_creates_spending_plan()
    {
        // Arrange
        var user = TestDataFactory.User();
        Context.Users.Add(user);
        await Context.SaveChangesAsync(default);

        _currentUser.UserId.Returns(user.Id);

        var handler = new CompleteOnboardingCommandHandler(Context, _currentUser);

        // Act
        await handler.Handle(new CompleteOnboardingCommand(), CancellationToken.None);

        // Assert
        var updatedUser = Context.Users.First(u => u.Id == user.Id);
        updatedUser.IsOnboardingComplete.Should().BeTrue();

        // A default spending plan should have been created for the current month
        var now = System.DateTime.UtcNow;
        var plan = Context.SpendingPlans.FirstOrDefault(
            p => p.UserId == user.Id && p.Year == now.Year && p.Month == now.Month);
        plan.Should().NotBeNull();
        plan!.IsActive.Should().BeTrue();
    }
}
