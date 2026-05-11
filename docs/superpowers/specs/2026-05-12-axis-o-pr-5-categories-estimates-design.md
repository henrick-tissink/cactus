# Axis O — PR 5: Categories Selection + Per-Category Estimates

**Date:** 2026-05-12
**Parent umbrella:** [2026-05-07-axis-o-onboarding-design.md](2026-05-07-axis-o-onboarding-design.md)
**Status:** Draft, executing
**Effort:** ~1 day
**Depth:** Solid

---

## What this PR ships

Two new screens that run after `goal-pick` and before the existing wizard's income step:

1. **CategoryScreen** — toggleable pills under "Needs" and "Wants" headings; tap "+ Add" to surface extras (Stokvel, Levies, Petrol, Pets, Coffee & Snacks, Clothing, etc.). Persists selection as JSON object under step 3.
2. **EstimateScreen** — per-category monthly amount inputs grouped by bucket; running totals; "Should take less than 5 minutes" hint. Persists as JSON object under step 4.

On `CompleteOnboardingCommand`, the new step 3 + step 4 responses are used to create `UserCategory` rows (selection) and seed `BudgetAllocation` rows on the `SpendingPlan` (estimates).

The backend seeder gains 8 SA-specific Category rows (School Fees, Stokvel, Home Security, Levies/Body Corp, Petrol, Pets, Coffee & Snacks, Clothing) with idempotent insertion so existing prod databases get them on next deploy.

## Decisions specific to this PR

| # | Decision | Rationale |
|---|---|---|
| O5-D1 | **Use step 3 for "category selection" (combined needs + wants in one JSON object) and step 4 for "per-category estimates".** | Umbrella's intended `7 = Needs cats, 8 = Wants cats, 9 = estimates` slots are already taken (Q5 → 7, Q4 → 8, Q2 → 9 per O-2's mapping). Slots 3 and 4 are free; combining needs+wants into one slot frees slot 5 onward for O-6's income/goal-target. |
| O5-D2 | **Category identity is by canonical NAME, not Guid.** The frontend uses category names ("rent", "groceries"); the backend resolves names → Category rows via case-insensitive lookup. | Decouples frontend hardcoded data from backend Guids (which differ across environments — Guid.NewGuid() in the seeder). Names are stable identifiers. |
| O5-D3 | **Idempotent category seeder.** `CactusDbContextSeeder` is extended to also seed missing categories (compares by name within macro bucket); existing prod databases get the SA-specific additions on next deploy. | Production already has 24 system categories. Adding to the seeder's `if !any` guard would skip; per-category idempotent check ensures additions land everywhere. |
| O5-D4 | **Names match the prototype, not the existing seeder.** Where they differ: `Healthcare` aliases to `Medical Aid` (the SA-specific term); `Transportation` aliases to `Transport`; `Housing` aliases to `Rent / Bond`. We **rename** the existing rows during the idempotent seed. | The prototype is the design authority. Renaming is forward-only — no users will have transactions categorized under the old names yet (no transactions exist pre-launch). If users existed, this would be a migration concern. |
| O5-D5 | **EstimateScreen totals are visual only, not validated.** The user can submit even with R0 totals; the backend creates `BudgetAllocation` rows with `AllocatedAmount = 0` for those. | Umbrella principle: "ballpark is perfect" — don't gate progress on completeness. Bank-feed integration (Axis D) will eventually correct these. |
| O5-D6 | **`UserCategory` rows are created for ALL system categories the user *opts into*** (not the full system catalog). Categories the user didn't pick stay system-only and remain available globally but won't show up as "the user's categories" in the Dashboard / Transactions UI. | Matches the `UserCategory.IsHidden` flag's semantics — users curate which categories are visible to them. |
| O5-D7 | **Estimates always create BudgetAllocations**, even when `AllocatedAmount = 0`. This guarantees per-user category breakdowns are present from day one. | Dashboard rendering depends on `BudgetAllocation` rows; absent rows mean empty UI. Zero-value rows mean "category visible, no spending allocated". |
| O5-D8 | **No new validator rules.** Step 3 + step 4 free-form JSON validation is handler-side, not validator-side. Step values are not constrained at the validator. | Matches existing pattern (step JSON shapes are heterogeneous; validators don't constrain content). |

## File structure

**Created (frontend):**
- `src/frontend/src/pages/onboarding/categories/data.ts` — default + extra category lists (by name, matching backend seed)
- `src/frontend/src/pages/onboarding/categories/CategoryScreen.tsx` + `.test.tsx`
- `src/frontend/src/pages/onboarding/categories/EstimateScreen.tsx` + `.test.tsx`

**Created (backend):**
- `src/backend/tests/Cactus.Application.Tests/Onboarding/CompleteOnboardingCommandHandlerTests.cs` — extended with category + estimate tests

**Modified (frontend):**
- `src/frontend/src/pages/Onboarding.tsx` — add `'categories'` and `'estimates'` phases; transitions: goal-pick → categories → estimates → existing wizard (which now lands on the income step).

**Modified (backend):**
- `src/backend/src/Cactus.Infrastructure/Data/CactusDbContextSeeder.cs` — idempotent category upsert; add 8 SA-specific entries; rename Healthcare/Transportation/Housing to Medical Aid / Transport / Rent / Bond.
- `src/backend/src/Cactus.Application/Features/Onboarding/Commands/CompleteOnboardingCommand.cs` — read step 3 + step 4; create `UserCategory` + `BudgetAllocation` rows.

## Category catalog (post-seed)

After this PR, the system Categories under MacroCategory "Needs" are:

| Name | Icon | Display |
|---|---|---|
| Rent / Bond | home | 1 |
| Groceries | shopping-cart | 2 |
| Transport | car | 3 |
| Utilities | bolt | 4 |
| Insurance | shield | 5 |
| Medical Aid | heart-pulse | 6 |
| Debt Minimum Payments | credit-card | 7 |
| School Fees | graduation-cap | 8 |
| Petrol | fuel | 9 |
| Childcare | baby | 10 |
| Stokvel | hand-shake | 11 |
| Home Security | lock | 12 |
| Levies / Body Corp | building | 13 |

Under MacroCategory "Wants":

| Name | Icon | Display |
|---|---|---|
| Dining Out | utensils | 1 |
| Entertainment | film | 2 |
| Shopping | bag-shopping | 3 |
| Subscriptions | tv | 4 |
| Personal Care | spa | 5 |
| Hobbies | gamepad-2 | 6 |
| Fitness | dumbbell | 7 |
| Travel | plane | 8 |
| Pets | paw-print | 9 |
| Gifts | gift | 10 |
| Coffee & Snacks | coffee | 11 |
| Clothing | shirt | 12 |

Goals catalog stays as-is (6 entries).

## Frontend data shape

`src/frontend/src/pages/onboarding/categories/data.ts`:

```ts
export interface CategoryDef {
  name: string;          // canonical name matching backend
  icon: string;          // emoji for the pill (different from backend's lucide-style icon string)
  bucket: 'needs' | 'wants';
}

export const defaultCategories: CategoryDef[] = [
  // Needs (8 defaults)
  { name: 'Rent / Bond',           icon: '🏠', bucket: 'needs' },
  { name: 'Groceries',             icon: '🛒', bucket: 'needs' },
  { name: 'Transport',             icon: '🚗', bucket: 'needs' },
  { name: 'Utilities',             icon: '💡', bucket: 'needs' },
  { name: 'Insurance',             icon: '🛡️', bucket: 'needs' },
  { name: 'Medical Aid',           icon: '🏥', bucket: 'needs' },
  { name: 'Debt Minimum Payments', icon: '💸', bucket: 'needs' },
  { name: 'School Fees',           icon: '🎒', bucket: 'needs' },
  // Wants (6 defaults)
  { name: 'Dining Out',            icon: '🍽️', bucket: 'wants' },
  { name: 'Entertainment',         icon: '🎬', bucket: 'wants' },
  { name: 'Shopping',              icon: '🛍️', bucket: 'wants' },
  { name: 'Subscriptions',         icon: '📺', bucket: 'wants' },
  { name: 'Personal Care',         icon: '💅', bucket: 'wants' },
  { name: 'Hobbies',               icon: '🎨', bucket: 'wants' },
];

export const extraCategories: CategoryDef[] = [
  // Needs extras (5)
  { name: 'Petrol',                icon: '⛽', bucket: 'needs' },
  { name: 'Childcare',             icon: '👶', bucket: 'needs' },
  { name: 'Stokvel',               icon: '🤝', bucket: 'needs' },
  { name: 'Home Security',         icon: '🔒', bucket: 'needs' },
  { name: 'Levies / Body Corp',    icon: '🏢', bucket: 'needs' },
  // Wants extras (6)
  { name: 'Fitness',               icon: '🏋️', bucket: 'wants' },
  { name: 'Travel',                icon: '✈️', bucket: 'wants' },
  { name: 'Pets',                  icon: '🐾', bucket: 'wants' },
  { name: 'Gifts',                 icon: '🎁', bucket: 'wants' },
  { name: 'Coffee & Snacks',       icon: '☕', bucket: 'wants' },
  { name: 'Clothing',              icon: '👕', bucket: 'wants' },
];
```

## Component contracts

### `CategoryScreen`

Props: `{ onContinue: (selectedNeeds: string[], selectedWants: string[]) => void }`.

State: `useState<string[]>` for both `selectedNeeds` and `selectedWants`, initialized from `defaultCategories` (all 8 needs + all 6 wants pre-selected as the methodology's "start with the common ones" default). User can deselect any default and add any extra.

On "Looks good" CTA:
1. POST step 3 with `JSON.stringify({needs: selectedNeeds, wants: selectedWants})`.
2. Call `onContinue(selectedNeeds, selectedWants)` so the next screen (EstimateScreen) knows which categories to ask about.

### `EstimateScreen`

Props: `{ selectedNeeds: string[]; selectedWants: string[]; onContinue: () => void }`.

State: `useState<Record<string, string>>({})` keyed by category name (string value to allow "" placeholder).

Renders one row per selected category with a `<MoneyInput />`. Shows running total per bucket and grand total.

On "Next" CTA:
1. Build estimates object: `{ "Rent / Bond": 12000, "Groceries": 4500, ... }` with non-numeric values stripped.
2. POST step 4 with `JSON.stringify(estimates)`.
3. Call `onContinue()`.

## Onboarding.tsx integration

Extend the phase union:

```tsx
const [phase, setPhase] = useState<
  | 'phase2-welcome'
  | 'phase2-intro'
  | 'phase2-slider'
  | 'goal-pick'
  | 'categories'    // NEW
  | 'estimates'     // NEW
  | 'questions'
>('phase2-welcome');
```

Local component state to hand-off selection from CategoryScreen to EstimateScreen:

```tsx
const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
const [selectedWants, setSelectedWants] = useState<string[]>([]);
```

Transitions:

- `goal-pick` → `categories`
- `categories` → `estimates` (after CategoryScreen.onContinue records the selection)
- `estimates` → `questions` (after EstimateScreen.onContinue)

The existing 5-step wizard (ids [1, 2, 5, 7, 8] after O-4) continues to take over for steps the pre-signup wizard didn't pre-fill — primarily step 5 (income). Once O-6 lands, the wizard fully retires.

## Backend changes — concrete

### `CactusDbContextSeeder.SeedAsync`

Change the top-level guard:

```csharp
public static async Task SeedAsync(CactusDbContext context)
{
    await EnsureMacroCategoriesAsync(context);   // no change
    await EnsureCategoriesAsync(context);        // NEW idempotent path
}
```

New `EnsureCategoriesAsync`:

```csharp
private static async Task EnsureCategoriesAsync(CactusDbContext context)
{
    var existing = await context.Categories
        .Include(c => c.MacroCategory)
        .ToListAsync();
    var macros = await context.MacroCategories.ToDictionaryAsync(m => m.Type);

    foreach (var (bucketType, definitions) in CategoryCatalog)
    {
        var macro = macros[bucketType];
        foreach (var def in definitions)
        {
            var current = existing.FirstOrDefault(c =>
                c.MacroCategoryId == macro.Id &&
                string.Equals(c.Name, def.Name, StringComparison.OrdinalIgnoreCase));

            if (current == null)
            {
                context.Categories.Add(new Category
                {
                    Id = Guid.NewGuid(),
                    MacroCategoryId = macro.Id,
                    Name = def.Name,
                    Icon = def.Icon,
                    DisplayOrder = def.DisplayOrder,
                    IsSystem = true,
                });
            }
            else if (current.Name != def.Name || current.Icon != def.Icon || current.DisplayOrder != def.DisplayOrder)
            {
                // Update existing row to match catalog (handles renames like Healthcare → Medical Aid)
                current.Name = def.Name;
                current.Icon = def.Icon;
                current.DisplayOrder = def.DisplayOrder;
            }
        }
    }

    await context.SaveChangesAsync();
}
```

`CategoryCatalog` is a private static dictionary mapping `MacroCategoryType` → `(name, icon, displayOrder)[]` matching the catalog table above.

Also: handle the rename collision. The existing `Healthcare`, `Transportation`, `Housing` are renamed to `Medical Aid`, `Transport`, `Rent / Bond` — but the case-insensitive match by name will need to handle this. Strategy: match by display order + bucket first if the canonical names don't match. Or use a one-time rename map.

Simpler: include a small migration / one-time rename block in the seeder:

```csharp
private static async Task RenameLegacyCategoriesAsync(CactusDbContext context)
{
    var renames = new Dictionary<string, string>
    {
        ["Healthcare"] = "Medical Aid",
        ["Transportation"] = "Transport",
        ["Housing"] = "Rent / Bond",
        ["Education"] = "School Fees",
        ["Debt Minimum Payments"] = "Debt Minimum Payments", // unchanged but listed for clarity
    };

    var toRename = await context.Categories
        .Where(c => renames.Keys.Contains(c.Name))
        .ToListAsync();

    foreach (var c in toRename)
    {
        if (renames.TryGetValue(c.Name, out var newName))
            c.Name = newName;
    }
    await context.SaveChangesAsync();
}
```

Call this BEFORE `EnsureCategoriesAsync` so the idempotent catalog check finds the renamed rows.

### `CompleteOnboardingCommand`

After the existing SpendingPlan creation block, add:

```csharp
        // PR O-5: Create UserCategory + BudgetAllocation rows from step 3 + step 4
        var categoriesResponse = responses.FirstOrDefault(r => r.StepNumber == 3);
        var estimatesResponse = responses.FirstOrDefault(r => r.StepNumber == 4);

        if (categoriesResponse != null && existingPlan == null)  // only on first onboarding
        {
            await ProcessCategoriesAndEstimatesAsync(
                userId,
                spendingPlan,
                categoriesResponse.Response,
                estimatesResponse?.Response,
                cancellationToken
            );
        }
```

New helper:

```csharp
    private async Task ProcessCategoriesAndEstimatesAsync(
        Guid userId,
        SpendingPlan plan,
        string categoriesJson,
        string? estimatesJson,
        CancellationToken cancellationToken)
    {
        // Parse selection: { needs: [...], wants: [...] }
        var selectedNames = new List<string>();
        try
        {
            using var doc = JsonDocument.Parse(categoriesJson);
            if (doc.RootElement.TryGetProperty("needs", out var needs))
                foreach (var n in needs.EnumerateArray()) selectedNames.Add(n.GetString() ?? "");
            if (doc.RootElement.TryGetProperty("wants", out var wants))
                foreach (var w in wants.EnumerateArray()) selectedNames.Add(w.GetString() ?? "");
        }
        catch
        {
            return; // malformed; skip
        }

        // Parse estimates: { "Rent / Bond": 12000, ... }
        var estimates = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
        if (!string.IsNullOrWhiteSpace(estimatesJson))
        {
            try
            {
                using var doc = JsonDocument.Parse(estimatesJson);
                foreach (var prop in doc.RootElement.EnumerateObject())
                {
                    if (prop.Value.ValueKind == JsonValueKind.Number)
                        estimates[prop.Name] = prop.Value.GetDecimal();
                }
            }
            catch
            {
                // Estimates optional; carry on with zero values
            }
        }

        // Resolve names to Category rows
        var categories = await _context.Categories
            .Where(c => selectedNames.Contains(c.Name))
            .ToListAsync(cancellationToken);

        // Create UserCategory + BudgetAllocation for each
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
                AllocatedAmount = amount, // 0m if not estimated
            });
        }
    }
```

Note: the SpendingPlan must already be added to `_context` (it is, earlier in the handler). The `plan.Id` is set when the entity is created via `Guid.NewGuid()` on `BaseEntity` or by `SaveChangesAsync`. If `BaseEntity` assigns Id in the constructor (verify by reading `BaseEntity.cs`), this works directly; otherwise we need to call `SaveChangesAsync` before referencing plan.Id.

## Acceptance criteria

1. User completes goal-pick → lands on CategoryScreen.
2. CategoryScreen renders 8 Needs + 6 Wants defaults as pills, all pre-selected.
3. Tapping "+ Add" under Needs reveals 5 extras (Petrol, Childcare, Stokvel, Home Security, Levies); under Wants reveals 6 extras (Fitness, Travel, Pets, Gifts, Coffee & Snacks, Clothing).
4. User can deselect defaults and select extras; selection persists in component state.
5. "Looks good" POSTs step 3 with `{needs:[...], wants:[...]}` and advances to EstimateScreen.
6. EstimateScreen renders the user's selected categories grouped by bucket, with `<MoneyInput />` per row + running totals.
7. "Next" POSTs step 4 with `{categoryName: amount, ...}` and advances to the existing wizard.
8. CompleteOnboardingCommand reads step 3 + step 4, creates `UserCategory` rows for selected categories and `BudgetAllocation` rows on the new SpendingPlan with the estimate amounts (0 if none).
9. Backend seeder is idempotent: re-running it doesn't duplicate categories. Existing prod categories are renamed (Healthcare → Medical Aid, etc.) and new SA-specific categories are added.
10. Lint / format / build / `dotnet test` all clean. ≥3 tests per new frontend screen; ≥2 new backend tests covering the seeder + CompleteOnboardingCommand category-creation path.

## Out of scope

- Custom user-added categories (only system + the prototype's extras). Future PR.
- SubCategory support in onboarding (the `SubCategory` entity exists but isn't surfaced).
- Editing categories post-onboarding (lives in Settings; future PR).
- Brand rollout (O-7/O-8).
- Income capture and goal-detail screen — O-6.

## Open risks

1. **Backend seeder modifies existing rows.** The rename from Healthcare → Medical Aid is destructive on existing prod data. If any user has transactions categorized as "Healthcare", the category row is renamed; the transactions follow by FK. Acceptable since no real users exist; documented for the deploy.
2. **Category name as identity is brittle.** A typo in `data.ts` (e.g. "Rent/Bond" vs "Rent / Bond" — different spacing) would cause the backend lookup to miss. Mitigation: exact-match constants in `data.ts` matching the canonical seeder names; case-insensitive lookup on the backend further softens this.
3. **The combined "needs + wants" JSON object for step 3 deviates from umbrella's 7 + 8 split.** Documented in O5-D1; future PRs reading historical step 3 data must understand the combined shape.
4. **EstimateScreen on small viewports.** Up to 19 rows + inputs could overflow phone-frame height. Mitigation: scrollable container with bucket-total stickies. Acceptable degraded UX; refine post-Axis-O if it's a problem.
5. **BudgetAllocation rows persist with `AllocatedAmount = 0` for categories the user didn't estimate.** Dashboard renders may need to filter or treat zero specially. Out of scope for this PR.
