using Cactus.Domain.Entities;
using Cactus.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Infrastructure.Data;

public static class CactusDbContextSeeder
{
    public static async Task SeedAsync(CactusDbContext context)
    {
        if (!await context.MacroCategories.AnyAsync())
        {
            await SeedMacroCategoriesAsync(context);
        }
    }

    private static async Task SeedMacroCategoriesAsync(CactusDbContext context)
    {
        // Create Macro Categories
        var needs = new MacroCategory
        {
            Id = Guid.NewGuid(),
            Type = MacroCategoryType.Needs,
            Name = "Needs",
            Description = "Essential expenses required for survival and basic living",
            DisplayOrder = 1
        };

        var wants = new MacroCategory
        {
            Id = Guid.NewGuid(),
            Type = MacroCategoryType.Wants,
            Name = "Wants",
            Description = "Non-essential expenses that improve quality of life",
            DisplayOrder = 2
        };

        var goals = new MacroCategory
        {
            Id = Guid.NewGuid(),
            Type = MacroCategoryType.Goals,
            Name = "Goals",
            Description = "Savings, investments, and debt payments",
            DisplayOrder = 3
        };

        context.MacroCategories.AddRange(needs, wants, goals);

        // Create Default Categories for Needs
        var needsCategories = new[]
        {
            new Category { Id = Guid.NewGuid(), MacroCategoryId = needs.Id, Name = "Housing", Icon = "home", DisplayOrder = 1, IsSystem = true },
            new Category { Id = Guid.NewGuid(), MacroCategoryId = needs.Id, Name = "Utilities", Icon = "bolt", DisplayOrder = 2, IsSystem = true },
            new Category { Id = Guid.NewGuid(), MacroCategoryId = needs.Id, Name = "Groceries", Icon = "shopping-cart", DisplayOrder = 3, IsSystem = true },
            new Category { Id = Guid.NewGuid(), MacroCategoryId = needs.Id, Name = "Transportation", Icon = "car", DisplayOrder = 4, IsSystem = true },
            new Category { Id = Guid.NewGuid(), MacroCategoryId = needs.Id, Name = "Insurance", Icon = "shield", DisplayOrder = 5, IsSystem = true },
            new Category { Id = Guid.NewGuid(), MacroCategoryId = needs.Id, Name = "Healthcare", Icon = "heart-pulse", DisplayOrder = 6, IsSystem = true },
            new Category { Id = Guid.NewGuid(), MacroCategoryId = needs.Id, Name = "Childcare", Icon = "baby", DisplayOrder = 7, IsSystem = true },
            new Category { Id = Guid.NewGuid(), MacroCategoryId = needs.Id, Name = "Education", Icon = "graduation-cap", DisplayOrder = 8, IsSystem = true },
            new Category { Id = Guid.NewGuid(), MacroCategoryId = needs.Id, Name = "Debt Minimum Payments", Icon = "credit-card", DisplayOrder = 9, IsSystem = true }
        };

        // Create Default Categories for Wants
        var wantsCategories = new[]
        {
            new Category { Id = Guid.NewGuid(), MacroCategoryId = wants.Id, Name = "Dining Out", Icon = "utensils", DisplayOrder = 1, IsSystem = true },
            new Category { Id = Guid.NewGuid(), MacroCategoryId = wants.Id, Name = "Entertainment", Icon = "film", DisplayOrder = 2, IsSystem = true },
            new Category { Id = Guid.NewGuid(), MacroCategoryId = wants.Id, Name = "Shopping", Icon = "bag-shopping", DisplayOrder = 3, IsSystem = true },
            new Category { Id = Guid.NewGuid(), MacroCategoryId = wants.Id, Name = "Subscriptions", Icon = "tv", DisplayOrder = 4, IsSystem = true },
            new Category { Id = Guid.NewGuid(), MacroCategoryId = wants.Id, Name = "Personal Care", Icon = "spa", DisplayOrder = 5, IsSystem = true },
            new Category { Id = Guid.NewGuid(), MacroCategoryId = wants.Id, Name = "Fitness", Icon = "dumbbell", DisplayOrder = 6, IsSystem = true },
            new Category { Id = Guid.NewGuid(), MacroCategoryId = wants.Id, Name = "Hobbies", Icon = "gamepad-2", DisplayOrder = 7, IsSystem = true },
            new Category { Id = Guid.NewGuid(), MacroCategoryId = wants.Id, Name = "Travel", Icon = "plane", DisplayOrder = 8, IsSystem = true },
            new Category { Id = Guid.NewGuid(), MacroCategoryId = wants.Id, Name = "Gifts", Icon = "gift", DisplayOrder = 9, IsSystem = true }
        };

        // Create Default Categories for Goals
        var goalsCategories = new[]
        {
            new Category { Id = Guid.NewGuid(), MacroCategoryId = goals.Id, Name = "Emergency Fund", Icon = "piggy-bank", DisplayOrder = 1, IsSystem = true },
            new Category { Id = Guid.NewGuid(), MacroCategoryId = goals.Id, Name = "Debt Payoff", Icon = "trending-down", DisplayOrder = 2, IsSystem = true },
            new Category { Id = Guid.NewGuid(), MacroCategoryId = goals.Id, Name = "Retirement", Icon = "umbrella-beach", DisplayOrder = 3, IsSystem = true },
            new Category { Id = Guid.NewGuid(), MacroCategoryId = goals.Id, Name = "Investments", Icon = "chart-line", DisplayOrder = 4, IsSystem = true },
            new Category { Id = Guid.NewGuid(), MacroCategoryId = goals.Id, Name = "Short-term Savings", Icon = "wallet", DisplayOrder = 5, IsSystem = true },
            new Category { Id = Guid.NewGuid(), MacroCategoryId = goals.Id, Name = "Long-term Savings", Icon = "landmark", DisplayOrder = 6, IsSystem = true }
        };

        context.Categories.AddRange(needsCategories);
        context.Categories.AddRange(wantsCategories);
        context.Categories.AddRange(goalsCategories);

        await context.SaveChangesAsync();
    }
}
