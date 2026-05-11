using Cactus.Application.Common.Interfaces;
using Cactus.Application.Features.Onboarding.Commands;
using Cactus.Application.Tests._Common;
using Cactus.Domain.Entities;
using Cactus.Domain.Enums;
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

    [Fact]
    public async Task Complete_WithStep6Save_CreatesSavingsGoal()
    {
        var user = TestDataFactory.User();
        Context.Users.Add(user);
        Context.OnboardingResponses.Add(new OnboardingResponse
        {
            UserId = user.Id,
            StepNumber = 6,
            StepName = "Goal type pick",
            Response = "[\"save\"]",
        });
        await Context.SaveChangesAsync(default);
        _currentUser.UserId.Returns(user.Id);

        var handler = new CompleteOnboardingCommandHandler(Context, _currentUser);
        await handler.Handle(new CompleteOnboardingCommand(), CancellationToken.None);

        var goal = Context.Goals.Single(g => g.UserId == user.Id);
        goal.GoalType.Should().Be(GoalType.Savings);
        goal.IsPrimary.Should().BeTrue();
    }

    [Fact]
    public async Task Complete_WithStep6Debt_CreatesDebtPayoffGoal()
    {
        var user = TestDataFactory.User();
        Context.Users.Add(user);
        Context.OnboardingResponses.Add(new OnboardingResponse
        {
            UserId = user.Id,
            StepNumber = 6,
            StepName = "Goal type pick",
            Response = "[\"debt\"]",
        });
        await Context.SaveChangesAsync(default);
        _currentUser.UserId.Returns(user.Id);

        var handler = new CompleteOnboardingCommandHandler(Context, _currentUser);
        await handler.Handle(new CompleteOnboardingCommand(), CancellationToken.None);

        var goal = Context.Goals.Single(g => g.UserId == user.Id);
        goal.GoalType.Should().Be(GoalType.DebtPayoff);
    }

    [Fact]
    public async Task Complete_WithStep6Emergency_CreatesEmergencyFundGoal()
    {
        var user = TestDataFactory.User();
        Context.Users.Add(user);
        Context.OnboardingResponses.Add(new OnboardingResponse
        {
            UserId = user.Id,
            StepNumber = 6,
            StepName = "Goal type pick",
            Response = "[\"emergency\"]",
        });
        await Context.SaveChangesAsync(default);
        _currentUser.UserId.Returns(user.Id);

        var handler = new CompleteOnboardingCommandHandler(Context, _currentUser);
        await handler.Handle(new CompleteOnboardingCommand(), CancellationToken.None);

        var goal = Context.Goals.Single(g => g.UserId == user.Id);
        goal.GoalType.Should().Be(GoalType.EmergencyFund);
    }

    [Fact]
    public async Task Complete_WithoutStep6_LegacyDebtFallback()
    {
        // No step 6, but legacy step 7 has full debt-form data (object array with name+balance)
        var user = TestDataFactory.User();
        Context.Users.Add(user);
        Context.OnboardingResponses.Add(new OnboardingResponse
        {
            UserId = user.Id,
            StepNumber = 7,
            StepName = "High-Interest Debts",
            Response = "[{\"type\":\"Credit Card\",\"name\":\"FNB Gold\",\"balance\":50000}]",
        });
        await Context.SaveChangesAsync(default);
        _currentUser.UserId.Returns(user.Id);

        var handler = new CompleteOnboardingCommandHandler(Context, _currentUser);
        await handler.Handle(new CompleteOnboardingCommand(), CancellationToken.None);

        var goal = Context.Goals.Single(g => g.UserId == user.Id);
        goal.GoalType.Should().Be(GoalType.DebtPayoff);
    }

    [Fact]
    public async Task Complete_WithoutStep6OrLegacyDebt_CreatesNoGoal()
    {
        var user = TestDataFactory.User();
        Context.Users.Add(user);
        await Context.SaveChangesAsync(default);
        _currentUser.UserId.Returns(user.Id);

        var handler = new CompleteOnboardingCommandHandler(Context, _currentUser);
        await handler.Handle(new CompleteOnboardingCommand(), CancellationToken.None);

        Context.Goals.Where(g => g.UserId == user.Id).Should().BeEmpty();
    }
}
