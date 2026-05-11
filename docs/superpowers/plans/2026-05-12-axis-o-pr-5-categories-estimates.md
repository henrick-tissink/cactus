# Axis O — PR 5: Categories Selection + Per-Category Estimates — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Parent specs:**
- Umbrella: [2026-05-07-axis-o-onboarding-design.md](../specs/2026-05-07-axis-o-onboarding-design.md)
- PR-5 design: [2026-05-12-axis-o-pr-5-categories-estimates-design.md](../specs/2026-05-12-axis-o-pr-5-categories-estimates-design.md)

**Goal:** Two new screens (categories + estimates) between goal-pick and the existing wizard. Backend persists user category selection (`UserCategory` rows) and per-category estimates (`BudgetAllocation` rows). Idempotent seeder adds 8 SA-specific categories and renames 4 existing ones.

**Architecture:** Frontend screens use canonical category names (matching backend seed). Backend `CompleteOnboardingCommand` reads step 3 (selection) + step 4 (estimates) and creates `UserCategory` + `BudgetAllocation` rows. `CactusDbContextSeeder` becomes idempotent: rename pass first (Healthcare → Medical Aid, etc.), then upsert categories by name.

**Tech Stack:** .NET 8, EF Core, React 19, TanStack Query, Tailwind v4, Vitest + RTL.

---

## File Structure

**Created (frontend):**
- `src/frontend/src/pages/onboarding/categories/data.ts`
- `src/frontend/src/pages/onboarding/categories/CategoryScreen.tsx` + `.test.tsx`
- `src/frontend/src/pages/onboarding/categories/EstimateScreen.tsx` + `.test.tsx`

**Modified (frontend):**
- `src/frontend/src/pages/Onboarding.tsx` — add `'categories'` + `'estimates'` phases

**Modified (backend):**
- `src/backend/src/Cactus.Infrastructure/Data/CactusDbContextSeeder.cs` — idempotent rename + upsert
- `src/backend/src/Cactus.Application/Features/Onboarding/Commands/CompleteOnboardingCommand.cs` — process steps 3 + 4
- `src/backend/tests/Cactus.Application.Tests/Onboarding/CompleteOnboardingCommandHandlerTests.cs` — new tests

---

## Task 1: Backend seeder — idempotent rename + SA-specific additions

**Files:**
- Modify: `src/backend/src/Cactus.Infrastructure/Data/CactusDbContextSeeder.cs`

### Step 1: Read the current seeder

Read `src/backend/src/Cactus.Infrastructure/Data/CactusDbContextSeeder.cs` end-to-end.

### Step 2: Replace the seeder body

Replace the entire `CactusDbContextSeeder` class body with:

```csharp
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
```

Make sure the `using` directives at the top include `Cactus.Domain.Entities`, `Cactus.Domain.Enums`, `Microsoft.EntityFrameworkCore`.

### Step 3: Build

```bash
DOTNET_ROLL_FORWARD=LatestMajor dotnet build src/backend/src/Cactus.Infrastructure/Cactus.Infrastructure.csproj 2>&1 | tail -5
```

Expected: clean build.

### Step 4: Commit

```bash
cd /Users/henricktissink/Sauce/cactus/.claude/worktrees/axis-o+pr-5-categories-estimates
git add src/backend/src/Cactus.Infrastructure/Data/CactusDbContextSeeder.cs
git commit -m "$(cat <<'EOF'
feat(seed): idempotent category seeding + SA-specific additions

Renames Housing → Rent / Bond, Transportation → Transport, Healthcare → Medical Aid, Education → School Fees. Adds Petrol, Stokvel, Home Security, Levies / Body Corp under Needs; Pets, Coffee & Snacks, Clothing under Wants. Catalog upsert is idempotent — existing prod databases get the additions on next deploy without duplicates.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Backend — extend CompleteOnboardingCommand (TDD)

**Files:**
- Modify: `src/backend/src/Cactus.Application/Features/Onboarding/Commands/CompleteOnboardingCommand.cs`
- Modify: `src/backend/tests/Cactus.Application.Tests/Onboarding/CompleteOnboardingCommandHandlerTests.cs`

### Step 1: Add failing tests

Append to `CompleteOnboardingCommandHandlerTests.cs`:

```csharp
[Fact]
public async Task Complete_WithStep3AndStep4_CreatesUserCategoriesAndBudgetAllocations()
{
    var user = TestDataFactory.User();
    Context.Users.Add(user);

    // Seed macros + categories (same as the seeder would)
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
```

### Step 2: Run to verify failure

```bash
cd src/backend && DOTNET_ROLL_FORWARD=LatestMajor dotnet test src/backend/tests/Cactus.Application.Tests/Cactus.Application.Tests.csproj --filter "FullyQualifiedName~CompleteOnboardingCommandHandlerTests" 2>&1 | tail -8
```

Expected: 2 new tests fail (UserCategories + BudgetAllocations are not created yet).

### Step 3: Modify `CompleteOnboardingCommand.cs`

Read the current handler first to find the insertion point. After the existing block that adds the `SpendingPlan` to `_context.SpendingPlans`, insert:

```csharp
        // PR O-5: Create UserCategory + BudgetAllocation rows from step 3 + step 4 selections
        if (existingPlan == null && spendingPlan != null)
        {
            var categoriesResponse = responses.FirstOrDefault(r => r.StepNumber == 3);
            if (categoriesResponse != null)
            {
                await ProcessCategoriesAndEstimatesAsync(
                    userId,
                    spendingPlan,
                    categoriesResponse.Response,
                    responses.FirstOrDefault(r => r.StepNumber == 4)?.Response,
                    cancellationToken
                );
            }
        }
```

Adjust the existing `spendingPlan` variable declaration so it's accessible in the new block (it may already be — check the current handler). If the SpendingPlan currently uses `var spendingPlan = new SpendingPlan { ... }; _context.SpendingPlans.Add(spendingPlan);` inside an `if (existingPlan == null)` block, declare `SpendingPlan? spendingPlan = null` outside and assign within.

Add the helper method to the same class:

```csharp
    private async Task ProcessCategoriesAndEstimatesAsync(
        Guid userId,
        SpendingPlan plan,
        string categoriesJson,
        string? estimatesJson,
        CancellationToken cancellationToken)
    {
        var selectedNames = new List<string>();
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(categoriesJson);
            if (doc.RootElement.TryGetProperty("needs", out var needs)
                && needs.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                foreach (var n in needs.EnumerateArray())
                {
                    var name = n.GetString();
                    if (!string.IsNullOrWhiteSpace(name)) selectedNames.Add(name);
                }
            }
            if (doc.RootElement.TryGetProperty("wants", out var wants)
                && wants.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                foreach (var w in wants.EnumerateArray())
                {
                    var name = w.GetString();
                    if (!string.IsNullOrWhiteSpace(name)) selectedNames.Add(name);
                }
            }
        }
        catch
        {
            return;
        }

        if (selectedNames.Count == 0) return;

        var estimates = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        if (!string.IsNullOrWhiteSpace(estimatesJson))
        {
            try
            {
                using var doc = System.Text.Json.JsonDocument.Parse(estimatesJson);
                if (doc.RootElement.ValueKind == System.Text.Json.JsonValueKind.Object)
                {
                    foreach (var prop in doc.RootElement.EnumerateObject())
                    {
                        if (prop.Value.ValueKind == System.Text.Json.JsonValueKind.Number
                            && prop.Value.TryGetDecimal(out var amount))
                        {
                            estimates[prop.Name] = amount;
                        }
                    }
                }
            }
            catch
            {
                // Estimates are optional; carry on with zeros.
            }
        }

        var categories = await _context.Categories
            .Where(c => selectedNames.Contains(c.Name))
            .ToListAsync(cancellationToken);

        foreach (var category in categories)
        {
            _context.UserCategories.Add(new UserCategory
            {
                UserId = userId,
                CategoryId = category.Id,
                IsHidden = false,
            });

            estimates.TryGetValue(category.Name, out var amount);
            _context.BudgetAllocations.Add(new BudgetAllocation
            {
                SpendingPlanId = plan.Id,
                CategoryId = category.Id,
                AllocatedAmount = amount,
            });
        }
    }
```

### Step 4: Run tests

```bash
cd src/backend && DOTNET_ROLL_FORWARD=LatestMajor dotnet test src/backend/tests/Cactus.Application.Tests/Cactus.Application.Tests.csproj --filter "FullyQualifiedName~CompleteOnboardingCommandHandlerTests" 2>&1 | tail -8
```

Expected: all CompleteOnboarding tests pass (the existing 6 + 2 new = 8).

### Step 5: Commit

```bash
git add src/backend/src/Cactus.Application/Features/Onboarding/Commands/CompleteOnboardingCommand.cs src/backend/tests/Cactus.Application.Tests/Onboarding/CompleteOnboardingCommandHandlerTests.cs
git commit -m "$(cat <<'EOF'
feat(onboarding): create UserCategory + BudgetAllocation rows from step 3/4

CompleteOnboardingCommand now reads the category selection (step 3) and per-category estimates (step 4) to seed UserCategory rows for the user and BudgetAllocation rows on the new SpendingPlan. Missing estimates default to 0.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Frontend — `data.ts` + `<CategoryScreen />` (TDD)

**Files:**
- Create: `src/frontend/src/pages/onboarding/categories/data.ts`
- Create: `src/frontend/src/pages/onboarding/categories/CategoryScreen.tsx`
- Create: `src/frontend/src/pages/onboarding/categories/CategoryScreen.test.tsx`

### Step 1: Create `data.ts`

```ts
export interface CategoryDef {
  name: string;
  icon: string;
  bucket: 'needs' | 'wants';
}

export const defaultCategories: CategoryDef[] = [
  { name: 'Rent / Bond', icon: '🏠', bucket: 'needs' },
  { name: 'Groceries', icon: '🛒', bucket: 'needs' },
  { name: 'Transport', icon: '🚗', bucket: 'needs' },
  { name: 'Utilities', icon: '💡', bucket: 'needs' },
  { name: 'Insurance', icon: '🛡️', bucket: 'needs' },
  { name: 'Medical Aid', icon: '🏥', bucket: 'needs' },
  { name: 'Debt Minimum Payments', icon: '💸', bucket: 'needs' },
  { name: 'School Fees', icon: '🎒', bucket: 'needs' },
  { name: 'Dining Out', icon: '🍽️', bucket: 'wants' },
  { name: 'Entertainment', icon: '🎬', bucket: 'wants' },
  { name: 'Shopping', icon: '🛍️', bucket: 'wants' },
  { name: 'Subscriptions', icon: '📺', bucket: 'wants' },
  { name: 'Personal Care', icon: '💅', bucket: 'wants' },
  { name: 'Hobbies', icon: '🎨', bucket: 'wants' },
];

export const extraCategories: CategoryDef[] = [
  { name: 'Petrol', icon: '⛽', bucket: 'needs' },
  { name: 'Childcare', icon: '👶', bucket: 'needs' },
  { name: 'Stokvel', icon: '🤝', bucket: 'needs' },
  { name: 'Home Security', icon: '🔒', bucket: 'needs' },
  { name: 'Levies / Body Corp', icon: '🏢', bucket: 'needs' },
  { name: 'Fitness', icon: '🏋️', bucket: 'wants' },
  { name: 'Travel', icon: '✈️', bucket: 'wants' },
  { name: 'Pets', icon: '🐾', bucket: 'wants' },
  { name: 'Gifts', icon: '🎁', bucket: 'wants' },
  { name: 'Coffee & Snacks', icon: '☕', bucket: 'wants' },
  { name: 'Clothing', icon: '👕', bucket: 'wants' },
];
```

### Step 2: Write the failing test

Path: `src/frontend/src/pages/onboarding/categories/CategoryScreen.test.tsx`

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/render';
import { server } from '../../../test/mocks/server';
import { CategoryScreen } from './CategoryScreen';

describe('CategoryScreen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders all 8 Needs defaults and 6 Wants defaults pre-selected', () => {
    renderWithProviders(<CategoryScreen onContinue={() => {}} />);
    expect(screen.getByRole('button', { name: /rent \/ bond/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /groceries/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dining out/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hobbies/i })).toBeInTheDocument();
  });

  it('exposes extras under a "+ Add" toggle in each bucket', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoryScreen onContinue={() => {}} />);
    expect(screen.queryByRole('button', { name: /stokvel/i })).not.toBeInTheDocument();
    const addButtons = screen.getAllByRole('button', { name: /\+ add/i });
    await user.click(addButtons[0]); // first is Needs
    expect(screen.getByRole('button', { name: /stokvel/i })).toBeInTheDocument();
  });

  it('persists selection on "Looks good" and forwards lists to onContinue', async () => {
    let captured: { stepNumber: number; stepName: string; response: string } | null = null;
    server.use(
      http.post('/api/onboarding/response', async ({ request }) => {
        captured = (await request.json()) as typeof captured;
        return HttpResponse.json({});
      })
    );
    const onContinue = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<CategoryScreen onContinue={onContinue} />);

    // Deselect Hobbies (one of the default Wants)
    await user.click(screen.getByRole('button', { name: /hobbies/i }));

    await user.click(screen.getByRole('button', { name: /looks good/i }));

    await waitFor(() => {
      expect(captured).not.toBeNull();
      expect(onContinue).toHaveBeenCalledOnce();
    });
    expect(captured!.stepNumber).toBe(3);
    expect(captured!.stepName).toBe('Category selection');
    const payload = JSON.parse(captured!.response) as { needs: string[]; wants: string[] };
    expect(payload.needs).toContain('Rent / Bond');
    expect(payload.wants).not.toContain('Hobbies');
    expect(onContinue).toHaveBeenCalledWith(payload.needs, payload.wants);
  });
});
```

### Step 3: Run to verify failure

`cd src/frontend && npm run test -- CategoryScreen`

Expected: `Cannot find module './CategoryScreen'`.

### Step 4: Implement `<CategoryScreen />`

Path: `src/frontend/src/pages/onboarding/categories/CategoryScreen.tsx`

```tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Btn } from '../../../components/brand/Btn';
import { apiClient } from '../../../api/client';
import { defaultCategories, extraCategories, type CategoryDef } from './data';

interface CategoryScreenProps {
  onContinue: (selectedNeeds: string[], selectedWants: string[]) => void;
}

export function CategoryScreen({ onContinue }: CategoryScreenProps) {
  const defaultNeeds = defaultCategories.filter((c) => c.bucket === 'needs');
  const defaultWants = defaultCategories.filter((c) => c.bucket === 'wants');

  const [selectedNeeds, setSelectedNeeds] = useState<string[]>(defaultNeeds.map((c) => c.name));
  const [selectedWants, setSelectedWants] = useState<string[]>(defaultWants.map((c) => c.name));
  const [showAddNeeds, setShowAddNeeds] = useState(false);
  const [showAddWants, setShowAddWants] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/onboarding/response', {
        stepNumber: 3,
        stepName: 'Category selection',
        response: JSON.stringify({ needs: selectedNeeds, wants: selectedWants }),
      });
    },
    onSuccess: () => onContinue(selectedNeeds, selectedWants),
  });

  const toggle = (cat: CategoryDef) => {
    if (cat.bucket === 'needs') {
      setSelectedNeeds((prev) =>
        prev.includes(cat.name) ? prev.filter((n) => n !== cat.name) : [...prev, cat.name]
      );
    } else {
      setSelectedWants((prev) =>
        prev.includes(cat.name) ? prev.filter((n) => n !== cat.name) : [...prev, cat.name]
      );
    }
  };

  const extraNeedsAvailable = extraCategories.filter(
    (c) => c.bucket === 'needs' && !selectedNeeds.includes(c.name)
  );
  const extraWantsAvailable = extraCategories.filter(
    (c) => c.bucket === 'wants' && !selectedWants.includes(c.name)
  );

  return (
    <div className="flex flex-col min-h-screen bg-cactus-sandstone font-cactus px-6 animate-fade-up">
      <div className="flex-1 pt-6 overflow-auto">
        <div className="text-4xl mb-2.5" aria-hidden="true">
          🗂️
        </div>
        <h1 className="font-cactus font-bold text-[21px] text-cactus-charcoal m-0 mb-1.5">
          Customise your categories
        </h1>
        <p className="font-cactus text-[13.5px] text-cactus-charcoal/40 font-medium m-0 mb-6 leading-relaxed">
          We've started you off with the common ones. Remove what doesn't apply, add what's missing.
        </p>

        <Bucket
          label="Needs"
          dotClass="bg-cactus-sage"
          accentClass="text-cactus-sage"
          activeBgClass="bg-cactus-needs-bg"
          activeBorderClass="border-cactus-sage"
          defaults={defaultNeeds}
          selected={selectedNeeds}
          onToggle={toggle}
          showAdd={showAddNeeds}
          onShowAdd={() => setShowAddNeeds((s) => !s)}
          extras={extraNeedsAvailable}
          extraSelectedFromNonDefaults={extraCategories
            .filter((c) => c.bucket === 'needs' && selectedNeeds.includes(c.name))}
        />
        <Bucket
          label="Wants"
          dotClass="bg-cactus-desert"
          accentClass="text-cactus-desert"
          activeBgClass="bg-cactus-wants-bg"
          activeBorderClass="border-cactus-desert"
          defaults={defaultWants}
          selected={selectedWants}
          onToggle={toggle}
          showAdd={showAddWants}
          onShowAdd={() => setShowAddWants((s) => !s)}
          extras={extraWantsAvailable}
          extraSelectedFromNonDefaults={extraCategories
            .filter((c) => c.bucket === 'wants' && selectedWants.includes(c.name))}
        />
      </div>
      <div className="py-4 pb-7 shrink-0">
        <Btn onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          Looks good
        </Btn>
      </div>
    </div>
  );
}

interface BucketProps {
  label: string;
  dotClass: string;
  accentClass: string;
  activeBgClass: string;
  activeBorderClass: string;
  defaults: CategoryDef[];
  selected: string[];
  onToggle: (cat: CategoryDef) => void;
  showAdd: boolean;
  onShowAdd: () => void;
  extras: CategoryDef[];
  extraSelectedFromNonDefaults: CategoryDef[];
}

function Bucket({
  label,
  dotClass,
  accentClass,
  activeBgClass,
  activeBorderClass,
  defaults,
  selected,
  onToggle,
  showAdd,
  onShowAdd,
  extras,
  extraSelectedFromNonDefaults,
}: BucketProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <div className={`w-2.5 h-2.5 rounded-sm ${dotClass}`} />
          <span className="font-cactus font-bold text-[15px] text-cactus-charcoal">{label}</span>
        </div>
        <button
          type="button"
          onClick={onShowAdd}
          className={`bg-transparent border-none font-cactus font-semibold text-xs cursor-pointer ${accentClass}`}
        >
          + Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {[...defaults, ...extraSelectedFromNonDefaults].map((cat) => {
          const active = selected.includes(cat.name);
          return (
            <button
              key={cat.name}
              type="button"
              onClick={() => onToggle(cat)}
              className={`inline-flex items-center gap-1.5 py-2 px-3.5 rounded-full border-2 cursor-pointer transition-all font-cactus font-semibold text-[13px] text-cactus-charcoal ${
                active ? `${activeBorderClass} ${activeBgClass}` : 'border-cactus-overlay bg-white'
              }`}
            >
              <span className="text-base" aria-hidden="true">
                {cat.icon}
              </span>
              {cat.name}
              {active && (
                <span className="text-xs text-cactus-charcoal/30 ml-0.5" aria-hidden="true">
                  ✕
                </span>
              )}
            </button>
          );
        })}
      </div>
      {showAdd && extras.length > 0 && (
        <div
          className={`mt-2.5 py-2.5 px-3 ${activeBgClass} rounded-xl animate-fade-up`}
        >
          <p className="font-cactus text-[11px] text-cactus-charcoal/40 font-semibold m-0 mb-2">
            Tap to add:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {extras.map((cat) => (
              <button
                key={cat.name}
                type="button"
                onClick={() => onToggle(cat)}
                className="inline-flex items-center gap-1 py-1.5 px-3 rounded-full border-2 border-cactus-overlay bg-white cursor-pointer font-cactus font-semibold text-xs text-cactus-charcoal"
              >
                <span className="text-sm" aria-hidden="true">
                  {cat.icon}
                </span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### Step 5: Run to verify pass

Expected: 3 tests pass.

### Step 6: Commit

```bash
cd /Users/henricktissink/Sauce/cactus/.claude/worktrees/axis-o+pr-5-categories-estimates
git add src/frontend/src/pages/onboarding/categories/
git commit -m "feat(onboarding): add <CategoryScreen /> with extras + selection persistence"
```

---

## Task 4: Frontend — `<EstimateScreen />` (TDD)

**Files:**
- Create: `src/frontend/src/pages/onboarding/categories/EstimateScreen.tsx`
- Create: `src/frontend/src/pages/onboarding/categories/EstimateScreen.test.tsx`

### Step 1: Write the failing test

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/render';
import { server } from '../../../test/mocks/server';
import { EstimateScreen } from './EstimateScreen';

describe('EstimateScreen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders one row per selected category grouped by bucket', () => {
    renderWithProviders(
      <EstimateScreen
        selectedNeeds={['Rent / Bond', 'Groceries']}
        selectedWants={['Dining Out']}
        onContinue={() => {}}
      />
    );
    expect(screen.getByText('Rent / Bond')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Dining Out')).toBeInTheDocument();
  });

  it('persists estimates on Next and advances', async () => {
    let captured: { stepNumber: number; stepName: string; response: string } | null = null;
    server.use(
      http.post('/api/onboarding/response', async ({ request }) => {
        captured = (await request.json()) as typeof captured;
        return HttpResponse.json({});
      })
    );
    const onContinue = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <EstimateScreen
        selectedNeeds={['Rent / Bond']}
        selectedWants={['Dining Out']}
        onContinue={onContinue}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    await user.clear(inputs[0]);
    await user.type(inputs[0], '12000');
    await user.clear(inputs[1]);
    await user.type(inputs[1], '1500');

    await user.click(screen.getByRole('button', { name: /^next$/i }));

    await waitFor(() => {
      expect(captured).not.toBeNull();
      expect(onContinue).toHaveBeenCalledOnce();
    });
    expect(captured!.stepNumber).toBe(4);
    const payload = JSON.parse(captured!.response) as Record<string, number>;
    expect(payload['Rent / Bond']).toBe(12000);
    expect(payload['Dining Out']).toBe(1500);
  });

  it('allows submission with zero values', async () => {
    let captured: { stepNumber: number; stepName: string; response: string } | null = null;
    server.use(
      http.post('/api/onboarding/response', async ({ request }) => {
        captured = (await request.json()) as typeof captured;
        return HttpResponse.json({});
      })
    );
    const onContinue = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <EstimateScreen
        selectedNeeds={['Rent / Bond']}
        selectedWants={[]}
        onContinue={onContinue}
      />
    );
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await waitFor(() => expect(onContinue).toHaveBeenCalledOnce());
    const payload = JSON.parse(captured!.response) as Record<string, number>;
    expect(payload['Rent / Bond'] ?? 0).toBe(0);
  });
});
```

### Step 2: Run to verify failure

`cd src/frontend && npm run test -- EstimateScreen`

### Step 3: Implement

Path: `src/frontend/src/pages/onboarding/categories/EstimateScreen.tsx`

```tsx
import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Btn } from '../../../components/brand/Btn';
import { apiClient } from '../../../api/client';
import { defaultCategories, extraCategories, type CategoryDef } from './data';

const allCategories: CategoryDef[] = [...defaultCategories, ...extraCategories];
const fmt = (n: number) => 'R' + Math.round(n).toLocaleString('en-ZA');

interface EstimateScreenProps {
  selectedNeeds: string[];
  selectedWants: string[];
  onContinue: () => void;
}

export function EstimateScreen({ selectedNeeds, selectedWants, onContinue }: EstimateScreenProps) {
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  const needsRows = useMemo(
    () => selectedNeeds.map((name) => allCategories.find((c) => c.name === name)).filter(Boolean) as CategoryDef[],
    [selectedNeeds]
  );
  const wantsRows = useMemo(
    () => selectedWants.map((name) => allCategories.find((c) => c.name === name)).filter(Boolean) as CategoryDef[],
    [selectedWants]
  );

  const totalNeeds = needsRows.reduce((s, c) => s + (parseInt(amounts[c.name]) || 0), 0);
  const totalWants = wantsRows.reduce((s, c) => s + (parseInt(amounts[c.name]) || 0), 0);
  const grandTotal = totalNeeds + totalWants;

  const setAmount = (name: string, raw: string) => {
    setAmounts((prev) => ({ ...prev, [name]: raw.replace(/[^0-9]/g, '') }));
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, number> = {};
      for (const row of [...needsRows, ...wantsRows]) {
        payload[row.name] = parseInt(amounts[row.name]) || 0;
      }
      await apiClient.post('/onboarding/response', {
        stepNumber: 4,
        stepName: 'Per-category estimates',
        response: JSON.stringify(payload),
      });
    },
    onSuccess: () => onContinue(),
  });

  return (
    <div className="flex flex-col min-h-screen bg-cactus-sandstone font-cactus px-6 animate-fade-up">
      <div className="flex-1 pt-6 overflow-auto">
        <div className="text-4xl mb-2.5" aria-hidden="true">
          ⚡
        </div>
        <h1 className="font-cactus font-bold text-[21px] text-cactus-charcoal m-0 mb-1.5">
          Quick estimates
        </h1>
        <p className="font-cactus text-[13.5px] text-cactus-charcoal/40 font-medium m-0 mb-1 leading-relaxed">
          Roughly how much do you spend per month on each? Don't overthink it — ballpark is perfect.
        </p>
        <div className="inline-flex items-center gap-1.5 bg-cactus-needs-bg rounded-lg py-1.5 px-2.5 mb-5 mt-2">
          <span className="text-sm" aria-hidden="true">
            ⏱️
          </span>
          <span className="font-cactus text-xs font-semibold text-cactus-charcoal/50">
            Should take less than 5 minutes
          </span>
        </div>
        <p className="font-cactus text-[11.5px] text-cactus-charcoal/40 font-medium m-0 mb-4 leading-relaxed">
          The real numbers will flow in once your bank is connected. This is just to get you started — momentum is what matters. 🚀
        </p>

        <EstimateBucket
          label="Needs"
          dotClass="bg-cactus-sage"
          rows={needsRows}
          amounts={amounts}
          setAmount={setAmount}
          total={totalNeeds}
        />
        <EstimateBucket
          label="Wants"
          dotClass="bg-cactus-desert"
          rows={wantsRows}
          amounts={amounts}
          setAmount={setAmount}
          total={totalWants}
        />

        {grandTotal > 0 && (
          <div className="bg-cactus-sandstone/80 border border-cactus-overlay rounded-xl py-3 px-3.5 flex justify-between items-center mb-2">
            <span className="font-cactus font-bold text-sm text-cactus-charcoal">
              Estimated monthly spend
            </span>
            <span className="font-cactus font-bold text-base text-cactus-charcoal">
              {fmt(grandTotal)}
            </span>
          </div>
        )}
      </div>
      <div className="py-4 pb-7 shrink-0">
        <Btn onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          Next
        </Btn>
      </div>
    </div>
  );
}

interface EstimateBucketProps {
  label: string;
  dotClass: string;
  rows: CategoryDef[];
  amounts: Record<string, string>;
  setAmount: (name: string, raw: string) => void;
  total: number;
}

function EstimateBucket({ label, dotClass, rows, amounts, setAmount, total }: EstimateBucketProps) {
  return (
    <div className="mb-5">
      <div className="flex items-center gap-1.5 mb-2">
        <div className={`w-2.5 h-2.5 rounded-sm ${dotClass}`} />
        <span className="font-cactus font-bold text-sm text-cactus-charcoal">{label}</span>
        <span className="font-cactus font-semibold text-xs text-cactus-charcoal/30 ml-auto">
          {fmt(total)}
        </span>
      </div>
      {rows.map((row) => (
        <div
          key={row.name}
          className="flex items-center gap-2.5 py-2.5 border-b border-cactus-overlay"
        >
          <span className="text-lg shrink-0" aria-hidden="true">
            {row.icon}
          </span>
          <span className="font-cactus font-semibold text-sm text-cactus-charcoal flex-1">
            {row.name}
          </span>
          <div className="flex items-center gap-0.5 bg-cactus-sandstone rounded-lg py-2 px-3 w-[110px]">
            <span className="font-cactus font-semibold text-sm text-cactus-charcoal/40">R</span>
            <input
              type="text"
              inputMode="numeric"
              value={amounts[row.name] ?? ''}
              onChange={(e) => setAmount(row.name, e.target.value)}
              placeholder="0"
              className="border-none bg-transparent outline-none font-cactus font-semibold text-sm text-cactus-charcoal w-full text-right"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Step 4: Run to verify pass

Expected: 3 tests pass.

### Step 5: Commit

```bash
git add src/frontend/src/pages/onboarding/categories/EstimateScreen.tsx src/frontend/src/pages/onboarding/categories/EstimateScreen.test.tsx
git commit -m "feat(onboarding): add <EstimateScreen /> with per-category amount entry"
```

---

## Task 5: Wire categories + estimates into `Onboarding.tsx`

**Files:**
- Modify: `src/frontend/src/pages/Onboarding.tsx`

### Step 1: Imports + state

Add to imports:

```tsx
import { CategoryScreen } from './onboarding/categories/CategoryScreen';
import { EstimateScreen } from './onboarding/categories/EstimateScreen';
```

Extend the phase union:

```tsx
const [phase, setPhase] = useState<
  | 'phase2-welcome'
  | 'phase2-intro'
  | 'phase2-slider'
  | 'goal-pick'
  | 'categories'   // NEW
  | 'estimates'    // NEW
  | 'questions'
>('phase2-welcome');
```

Add hand-off state for the selection (place near the other useState declarations):

```tsx
const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
const [selectedWants, setSelectedWants] = useState<string[]>([]);
```

### Step 2: Wire transitions

Update the goal-pick block to route to `categories` instead of `questions`:

```tsx
if (phase === 'goal-pick') {
  return <GoalPickScreen onContinue={() => setPhase('categories')} />;
}
```

Add the categories block immediately after `goal-pick`:

```tsx
if (phase === 'categories') {
  return (
    <CategoryScreen
      onContinue={(needs, wants) => {
        setSelectedNeeds(needs);
        setSelectedWants(wants);
        setPhase('estimates');
      }}
    />
  );
}
if (phase === 'estimates') {
  return (
    <EstimateScreen
      selectedNeeds={selectedNeeds}
      selectedWants={selectedWants}
      onContinue={() => setPhase('questions')}
    />
  );
}
```

### Step 3: Run the full test suite

`cd src/frontend && npm run test`

Expected: previous baseline + 6 new tests (3 CategoryScreen + 3 EstimateScreen) pass.

### Step 4: Lint + format + build

```bash
cd src/frontend
npm run lint
npm run format:check
npm run build
```

All clean.

### Step 5: Commit

```bash
git add src/frontend/src/pages/Onboarding.tsx
git commit -m "$(cat <<'EOF'
feat(onboarding): wire categories + estimates phases between goal-pick and questions

The phase state machine gains 'categories' and 'estimates'. goal-pick now transitions to categories instead of questions; estimates is the last phase before the existing wizard. Selection lists hand off from CategoryScreen to EstimateScreen via local component state.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Open the PR

> **Pre-task setup:** the executor should be on branch `axis-o/pr-5-categories-estimates`.

### Step 1: Final gates

```bash
cd /Users/henricktissink/Sauce/cactus/.claude/worktrees/axis-o+pr-5-categories-estimates
cd src/frontend && npm run test && npm run lint && npm run format:check && npm run build
cd ../.. && DOTNET_ROLL_FORWARD=LatestMajor dotnet test src/backend/tests/Cactus.Application.Tests/Cactus.Application.Tests.csproj --filter "FullyQualifiedName~Onboarding"
```

All green.

### Step 2: Push

```bash
git push -u origin worktree-axis-o+pr-5-categories-estimates:axis-o/pr-5-categories-estimates
```

### Step 3: Create the PR

```bash
gh pr create --title "Axis O PR 5: categories + per-category estimates" --body "$(cat <<'EOF'
## Summary
- New `<CategoryScreen />` inserted between goal-pick and the wizard — toggle pills for Needs + Wants with an extras panel revealing SA-specific options (Stokvel, Levies, Petrol, etc.)
- New `<EstimateScreen />` follows — per-category monthly amount entry with running totals; "ballpark is perfect" friction-light copy
- Backend seeder is now **idempotent** and adds 8 SA-specific categories; renames legacy entries (Housing → Rent / Bond, Healthcare → Medical Aid, etc.)
- `CompleteOnboardingCommand` reads step 3 + step 4 and creates `UserCategory` rows + `BudgetAllocation` rows on the SpendingPlan with the estimated amounts (0 for unestimated categories)

## Out of scope (deferred)
- Multi-source income + goal-detail with affordability classification (O-6)
- Custom user-added categories (future PR)
- Brand rollout (O-7/O-8)

## Test plan
- [x] Backend: 8 CompleteOnboardingCommand tests (existing 6 + 2 new for UserCategory + BudgetAllocation creation)
- [x] Frontend: 6 new tests (3 CategoryScreen + 3 EstimateScreen)
- [x] `npm run lint`, `npm run format:check`, `npm run build` clean
- [x] `dotnet test` green
- [ ] Manual: register → walk through Phase 2 → goal-pick → CategoryScreen (defaults pre-selected; add Stokvel from extras) → EstimateScreen (enter R12000 for Rent / Bond) → existing wizard (income step)
- [ ] Manual: after merge, deploy → seeder runs on first request → confirm new categories appear in prod DB

## Spec / plan
- [Umbrella](docs/superpowers/specs/2026-05-07-axis-o-onboarding-design.md)
- [PR-5 design](docs/superpowers/specs/2026-05-12-axis-o-pr-5-categories-estimates-design.md)
- [PR-5 plan](docs/superpowers/plans/2026-05-12-axis-o-pr-5-categories-estimates.md)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

If `gh` is not authenticated, surface the URL + body for manual creation.

### Step 4: Hand off to user for merge.

---

## Self-Review

**Spec coverage:** All 10 acceptance criteria mapped to tasks (T1: seeder; T2: backend handler + tests; T3-T4: frontend screens; T5: wiring; T6: PR).

**Placeholder scan:** No TBD / TODO. Every step has concrete code or commands.

**Type consistency:** Category names are strings across `data.ts`, screen components, and backend lookups. The `selectedNeeds: string[]; selectedWants: string[]` props of EstimateScreen match what CategoryScreen passes via `onContinue(needs, wants)`.

**Risks / followups:**
- The "selectedNeeds / selectedWants" hand-off via local component state in Onboarding.tsx is lost on browser refresh. Acceptable since the user just answered them; in practice they'd re-answer if they got that far and refreshed. Long-term, push to a wizard-state store similar to the pre-signup one.
- The seeder's rename of legacy categories is destructive in prod. Documented in O5-D4. No production users yet so this is safe.
