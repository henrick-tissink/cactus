# Axis O — PR 6: Multi-Source Income + Goal Detail + Final Screen

**Date:** 2026-05-12
**Parent umbrella:** [2026-05-07-axis-o-onboarding-design.md](2026-05-07-axis-o-onboarding-design.md)
**Status:** Draft, awaiting execution
**Effort:** ~1 day
**Depth:** Solid

---

## What this PR ships

The final three screens of the post-signup wizard — bringing Axis O's onboarding flow to its conclusion:

1. **IncomeScreen** — primary salary input + optional secondary sources (freelance / rental / investment / support / grant / other). Live total.
2. **GoalDetailScreen** — target amount + (optional) months input with **affordability classification** (✅ doable / ⚠️ stretch) computed from `leftover = income - expenses`.
3. **FinalScreen** — "You're all set!" with the bank-connect teaser. POSTs `/onboarding/complete` and navigates to `/` (Dashboard with FTUX banner per umbrella D4).

Plus the **legacy wizard cleanup**: the existing `steps` array, `progressPrompts`, fast-forward `useQuery`, slider JSX, debt form JSX in `Onboarding.tsx` are all deleted — every step is now superseded by an Axis O screen.

## Decisions specific to this PR

| # | Decision | Rationale |
|---|---|---|
| O6-D1 | **Primary income reuses existing backend step 5.** Secondary sources land in step 11. Goal target lands in steps 12 + 13. | Keeps backwards compat with `CompleteOnboardingCommand`'s existing step-5 reading; secondary + target use free slots from the validator's 1..13 range. |
| O6-D2 | **Affordability math is frontend-only.** No new backend query. The screen reads income + expenses from local component state (handed off from earlier screens via Onboarding.tsx). | Umbrella D9: wizard state is local. Adding a backend query would duplicate state already in-flight. |
| O6-D3 | **Secondary income sources stored as JSON column on `SpendingPlan`** (`SecondaryIncomeSources` string, nullable). No new `IncomeSource` entity. | Per umbrella D6 (YAGNI): no use case beyond onboarding yet. Schema upgrade if/when an in-product income editor lands. |
| O6-D4 | **Goal target updates the existing `Goal` entity post-creation.** `CompleteOnboardingCommand` reads steps 12 + 13 and updates `TargetAmount` + `TargetDate` after `CreateGoalForPick`. | Avoids restructuring the existing goal-creation flow; `TargetAmount = 0` placeholder from O-4 gets replaced. `TargetDate` = `now + months` for save/debt; `null` for emergency. |
| O6-D5 | **Final screen calls POST `/onboarding/complete`** before navigating. The "Got it" CTA → POST → navigate('/'). | Currently the legacy wizard's "Get Started" did the POST; with the wizard removed, the FinalScreen owns it. |
| O6-D6 | **Delete the entire legacy wizard render in `Onboarding.tsx`.** All 5 remaining steps (ids [1, 2, 5, 7, 8]) are pre-answered or superseded. | After O-6, none of the legacy `steps` array entries are reachable — phase machine fully drives the flow. |
| O6-D7 | **`GoalDetailScreen` is shown for save and debt goals, skipped for emergency.** For emergency, the FinalScreen renders directly after IncomeScreen with a default target = 3 months of expenses. | Emergency goals don't ask "by when?" — methodology says "ready when you're ready". Matches umbrella's step 13 conditional. |
| O6-D8 | **EF migration includes the new SecondaryIncomeSources column.** Generate via `dotnet ef migrations add`. | Required for prod deploys to apply the schema change. Migration runs automatically via `db.Database.MigrateAsync()` on startup. |

## File structure

**Created (frontend):**
- `src/frontend/src/pages/onboarding/income/IncomeScreen.tsx` + `.test.tsx`
- `src/frontend/src/pages/onboarding/income/data.ts` — secondary-source type definitions
- `src/frontend/src/pages/onboarding/goal/GoalDetailScreen.tsx` + `.test.tsx`
- `src/frontend/src/pages/onboarding/final/FinalScreen.tsx` + `.test.tsx`

**Created (backend):**
- New EF migration adding `secondary_income_sources` text column to `spending_plans`

**Modified (frontend):**
- `src/frontend/src/pages/Onboarding.tsx` — add 3 new phases (`income`, `goal-detail`, `final`); REMOVE legacy `steps` array + render block; carry `totalIncome` + `totalExpenses` + `goalType` in local state for hand-off

**Modified (backend):**
- `src/backend/src/Cactus.Domain/Entities/SpendingPlan.cs` — add `SecondaryIncomeSources` string property
- `src/backend/src/Cactus.Infrastructure/Data/Configurations/SpendingPlanConfiguration.cs` — map the new column
- `src/backend/src/Cactus.Application/Features/Onboarding/Commands/CompleteOnboardingCommand.cs` — read steps 11, 12, 13; persist to SpendingPlan + Goal
- `src/backend/tests/Cactus.Application.Tests/Onboarding/CompleteOnboardingCommandHandlerTests.cs` — new tests for income aggregation + goal target

## Step semantics (final mapping after O-6)

| Backend step | Captured by | StepName |
|---|---|---|
| 1 | Pre-signup Q1 (priorities) | "Priorities (multi)" |
| 2 | Pre-signup Q3 (month-end) | "Month-end state" |
| 3 | CategoryScreen (needs+wants combined object) | "Category selection" |
| 4 | EstimateScreen (per-category amounts) | "Per-category estimates" |
| 5 | IncomeScreen primary salary | "Monthly Income" |
| 6 | GoalPickScreen ("save"/"debt"/"emergency") | "Goal type pick" |
| 7 | Pre-signup Q5 (debt types array) | "Debt types (multi)" |
| 8 | Pre-signup Q4 (savings cushion) | "Savings cushion" |
| 9 | Pre-signup Q2 (stress points) | "Stress points (multi)" |
| 10 | (free / unused) | — |
| 11 | IncomeScreen secondary sources | "Secondary income sources" |
| 12 | GoalDetailScreen target amount | "Goal target amount" |
| 13 | GoalDetailScreen target months (omitted for emergency) | "Goal target months" |

## Component contracts

### `IncomeScreen`

Props: `{ onContinue: (totalIncome: number) => void }`.

State: primary (string), secondarySources (`Array<{type: string, label: string, icon: string, amount: string}>`).

On "Next":
1. POST step 5 with primary as a JSON-serialized number.
2. POST step 11 with `JSON.stringify(secondarySources.map(s => ({type: s.type, amount: parseInt(s.amount) || 0})))`.
3. Compute `totalIncome = parseInt(primary) + sum(secondary amounts)`, call `onContinue(totalIncome)`.

Fixed list of secondary income types (icons + labels matching the prototype):
- `freelance` 💻 Freelance / Side hustle
- `rental` 🏘️ Rental income
- `investment` 📈 Investment returns
- `support` 🤝 Support / Maintenance
- `grant` 🎓 Grant / Stipend
- `other` 💵 Other income

### `GoalDetailScreen`

Props: `{ goalType: 'save' | 'debt' | 'emergency'; totalIncome: number; totalExpenses: number; onContinue: () => void }`.

For `emergency`: skip rendering. The wizard wires goal-detail → final directly (no months input). For interim simplicity, **emergency goals get TargetAmount = totalExpenses × 3** computed by the backend in `CompleteOnboardingCommand` when step 12 is absent.

For `save` and `debt`: render target amount + months inputs + affordability card.

State: amount (string), months (string).

Math:
- `monthlyNeeded = Math.ceil(amount / months)`
- `leftover = totalIncome - totalExpenses`
- `canAfford = monthlyNeeded <= leftover`

Display:
- "✅ That's doable!" if canAfford → `monthlyNeeded` in sage; "X% of your available R{leftover}/mo — totally achievable."
- "⚠️ Might be a stretch" if not → `monthlyNeeded` in prickly; "💡 At R{leftover}/month, it would take {ceil(amount/leftover)} months instead."

On "Lock in my goal":
1. POST step 12 with `JSON.stringify(amount)`.
2. POST step 13 with `JSON.stringify(months)`.
3. Call `onContinue()`.

### `FinalScreen`

Props: `{ goalType: 'save' | 'debt' | 'emergency'; monthlyGoalAmount: number }`.

Renders 🌵 splash + "You're all set!" + "Your Spending Plan is ready with R{monthlyGoalAmount}/month going toward {goalLabel}." + bank-connect teaser pill + "Got it — take me to my Dashboard" CTA.

On CTA:
1. POST `/onboarding/complete`.
2. On success: update auth store `setUser({...user, isOnboardingComplete: true})`.
3. Navigate to `/`.

## Backend changes — concrete

### SpendingPlan entity

Add property:

```csharp
public string? SecondaryIncomeSources { get; set; }
```

### SpendingPlanConfiguration

Add mapping:

```csharp
builder.Property(s => s.SecondaryIncomeSources)
    .HasColumnName("secondary_income_sources")
    .HasColumnType("text");
```

### EF migration

Generate via:

```bash
cd src/backend && DOTNET_ROLL_FORWARD=LatestMajor dotnet ef migrations add AddSecondaryIncomeSourcesToSpendingPlan \
  --project src/Cactus.Infrastructure/Cactus.Infrastructure.csproj \
  --startup-project src/Cactus.Api/Cactus.Api.csproj
```

Verify the generated migration adds a single column. Hand-edit if needed.

### CompleteOnboardingCommand updates

After SpendingPlan creation block, set the new fields:

```csharp
// PR O-6: Aggregate income from primary (step 5) + secondary (step 11)
var primaryIncomeResponse = responses.FirstOrDefault(r => r.StepNumber == 5);
decimal primaryIncome = 0m;
if (primaryIncomeResponse != null)
    decimal.TryParse(primaryIncomeResponse.Response, out primaryIncome);

var secondaryResponse = responses.FirstOrDefault(r => r.StepNumber == 11);
var (secondaryTotal, secondaryJson) = ParseSecondaryIncome(secondaryResponse?.Response);

if (newSpendingPlan != null)
{
    newSpendingPlan.MonthlyIncome = primaryIncome + secondaryTotal;
    newSpendingPlan.SecondaryIncomeSources = secondaryJson;
}

// PR O-6: Update Goal with target amount + months from steps 12 + 13
var primaryGoal = _context.Goals.Local.FirstOrDefault(g => g.UserId == userId && g.IsPrimary);
if (primaryGoal != null)
{
    var targetAmountResponse = responses.FirstOrDefault(r => r.StepNumber == 12);
    var targetMonthsResponse = responses.FirstOrDefault(r => r.StepNumber == 13);

    decimal targetAmount = 0m;
    if (targetAmountResponse != null)
        decimal.TryParse(targetAmountResponse.Response.Trim('"'), out targetAmount);

    primaryGoal.TargetAmount = targetAmount;

    if (targetMonthsResponse != null
        && int.TryParse(targetMonthsResponse.Response.Trim('"'), out var months)
        && months > 0)
    {
        primaryGoal.TargetDate = DateTime.UtcNow.AddMonths(months);
    }
}
```

`ParseSecondaryIncome` helper:

```csharp
private static (decimal total, string? json) ParseSecondaryIncome(string? response)
{
    if (string.IsNullOrWhiteSpace(response)) return (0m, null);
    try
    {
        using var doc = System.Text.Json.JsonDocument.Parse(response);
        if (doc.RootElement.ValueKind != System.Text.Json.JsonValueKind.Array) return (0m, null);
        decimal total = 0m;
        foreach (var element in doc.RootElement.EnumerateArray())
        {
            if (element.TryGetProperty("amount", out var amt) && amt.TryGetDecimal(out var amount))
                total += amount;
        }
        return (total, response);  // store raw JSON for future use
    }
    catch
    {
        return (0m, null);
    }
}
```

## Onboarding.tsx integration

Extend the phase union to its FINAL form:

```tsx
const [phase, setPhase] = useState<
  | 'phase2-welcome'
  | 'phase2-intro'
  | 'phase2-slider'
  | 'goal-pick'
  | 'categories'
  | 'estimates'
  | 'income'         // NEW
  | 'goal-detail'    // NEW
  | 'final'          // NEW
>('phase2-welcome');
```

Local state for cross-screen hand-off:

```tsx
const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
const [selectedWants, setSelectedWants] = useState<string[]>([]);
const [perCategoryEstimates, setPerCategoryEstimates] = useState<Record<string, number>>({});
const [totalIncome, setTotalIncome] = useState(0);
const [goalType, setGoalType] = useState<'save' | 'debt' | 'emergency'>('save');
const [monthlyGoalAmount, setMonthlyGoalAmount] = useState(0);
```

Note: the goal-pick screen needs a small extension to call `setGoalType(value)` before `onContinue`. EstimateScreen needs to also call `setPerCategoryEstimates(estimates)` so we can compute totalExpenses for goal-detail.

Transitions (final form):

- `goal-pick` → `categories` (also captures `goalType`)
- `categories` → `estimates`
- `estimates` → `income` (also captures `perCategoryEstimates`)
- `income` → `goalType === 'emergency' ? 'final' : 'goal-detail'`
- `goal-detail` → `final`
- `final` → POST complete + navigate('/')

Total expenses (for goal-detail's affordability math): `Object.values(perCategoryEstimates).reduce((a, b) => a + b, 0)`.

REMOVE entirely from Onboarding.tsx:
- The `steps` array
- `progressPrompts`
- The `useQuery({ queryKey: ['/onboarding/status'] })`
- The `hasFastForwarded` render-phase derivation block
- All the JSX in the `return ( ... )` for the legacy wizard (from `<div className="min-h-screen bg-cactus-sandstone font-cactus flex flex-col">` onward)

The file should shrink from ~545 lines to roughly 100 lines (just the phase machine).

## Acceptance criteria

1. After EstimateScreen, the user lands on IncomeScreen.
2. IncomeScreen renders primary input + "Add other income source" expander; selecting a type adds an editable row.
3. "Next" POSTs steps 5 + 11; advances to GoalDetailScreen (or directly to FinalScreen for emergency goal).
4. GoalDetailScreen shows the affordability card with ✅ doable / ⚠️ stretch verdict based on `leftover = income - expenses`.
5. "Lock in" POSTs steps 12 + 13; advances to FinalScreen.
6. FinalScreen renders the "All set!" splash + bank-connect teaser; "Got it" CTA POSTs `/onboarding/complete` and navigates to `/`.
7. CompleteOnboardingCommand: `SpendingPlan.MonthlyIncome` = primary + sum(secondary); `SpendingPlan.SecondaryIncomeSources` = the raw step-11 JSON; primary `Goal.TargetAmount` + `TargetDate` updated from steps 12+13.
8. Legacy wizard render is removed from Onboarding.tsx.
9. EF migration applies cleanly to a fresh SQLite + Postgres database; production deploy applies it via `MigrateAsync()`.
10. Lint / format / build / `dotnet test` all clean. ≥3 tests per new frontend screen; ≥2 new backend tests covering income aggregation + goal target update.

## Out of scope

- Custom user-added secondary income types (fixed list of 6).
- Editing income / goal post-onboarding (Settings; future PR).
- The Dashboard FTUX banner that nudges bank-connect (umbrella D4) — that's part of O-7's Dashboard pass.
- Brand rollout to non-onboarding pages (O-7/O-8).

## Open risks

1. **EF migration on prod.** First migration that's been generated since Axis A's setup. Verify the generated SQL is what we expect; commit the migration files (both `.cs` and `.Designer.cs`) and the snapshot update.
2. **`Goals.Local` lookup** for the primary goal in CompleteOnboardingCommand assumes the goal was added in the same `SaveChanges` cycle. Since `CreateGoalForPick` runs earlier in the same handler invocation, the goal sits in `Local` before SaveChanges — verified pattern.
3. **Removing the legacy wizard render is a big delete.** Any test or dev-tool that depended on the slider/debt-form JSX would break. Verify no consumers exist (`grep -r 'Allocation Estimate\|hasDebts' src/`).
4. **Secondary income JSON column on existing rows.** Existing prod rows get `null` for the new column on migration. Acceptable — column is nullable.
5. **Emergency goal's "skip goal-detail" branch.** Frontend logic checks `goalType === 'emergency'` to bypass goal-detail. If the goal-pick wasn't recorded somehow (e.g. user skipped via dev tools), `goalType` defaults to `'save'` and the wizard renders goal-detail — acceptable degradation.
