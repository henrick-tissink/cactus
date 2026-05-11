# Axis O — PR 4: Goal Pick with Recommendation Engine — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Parent specs:**
- Umbrella: [2026-05-07-axis-o-onboarding-design.md](../specs/2026-05-07-axis-o-onboarding-design.md)
- PR-4 design: [2026-05-11-axis-o-pr-4-goal-pick-design.md](../specs/2026-05-11-axis-o-pr-4-goal-pick-design.md)

**Goal:** A new goal-pick screen with backend-driven methodology recommendation, persisted under `OnboardingResponse` step 6, that creates the right `Goal` type on completion. Goal-detail (affordability) is deferred to O-6.

**Architecture:** Backend `GetGoalRecommendationQuery` reads existing `OnboardingResponses` (steps 7 & 8) and runs a 4-branch rule engine → `{ recommendedType, reason }`. Frontend `GoalPickScreen` fetches the recommendation on mount, shows 3 cards with the recommended one highlighted, persists the user's pick via existing `POST /onboarding/response`, then advances. `CompleteOnboardingCommand` reads step 6 and creates the typed `Goal` entity (replacing the hardcoded DebtPayoff path).

**Tech Stack:** .NET 8 ASP.NET Core, MediatR, FluentValidation, EF Core. React 19, TanStack Query, Tailwind v4, Vitest + RTL, MSW.

---

## File Structure

**Created (frontend):**
- `src/frontend/src/pages/onboarding/goal/data.ts` — 3 goal options (save / debt / emergency)
- `src/frontend/src/pages/onboarding/goal/GoalPickScreen.tsx` + `.test.tsx`

**Created (backend):**
- `src/backend/src/Cactus.Application/Features/Onboarding/Queries/GetGoalRecommendationQuery.cs`
- `src/backend/tests/Cactus.Application.Tests/Onboarding/GetGoalRecommendationQueryHandlerTests.cs`

**Modified (frontend):**
- `src/frontend/src/pages/Onboarding.tsx` — add `'goal-pick'` phase + render block; remove `{ id: 6, name: 'Allocation Estimate' }` step.

**Modified (backend):**
- `src/backend/src/Cactus.Application/Features/Onboarding/Commands/CompleteOnboardingCommand.cs` — switch on step-6 value to create the right Goal type; preserve legacy fallback.
- `src/backend/src/Cactus.Api/Controllers/OnboardingController.cs` — add `GET /goal-recommendation` route.
- `src/backend/tests/Cactus.Application.Tests/Onboarding/CompleteOnboardingCommandHandlerTests.cs` (NEW or extended) — goal-type-from-step-6 tests.

---

## Task 1: Backend — `GetGoalRecommendationQuery` (TDD)

**Files:**
- Create: `src/backend/src/Cactus.Application/Features/Onboarding/Queries/GetGoalRecommendationQuery.cs`
- Create: `src/backend/tests/Cactus.Application.Tests/Onboarding/GetGoalRecommendationQueryHandlerTests.cs`

### Step 1: Read existing patterns

Read `src/backend/src/Cactus.Application/Features/Onboarding/Queries/GetOnboardingStatusQuery.cs` first to confirm the project's MediatR / query / DI patterns. Mirror its structure.

### Step 2: Write the failing tests

Path: `src/backend/tests/Cactus.Application.Tests/Onboarding/GetGoalRecommendationQueryHandlerTests.cs`

```csharp
using Cactus.Application.Features.Onboarding.Queries;
using Cactus.Application.Tests._Common;
using Cactus.Domain.Entities;
using FluentAssertions;
using Xunit;

namespace Cactus.Application.Tests.Onboarding;

public class GetGoalRecommendationQueryHandlerTests : HandlerTestBase
{
    [Fact]
    public async Task NoSavings_NoDebt_RecommendsEmergency()
    {
        await SeedUserAsync();
        await SeedResponseAsync(stepNumber: 8, response: "[\"none\"]");
        await SeedResponseAsync(stepNumber: 7, response: "[\"none\"]");

        var handler = new GetGoalRecommendationQueryHandler(Context, CurrentUser);
        var result = await handler.Handle(new GetGoalRecommendationQuery(), default);

        result.RecommendedType.Should().Be("emergency");
        result.Reason.Should().Contain("safety net");
    }

    [Fact]
    public async Task NoSavings_WithDebt_RecommendsEmergencyWithMiniBufferReason()
    {
        await SeedUserAsync();
        await SeedResponseAsync(stepNumber: 8, response: "[\"none\"]");
        await SeedResponseAsync(stepNumber: 7, response: "[\"credit_card\"]");

        var handler = new GetGoalRecommendationQueryHandler(Context, CurrentUser);
        var result = await handler.Handle(new GetGoalRecommendationQuery(), default);

        result.RecommendedType.Should().Be("emergency");
        result.Reason.Should().Contain("buffer");
    }

    [Fact]
    public async Task SomeSavings_WithDebt_RecommendsDebt()
    {
        await SeedUserAsync();
        await SeedResponseAsync(stepNumber: 8, response: "[\"under_10k\"]");
        await SeedResponseAsync(stepNumber: 7, response: "[\"credit_card\",\"overdraft\"]");

        var handler = new GetGoalRecommendationQueryHandler(Context, CurrentUser);
        var result = await handler.Handle(new GetGoalRecommendationQuery(), default);

        result.RecommendedType.Should().Be("debt");
    }

    [Fact]
    public async Task GoodSavings_NoDebt_RecommendsSave()
    {
        await SeedUserAsync();
        await SeedResponseAsync(stepNumber: 8, response: "[\"50k_100k\"]");
        await SeedResponseAsync(stepNumber: 7, response: "[\"none\"]");

        var handler = new GetGoalRecommendationQueryHandler(Context, CurrentUser);
        var result = await handler.Handle(new GetGoalRecommendationQuery(), default);

        result.RecommendedType.Should().Be("save");
    }

    [Fact]
    public async Task NoResponses_RecommendsEmergencyAsDefault()
    {
        await SeedUserAsync();
        // No OnboardingResponses seeded — treat as savings=none, no debt
        var handler = new GetGoalRecommendationQueryHandler(Context, CurrentUser);
        var result = await handler.Handle(new GetGoalRecommendationQuery(), default);

        result.RecommendedType.Should().Be("emergency");
    }
}
```

Note: this assumes a `HandlerTestBase` with `SeedUserAsync()` and `SeedResponseAsync(stepNumber, response)` helpers. Check `src/backend/tests/Cactus.Application.Tests/_Common/HandlerTestBase.cs` — if those helpers don't exist, either extend the base class or inline the seeding via `Context.Users.Add(...)` / `Context.OnboardingResponses.Add(...)` patterns used elsewhere in the test project.

### Step 3: Run the tests to confirm they fail

```bash
cd src/backend && DOTNET_ROLL_FORWARD=LatestMajor dotnet test src/backend/tests/Cactus.Application.Tests/Cactus.Application.Tests.csproj --filter "FullyQualifiedName~GetGoalRecommendationQueryHandlerTests"
```

Expected: FAIL with "type or namespace `GetGoalRecommendationQuery` could not be found".

### Step 4: Implement the query + handler

Path: `src/backend/src/Cactus.Application/Features/Onboarding/Queries/GetGoalRecommendationQuery.cs`

```csharp
using Cactus.Application.Common.Interfaces;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace Cactus.Application.Features.Onboarding.Queries;

public record GetGoalRecommendationQuery : IRequest<GoalRecommendationResult>;

public record GoalRecommendationResult(string RecommendedType, string Reason);

public class GetGoalRecommendationQueryHandler
    : IRequestHandler<GetGoalRecommendationQuery, GoalRecommendationResult>
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUser;

    public GetGoalRecommendationQueryHandler(
        IApplicationDbContext context,
        ICurrentUserService currentUser)
    {
        _context = context;
        _currentUser = currentUser;
    }

    public async Task<GoalRecommendationResult> Handle(
        GetGoalRecommendationQuery request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUser.UserId ?? throw new UnauthorizedAccessException();

        var responses = await _context.OnboardingResponses
            .Where(r => r.UserId == userId && (r.StepNumber == 7 || r.StepNumber == 8))
            .ToListAsync(cancellationToken);

        var savings = ParseFirstValue(responses.FirstOrDefault(r => r.StepNumber == 8)?.Response);
        var debts = ParseArray(responses.FirstOrDefault(r => r.StepNumber == 7)?.Response);

        var hasNoSavings = savings == "none" || savings == null;
        var hasDebt = debts.Count > 0 && !debts.Contains("none");

        if (hasNoSavings)
        {
            return new GoalRecommendationResult(
                "emergency",
                hasDebt
                    ? "Most people find a small emergency buffer (~R30k) helps before tackling debt — that's where we'd start."
                    : "Building a safety net first protects you from unexpected expenses turning into new debt."
            );
        }

        if (hasDebt)
        {
            return new GoalRecommendationResult(
                "debt",
                "You've got a safety net — now tackling high-interest debt is the highest-leverage move."
            );
        }

        return new GoalRecommendationResult(
            "save",
            "Your foundation is solid. Time to build wealth — let's grow what you've already started."
        );
    }

    private static string? ParseFirstValue(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind == JsonValueKind.Array && doc.RootElement.GetArrayLength() > 0)
                return doc.RootElement[0].GetString();
            return doc.RootElement.ValueKind == JsonValueKind.String ? doc.RootElement.GetString() : null;
        }
        catch
        {
            return null;
        }
    }

    private static List<string> ParseArray(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return new();
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind != JsonValueKind.Array) return new();
            var result = new List<string>();
            foreach (var element in doc.RootElement.EnumerateArray())
            {
                var s = element.GetString();
                if (s != null) result.Add(s);
            }
            return result;
        }
        catch
        {
            return new();
        }
    }
}
```

### Step 5: Run the tests to verify pass

```bash
cd src/backend && DOTNET_ROLL_FORWARD=LatestMajor dotnet test src/backend/tests/Cactus.Application.Tests/Cactus.Application.Tests.csproj --filter "FullyQualifiedName~GetGoalRecommendationQueryHandlerTests"
```

Expected: 5 tests pass.

### Step 6: Commit

```bash
cd /Users/henricktissink/Sauce/cactus/.claude/worktrees/axis-o+pr-4-goal-pick
git add src/backend/src/Cactus.Application/Features/Onboarding/Queries/GetGoalRecommendationQuery.cs src/backend/tests/Cactus.Application.Tests/Onboarding/GetGoalRecommendationQueryHandlerTests.cs
git commit -m "$(cat <<'EOF'
feat(onboarding): add GetGoalRecommendationQuery (rule-based goal type recommendation)

Reads OnboardingResponse rows for steps 7 (debt types) and 8 (savings cushion) and returns a goal-type recommendation ("save"|"debt"|"emergency") plus a methodology-aligned reason. Implements the umbrella spec D1 sequencing: no savings → emergency (mini buffer first); savings + debt → debt; savings + no debt → save.

5 boundary tests cover all rule branches plus the no-responses default.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Backend — wire the new endpoint into `OnboardingController`

**Files:**
- Modify: `src/backend/src/Cactus.Api/Controllers/OnboardingController.cs`

### Step 1: Read the existing controller

Read `src/backend/src/Cactus.Api/Controllers/OnboardingController.cs` and find the existing GET endpoints (e.g. `GetStatus`). Mirror the pattern.

### Step 2: Add the endpoint

Inside `OnboardingController`, add a new GET action (immediately after the existing `GetStatus`):

```csharp
[HttpGet("goal-recommendation")]
public async Task<ActionResult<GoalRecommendationResult>> GetGoalRecommendation()
{
    var result = await _mediator.Send(new GetGoalRecommendationQuery());
    return Ok(result);
}
```

Ensure the `using` for `Cactus.Application.Features.Onboarding.Queries` is present (it should already be from the existing `GetOnboardingStatusQuery` usage).

### Step 3: Verify build

```bash
cd src/backend && DOTNET_ROLL_FORWARD=LatestMajor dotnet build src/backend/Cactus.sln 2>&1 | tail -10
```

Expected: clean build.

### Step 4: Commit

```bash
git add src/backend/src/Cactus.Api/Controllers/OnboardingController.cs
git commit -m "feat(onboarding): expose GET /api/onboarding/goal-recommendation"
```

---

## Task 3: Backend — update `CompleteOnboardingCommand` for typed Goal (TDD)

**Files:**
- Modify: `src/backend/src/Cactus.Application/Features/Onboarding/Commands/CompleteOnboardingCommand.cs`
- Create or modify: `src/backend/tests/Cactus.Application.Tests/Onboarding/CompleteOnboardingCommandHandlerTests.cs`

### Step 1: Read existing test patterns

Check if `CompleteOnboardingCommandHandlerTests.cs` exists. If not, create it. Use the same `HandlerTestBase` pattern as in Task 1.

### Step 2: Add failing tests for typed Goal creation

Add (or create) these tests:

```csharp
[Fact]
public async Task Complete_WithStep6Save_CreatesSavingsGoal()
{
    await SeedUserAsync();
    await SeedResponseAsync(stepNumber: 6, response: "[\"save\"]");

    var handler = new CompleteOnboardingCommandHandler(Context, CurrentUser);
    await handler.Handle(new CompleteOnboardingCommand(), default);

    var goal = Context.Goals.Single();
    goal.GoalType.Should().Be(GoalType.Savings);
}

[Fact]
public async Task Complete_WithStep6Debt_CreatesDebtPayoffGoal()
{
    await SeedUserAsync();
    await SeedResponseAsync(stepNumber: 6, response: "[\"debt\"]");

    var handler = new CompleteOnboardingCommandHandler(Context, CurrentUser);
    await handler.Handle(new CompleteOnboardingCommand(), default);

    var goal = Context.Goals.Single();
    goal.GoalType.Should().Be(GoalType.DebtPayoff);
}

[Fact]
public async Task Complete_WithStep6Emergency_CreatesEmergencyFundGoal()
{
    await SeedUserAsync();
    await SeedResponseAsync(stepNumber: 6, response: "[\"emergency\"]");

    var handler = new CompleteOnboardingCommandHandler(Context, CurrentUser);
    await handler.Handle(new CompleteOnboardingCommand(), default);

    var goal = Context.Goals.Single();
    goal.GoalType.Should().Be(GoalType.EmergencyFund);
}

[Fact]
public async Task Complete_WithoutStep6_LegacyDebtFallback()
{
    // No step 6, but legacy step 7 has full debt-form data (name+balance)
    await SeedUserAsync();
    await SeedResponseAsync(
        stepNumber: 7,
        response: "[{\"type\":\"Credit Card\",\"name\":\"FNB Gold\",\"balance\":50000}]");

    var handler = new CompleteOnboardingCommandHandler(Context, CurrentUser);
    await handler.Handle(new CompleteOnboardingCommand(), default);

    var goal = Context.Goals.Single();
    goal.GoalType.Should().Be(GoalType.DebtPayoff);
}

[Fact]
public async Task Complete_WithoutStep6OrLegacyDebt_CreatesNoGoal()
{
    await SeedUserAsync();
    // No step 6, no debt responses

    var handler = new CompleteOnboardingCommandHandler(Context, CurrentUser);
    await handler.Handle(new CompleteOnboardingCommand(), default);

    Context.Goals.Should().BeEmpty();
}
```

### Step 3: Run to verify failure

```bash
cd src/backend && DOTNET_ROLL_FORWARD=LatestMajor dotnet test src/backend/tests/Cactus.Application.Tests/Cactus.Application.Tests.csproj --filter "FullyQualifiedName~CompleteOnboardingCommandHandlerTests"
```

Expected: at least 3 tests fail (the step-6 branches). The legacy fallback test may pass since existing code handles it.

### Step 4: Modify `CompleteOnboardingCommand.cs`

Find the existing "Create a DebtPayoff goal if any debts were added" block (around line 95). Replace it with:

```csharp
        // Determine goal type from step 6 (goal pick); fall back to legacy DebtPayoff-from-debts if step 6 is absent or malformed.
        var goalPickResponse = responses.FirstOrDefault(r => r.StepNumber == 6);
        var goalPickValue = ParseGoalPickValue(goalPickResponse?.Response);

        if (goalPickValue != null)
        {
            var goal = CreateGoalForPick(userId, goalPickValue, createdDebts);
            if (goal != null) _context.Goals.Add(goal);
        }
        else if (createdDebts.Count > 0)
        {
            // Legacy fallback: pre-O-4 users finishing onboarding
            var totalDebt = createdDebts.Sum(d => d.CurrentBalance);
            var debtGoal = new Goal
            {
                UserId = userId,
                Name = "Pay Off Debt",
                GoalType = GoalType.DebtPayoff,
                TargetAmount = totalDebt,
                CurrentAmount = 0,
                Priority = 1,
                IsActive = true,
                IsCompleted = false
            };
            _context.Goals.Add(debtGoal);
        }
```

Add these helper methods to the same class:

```csharp
    private static string? ParseGoalPickValue(string? json)
    {
        if (string.IsNullOrWhiteSpace(json)) return null;
        try
        {
            using var doc = System.Text.Json.JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind == System.Text.Json.JsonValueKind.Array
                && doc.RootElement.GetArrayLength() > 0)
            {
                var value = doc.RootElement[0].GetString();
                if (value == "save" || value == "debt" || value == "emergency") return value;
            }
        }
        catch
        {
            // fall through
        }
        return null;
    }

    private static Goal? CreateGoalForPick(Guid userId, string pick, List<UserDebt> createdDebts)
    {
        return pick switch
        {
            "save" => new Goal
            {
                UserId = userId,
                Name = "Save more money",
                GoalType = GoalType.Savings,
                TargetAmount = 0,        // Filled in by O-6 goal-detail
                CurrentAmount = 0,
                Priority = 1,
                IsActive = true,
                IsCompleted = false,
                IsPrimary = true
            },
            "debt" => new Goal
            {
                UserId = userId,
                Name = "Pay off debt",
                GoalType = GoalType.DebtPayoff,
                TargetAmount = createdDebts.Sum(d => d.CurrentBalance),
                CurrentAmount = 0,
                Priority = 1,
                IsActive = true,
                IsCompleted = false,
                IsPrimary = true,
                LinkedDebtId = createdDebts.OrderByDescending(d => d.CurrentBalance).FirstOrDefault()?.Id
            },
            "emergency" => new Goal
            {
                UserId = userId,
                Name = "Emergency fund",
                GoalType = GoalType.EmergencyFund,
                TargetAmount = 0,
                CurrentAmount = 0,
                Priority = 1,
                IsActive = true,
                IsCompleted = false,
                IsPrimary = true
            },
            _ => null
        };
    }
```

### Step 5: Run all CompleteOnboarding tests

Expected: 5 tests pass.

### Step 6: Commit

```bash
git add src/backend/src/Cactus.Application/Features/Onboarding/Commands/CompleteOnboardingCommand.cs src/backend/tests/Cactus.Application.Tests/Onboarding/CompleteOnboardingCommandHandlerTests.cs
git commit -m "$(cat <<'EOF'
feat(onboarding): create typed Goal based on step 6 (goal pick)

CompleteOnboardingCommand now switches on the user's goal pick from step 6 to create the right Goal type: "save" → Savings, "debt" → DebtPayoff (linked to largest debt), "emergency" → EmergencyFund. The legacy "create DebtPayoff if UserDebts exist" path is preserved as a fallback for users without step 6.

TargetAmount stays 0 for save/emergency goals — O-6's goal-detail screen will populate it.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Frontend — goal options data + `<GoalPickScreen />` (TDD)

**Files:**
- Create: `src/frontend/src/pages/onboarding/goal/data.ts`
- Create: `src/frontend/src/pages/onboarding/goal/GoalPickScreen.tsx`
- Create: `src/frontend/src/pages/onboarding/goal/GoalPickScreen.test.tsx`

### Step 1: Create the goal options data

Path: `src/frontend/src/pages/onboarding/goal/data.ts`

```ts
export type GoalPickValue = 'save' | 'debt' | 'emergency';

export interface GoalOption {
  value: GoalPickValue;
  icon: string;
  label: string;
  subtitle: string;
  colorClass: string;
  bgClass: string;
}

export const goalOptions: GoalOption[] = [
  {
    value: 'save',
    icon: '💰',
    label: 'Save more money',
    subtitle: 'Build savings, emergency fund, or save for something specific',
    colorClass: 'text-cactus-sage',
    bgClass: 'bg-cactus-needs-bg',
  },
  {
    value: 'debt',
    icon: '🔓',
    label: 'Reduce my debt',
    subtitle: 'Pay off credit cards, loans, or any other debt faster',
    colorClass: 'text-cactus-prickly',
    bgClass: 'bg-cactus-goals-bg',
  },
  {
    value: 'emergency',
    icon: '🛟',
    label: 'Build an emergency fund',
    subtitle: "Create a safety net for life's surprises",
    colorClass: 'text-cactus-desert',
    bgClass: 'bg-cactus-wants-bg',
  },
];
```

### Step 2: Write the failing test

Path: `src/frontend/src/pages/onboarding/goal/GoalPickScreen.test.tsx`

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/render';
import { server } from '../../../test/mocks/server';
import { GoalPickScreen } from './GoalPickScreen';

describe('GoalPickScreen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('fetches and shows the recommendation banner, marks recommended card', async () => {
    server.use(
      http.get('/api/onboarding/goal-recommendation', () =>
        HttpResponse.json({
          recommendedType: 'emergency',
          reason: 'Building a safety net first.',
        })
      )
    );
    renderWithProviders(<GoalPickScreen onContinue={() => {}} />);

    await waitFor(() =>
      expect(screen.getByText(/building a safety net first/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/recommended for you/i)).toBeInTheDocument();
  });

  it('renders all 3 goal options', async () => {
    server.use(
      http.get('/api/onboarding/goal-recommendation', () =>
        HttpResponse.json({ recommendedType: 'save', reason: 'You are doing great.' })
      )
    );
    renderWithProviders(<GoalPickScreen onContinue={() => {}} />);

    await waitFor(() => expect(screen.getByText(/you are doing great/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /save more money/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reduce my debt/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /build an emergency fund/i })).toBeInTheDocument();
  });

  it('persists the user pick and advances on lock-in', async () => {
    let captured: { stepNumber: number; stepName: string; response: string } | null = null;
    server.use(
      http.get('/api/onboarding/goal-recommendation', () =>
        HttpResponse.json({ recommendedType: 'emergency', reason: 'r' })
      ),
      http.post('/api/onboarding/response', async ({ request }) => {
        captured = (await request.json()) as typeof captured;
        return HttpResponse.json({});
      })
    );
    const onContinue = vi.fn();
    renderWithProviders(<GoalPickScreen onContinue={onContinue} />);

    await waitFor(() => expect(screen.getByText(/recommended for you/i)).toBeInTheDocument());

    const user = userEvent.setup();
    // User overrides recommendation: clicks "Reduce my debt"
    await user.click(screen.getByRole('button', { name: /reduce my debt/i }));
    await user.click(screen.getByRole('button', { name: /lock in this goal/i }));

    await waitFor(() => {
      expect(captured).not.toBeNull();
    });
    expect(captured).toEqual({
      stepNumber: 6,
      stepName: 'Goal type pick',
      response: JSON.stringify(['debt']),
    });
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it('disables the lock-in CTA until something is selected', async () => {
    server.use(
      http.get('/api/onboarding/goal-recommendation', () =>
        HttpResponse.json({ recommendedType: 'save', reason: 'r' })
      )
    );
    renderWithProviders(<GoalPickScreen onContinue={() => {}} />);

    await waitFor(() => expect(screen.getByText(/recommended for you/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /lock in this goal/i })).toBeDisabled();
  });
});
```

### Step 3: Run to verify failure

`cd src/frontend && npm run test -- GoalPickScreen`

### Step 4: Implement `<GoalPickScreen />`

Path: `src/frontend/src/pages/onboarding/goal/GoalPickScreen.tsx`

```tsx
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Btn } from '../../../components/brand/Btn';
import { apiClient } from '../../../api/client';
import { goalOptions, type GoalPickValue } from './data';

interface GoalRecommendationResponse {
  recommendedType: GoalPickValue;
  reason: string;
}

interface GoalPickScreenProps {
  onContinue: () => void;
}

export function GoalPickScreen({ onContinue }: GoalPickScreenProps) {
  const [selected, setSelected] = useState<GoalPickValue | null>(null);

  const { data: recommendation } = useQuery({
    queryKey: ['/onboarding/goal-recommendation'],
    queryFn: async () => {
      const response = await apiClient.get<GoalRecommendationResponse>('/onboarding/goal-recommendation');
      return response.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (value: GoalPickValue) => {
      await apiClient.post('/onboarding/response', {
        stepNumber: 6,
        stepName: 'Goal type pick',
        response: JSON.stringify([value]),
      });
    },
    onSuccess: () => onContinue(),
  });

  const handleLockIn = () => {
    if (!selected) return;
    saveMutation.mutate(selected);
  };

  return (
    <div className="flex flex-col min-h-screen bg-cactus-sandstone font-cactus px-6 animate-fade-up">
      <div className="flex-1 pt-7">
        <div className="text-4xl mb-3" aria-hidden="true">
          🏁
        </div>
        <h1 className="font-cactus font-bold text-[22px] text-cactus-charcoal m-0 mb-1.5 leading-tight">
          Let's set your first goal
        </h1>
        <p className="font-cactus text-sm text-cactus-charcoal/40 font-medium m-0 mb-1.5 leading-relaxed">
          Pick one to start with. Just one — you can always add more later.
        </p>
        <p className="font-cactus text-[12.5px] text-cactus-charcoal/40 font-medium m-0 mb-6 leading-snug">
          Starting small keeps things manageable. Once this one's rolling, we'll help you stack more goals on top. 🧱
        </p>

        {recommendation && (
          <div className="bg-cactus-sage-light/40 rounded-2xl px-4 py-3 mb-5 animate-fade-up">
            <p className="font-cactus text-[13px] text-cactus-charcoal/70 font-medium m-0 leading-relaxed">
              💡 Based on what you told us: {recommendation.reason}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {goalOptions.map((opt) => {
            const isSelected = selected === opt.value;
            const isRecommended = recommendation?.recommendedType === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelected(isSelected ? null : opt.value)}
                className={`flex items-center gap-3.5 p-4 px-[18px] rounded-2xl border-[2.5px] cursor-pointer transition-all text-left animate-fade-up ${
                  isSelected
                    ? `${opt.bgClass} border-current ${opt.colorClass}`
                    : 'bg-white border-cactus-overlay'
                }`}
              >
                <div className="text-3xl shrink-0" aria-hidden="true">
                  {opt.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-cactus font-bold text-base text-cactus-charcoal">
                      {opt.label}
                    </span>
                    {isRecommended && (
                      <span className="font-cactus font-bold text-[10px] uppercase tracking-wide text-cactus-sage bg-cactus-sage-light px-2 py-0.5 rounded-full">
                        Recommended for you
                      </span>
                    )}
                  </div>
                  <span className="font-cactus font-medium text-[12.5px] text-cactus-charcoal/40 leading-snug block">
                    {opt.subtitle}
                  </span>
                </div>
                {isSelected && (
                  <span className={`${opt.colorClass} text-xl shrink-0`} aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="py-5 pb-7 shrink-0">
        <Btn onClick={handleLockIn} disabled={!selected || saveMutation.isPending}>
          Lock in this goal
        </Btn>
      </div>
    </div>
  );
}
```

### Step 5: Run to verify pass

Expected: 4 tests pass.

### Step 6: Commit

```bash
cd /Users/henricktissink/Sauce/cactus/.claude/worktrees/axis-o+pr-4-goal-pick
git add src/frontend/src/pages/onboarding/goal/
git commit -m "feat(onboarding): add <GoalPickScreen /> with backend-driven recommendation"
```

---

## Task 5: Wire goal-pick into `Onboarding.tsx`

**Files:**
- Modify: `src/frontend/src/pages/Onboarding.tsx`

### Step 1: Read the current file

Read `src/frontend/src/pages/Onboarding.tsx`. Note the existing Phase 2 state machine (`phase` with values `'phase2-welcome' | 'phase2-intro' | 'phase2-slider' | 'questions'`) added in O-3.

### Step 2: Add the imports

Add to the imports section:

```tsx
import { GoalPickScreen } from './onboarding/goal/GoalPickScreen';
```

### Step 3: Extend the phase union

Find the existing phase useState declaration and update the union:

```tsx
  const [phase, setPhase] = useState<
    | 'phase2-welcome'
    | 'phase2-intro'
    | 'phase2-slider'
    | 'goal-pick'        // NEW
    | 'questions'
  >('phase2-welcome');
```

### Step 4: Update the existing phase transitions

Find the existing Phase2Intro `onSkip` and Phase2Slider `onContinue` and update them:

```tsx
  if (phase === 'phase2-intro') {
    return (
      <Phase2Intro
        onContinue={() => setPhase('phase2-slider')}
        onSkip={() => setPhase('goal-pick')}    // changed from 'questions'
      />
    );
  }
  if (phase === 'phase2-slider') {
    return <Phase2Slider onContinue={() => setPhase('goal-pick')} />;   // changed from 'questions'
  }
```

### Step 5: Add the goal-pick early return

After `phase === 'phase2-slider'` check, insert:

```tsx
  if (phase === 'goal-pick') {
    return <GoalPickScreen onContinue={() => setPhase('questions')} />;
  }
```

### Step 6: Remove the Allocation Estimate step

Find the existing `steps` array. Locate the step object with `id: 6` and `name: 'Allocation Estimate'` (the slider step). Delete that entire object from the array. The array shrinks from 6 entries to 5 with ids [1, 2, 5, 7, 8].

Verify the existing slider-related rendering / state in `Onboarding.tsx` doesn't depend on `id: 6` semantically. The wizard renders `steps[currentStep]` so removing entry just shrinks the array.

### Step 7: Run the full test suite

`cd src/frontend && npm run test`

Expected: previous baseline + new GoalPickScreen tests pass. No regressions.

### Step 8: Lint + format + build

```bash
cd src/frontend
npm run lint
npm run format:check
npm run build
```

All clean.

### Step 9: Commit

```bash
git add src/frontend/src/pages/Onboarding.tsx
git commit -m "$(cat <<'EOF'
feat(onboarding): wire goal-pick phase after Phase 2 and remove the Allocation Estimate step

The phase state machine gains a 'goal-pick' phase between Phase 2 and the existing wizard. Phase2Intro's skip and Phase2Slider's continue now route to goal-pick. After locking in a goal, the user advances to the wizard, which now has 5 steps (ids [1,2,5,7,8]) — the old "Allocation Estimate" (id 6) is removed since the goal pick screen supersedes its role.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Open the PR

> **Pre-task setup:** the executor should be on branch `axis-o/pr-4-goal-pick`.

### Step 1: Final gates

```bash
cd /Users/henricktissink/Sauce/cactus/.claude/worktrees/axis-o+pr-4-goal-pick
cd src/frontend && npm run test && npm run lint && npm run format:check && npm run build
cd ../.. && DOTNET_ROLL_FORWARD=LatestMajor dotnet test src/backend/tests/Cactus.Application.Tests/Cactus.Application.Tests.csproj --filter "FullyQualifiedName~Onboarding"
```

All green.

### Step 2: Push the branch

```bash
git push -u origin worktree-axis-o+pr-4-goal-pick:axis-o/pr-4-goal-pick
```

### Step 3: Create the PR

```bash
gh pr create --title "Axis O PR 4: goal pick with recommendation engine" --body "$(cat <<'EOF'
## Summary
- New `GoalPickScreen` inserted between Phase 2 and the existing wizard; three cards (save / debt / emergency) with a methodology-driven recommendation badge.
- Backend `GetGoalRecommendationQuery` reads pre-signup survey answers (steps 7 + 8) and applies a 4-branch rule engine ("no savings → emergency"; "no savings + debt → emergency with mini-buffer reason"; "savings + debt → debt"; "savings + no debt → save").
- `CompleteOnboardingCommand` now switches on step 6 (goal pick) to create the right `Goal` type. Legacy DebtPayoff-from-UserDebts path retained as a fallback.
- The existing wizard's "Allocation Estimate" step (id 6) is removed — superseded by goal-pick.

## Out of scope (deferred)
- Goal-detail screen with affordability classification (O-6, immediately after income capture).
- Goal target amount + months (steps 12, 13) — O-6.
- Brand rollout (O-7/O-8).

## Test plan
- [x] Backend: 5 GetGoalRecommendationQueryHandler tests covering all rule branches + no-responses default; 5 CompleteOnboardingCommandHandler tests covering save/debt/emergency goal types + legacy fallback + no-goal case.
- [x] Frontend: 4 GoalPickScreen tests (banner + recommended badge, 3 options render, lock-in posts + advances, lock-in disabled until selection).
- [x] `npm run lint`, `npm run format:check`, `npm run build` clean.
- [ ] Manual: register fresh account → Phase 2 → goal-pick. With pre-signup answers saying "no savings + credit card debt", emergency is recommended with the mini-buffer reason. Override to "debt", lock in, land on income step.

## Spec / plan
- [Umbrella](docs/superpowers/specs/2026-05-07-axis-o-onboarding-design.md)
- [PR-4 design](docs/superpowers/specs/2026-05-11-axis-o-pr-4-goal-pick-design.md)
- [PR-4 plan](docs/superpowers/plans/2026-05-11-axis-o-pr-4-goal-pick.md)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

If `gh` is not authenticated, report the URL and the title + body for manual creation.

### Step 4: Hand off to user for merge.

---

## Self-Review

**Spec coverage:**
- AC1 (newly-registered lands on phase 2 → goal-pick) — Task 5
- AC2 (3 cards + recommendation banner) — Task 4
- AC3 (rule branches) — Task 1
- AC4 (override) — Task 4 (selection logic in GoalPickScreen)
- AC5 (lock-in persists + advances) — Task 4 + Task 5
- AC6 (wizard now 5 steps) — Task 5
- AC7 (typed Goal creation) — Task 3
- AC8 (legacy fallback) — Task 3
- AC9 (backend tests) — Task 1
- AC10 (CompleteOnboarding tests) — Task 3
- AC11 (frontend tests) — Task 4
- AC12 (lint/format/build/dotnet test) — Task 6

**Placeholder scan:** No TBD / TODO. Every step has concrete code or commands.

**Type consistency:** `GoalPickValue = 'save' | 'debt' | 'emergency'` is used consistently across `data.ts`, `GoalPickScreen.tsx`, and the backend's accepted values. `GoalType` enum values (`EmergencyFund`, `DebtPayoff`, `Savings`) match the backend's existing definitions.

**Risks / followups:**
- The fast-forward useQuery in Onboarding.tsx runs during Phase 2 — confirm with manual smoke that, after goal-pick, the wizard lands on step 5 (income, index 2 in the new 5-element steps array).
- The "Allocation Estimate" step removal is a deliberate scope decision (D5). If any other code references step 6's slider data, this PR removes that access point — verify no callers exist (`grep -r "Allocation Estimate" src/`).
