# Axis O — PR 2: Pre-signup Welcome + 5-Question Survey

**Date:** 2026-05-08
**Parent umbrella:** [2026-05-07-axis-o-onboarding-design.md](2026-05-07-axis-o-onboarding-design.md)
**Status:** Draft, executing
**Effort:** 1 day
**Depth:** Solid

---

## What this PR ships

A new public `/welcome` flow that lets anonymous visitors answer 5 lifestyle questions *before* registering. Answers persist in localStorage; on register success, they're batched-POSTed to `/onboarding/response` so the existing post-signup wizard at `/onboarding` can read them. New users land on `/welcome` instead of `/login`. Returning users continue to use `/login` directly.

This is the first wizard PR — establishes the brand-tokenized screen patterns (welcome / question / transition) and the Zustand-backed wizard state machine that PRs O-3..O-6 will extend.

## Decisions specific to this PR

(Beyond what the umbrella spec already locks down.)

| # | Decision | Rationale |
|---|---|---|
| O2-D1 | **`/welcome` is the new public entry point.** Unauthenticated `/` → redirects to `/welcome`. `/login` stays for returning users. `/register` keeps working for direct-link signups (e.g. invite emails) but loses its role as the primary entry. | Matches prototype's "Welcome → Questions → Signup" flow. Doesn't break existing entry points. |
| O2-D2 | **5 questions persist in localStorage via a separate Zustand store** (`useOnboardingWizardStore`), not via the existing `auth-storage` key. Cleared on successful batched POST. | Wizard state has different lifecycle than auth state; conflating them risks bugs. Mirrors the existing `authStore.ts` pattern. |
| O2-D3 | **Batched POST runs from `Register.tsx`, after `login()`, before `navigate('/onboarding')`.** Failures are non-fatal — navigate anyway; user re-answers in the post-signup flow. | Closest to the authed boundary; simplest auth handling (token already in localStorage; axios interceptor adds Bearer). Graceful degradation matches the methodology's "discovery, not data entry" tone. |
| O2-D4 | **Existing `Onboarding.tsx` is not restructured in this PR**, but is updated to **skip already-answered steps on init** so users don't re-answer Q1, Q2, Q7, Q8 (which are now answered pre-signup). Q3 + Q4 are removed entirely (per umbrella D2). | Bounds PR scope. The wholesale wizard rewrite lives in O-3..O-6. |
| O2-D5 | **Multi-select Q1, Q2, Q5; single-select Q3, Q4.** Q5 has a mutually-exclusive "None of these" sentinel; Q2 has a mutually-exclusive "I'm not stressed" sentinel. | Matches prototype exactly. Sentinel exclusivity is implemented in shared `<OptionPill />` selection logic. |
| O2-D6 | **`<Btn />` and `<MoneyInput />` promote to `components/brand/`** (used app-wide). `<Dots />`, `<WhyDisclosure />`, `<OptionPill />` stay in `pages/onboarding/components/` (wizard-only). | Two-tier component organization: brand-wide vs. wizard-specific. |
| O2-D7 | **Backend validator bump 1..8 → 1..13** in this PR even though only 1..5 are actively written. | Validator change is one line; doing it now means PRs O-3..O-6 don't each need a backend change for the same reason. |
| O2-D8 | **Step names are deliberately new** ("Priorities (multi)", "Stress points (multi)", "Month-end state", "Savings cushion", "Debt types") — distinct from the legacy "Financial Priority", "Month-End Status", etc. The post-signup wizard updates its `steps` array's `name` fields to match. | Step names are stored in `OnboardingResponse.StepName`; the new names accurately describe the new question semantics. |

## The 5 questions (verbatim from prototype)

| Step | Type | Headline | Subtitle | Why we ask | Options |
|----|----|----|----|----|----|
| 1 | multi | What matters most to you right now? | Pick as many as you like — life's rarely just one thing. | This helps us shape your Spending Plan around what actually matters to you, not some generic template. | 🔓 Get out of debt; 📅 Stop living month to month; 🛟 Build an emergency fund; 🎯 Save for something specific; 📈 Invest and grow my money |
| 2 | multi | What stresses you most about money? | Be honest — this stays between us. 🤝 | Knowing your stress points lets us focus on fixing those first. Small wins early = big motivation. | 😰 Debt repayments; 😱 Unexpected expenses; 😕 Not saving enough; 🤔 Not optimising or investing well; **😎 Honestly? I'm not stressed** *(exclusive)* |
| 3 | single | At the end of most months, you… | No judgment — it varies, we get it. Pick what feels closest. | This helps us understand your cash flow so we can set realistic goals — not impossible ones. | 😬 Run out of money; ⚖️ Break even; 🙂 Have a small surplus; 💪 Consistently save |
| 4 | single | Got any money set aside for a rainy day? | Just a rough idea — no need to check your bank right now. | We use this to figure out if building a safety net should be part of your plan. No wrong answer here. | 🌱 No savings yet; 🪴 Less than R10,000; 🌿 R10,000 – R50,000; 🌳 R50,000 – R100,000; 🏔️ More than R100,000 |
| 5 | multi | Do any of these apply to you? | Select all that apply. Or 'None' — that's great too! | Understanding your debt picture helps us prioritise what to tackle first in your Spending Plan. | 💳 Credit card debt; 🏦 Personal loan; 📉 Overdraft; 🛍️ Store credit (e.g. Woolies); 📱 Buy-now-pay-later; **✨ None of these** *(exclusive)* |

**Sentinel exclusivity:** picking the bolded option clears all others; picking any other option clears the sentinel.

## File structure

```
src/frontend/src/
├── components/brand/
│   ├── CactusLogo.tsx              (existing from O-1)
│   ├── CactusLogo.test.tsx         (existing from O-1)
│   ├── Btn.tsx                     (NEW)
│   ├── Btn.test.tsx                (NEW)
│   ├── MoneyInput.tsx              (NEW; not yet used in O-2 — created here for O-3 reuse)
│   └── MoneyInput.test.tsx         (NEW)
├── pages/onboarding/
│   ├── store.ts                    (NEW — Zustand wizard store w/ persist)
│   ├── store.test.ts               (NEW)
│   ├── data.ts                     (NEW — the 5 questions content)
│   ├── components/
│   │   ├── Dots.tsx                (NEW — progress dots)
│   │   ├── Dots.test.tsx           (NEW)
│   │   ├── WhyDisclosure.tsx       (NEW — collapsible "Why?" panel)
│   │   ├── WhyDisclosure.test.tsx  (NEW)
│   │   ├── OptionPill.tsx          (NEW — multi/single select option button)
│   │   └── OptionPill.test.tsx     (NEW)
│   └── welcome/
│       ├── WelcomePage.tsx         (NEW — outer page; renders state-machine of 7 screens)
│       ├── WelcomePage.test.tsx    (NEW — golden path + multi-select branch)
│       ├── WelcomeScreen.tsx       (NEW — splash with "Let's do this" CTA)
│       ├── QuestionScreen.tsx      (NEW — generic per-question component)
│       └── TransitionScreen.tsx    (NEW — "Nice one!" before signup)
├── pages/
│   ├── Register.tsx                (MODIFY — read wizard store + batched POST after login)
│   └── Onboarding.tsx              (MODIFY — skip pre-answered steps + remove Q3/Q4)
└── App.tsx                         (MODIFY — add /welcome route, redirect anon / to /welcome)

src/backend/src/Cactus.Application/Features/Onboarding/Commands/
└── SaveOnboardingResponseCommand.cs  (MODIFY — InclusiveBetween(1, 13))
```

## Wizard store shape

```ts
// src/frontend/src/pages/onboarding/store.ts
type WizardAnswers = Partial<Record<1 | 2 | 3 | 4 | 5, string[]>>;
// All values stored as string[] for uniformity (single-select questions store a 1-element array).

interface OnboardingWizardState {
  answers: WizardAnswers;
  setAnswer: (step: 1|2|3|4|5, values: string[]) => void;
  reset: () => void;
}

export const useOnboardingWizardStore = create<OnboardingWizardState>()(
  persist(
    (set) => ({
      answers: {},
      setAnswer: (step, values) =>
        set((s) => ({ answers: { ...s.answers, [step]: values } })),
      reset: () => set({ answers: {} }),
    }),
    { name: 'onboarding-wizard' }
  )
);
```

## Routing changes (App.tsx)

```tsx
// New route
<Route path="/welcome" element={<PublicRoute><WelcomePage /></PublicRoute>} />

// Updated catch-all for unauthenticated:
// PublicRoute already redirects authenticated users to / or /onboarding.
// For unauthenticated users hitting /, the existing ProtectedRoute redirects to /login.
// Update ProtectedRoute to redirect unauthenticated users to /welcome instead.
```

## Register integration flow

`Register.tsx` after successful `login(...)`:

```ts
const wizardAnswers = useOnboardingWizardStore.getState().answers;
const stepNames = {
  1: 'Priorities (multi)',
  2: 'Stress points (multi)',
  3: 'Month-end state',
  4: 'Savings cushion',
  5: 'Debt types (multi)',
};

const postPromises = Object.entries(wizardAnswers).map(([step, values]) =>
  apiClient.post('/onboarding/response', {
    stepNumber: Number(step),
    stepName: stepNames[Number(step) as 1|2|3|4|5],
    response: JSON.stringify(values),
  }).catch(() => null)  // non-fatal
);
await Promise.all(postPromises);
useOnboardingWizardStore.getState().reset();
navigate('/onboarding');
```

## Existing Onboarding.tsx changes

- Remove the steps `id: 3` (Money Management) and `id: 4` (Tracking Preference) from the `steps` array entirely. Renumber subsequent steps so step 5 becomes step 3, etc.? **No.** Keep step IDs stable so they map to backend `stepNumber`. Instead, mark steps 3 and 4 as `skipped: true` and have the wizard auto-advance past them. Cleaner: delete them from the array AND keep the existing renumbered IDs starting from 5 → step 5, 6, 7, 8 still. The IDs aren't sequential array indices; they're literal step numbers.
- **Decision:** delete steps 3 and 4 from the array. The wizard's `currentStep` state (which is an index into `steps[]`, not an `id`) doesn't care about ID gaps. Backend validator accepts 1..13 so storing under stepNumber 5,6,7,8 (skipping 3,4) is valid.
- On mount, fetch `/onboarding/status`; if responses for steps 1, 2, 7 (savings cushion was step 8 in old numbering, now step 4 in new), 8 already exist (because they were posted post-signup from the wizard store), advance `currentStep` to the first un-answered step. **Wait — this is getting confusing because the existing Onboarding.tsx uses old step numbering (1=Priority, 2=Month-End, 5=Income, 6=Allocation, 7=Debts, 8=Emergency).** New umbrella numbering is 1=Priorities, 2=Stress, 3=Month-end, 4=Savings cushion, 5=Debt types.
- The conflict: existing step numbers and new step numbers don't match. Backend `OnboardingResponse.StepNumber` is typed as `int` and validator is bumping to 1..13. So we have a renumbering problem.

**Resolution:** Renumber the existing Onboarding.tsx steps to match the new umbrella numbering:
- Old 1 (Financial Priority) → effectively gone (replaced by new step 1 Priorities answered pre-signup; existing step's content is similar but multi-select now)
- Old 2 (Month-End Status) → effectively gone (replaced by new step 3 Month-end state)
- Old 3 (Money Management) → DROP entirely
- Old 4 (Tracking Preference) → DROP entirely
- Old 5 (Monthly Income) → renumber to new step 10
- Old 6 (Allocation Estimate) → effectively gone for now (replaced by Phase 2 slider in O-3); for this PR we keep the existing slider screen, renumber to a temporary step number
- Old 7 (High-Interest Debts) → renumber to new step 5 (Debt types) but degraded — old captures balances, new captures only types. **Conflict:** new step 5 is multi-select of types only; old step 7 captures per-debt balances + name. We don't want to lose the balance/name capture functionality, just the question is now asked pre-signup as types-only.

**Cleaner resolution for PR O-2 — defer the renumbering chaos:**

For PR O-2, do this minimum:
1. Delete steps `id: 3` and `id: 4` from the existing `steps` array (they're dropped per umbrella D2).
2. Leave the remaining 6 steps (1, 2, 5, 6, 7, 8) with their existing IDs intact.
3. On mount of `Onboarding.tsx`, fetch `/onboarding/status`. If responses exist for steps 1, 2, and 8 (the three steps now answered pre-signup; remaining post-signup work picks up at step 5 income), advance `currentStep` past them.
4. The existing post-signup wizard then asks: step 5 (income), step 6 (allocation), step 7 (debts with balance) — same as today minus the skipped steps. User experience: registers, lands on existing wizard's *4th* screen (income), flows through 5-6-7 as before.
5. **The conceptual umbrella renumbering (1..13) is ASPIRATIONAL** — the actual steps lived as 1..8 previously, will live as 1..13 after Axis O completes. PR O-2 keeps using the OLD step numbers 1..8 for backend storage but adds the validator headroom. New step names are written to old step numbers — yes, the step names will look mismatched in the database for users created during the transition. That's acceptable transitional state; per O2-D8, names accurately describe the new semantics.
6. **One aspect needs reconciling:** the prototype's question 4 (savings cushion) should map to existing step 8 (Emergency Savings) for storage. Pre-signup wizard stores it as "step 4" in the wizard store but on register-batched-POST sends it as `stepNumber: 8` so it lands in the right backend slot. Pre-signup wizard step 5 (debt types) maps to backend step 7. Pre-signup steps 1, 2, 3 map to backend 1, 2, ??? — Q3 (month-end) doesn't have a backend slot in the existing 8-step scheme either... actually yes it does: existing step 2 was "How do you typically feel at the end of the month?" which is the same question. So new wizard Q3 → backend step 2.

**Final mapping (PR O-2 only — stays compatible with existing 1..8 schema):**

| Wizard step (new UI) | Backend stepNumber | Backend stepName |
|---|---|---|
| 1 (Priorities, multi) | 1 | "Priorities (multi)" |
| 2 (Stress points, multi) | NEW: store as **stepNumber 9** | "Stress points (multi)" |
| 3 (Month-end state, single) | 2 | "Month-end state" |
| 4 (Savings cushion, single) | 8 | "Savings cushion" |
| 5 (Debt types, multi) | 7 | "Debt types (multi)" |

This way Q1, Q3, Q4, Q5 land in the existing slots (overwriting if user revisits). Q2 (genuinely new question) lands in stepNumber 9, which the validator now accepts thanks to the bump.

**Onboarding.tsx start position logic:**

```ts
const { data: status } = useQuery(['/onboarding/status']);
useEffect(() => {
  if (!status) return;
  const answered = new Set(status.responses.map((r) => r.stepNumber));
  // Find the first step in our local steps[] whose ID is not in `answered`
  const firstUnanswered = steps.findIndex((s) => !answered.has(s.id));
  setCurrentStep(firstUnanswered >= 0 ? firstUnanswered : 0);
}, [status]);
```

Effect: a user who answered 1, 2, 7, 8 + 9 pre-signup lands on step 5 (income) in the existing wizard.

## Backend changes

`SaveOnboardingResponseCommand.cs`: change `RuleFor(x => x.StepNumber).InclusiveBetween(1, 8)` → `RuleFor(x => x.StepNumber).InclusiveBetween(1, 13)`.

No other backend changes. The `Response` field is already `string` (JSON), so storing arrays-as-JSON works.

## Acceptance criteria

1. Anonymous visitor at `/` is redirected to `/welcome`.
2. Welcome page renders the cactus splash + "Let's do this" CTA in the new brand.
3. Question screens cycle 1 → 5 with a working back button (except on Q1).
4. Q1, Q2, Q5 allow multi-select; Q5's "None of these" + Q2's "I'm not stressed" are mutually exclusive with other options.
5. "Why are we asking this?" disclosure expands/collapses on click.
6. Transition screen renders after Q5 with "Create my account" CTA → routes to `/register`.
7. Register flow on success batched-POSTs the 5 stored answers (mapped per the table above), clears the wizard store, navigates to `/onboarding`.
8. `/onboarding` skips the pre-answered steps and lands on the first un-answered step.
9. Refreshing the browser mid-pre-signup flow preserves answers (localStorage).
10. Frontend tests: ≥80% line coverage on the new components; full suite ≥15 baseline + new tests passes.
11. Backend tests: validator accepts stepNumber 1..13; rejects 0 and 14.
12. Lint, format, build, dev-server all clean.

## Out of scope

- OAuth signup buttons (deferred per umbrella D10).
- Removing the legacy local `CactusLogo` from Login.tsx / ForgotPassword.tsx / ResetPassword.tsx (PRs O-7/O-8).
- Restructuring `Onboarding.tsx` beyond the minimal "skip pre-answered steps" change (PRs O-3..O-6).
- The `/welcome` page using the prototype's phone-frame container (using `max-w-md` centered per umbrella D7 instead).
- Visually rebranding `/register` (PRs O-7/O-8).
- Animation polish beyond the existing `fadeUp` keyframe added in O-1.

## Open risks

1. **Wizard answers vs backend step number mismatch is confusing.** Documented in the mapping table above. Worth a one-line code comment in the batched-POST loop explaining why wizard step != backend stepNumber.
2. **User abandons mid-pre-signup.** Welcome store persists indefinitely in localStorage; could grow stale. Mitigation: only purge on successful register batched POST. If user clears cookies, answers are lost (acceptable).
3. **Register page race**: if user registers very fast (<200ms after landing on /register), the wizard store read might happen before localStorage hydrates. Zustand's `persist` is synchronous on read, so this should be fine — but worth verifying with a Playwright check post-merge.
4. **Existing `/onboarding/status` endpoint might 401** if called before login completes. App.tsx routing already gates `/onboarding` behind auth; the status fetch happens after register success → after login → token exists. Should be fine.
5. **The `new step 9` (Stress points) backend slot** is a "shadow" addition — the existing `Onboarding.tsx` `steps` array has IDs 1..8. Step 9 is only ever written via the batched POST. Existing wizard never asks for it. Acceptable; future per-PR (O-3..O-6) wizard rewrite cleans up the numbering holistically.
