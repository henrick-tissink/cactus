using Cactus.Domain.Entities;
using Cactus.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Cactus.Infrastructure.Data;

public static class CactusDbContextSeeder
{
    public static async Task SeedAsync(CactusDbContext context)
    {
        await EnsureMacroCategoriesAsync(context);
        await RenameLegacyCategoriesAsync(context);
        await EnsureCategoriesAsync(context);
    }

    private static async Task EnsureMacroCategoriesAsync(CactusDbContext context)
    {
        if (await context.MacroCategories.AnyAsync()) return;

        context.MacroCategories.AddRange(
            new MacroCategory
            {
                Id = Guid.NewGuid(),
                Type = MacroCategoryType.Needs,
                Name = "Needs",
                Description = "Essential expenses required for survival and basic living",
                DisplayOrder = 1,
            },
            new MacroCategory
            {
                Id = Guid.NewGuid(),
                Type = MacroCategoryType.Wants,
                Name = "Wants",
                Description = "Non-essential expenses that improve quality of life",
                DisplayOrder = 2,
            },
            new MacroCategory
            {
                Id = Guid.NewGuid(),
                Type = MacroCategoryType.Goals,
                Name = "Goals",
                Description = "Savings, investments, and debt payments",
                DisplayOrder = 3,
            }
        );
        await context.SaveChangesAsync();
    }

    private static async Task RenameLegacyCategoriesAsync(CactusDbContext context)
    {
        var renames = new Dictionary<string, string>
        {
            ["Housing"] = "Rent / Bond",
            ["Transportation"] = "Transport",
            ["Healthcare"] = "Medical Aid",
            ["Education"] = "School Fees",
        };

        var keys = renames.Keys.ToList();
        var toRename = await context.Categories
            .Where(c => keys.Contains(c.Name))
            .ToListAsync();

        foreach (var category in toRename)
        {
            if (renames.TryGetValue(category.Name, out var newName))
                category.Name = newName;
        }

        if (toRename.Count > 0) await context.SaveChangesAsync();
    }

    private static async Task EnsureCategoriesAsync(CactusDbContext context)
    {
        var macros = await context.MacroCategories.ToDictionaryAsync(m => m.Type);
        var existing = await context.Categories.ToListAsync();

        var catalog = new Dictionary<MacroCategoryType, (string Name, string Icon, int DisplayOrder)[]>
        {
            [MacroCategoryType.Needs] = new[]
            {
                ("Rent / Bond",           "home",            1),
                ("Groceries",             "shopping-cart",   2),
                ("Transport",             "car",             3),
                ("Utilities",             "bolt",            4),
                ("Insurance",             "shield",          5),
                ("Medical Aid",           "heart-pulse",     6),
                ("Debt Minimum Payments", "credit-card",     7),
                ("School Fees",           "graduation-cap",  8),
                ("Petrol",                "fuel",            9),
                ("Childcare",             "baby",           10),
                ("Stokvel",               "hand-shake",     11),
                ("Home Security",         "lock",           12),
                ("Levies / Body Corp",    "building",       13),
            },
            [MacroCategoryType.Wants] = new[]
            {
                ("Dining Out",            "utensils",        1),
                ("Entertainment",         "film",            2),
                ("Shopping",              "bag-shopping",    3),
                ("Subscriptions",         "tv",              4),
                ("Personal Care",         "spa",             5),
                ("Hobbies",               "gamepad-2",       6),
                ("Fitness",               "dumbbell",        7),
                ("Travel",                "plane",           8),
                ("Pets",                  "paw-print",       9),
                ("Gifts",                 "gift",           10),
                ("Coffee & Snacks",       "coffee",         11),
                ("Clothing",              "shirt",          12),
            },
            [MacroCategoryType.Goals] = new[]
            {
                ("Emergency Fund",        "piggy-bank",      1),
                ("Debt Payoff",           "trending-down",   2),
                ("Retirement",            "umbrella-beach",  3),
                ("Investments",           "chart-line",      4),
                ("Short-term Savings",    "wallet",          5),
                ("Long-term Savings",     "landmark",        6),
            },
        };

        foreach (var (bucketType, definitions) in catalog)
        {
            if (!macros.TryGetValue(bucketType, out var macro)) continue;

            foreach (var (name, icon, displayOrder) in definitions)
            {
                var current = existing.FirstOrDefault(c =>
                    c.MacroCategoryId == macro.Id &&
                    string.Equals(c.Name, name, StringComparison.OrdinalIgnoreCase));

                if (current == null)
                {
                    context.Categories.Add(new Category
                    {
                        Id = Guid.NewGuid(),
                        MacroCategoryId = macro.Id,
                        Name = name,
                        Icon = icon,
                        DisplayOrder = displayOrder,
                        IsSystem = true,
                    });
                }
                else if (current.Icon != icon || current.DisplayOrder != displayOrder)
                {
                    current.Icon = icon;
                    current.DisplayOrder = displayOrder;
                }
            }
        }

        await context.SaveChangesAsync();
    }
}
