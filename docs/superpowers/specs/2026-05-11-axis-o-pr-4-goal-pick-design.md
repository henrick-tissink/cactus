# Axis O — PR 4: Goal Pick with Recommendation Engine

**Date:** 2026-05-11
**Parent umbrella:** [2026-05-07-axis-o-onboarding-design.md](2026-05-07-axis-o-onboarding-design.md)
**Status:** Draft, executing
**Effort:** ~1 day
**Depth:** Solid

---

## What this PR ships

A new **goal-pick screen** inserted between Phase 2 and the existing 6-step wizard. Three cards (save / debt / emergency) with a **methodology-driven recommendation** computed by a new backend query that reads the user's pre-signup survey answers. User can accept the recommendation or pick something else. The chosen goal is persisted as `OnboardingResponse` step 6 and, on completion, becomes a typed `Goal` entity via the updated `CompleteOnboardingCommand`.

**Out of this PR:** goal-detail screen with affordability classification (target amount + months input + "doable / stretch" verdict). It depends on income + expenses data that doesn't land until PRs O-5 (per-category expenses) and O-6 (income). Folded into O-6, not built here.

## Decisions specific to this PR

| # | Decision | Rationale |
|---|---|---|
| O4-D1 | **Goal-detail screen deferred.** O-4 ships goal-pick only; goal-detail folds into O-6 (immediately after income capture). | Goal-detail's affordability math requires income + expenses; both unavailable until O-5/O-6. Shipping the screen now with placeholder math would create dead code. |
| O4-D2 | **Three UI options (save / debt / emergency), recommendation under the hood.** A backend rule engine reads survey answers and returns `{ recommendedType, reason }`. Frontend renders a "Based on what you told us, we recommend X" badge above the cards. User can override. | Honors user mental model (3 emotional categories) while applying the methodology's 4-stage sequencing as smart pre-selection (per umbrella D1). |
| O4-D3 | **Recommendation rules (rule-based, no ML):**<br>1. **Savings cushion = "none"** AND any debt → `emergency` (build mini buffer first; protects against new debt during repayment — methodology Phase 2 Step 1).<br>2. **Savings cushion = "none"** AND no debt → `emergency` (safety net always comes first).<br>3. **Savings cushion ≥ R10k** AND has debt → `debt` (mini buffer in place; tackle high-interest now).<br>4. **Savings cushion ≥ R10k** AND no debt → `save` (build full emergency fund or generic future savings). | Maps directly to the methodology's mini-buffer → high-interest-debt → full-emergency-fund → long-term-investing sequence, collapsed to the 3 user-facing options. |
| O4-D4 | **No enum changes.** `GoalType` already exposes `EmergencyFund`, `DebtPayoff`, `Savings`, `Investment`, `MiniBuffer` per existing code. | Verified in `src/backend/src/Cactus.Domain/Enums/GoalType.cs`. Saves a migration. |
| O4-D5 | **Goal-pick maps to backend step 6.** The OLD post-signup wizard had step 6 = "Allocation Estimate" (the in-product slider). Phase 2 (O-3) supersedes the educational role of that screen but the slider is still in the existing wizard as a placeholder. **O-4 also removes step 6 (the slider) from the existing wizard's `steps[]` array** since the goal pick screen now occupies that slot semantically. | Frees step 6 for goal pick (matches umbrella). Allocation % comes from O-6 income capture + O-5 expenses; the slider is redundant. |
| O4-D6 | **CompleteOnboardingCommand reads step 6 (goal pick) and creates the correct Goal type.** The hardcoded `DebtPayoff`-only logic becomes a switch on `"save" | "debt" | "emergency"`. The old "create a DebtPayoff goal if any UserDebts exist" path is retained as a fallback when step 6 is absent (backward compat for users who already completed onboarding). | Forward-compatible without breaking existing rows. |
| O4-D7 | **TargetAmount = 0 for now.** Goal's `TargetAmount` would normally come from step 12 (target amount). That step lands in O-6 alongside goal-detail. PR O-4 creates Goal entities with `TargetAmount = 0` and `TargetDate = null` — placeholders that O-6 fills in. | Keeps O-4 focused on goal type selection. |
| O4-D8 | **Existing UserDebt creation logic in `CompleteOnboardingCommand` stays untouched.** Per PR O-2's "Final mapping" table, pre-signup Q5 maps to backend step 7. That overwrites any old "balance + name" data with the new "types-only" array. The existing `ProcessDebtResponse` correctly returns 0 debts in this case (`balance <= 0 → continue`). Result: no `UserDebt` rows from pre-signup. **This is a known regression — debt balances are no longer captured.** Will be addressed in a future PR (out of scope here). | Documents the gap; addressing it would require renumbering Q5's backend slot or restoring a balance-capture step, both larger than O-4's scope. |

## Recommendation engine — concrete logic

Backend reads these `OnboardingResponse` rows for the user:

| Step | Source | Value shape |
|---|---|---|
| 8 | Pre-signup Q4 (Savings cushion) | `"none"` \| `"under_10k"` \| `"10k_50k"` \| `"50k_100k"` \| `"over_100k"` (single-element JSON array) |
| 7 | Pre-signup Q5 (Debt types) | JSON array of strings, e.g. `["credit_card","overdraft"]` or `["none"]` |

Pseudocode:

```csharp
var savings = ParseSingleValue(step8);     // "none" if not answered
var debts = ParseArray(step7);              // [] if not answered
var hasDebt = debts.Any() && !debts.Contains("none");
var hasNoSavings = savings == "none";

if (hasNoSavings)
    return ("emergency", hasDebt
        ? "Most people find a small emergency buffer (~R30k) helps before tackling debt — that's where we'd start."
        : "Building a safety net first protects you from unexpected expenses turning into new debt.");

if (hasDebt)
    return ("debt", "You've got a safety net — now tackling high-interest debt is the highest-leverage move.");

return ("save", "Your foundation is solid. Time to build wealth — let's grow what you've already started.");
```

## File structure

**Created (frontend):**
- `src/frontend/src/pages/onboarding/goal/GoalPickScreen.tsx` + `.test.tsx`
- `src/frontend/src/pages/onboarding/goal/data.ts` — 3 goal options (icon, label, subtitle, color/bg classes)

**Created (backend):**
- `src/backend/src/Cactus.Application/Features/Onboarding/Queries/GetGoalRecommendationQuery.cs` (query + handler + DTO)
- `src/backend/tests/Cactus.Application.Tests/Onboarding/GetGoalRecommendationQueryHandlerTests.cs`

**Modified (frontend):**
- `src/frontend/src/pages/Onboarding.tsx` — add `'goal-pick'` to the phase state machine; remove the "Allocation Estimate" step (id 6) from the `steps` array; route goal-pick after Phase 2 / questions, before the remaining wizard steps.
- `src/frontend/src/api/client.ts` — no changes needed; existing axios client handles the new GET endpoint.

**Modified (backend):**
- `src/backend/src/Cactus.Application/Features/Onboarding/Commands/CompleteOnboardingCommand.cs` — read step 6 (goal pick) and create the corresponding Goal type; keep the existing UserDebt-derived DebtPayoff path as a fallback if step 6 is absent.
- `src/backend/src/Cactus.Api/Controllers/OnboardingController.cs` — wire the new GET `/onboarding/goal-recommendation` endpoint.
- `src/backend/tests/Cactus.Application.Tests/Onboarding/CompleteOnboardingCommandHandlerTests.cs` (NEW or extended) — verify the goal type is correctly created based on step 6.

## Component contracts

### `GoalPickScreen`

Props: `{ onContinue: (goalType: 'save' | 'debt' | 'emergency') => void }`.

Behaviour:
- On mount, fetches `GET /api/onboarding/goal-recommendation` → `{ recommendedType, reason }`.
- Renders a sage "💡 Based on what you told us…" banner with the reason above the 3 cards.
- The recommended card has a sage outline + "Recommended for you" pill badge.
- User clicks a card to select (single-select); clicking the same card again toggles it off (allowing a deliberate override).
- "Lock in this goal" CTA (disabled when nothing selected) → persists the pick via `POST /onboarding/response` with `stepNumber: 6, stepName: "Goal type pick", response: JSON.stringify([selectedType])`, then calls `onContinue(selectedType)`.

### New backend endpoint

`GET /api/onboarding/goal-recommendation`

Response:
```json
{
  "recommendedType": "emergency",
  "reason": "Building a safety net first protects you from unexpected expenses turning into new debt."
}
```

Returns 401 if unauthenticated. Recommendation is computed from current `OnboardingResponses`; no body parameters.

## Onboarding.tsx integration

```tsx
const [phase, setPhase] = useState<
  | 'phase2-welcome'
  | 'phase2-intro'
  | 'phase2-slider'
  | 'goal-pick'      // NEW
  | 'questions'
>('phase2-welcome');

// After phase2-slider:
<Phase2Slider onContinue={() => setPhase('goal-pick')} />

// New phase2-intro skip:
<Phase2Intro
  onContinue={() => setPhase('phase2-slider')}
  onSkip={() => setPhase('goal-pick')}    // changed from 'questions' in O-3
/>

// New goal-pick phase:
if (phase === 'goal-pick') {
  return <GoalPickScreen onContinue={() => setPhase('questions')} />;
}

// Existing 6-step wizard renders for 'questions' phase as before.
```

Also: remove the `{ id: 6, name: 'Allocation Estimate', ... }` entry from the existing `steps` array. The array becomes 5 entries with ids [1, 2, 5, 7, 8]. The user lands on step 5 (income) after goal-pick. Steps 1, 2, 7, 8 are still fast-forwarded as before; the user mostly just sees step 5 (income).

## Acceptance criteria

1. Newly-registered user lands on Phase 2, walks through, then sees GoalPickScreen.
2. GoalPickScreen renders 3 cards (save / debt / emergency) with a recommendation banner.
3. Recommendation rules pass: a user with `savings = "none"` and no debt sees `emergency` recommended; with `savings = "none"` and debt sees `emergency` with the "mini buffer" message; with savings + debt sees `debt`; with savings + no debt sees `save`.
4. User can pick the recommended option OR override with another.
5. "Lock in this goal" persists the pick via `POST /onboarding/response` (step 6) and advances to the wizard.
6. The wizard now has 5 steps (ids 1, 2, 5, 7, 8) — old step 6 (Allocation Estimate slider) is removed.
7. `CompleteOnboardingCommand` creates a Goal of the correct type based on step 6: `save` → Savings, `debt` → DebtPayoff (linked to largest debt if any), `emergency` → EmergencyFund.
8. If step 6 is absent (legacy users finishing old onboarding), fallback DebtPayoff-from-UserDebts logic still works.
9. Backend tests for `GetGoalRecommendationQueryHandler` cover all 4 rule branches.
10. Backend tests for `CompleteOnboardingCommand` cover the 3 goal type branches + the legacy fallback.
11. Frontend tests: ≥3 tests for GoalPickScreen (renders with recommendation, override works, lock-in posts + advances).
12. Lint / format / build / dotnet test all clean.

## Out of scope

- Goal-detail screen with affordability classification (O-6).
- Capturing goal target amount + months (steps 12, 13) — O-6.
- Debt balance regression (pre-signup Q5 only stores types) — separate cleanup.
- Brand rollout to non-onboarding pages (O-7/O-8).
- OAuth/social signup (umbrella D10).

## Open risks

1. **Goal pick stored as JSON array `["save"]` vs string `"save"`.** Existing `OnboardingResponse.Response` is always a string. We use `JSON.stringify([selectedType])` for consistency with how the wizard store handles other answers. `CompleteOnboardingCommand` parses with `JsonDocument` and reads the first array element. Documented.
2. **Recommendation banner copy is part of the spec, not localized.** Acceptable for a SA-only product at this stage.
3. **Step 6's prior role (Allocation Estimate slider) is dropped without replacement.** Users who completed onboarding in the old format have an `OnboardingResponse` with `stepNumber: 6, response: '{"needs":50,"wants":30,"goals":20}'`. The new CompleteOnboardingCommand reading step 6 expects a goal pick string. **Read step 6 defensively** — if the parsed value isn't one of `save/debt/emergency`, treat as absent and fall through to the legacy DebtPayoff fallback.
4. **The fast-forward `useQuery` in Onboarding.tsx triggers on mount during Phase 2.** When the user reaches the wizard after goal-pick, `currentStep` is already positioned via the existing hasFastForwarded flag (PR O-2). With step 6 removed, the wizard's `steps` array index for income is 2 (id 5 at index 2 in [1, 2, 5, 7, 8]). Verify the fast-forward still lands correctly.
