# Axis O — PR 6: Multi-Source Income + Goal Detail + Final — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Parent specs:**
- Umbrella: [2026-05-07-axis-o-onboarding-design.md](../specs/2026-05-07-axis-o-onboarding-design.md)
- PR-6 design: [2026-05-12-axis-o-pr-6-income-goal-detail-final-design.md](../specs/2026-05-12-axis-o-pr-6-income-goal-detail-final-design.md)

**Goal:** Three new screens (income, goal-detail, final) closing the post-signup wizard; backend persists secondary income + goal target; legacy wizard render fully removed from `Onboarding.tsx`.

**Architecture:** Frontend screens hand off `totalIncome` + `totalExpenses` + `goalType` via local state in Onboarding.tsx. Backend gains a `SecondaryIncomeSources` JSON column on `SpendingPlan` (new EF migration) and updates `CompleteOnboardingCommand` to aggregate income + update Goal target.

**Tech Stack:** React 19, TanStack Query, Tailwind v4, Vitest+RTL, MSW. .NET 8 with EF Core (new migration).

---

## File Structure

**Created (frontend):**
- `src/frontend/src/pages/onboarding/income/data.ts` — secondary-source type list
- `src/frontend/src/pages/onboarding/income/IncomeScreen.tsx` + `.test.tsx`
- `src/frontend/src/pages/onboarding/goal/GoalDetailScreen.tsx` + `.test.tsx`
- `src/frontend/src/pages/onboarding/final/FinalScreen.tsx` + `.test.tsx`

**Created (backend):**
- New EF migration `AddSecondaryIncomeSourcesToSpendingPlan`

**Modified (frontend):**
- `src/frontend/src/pages/Onboarding.tsx` — final phase wiring + REMOVE legacy wizard render
- `src/frontend/src/pages/onboarding/goal/GoalPickScreen.tsx` — emit `goalType` in `onContinue` (small extension)
- `src/frontend/src/pages/onboarding/categories/EstimateScreen.tsx` — emit `estimates` in `onContinue` (small extension)

**Modified (backend):**
- `src/backend/src/Cactus.Domain/Entities/SpendingPlan.cs`
- `src/backend/src/Cactus.Infrastructure/Data/Configurations/SpendingPlanConfiguration.cs`
- `src/backend/src/Cactus.Application/Features/Onboarding/Commands/CompleteOnboardingCommand.cs`
- `src/backend/tests/Cactus.Application.Tests/Onboarding/CompleteOnboardingCommandHandlerTests.cs`

---

## Task 1: Backend domain + migration for SecondaryIncomeSources

**Files:**
- Modify: `src/backend/src/Cactus.Domain/Entities/SpendingPlan.cs`
- Modify: `src/backend/src/Cactus.Infrastructure/Data/Configurations/SpendingPlanConfiguration.cs`
- Generate: new EF migration

### Step 1: Add the property to SpendingPlan

In `src/backend/src/Cactus.Domain/Entities/SpendingPlan.cs`, add after `IsActive`:

```csharp
public string? SecondaryIncomeSources { get; set; }
```

### Step 2: Add the EF mapping

In `src/backend/src/Cactus.Infrastructure/Data/Configurations/SpendingPlanConfiguration.cs`, add inside the `SpendingPlanConfiguration` class's `Configure` method (after the `IsActive` property mapping):

```csharp
builder.Property(s => s.SecondaryIncomeSources)
    .HasColumnName("secondary_income_sources")
    .HasColumnType("text");
```

### Step 3: Generate the EF migration

```bash
cd src/backend && DOTNET_ROLL_FORWARD=LatestMajor dotnet ef migrations add AddSecondaryIncomeSourcesToSpendingPlan \
  --project src/Cactus.Infrastructure/Cactus.Infrastructure.csproj \
  --startup-project src/Cactus.Api/Cactus.Api.csproj
```

If `dotnet-ef` isn't installed globally, install with:

```bash
DOTNET_ROLL_FORWARD=LatestMajor dotnet tool install --global dotnet-ef
```

Verify the generated migration adds a single `AddColumn` for `secondary_income_sources` text nullable. Files generated: `*_AddSecondaryIncomeSourcesToSpendingPlan.cs`, `*.Designer.cs`, snapshot updated.

### Step 4: Build + smoke

```bash
DOTNET_ROLL_FORWARD=LatestMajor dotnet build src/backend/src/Cactus.Infrastructure/Cactus.Infrastructure.csproj 2>&1 | tail -5
```

Clean build expected.

### Step 5: Commit

```bash
git add src/backend/src/Cactus.Domain/Entities/SpendingPlan.cs \
  src/backend/src/Cactus.Infrastructure/Data/Configurations/SpendingPlanConfiguration.cs \
  src/backend/src/Cactus.Infrastructure/Data/Migrations/
git commit -m "feat(domain): add SpendingPlan.SecondaryIncomeSources JSON column + migration"
```

---

## Task 2: Backend — extend `CompleteOnboardingCommand` for income + goal target (TDD)

**Files:**
- Modify: `src/backend/src/Cactus.Application/Features/Onboarding/Commands/CompleteOnboardingCommand.cs`
- Modify: `src/backend/tests/Cactus.Application.Tests/Onboarding/CompleteOnboardingCommandHandlerTests.cs`

### Step 1: Write failing tests

Append to the test file:

```csharp
[Fact]
public async Task Complete_WithStep11SecondaryIncome_AggregatesIntoMonthlyIncome()
{
    var user = TestDataFactory.User();
    Context.Users.Add(user);
    Context.OnboardingResponses.Add(new OnboardingResponse
    {
        UserId = user.Id, StepNumber = 5, StepName = "Monthly Income", Response = "35000",
    });
    Context.OnboardingResponses.Add(new OnboardingResponse
    {
        UserId = user.Id, StepNumber = 11, StepName = "Secondary income sources",
        Response = "[{\"type\":\"freelance\",\"amount\":5000},{\"type\":\"rental\",\"amount\":2500}]",
    });
    await Context.SaveChangesAsync(default);
    _currentUser.UserId.Returns(user.Id);

    var handler = new CompleteOnboardingCommandHandler(Context, _currentUser);
    await handler.Handle(new CompleteOnboardingCommand(), CancellationToken.None);

    var plan = Context.SpendingPlans.Single(p => p.UserId == user.Id);
    plan.MonthlyIncome.Should().Be(42500m); // 35000 + 5000 + 2500
    plan.SecondaryIncomeSources.Should().Contain("freelance");
}

[Fact]
public async Task Complete_WithStep12And13_UpdatesGoalTargetAmountAndDate()
{
    var user = TestDataFactory.User();
    Context.Users.Add(user);
    Context.OnboardingResponses.Add(new OnboardingResponse
    {
        UserId = user.Id, StepNumber = 6, StepName = "Goal type pick", Response = "[\"save\"]",
    });
    Context.OnboardingResponses.Add(new OnboardingResponse
    {
        UserId = user.Id, StepNumber = 12, StepName = "Goal target amount", Response = "\"50000\"",
    });
    Context.OnboardingResponses.Add(new OnboardingResponse
    {
        UserId = user.Id, StepNumber = 13, StepName = "Goal target months", Response = "\"12\"",
    });
    await Context.SaveChangesAsync(default);
    _currentUser.UserId.Returns(user.Id);

    var handler = new CompleteOnboardingCommandHandler(Context, _currentUser);
    await handler.Handle(new CompleteOnboardingCommand(), CancellationToken.None);

    var goal = Context.Goals.Single(g => g.UserId == user.Id);
    goal.TargetAmount.Should().Be(50000m);
    goal.TargetDate.Should().NotBeNull();
    goal.TargetDate!.Value.Should().BeCloseTo(DateTime.UtcNow.AddMonths(12), TimeSpan.FromMinutes(1));
}

[Fact]
public async Task Complete_WithEmergencyGoalAndNoMonths_LeavesTargetDateNull()
{
    var user = TestDataFactory.User();
    Context.Users.Add(user);
    Context.OnboardingResponses.Add(new OnboardingResponse
    {
        UserId = user.Id, StepNumber = 6, StepName = "Goal type pick", Response = "[\"emergency\"]",
    });
    Context.OnboardingResponses.Add(new OnboardingResponse
    {
        UserId = user.Id, StepNumber = 12, StepName = "Goal target amount", Response = "\"30000\"",
    });
    // No step 13 for emergency
    await Context.SaveChangesAsync(default);
    _currentUser.UserId.Returns(user.Id);

    var handler = new CompleteOnboardingCommandHandler(Context, _currentUser);
    await handler.Handle(new CompleteOnboardingCommand(), CancellationToken.None);

    var goal = Context.Goals.Single(g => g.UserId == user.Id);
    goal.TargetAmount.Should().Be(30000m);
    goal.TargetDate.Should().BeNull();
}
```

### Step 2: Run to verify failure

```bash
cd src/backend && DOTNET_ROLL_FORWARD=LatestMajor dotnet test src/backend/tests/Cactus.Application.Tests/Cactus.Application.Tests.csproj --filter "FullyQualifiedName~CompleteOnboardingCommandHandlerTests" 2>&1 | tail -8
```

Expected: 3 new tests fail.

### Step 3: Modify CompleteOnboardingCommand

Read the current handler. Find the spot after `_context.SpendingPlans.Add(spendingPlan)` and after `CreateGoalForPick(...)` adds the goal. Insert (in this order):

```csharp
        // PR O-6: Aggregate primary + secondary income onto SpendingPlan
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

        // PR O-6: Update primary Goal with target amount + date from steps 12 + 13
        var primaryGoal = _context.Goals.Local.FirstOrDefault(g => g.UserId == userId && g.IsPrimary);
        if (primaryGoal != null)
        {
            var targetAmountResponse = responses.FirstOrDefault(r => r.StepNumber == 12);
            decimal targetAmount = 0m;
            if (targetAmountResponse != null)
            {
                var trimmed = targetAmountResponse.Response.Trim('"');
                decimal.TryParse(trimmed, out targetAmount);
            }
            if (targetAmount > 0) primaryGoal.TargetAmount = targetAmount;

            var targetMonthsResponse = responses.FirstOrDefault(r => r.StepNumber == 13);
            if (targetMonthsResponse != null)
            {
                var trimmed = targetMonthsResponse.Response.Trim('"');
                if (int.TryParse(trimmed, out var months) && months > 0)
                {
                    primaryGoal.TargetDate = DateTime.UtcNow.AddMonths(months);
                }
            }
        }
```

Add the helper:

```csharp
    private static (decimal Total, string? Json) ParseSecondaryIncome(string? response)
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
            return (total, response);
        }
        catch
        {
            return (0m, null);
        }
    }
```

### Step 4: Run tests

```bash
cd src/backend && DOTNET_ROLL_FORWARD=LatestMajor dotnet test src/backend/tests/Cactus.Application.Tests/Cactus.Application.Tests.csproj --filter "FullyQualifiedName~CompleteOnboardingCommandHandlerTests" 2>&1 | tail -8
```

Expected: 11 tests pass (8 existing + 3 new).

### Step 5: Commit

```bash
git add src/backend/src/Cactus.Application/Features/Onboarding/Commands/CompleteOnboardingCommand.cs \
  src/backend/tests/Cactus.Application.Tests/Onboarding/CompleteOnboardingCommandHandlerTests.cs
git commit -m "feat(onboarding): aggregate income (steps 5+11) + update Goal target (steps 12+13)"
```

---

## Task 3: Frontend — `<IncomeScreen />` + data (TDD)

**Files:**
- Create: `src/frontend/src/pages/onboarding/income/data.ts`
- Create: `src/frontend/src/pages/onboarding/income/IncomeScreen.tsx`
- Create: `src/frontend/src/pages/onboarding/income/IncomeScreen.test.tsx`

### Step 1: Create `data.ts`

```ts
export interface IncomeSourceType {
  id: string;
  label: string;
  icon: string;
}

export const incomeSourceTypes: IncomeSourceType[] = [
  { id: 'freelance', label: 'Freelance / Side hustle', icon: '💻' },
  { id: 'rental', label: 'Rental income', icon: '🏘️' },
  { id: 'investment', label: 'Investment returns', icon: '📈' },
  { id: 'support', label: 'Support / Maintenance', icon: '🤝' },
  { id: 'grant', label: 'Grant / Stipend', icon: '🎓' },
  { id: 'other', label: 'Other income', icon: '💵' },
];
```

### Step 2: Write the failing test

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/render';
import { server } from '../../../test/mocks/server';
import { IncomeScreen } from './IncomeScreen';

describe('IncomeScreen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('disables Next until primary income has a value', async () => {
    renderWithProviders(<IncomeScreen onContinue={() => {}} />);
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled();
  });

  it('persists primary + secondary on Next and forwards total to onContinue', async () => {
    const captured: Array<{ stepNumber: number; stepName: string; response: string }> = [];
    server.use(
      http.post('/api/onboarding/response', async ({ request }) => {
        captured.push((await request.json()) as (typeof captured)[number]);
        return HttpResponse.json({});
      })
    );
    const onContinue = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<IncomeScreen onContinue={onContinue} />);

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], '35000');
    await user.click(screen.getByRole('button', { name: /add other income source/i }));
    await user.click(screen.getByRole('button', { name: /freelance/i }));
    const allInputs = screen.getAllByRole('textbox');
    await user.type(allInputs[allInputs.length - 1], '5000');

    await user.click(screen.getByRole('button', { name: /^next$/i }));

    await waitFor(() => expect(onContinue).toHaveBeenCalledOnce());
    expect(captured).toHaveLength(2);
    const primaryPost = captured.find((c) => c.stepNumber === 5);
    expect(primaryPost!.response).toContain('35000');
    const secondaryPost = captured.find((c) => c.stepNumber === 11);
    const parsed = JSON.parse(secondaryPost!.response) as Array<{ type: string; amount: number }>;
    expect(parsed[0]).toEqual({ type: 'freelance', amount: 5000 });
    expect(onContinue).toHaveBeenCalledWith(40000); // 35000 + 5000
  });

  it('allows submission with primary only (no secondary)', async () => {
    server.use(
      http.post('/api/onboarding/response', () => HttpResponse.json({}))
    );
    const onContinue = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<IncomeScreen onContinue={onContinue} />);
    await user.type(screen.getAllByRole('textbox')[0], '20000');
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await waitFor(() => expect(onContinue).toHaveBeenCalledWith(20000));
  });
});
```

### Step 3: Run to verify failure, then implement

Skeleton (the implementer should fill in the full layout based on the prototype's IncomeScreen at `cactus-onboarding-phase1.jsx` lines 318-432):

```tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Btn } from '../../../components/brand/Btn';
import { MoneyInput } from '../../../components/brand/MoneyInput';
import { apiClient } from '../../../api/client';
import { incomeSourceTypes, type IncomeSourceType } from './data';

interface SecondaryEntry {
  id: string;
  label: string;
  icon: string;
  amount: string;
}

interface IncomeScreenProps {
  onContinue: (totalIncome: number) => void;
}

export function IncomeScreen({ onContinue }: IncomeScreenProps) {
  const [primary, setPrimary] = useState('');
  const [secondary, setSecondary] = useState<SecondaryEntry[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const primaryNum = parseInt(primary) || 0;
  const secondaryTotal = secondary.reduce((s, e) => s + (parseInt(e.amount) || 0), 0);
  const totalIncome = primaryNum + secondaryTotal;

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/onboarding/response', {
        stepNumber: 5,
        stepName: 'Monthly Income',
        response: String(primaryNum),
      });
      const secondaryPayload = secondary.map((s) => ({
        type: s.id,
        amount: parseInt(s.amount) || 0,
      }));
      await apiClient.post('/onboarding/response', {
        stepNumber: 11,
        stepName: 'Secondary income sources',
        response: JSON.stringify(secondaryPayload),
      });
    },
    onSuccess: () => onContinue(totalIncome),
  });

  const addSource = (type: IncomeSourceType) => {
    if (secondary.find((s) => s.id === type.id)) return;
    setSecondary((prev) => [...prev, { ...type, amount: '' }]);
    setShowAdd(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-cactus-sandstone font-cactus px-6 animate-fade-up">
      <div className="flex-1 pt-7 overflow-auto">
        <div className="text-4xl mb-3" aria-hidden="true">💰</div>
        <h1 className="font-cactus font-bold text-[22px] text-cactus-charcoal m-0 mb-1.5 leading-tight">
          What's coming in each month?
        </h1>
        <p className="font-cactus text-sm text-cactus-charcoal/40 font-medium m-0 mb-6 leading-relaxed">
          Your take-home pay after tax. We need this to build a plan that actually works for you.
        </p>

        <label className="font-cactus font-bold text-sm text-cactus-charcoal block mb-2">
          💼 Primary income (salary)
        </label>
        <MoneyInput value={primary} onChange={setPrimary} placeholder="e.g. 35,000" />
        <p className="font-cactus text-[11.5px] text-cactus-charcoal/40 font-medium mt-1.5 mb-6">
          After tax — what actually hits your account
        </p>

        {secondary.length > 0 && (
          <div className="mb-4">
            <span className="font-cactus font-bold text-sm text-cactus-charcoal block mb-2.5">
              Other income
            </span>
            {secondary.map((src) => (
              <div key={src.id} className="flex items-center gap-2.5 mb-2.5 animate-fade-up">
                <span className="text-lg" aria-hidden="true">{src.icon}</span>
                <div className="flex-1">
                  <span className="font-cactus font-semibold text-[13px] text-cactus-charcoal block mb-1">
                    {src.label}
                  </span>
                  <MoneyInput
                    value={src.amount}
                    onChange={(v) =>
                      setSecondary((prev) =>
                        prev.map((s) => (s.id === src.id ? { ...s, amount: v } : s))
                      )
                    }
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setSecondary((prev) => prev.filter((s) => s.id !== src.id))}
                  className="bg-transparent border-none text-base text-cactus-charcoal/30 cursor-pointer p-1"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowAdd((s) => !s)}
          className="flex items-center gap-1.5 bg-transparent border-2 border-dashed border-cactus-overlay rounded-xl py-3 px-4 w-full cursor-pointer font-cactus font-semibold text-[13px] text-cactus-sage mb-3"
        >
          <span className="text-base">+</span> Add other income source
        </button>

        {showAdd && (
          <div className="bg-cactus-sage-light/50 rounded-xl p-3 mb-4 animate-fade-up">
            <p className="font-cactus text-[11px] text-cactus-charcoal/50 font-semibold m-0 mb-2">
              What kind of income?
            </p>
            <div className="flex flex-wrap gap-1.5">
              {incomeSourceTypes
                .filter((t) => !secondary.find((s) => s.id === t.id))
                .map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => addSource(t)}
                    className="inline-flex items-center gap-1 py-1.5 px-3 rounded-full border-[1.5px] border-cactus-overlay bg-white cursor-pointer font-cactus font-semibold text-xs text-cactus-charcoal"
                  >
                    <span className="text-sm">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
            </div>
          </div>
        )}

        {totalIncome > 0 && (
          <div className="bg-cactus-needs-bg rounded-2xl p-3.5 px-4 animate-fade-up">
            <div className="flex justify-between items-center">
              <span className="font-cactus font-bold text-sm text-cactus-charcoal">
                Total monthly income
              </span>
              <span className="font-cactus font-bold text-base text-cactus-sage">
                R{totalIncome.toLocaleString('en-ZA')}
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="py-4 pb-7 shrink-0">
        <Btn onClick={() => saveMutation.mutate()} disabled={!primaryNum || saveMutation.isPending}>
          Next
        </Btn>
      </div>
    </div>
  );
}
```

### Step 4: Verify pass, commit

```bash
cd src/frontend && npm run test -- IncomeScreen
git add src/frontend/src/pages/onboarding/income/
git commit -m "feat(onboarding): add <IncomeScreen /> with primary + secondary income sources"
```

---

## Task 4: Frontend — `<GoalDetailScreen />` (TDD)

**Files:**
- Create: `src/frontend/src/pages/onboarding/goal/GoalDetailScreen.tsx`
- Create: `src/frontend/src/pages/onboarding/goal/GoalDetailScreen.test.tsx`

### Step 1: Write the failing test

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/render';
import { server } from '../../../test/mocks/server';
import { GoalDetailScreen } from './GoalDetailScreen';

describe('GoalDetailScreen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders save-goal copy and inputs', () => {
    renderWithProviders(
      <GoalDetailScreen goalType="save" totalIncome={35000} totalExpenses={20000} onContinue={() => {}} />
    );
    expect(screen.getByRole('heading', { name: /how much do you want to save/i })).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(2); // amount + months
  });

  it('shows ✅ doable verdict when monthly fits leftover', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <GoalDetailScreen goalType="save" totalIncome={35000} totalExpenses={20000} onContinue={() => {}} />
    );
    await user.type(screen.getAllByRole('textbox')[0], '50000');
    await user.type(screen.getAllByRole('textbox')[1], '12');
    // 50000/12 = 4167; leftover = 15000 → doable
    expect(screen.getByText(/that's doable/i)).toBeInTheDocument();
  });

  it('shows ⚠️ stretch verdict when monthly exceeds leftover', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <GoalDetailScreen goalType="save" totalIncome={35000} totalExpenses={32000} onContinue={() => {}} />
    );
    await user.type(screen.getAllByRole('textbox')[0], '60000');
    await user.type(screen.getAllByRole('textbox')[1], '6');
    // 60000/6 = 10000; leftover = 3000 → stretch
    expect(screen.getByText(/might be a stretch/i)).toBeInTheDocument();
  });

  it('persists steps 12 + 13 on lock-in and advances', async () => {
    const captured: Array<{ stepNumber: number; stepName: string; response: string }> = [];
    server.use(
      http.post('/api/onboarding/response', async ({ request }) => {
        captured.push((await request.json()) as (typeof captured)[number]);
        return HttpResponse.json({});
      })
    );
    const onContinue = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <GoalDetailScreen goalType="save" totalIncome={35000} totalExpenses={20000} onContinue={onContinue} />
    );
    await user.type(screen.getAllByRole('textbox')[0], '50000');
    await user.type(screen.getAllByRole('textbox')[1], '12');
    await user.click(screen.getByRole('button', { name: /lock in my goal/i }));

    await waitFor(() => expect(onContinue).toHaveBeenCalledOnce());
    expect(captured.find((c) => c.stepNumber === 12)?.response).toContain('50000');
    expect(captured.find((c) => c.stepNumber === 13)?.response).toContain('12');
  });
});
```

### Step 2: Implement

Skeleton:

```tsx
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Btn } from '../../../components/brand/Btn';
import { MoneyInput } from '../../../components/brand/MoneyInput';
import { apiClient } from '../../../api/client';

const fmt = (n: number) => 'R' + Math.round(n).toLocaleString('en-ZA');

interface GoalDetailScreenProps {
  goalType: 'save' | 'debt' | 'emergency';
  totalIncome: number;
  totalExpenses: number;
  onContinue: () => void;
}

const config = {
  save: {
    emoji: '💰',
    title: 'How much do you want to save?',
    subtitle: "Pick a target amount and when you'd like to reach it.",
    amountPlaceholder: 'e.g. 50,000',
  },
  debt: {
    emoji: '🔓',
    title: 'How much debt do you want to pay off?',
    subtitle: "Total amount across all your debts. We'll work out a monthly plan.",
    amountPlaceholder: 'e.g. 30,000',
  },
};

export function GoalDetailScreen({ goalType, totalIncome, totalExpenses, onContinue }: GoalDetailScreenProps) {
  const [amount, setAmount] = useState('');
  const [months, setMonths] = useState('');
  const c = config[goalType as 'save' | 'debt'] ?? config.save;

  const leftover = totalIncome - totalExpenses;
  const amtNum = parseInt(amount) || 0;
  const monthsNum = parseInt(months) || 0;
  const monthlyNeeded = monthsNum > 0 ? Math.ceil(amtNum / monthsNum) : 0;
  const canAfford = monthlyNeeded > 0 && monthlyNeeded <= leftover;

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/onboarding/response', {
        stepNumber: 12,
        stepName: 'Goal target amount',
        response: JSON.stringify(amount),
      });
      await apiClient.post('/onboarding/response', {
        stepNumber: 13,
        stepName: 'Goal target months',
        response: JSON.stringify(months),
      });
    },
    onSuccess: () => onContinue(),
  });

  return (
    <div className="flex flex-col min-h-screen bg-cactus-sandstone font-cactus px-6 animate-fade-up">
      <div className="flex-1 pt-7 overflow-auto">
        <div className="text-4xl mb-3" aria-hidden="true">{c.emoji}</div>
        <h1 className="font-cactus font-bold text-[21px] text-cactus-charcoal m-0 mb-1.5 leading-tight">
          {c.title}
        </h1>
        <p className="font-cactus text-[13.5px] text-cactus-charcoal/40 font-medium m-0 mb-6 leading-relaxed">
          {c.subtitle}
        </p>

        <label className="font-cactus font-semibold text-[13px] text-cactus-charcoal/50 block mb-2">
          Target amount
        </label>
        <MoneyInput value={amount} onChange={setAmount} placeholder={c.amountPlaceholder} />

        <label className="font-cactus font-semibold text-[13px] text-cactus-charcoal/50 block mb-2 mt-5">
          I want to reach this in
        </label>
        <div className="flex items-center gap-2.5">
          <input
            type="text"
            inputMode="numeric"
            value={months}
            onChange={(e) => setMonths(e.target.value.replace(/[^0-9]/g, ''))}
            placeholder="e.g. 12"
            className="flex-1 bg-white border-2 border-cactus-overlay rounded-xl py-3 px-4 font-cactus font-bold text-lg text-cactus-charcoal outline-none focus:border-cactus-sage"
          />
          <span className="font-cactus font-semibold text-[15px] text-cactus-charcoal/40">months</span>
        </div>

        <div className="bg-cactus-sandstone/80 border border-cactus-overlay rounded-xl py-3 px-3.5 mt-5 mb-4">
          <div className="flex justify-between mb-1">
            <span className="font-cactus font-medium text-xs text-cactus-charcoal/40">Monthly income</span>
            <span className="font-cactus font-semibold text-xs text-cactus-charcoal/50">{fmt(totalIncome)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span className="font-cactus font-medium text-xs text-cactus-charcoal/40">Estimated expenses</span>
            <span className="font-cactus font-semibold text-xs text-cactus-charcoal/50">– {fmt(totalExpenses)}</span>
          </div>
          <div className="flex justify-between border-t border-cactus-overlay pt-1 mt-1">
            <span className="font-cactus font-bold text-[13px] text-cactus-charcoal">Available for goals</span>
            <span className={`font-cactus font-bold text-[13px] ${leftover >= 0 ? 'text-cactus-sage' : 'text-cactus-prickly'}`}>
              {fmt(leftover)}/mo
            </span>
          </div>
        </div>

        {amtNum > 0 && monthsNum > 0 && (
          <div className={`rounded-2xl p-4 animate-fade-up ${canAfford ? 'bg-cactus-needs-bg' : 'bg-cactus-goals-bg'}`}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-lg">{canAfford ? '✅' : '⚠️'}</span>
              <span className="font-cactus font-bold text-[15px] text-cactus-charcoal">
                {canAfford ? "That's doable!" : 'Might be a stretch'}
              </span>
            </div>
            <div className={`font-cactus font-bold text-[22px] mb-1 ${canAfford ? 'text-cactus-sage' : 'text-cactus-prickly'}`}>
              {fmt(monthlyNeeded)}/month
            </div>
            <p className="font-cactus text-xs text-cactus-charcoal/50 font-medium m-0">
              {canAfford
                ? `That's ${Math.round((monthlyNeeded / leftover) * 100)}% of your available ${fmt(leftover)}/mo — totally achievable.`
                : `You have ${fmt(leftover)}/mo available. Consider extending your timeline or adjusting your expenses.`}
            </p>
            {!canAfford && leftover > 0 && (
              <p className="font-cactus text-xs text-cactus-charcoal/40 font-medium mt-2 m-0">
                💡 At {fmt(leftover)}/month, it would take {Math.ceil(amtNum / leftover)} months instead.
              </p>
            )}
          </div>
        )}
      </div>
      <div className="py-4 pb-7 shrink-0">
        <Btn onClick={() => saveMutation.mutate()} disabled={!amtNum || saveMutation.isPending}>
          Lock in my goal
        </Btn>
      </div>
    </div>
  );
}
```

### Step 3: Verify pass, commit

```bash
cd src/frontend && npm run test -- GoalDetailScreen
git add src/frontend/src/pages/onboarding/goal/GoalDetailScreen.tsx src/frontend/src/pages/onboarding/goal/GoalDetailScreen.test.tsx
git commit -m "feat(onboarding): add <GoalDetailScreen /> with affordability classification"
```

---

## Task 5: Frontend — `<FinalScreen />` (TDD)

**Files:**
- Create: `src/frontend/src/pages/onboarding/final/FinalScreen.tsx`
- Create: `src/frontend/src/pages/onboarding/final/FinalScreen.test.tsx`

### Step 1: Failing test

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/render';
import { server } from '../../../test/mocks/server';
import { useAuthStore } from '../../../store/authStore';
import { FinalScreen } from './FinalScreen';

describe('FinalScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: { userId: 'u1', email: 'x@y.z', firstName: null, lastName: null, isOnboardingComplete: false, isEmailVerified: false },
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it('renders the all-set splash with goal summary', () => {
    renderWithProviders(<FinalScreen goalType="save" monthlyGoalAmount={5000} />);
    expect(screen.getByRole('heading', { name: /you're all set/i })).toBeInTheDocument();
    expect(screen.getByText(/r5,000/i)).toBeInTheDocument();
  });

  it('POSTs /onboarding/complete and updates auth store on CTA click', async () => {
    let postedComplete = false;
    server.use(
      http.post('/api/onboarding/complete', () => {
        postedComplete = true;
        return HttpResponse.json({});
      })
    );
    const user = userEvent.setup();
    renderWithProviders(<FinalScreen goalType="save" monthlyGoalAmount={5000} />);
    await user.click(screen.getByRole('button', { name: /take me to my dashboard/i }));

    await waitFor(() => {
      expect(postedComplete).toBe(true);
      expect(useAuthStore.getState().user?.isOnboardingComplete).toBe(true);
    });
  });
});
```

### Step 2: Implement

```tsx
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Btn } from '../../../components/brand/Btn';
import { apiClient } from '../../../api/client';
import { useAuthStore } from '../../../store/authStore';

const fmt = (n: number) => 'R' + Math.round(n).toLocaleString('en-ZA');

const goalLabels: Record<string, string> = {
  save: 'saving',
  debt: 'debt payoff',
  emergency: 'emergency fund',
};

interface FinalScreenProps {
  goalType: 'save' | 'debt' | 'emergency';
  monthlyGoalAmount: number;
}

export function FinalScreen({ goalType, monthlyGoalAmount }: FinalScreenProps) {
  const navigate = useNavigate();
  const updateUser = useAuthStore((s) => s.updateUser);

  const completeMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/onboarding/complete');
    },
    onSuccess: () => {
      updateUser({ isOnboardingComplete: true });
      navigate('/');
    },
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10 text-center bg-cactus-sandstone font-cactus animate-fade-up">
      <div className="text-6xl mb-4" aria-hidden="true">🌵</div>
      <h1 className="font-cactus font-bold text-2xl text-cactus-charcoal m-0 mb-2">
        You're all set!
      </h1>
      <p className="font-cactus text-[15px] text-cactus-charcoal/60 font-medium m-0 mb-1.5 leading-relaxed max-w-xs">
        Your Spending Plan is ready with {fmt(monthlyGoalAmount)}/month going toward {goalLabels[goalType] ?? 'your goal'}.
      </p>
      <p className="font-cactus text-[13px] text-cactus-charcoal/40 font-medium m-0 mb-6 leading-relaxed max-w-[260px]">
        Next up: connecting your bank so real transactions start flowing in. The more you use Cactus, the smarter it gets. 💪
      </p>
      <div className="bg-cactus-sage-light rounded-xl py-3.5 px-5 inline-flex items-center gap-2 mb-8">
        <span className="text-lg" aria-hidden="true">🏦</span>
        <span className="font-cactus font-semibold text-sm text-cactus-charcoal">
          Bank connection coming next…
        </span>
      </div>
      <div className="w-auto">
        <Btn onClick={() => completeMutation.mutate()} disabled={completeMutation.isPending} className="px-12">
          Take me to my Dashboard
        </Btn>
      </div>
    </div>
  );
}
```

### Step 3: Verify, commit

```bash
cd src/frontend && npm run test -- FinalScreen
git add src/frontend/src/pages/onboarding/final/
git commit -m "feat(onboarding): add <FinalScreen /> with /onboarding/complete + dashboard navigation"
```

---

## Task 6: Wire phases + REMOVE legacy wizard from `Onboarding.tsx`

**Files:**
- Modify: `src/frontend/src/pages/Onboarding.tsx`
- Modify: `src/frontend/src/pages/onboarding/goal/GoalPickScreen.tsx` — emit goalType
- Modify: `src/frontend/src/pages/onboarding/categories/EstimateScreen.tsx` — emit estimates

### Step 1: Extend GoalPickScreen.onContinue signature

Change `onContinue: () => void` → `onContinue: (goalType: 'save' | 'debt' | 'emergency') => void`. The `saveMutation.onSuccess` becomes `() => onContinue(selected!)` — `selected` is the user's pick, guarded non-null since the lock-in CTA is disabled until selected.

Update GoalPickScreen.test.tsx accordingly: the test that asserts `expect(onContinue).toHaveBeenCalledOnce()` should be `expect(onContinue).toHaveBeenCalledWith('debt')` (or whichever was clicked).

### Step 2: Extend EstimateScreen.onContinue signature

Change `onContinue: () => void` → `onContinue: (estimates: Record<string, number>) => void`. Inside `saveMutation.mutationFn`, build the payload (already done) and pass it to `onContinue`:

```tsx
onSuccess: (...) // change to:
onSuccess: () => {
  const payload: Record<string, number> = {};
  for (const row of [...needsRows, ...wantsRows]) {
    payload[row.name] = parseInt(amounts[row.name]) || 0;
  }
  onContinue(payload);
}
```

Or hoist the `payload` build out of the mutation closure.

Update EstimateScreen.test.tsx: assert `expect(onContinue).toHaveBeenCalledWith(expect.objectContaining({ 'Rent / Bond': 12000 }))` etc.

### Step 3: Replace `Onboarding.tsx` body

Read the current file. Replace the entire `OnboardingPage` function body with:

```tsx
export function OnboardingPage() {
  const [phase, setPhase] = useState<
    | 'phase2-welcome'
    | 'phase2-intro'
    | 'phase2-slider'
    | 'goal-pick'
    | 'categories'
    | 'estimates'
    | 'income'
    | 'goal-detail'
    | 'final'
  >('phase2-welcome');

  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);
  const [selectedWants, setSelectedWants] = useState<string[]>([]);
  const [perCategoryEstimates, setPerCategoryEstimates] = useState<Record<string, number>>({});
  const [totalIncome, setTotalIncome] = useState(0);
  const [goalType, setGoalType] = useState<'save' | 'debt' | 'emergency'>('save');
  const [monthlyGoalAmount, setMonthlyGoalAmount] = useState(0);

  const totalExpenses = Object.values(perCategoryEstimates).reduce((a, b) => a + b, 0);

  if (phase === 'phase2-welcome') return <Phase2Welcome onContinue={() => setPhase('phase2-intro')} />;
  if (phase === 'phase2-intro')
    return (
      <Phase2Intro
        onContinue={() => setPhase('phase2-slider')}
        onSkip={() => setPhase('goal-pick')}
      />
    );
  if (phase === 'phase2-slider') return <Phase2Slider onContinue={() => setPhase('goal-pick')} />;

  if (phase === 'goal-pick')
    return (
      <GoalPickScreen
        onContinue={(picked) => {
          setGoalType(picked);
          setPhase('categories');
        }}
      />
    );

  if (phase === 'categories')
    return (
      <CategoryScreen
        onContinue={(needs, wants) => {
          setSelectedNeeds(needs);
          setSelectedWants(wants);
          setPhase('estimates');
        }}
      />
    );

  if (phase === 'estimates')
    return (
      <EstimateScreen
        selectedNeeds={selectedNeeds}
        selectedWants={selectedWants}
        onContinue={(estimates) => {
          setPerCategoryEstimates(estimates);
          setPhase('income');
        }}
      />
    );

  if (phase === 'income')
    return (
      <IncomeScreen
        onContinue={(income) => {
          setTotalIncome(income);
          setPhase(goalType === 'emergency' ? 'final' : 'goal-detail');
        }}
      />
    );

  if (phase === 'goal-detail')
    return (
      <GoalDetailScreen
        goalType={goalType}
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        onContinue={() => {
          // monthlyGoalAmount is computed best-effort from leftover for emergency,
          // or recomputed from the stored target+months elsewhere later.
          const leftover = Math.max(0, totalIncome - totalExpenses);
          setMonthlyGoalAmount(leftover);
          setPhase('final');
        }}
      />
    );

  return <FinalScreen goalType={goalType} monthlyGoalAmount={monthlyGoalAmount} />;
}
```

Add the imports at the top:

```tsx
import { useState } from 'react';
import { Phase2Welcome } from './onboarding/phase2/Phase2Welcome';
import { Phase2Intro } from './onboarding/phase2/Phase2Intro';
import { Phase2Slider } from './onboarding/phase2/Phase2Slider';
import { GoalPickScreen } from './onboarding/goal/GoalPickScreen';
import { GoalDetailScreen } from './onboarding/goal/GoalDetailScreen';
import { CategoryScreen } from './onboarding/categories/CategoryScreen';
import { EstimateScreen } from './onboarding/categories/EstimateScreen';
import { IncomeScreen } from './onboarding/income/IncomeScreen';
import { FinalScreen } from './onboarding/final/FinalScreen';
```

DELETE everything else from the file: existing imports for icons, the `steps` array, `progressPrompts`, mutations, useAuthStore for completion (FinalScreen owns it now), useQuery, all JSX from the old `return ( ... )`.

The file should end up around ~120 lines.

### Step 4: Run full test suite

`cd src/frontend && npm run test`

Expected: previous baseline + all new screen tests + updated GoalPickScreen + updated EstimateScreen tests pass.

### Step 5: Lint + format + build

```bash
cd src/frontend
npm run lint && npm run format:check && npm run build
```

All clean.

### Step 6: Commit

```bash
git add src/frontend/src/pages/Onboarding.tsx \
  src/frontend/src/pages/onboarding/goal/GoalPickScreen.tsx \
  src/frontend/src/pages/onboarding/goal/GoalPickScreen.test.tsx \
  src/frontend/src/pages/onboarding/categories/EstimateScreen.tsx \
  src/frontend/src/pages/onboarding/categories/EstimateScreen.test.tsx
git commit -m "$(cat <<'EOF'
feat(onboarding): wire income/goal-detail/final phases + remove legacy wizard render

The phase state machine reaches its final form. Income → (goal-detail OR final for emergency) → final. GoalPickScreen now emits the picked goalType; EstimateScreen emits the per-category estimates so goal-detail can compute leftover. The legacy wizard render (steps array, slider/debt JSX, fast-forward useQuery) is fully removed — every step is now superseded by an Axis O screen.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Open the PR

> **Pre-task setup:** branch `axis-o/pr-6-income-goal-detail-final`.

### Step 1: Final gates

```bash
cd /Users/henricktissink/Sauce/cactus/.claude/worktrees/axis-o+pr-6-income-goal-detail-final
cd src/frontend && npm run test && npm run lint && npm run format:check && npm run build
cd ../.. && DOTNET_ROLL_FORWARD=LatestMajor dotnet test src/backend/tests/Cactus.Application.Tests/Cactus.Application.Tests.csproj --filter "FullyQualifiedName~Onboarding"
```

### Step 2: Push

```bash
git push -u origin worktree-axis-o+pr-6-income-goal-detail-final:axis-o/pr-6-income-goal-detail-final
```

### Step 3: PR

```bash
gh pr create --title "Axis O PR 6: income + goal-detail + final + legacy wizard removal" --body "$(cat <<'EOF'
## Summary
- Three new screens close the post-signup wizard: IncomeScreen, GoalDetailScreen (with affordability classification), FinalScreen
- `SpendingPlan.SecondaryIncomeSources` JSON column added (new EF migration)
- `CompleteOnboardingCommand` aggregates primary + secondary income; updates Goal target amount + date from steps 12/13
- Legacy wizard render (`steps` array, slider/debt-form JSX, fast-forward useQuery) fully removed from Onboarding.tsx — every step now superseded
- FinalScreen owns the `/onboarding/complete` POST + Dashboard navigation

## Out of scope (deferred)
- Dashboard FTUX banner nudging bank-connect (O-7)
- Brand rollout to non-onboarding pages (O-7/O-8)
- OAuth signup buttons (umbrella D10)

## Test plan
- [x] Backend: 3 new CompleteOnboardingCommand tests (income aggregation + goal target amount + emergency-no-months)
- [x] Frontend: ~9 new tests across 3 new screens
- [x] EF migration applies cleanly to both SQLite (in-memory tests) and Postgres (prod)
- [x] Lint / format / build / dotnet test clean

## Spec / plan
- [Umbrella](docs/superpowers/specs/2026-05-07-axis-o-onboarding-design.md)
- [PR-6 design](docs/superpowers/specs/2026-05-12-axis-o-pr-6-income-goal-detail-final-design.md)
- [PR-6 plan](docs/superpowers/plans/2026-05-12-axis-o-pr-6-income-goal-detail-final.md)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

If `gh` not authed, surface URL + body for manual.

### Step 4: Hand off to user for merge.

---

## Self-Review

**Spec coverage:** Acceptance criteria 1-10 mapped to tasks 1-7. The cleanup of the legacy wizard render lands in T6 alongside the wiring.

**Risks:**
- T1's EF migration is the first generated since project setup — verify it cleanly adds the column with no unintended schema changes.
- T6 is a big delete (~400 lines from Onboarding.tsx). Verify no consumer references the removed `steps` / `progressPrompts` / `hasFastForwarded` symbols (`grep` before deleting).
- The Goals.Local lookup in T2 assumes the goal was added in the same SaveChanges scope — true given the handler's flow but watch for changes that move SaveChanges earlier.
