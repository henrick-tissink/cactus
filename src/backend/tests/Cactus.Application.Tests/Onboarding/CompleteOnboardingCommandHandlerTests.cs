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

    [Fact]
    public async Task Complete_WithStep3AndStep4_CreatesUserCategoriesAndBudgetAllocations()
    {
        var user = TestDataFactory.User();
        Context.Users.Add(user);

        var needsMacro = new MacroCategory
        {
            Id = Guid.NewGuid(),
            Type = MacroCategoryType.Needs,
            Name = "Needs",
            Description = "Essentials",
            DisplayOrder = 1,
        };
        var wantsMacro = new MacroCategory
        {
            Id = Guid.NewGuid(),
            Type = MacroCategoryType.Wants,
            Name = "Wants",
            Description = "Lifestyle",
            DisplayOrder = 2,
        };
        Context.MacroCategories.AddRange(needsMacro, wantsMacro);

        var rent = new Category { Id = Guid.NewGuid(), MacroCategoryId = needsMacro.Id, Name = "Rent / Bond", Icon = "home", DisplayOrder = 1, IsSystem = true };
        var groceries = new Category { Id = Guid.NewGuid(), MacroCategoryId = needsMacro.Id, Name = "Groceries", Icon = "shopping-cart", DisplayOrder = 2, IsSystem = true };
        var dining = new Category { Id = Guid.NewGuid(), MacroCategoryId = wantsMacro.Id, Name = "Dining Out", Icon = "utensils", DisplayOrder = 1, IsSystem = true };
        Context.Categories.AddRange(rent, groceries, dining);

        Context.OnboardingResponses.Add(new OnboardingResponse
        {
            UserId = user.Id,
            StepNumber = 3,
            StepName = "Category selection",
            Response = "{\"needs\":[\"Rent / Bond\",\"Groceries\"],\"wants\":[\"Dining Out\"]}",
        });
        Context.OnboardingResponses.Add(new OnboardingResponse
        {
            UserId = user.Id,
            StepNumber = 4,
            StepName = "Per-category estimates",
            Response = "{\"Rent / Bond\":12000,\"Groceries\":4500,\"Dining Out\":1500}",
        });

        await Context.SaveChangesAsync(default);
        _currentUser.UserId.Returns(user.Id);

        var handler = new CompleteOnboardingCommandHandler(Context, _currentUser);
        await handler.Handle(new CompleteOnboardingCommand(), CancellationToken.None);

        var userCategories = Context.UserCategories.Where(uc => uc.UserId == user.Id).ToList();
        userCategories.Should().HaveCount(3);

        var plan = Context.SpendingPlans.Single(p => p.UserId == user.Id);
        var allocations = Context.BudgetAllocations.Where(a => a.SpendingPlanId == plan.Id).ToList();
        allocations.Should().HaveCount(3);
        allocations.Single(a => a.CategoryId == rent.Id).AllocatedAmount.Should().Be(12000m);
        allocations.Single(a => a.CategoryId == groceries.Id).AllocatedAmount.Should().Be(4500m);
        allocations.Single(a => a.CategoryId == dining.Id).AllocatedAmount.Should().Be(1500m);
    }

    [Fact]
    public async Task Complete_WithStep3ButNoStep4_CreatesAllocationsWithZeroAmounts()
    {
        var user = TestDataFactory.User();
        Context.Users.Add(user);

        var needsMacro = new MacroCategory
        {
            Id = Guid.NewGuid(),
            Type = MacroCategoryType.Needs,
            Name = "Needs",
            Description = "Essentials",
            DisplayOrder = 1,
        };
        Context.MacroCategories.Add(needsMacro);
        var rent = new Category { Id = Guid.NewGuid(), MacroCategoryId = needsMacro.Id, Name = "Rent / Bond", Icon = "home", DisplayOrder = 1, IsSystem = true };
        Context.Categories.Add(rent);

        Context.OnboardingResponses.Add(new OnboardingResponse
        {
            UserId = user.Id,
            StepNumber = 3,
            StepName = "Category selection",
            Response = "{\"needs\":[\"Rent / Bond\"],\"wants\":[]}",
        });

        await Context.SaveChangesAsync(default);
        _currentUser.UserId.Returns(user.Id);

        var handler = new CompleteOnboardingCommandHandler(Context, _currentUser);
        await handler.Handle(new CompleteOnboardingCommand(), CancellationToken.None);

        var allocation = Context.BudgetAllocations.Single();
        allocation.AllocatedAmount.Should().Be(0m);
    }
}
