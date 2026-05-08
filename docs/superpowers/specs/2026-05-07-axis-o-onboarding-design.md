# Axis O — Onboarding Redesign

**Date:** 2026-05-07
**Parent:** [2026-05-03-100x-roadmap.md](2026-05-03-100x-roadmap.md)
**Status:** Draft, awaiting user review
**Effort:** 8–10 days (8 PRs, ~1 day each, with O-7/O-8 parallelizable)
**Depth:** Solid

---

## Why this axis

The codebase already implements Paul's 8-question onboarding end-to-end (`OnboardingResponse` table, `SaveOnboardingResponseCommand`, `CompleteOnboardingCommand` that writes a `SpendingPlan` + `UserDebt` rows + a `DebtPayoff` `Goal`). What it lacks is the *experience layer* the homies' product spec demands:

1. The Cactus brand identity (Quicksand, sage/desert/prickly palette, cactus mark, emoji-as-icons) decided in the 8 January 2026 meeting — currently the app is generic green-Tailwind.
2. The methodology's three-phase product structure (Awareness → Spending Plan & Goal Setting → Staying on Track), which is *named* in the framework doc but not *honored* by the current UX — the existing flow jumps straight into questions with no framing, no teaching, no goal sequencing.
3. The "feels like discovery, not data entry" principle, which the prototype enforces via per-question disclosures, multi-select on emotional questions, an interactive 50/30/20 slider that teaches before asking, and pre-signup engagement to lift conversion.

The opportunity is to keep the existing backend (95% correct) and replace the frontend with an experience that matches the methodology and the brand. This is the highest-leverage product feature work available — every other axis (bank feeds, AI categorization, notifications) lands inside the home the user finds after onboarding.

## Methodology grounding

This axis is governed by three product docs in the repo root:

- **`Cactus envisaged framework V0.1.docx`** — the Cactus product behaviour framework. Defines zero-based thinking, the three macro buckets (Needs / Wants / Goals), the three product phases, the macro-first / micro-on-demand transaction model, the goal-sequencing principle.
- **`Helping Nadia using Methodology 05 March Goals updated.docx`** — applied case study. Shows the methodology in conversation: 63/35/1 → 60/30/10 as a "small shifts matter" reveal, the four-stage goal sequence (mini buffer → high-interest debt → full emergency fund → long-term investing), Pay Yourself First as structural commitment.
- **`Onboarding Flow Questions- Paul.docx`** — the 8-question source for the existing onboarding. We are *not* replacing this wholesale; we are reframing it.

The reference prototype (delivered 2026-05-05 as `cactus-onboarding-phase1.jsx`, 660 LOC) is the design authority for screen content, copy tone, and visual language. Where the prototype and the methodology disagree, the methodology wins; where the prototype and the existing code disagree, this spec adjudicates explicitly per decision below.

## Decisions made (creative-director calls)

| # | Decision | Rationale |
|---|---|---|
| D1 | **Goal pick stays at 3 user-facing options** (save / debt / emergency); methodology's 4-stage sequencing implemented as a *recommendation engine* using the survey answers | Three intuitive emotional categories the user understands; methodology sequencing applied as smart pre-selection + "we recommend X based on what you told us" header, not as four buttons |
| D2 | **Drop Q3 (tracking method) and Q4 (detail preference)** from the existing flow — match the prototype's 5-question pre-signup set | Framework doc: "simple by default, detailed by choice" — Q4 violates this on the way in; Q3 duplicates signal already captured by priorities + stress + month-end |
| D3 | **Renumber response slots 1..8 → 1..13** | New schema accommodates pre-signup lifestyle (1–5), goal pick (6), needs/wants categories (7–8), per-category estimates (9), primary income (10), secondary sources (11), goal target amount (12), goal target months (13) |
| D4 | **Land on Dashboard with a dismissible bank-connect banner** after onboarding completes — *not* a forced bank-connect interstitial | Brand vibe is calm, achievable, sustainable; forcing bank-connect would feel pushy after a 2-minute investment |
| D5 | **Insert Axis O before Axis D in the roadmap.** Defer Axis B (operations). Fold Axis C (frontend craft) into O-7/O-8 brand rollout | Onboarding produces real plans; bank feeds (D) deliver real numbers — natural sequence. C duplicates the brand-rollout work; combining avoids double polish |
| D6 | **No data migration for existing onboarding rows.** Old `IsOnboardingComplete = true` users skip the new flow entirely; `GoalType` enum additions are purely additive | Verified safe: validator bump and renumbering are forward-only; no destructive change |
| D7 | **Mobile-first responsive (Mercury / Cash App pattern).** Tablet/desktop centers the same content in `max-w-md` with sandstone bg fill on the sides | Brand is intentionally narrow; "spreading out" the flow breaks the calm aesthetic |
| D8 | **Tailwind theme extension, not inline styles.** Quicksand via `@fontsource/quicksand`. Raw CSS keyframes for the small animation surface — no framer-motion | Stack consistency with existing app; minimal new dependencies |
| D9 | **Wizard state in a Zustand store with `persist` middleware** | Refresh-safe, browser back-button works, mirrors the existing `authStore` pattern |
| D10 | **OAuth signup deferred** to a separate later ticket | Provider registration + callback handlers + account linking is a 1–2 day infra ticket; should not block onboarding shipping. Prototype's Google/Facebook buttons are scaffolded as "coming soon" placeholders |

## Approach

**Model B — incremental enhancement.** Reuse the existing backend; evolve the frontend in shippable PRs that each carry a coherent piece. Accept a transition window where some screens are new-brand and others are still generic Tailwind — this is bounded by the brand-rollout PRs (O-7/O-8) running in parallel with the wizard PRs (O-2..O-6).

Considered and rejected:

- **Model A — rip-and-replace `Onboarding.tsx`** in one PR: cleanest UX but massive single change; brand sits half-on/half-off the app for a long time.
- **Model C — parallel V1/V2 behind a feature flag**: best ops story, doubles the code, no flag infrastructure exists yet; A/B is overkill for a once-per-user flow.

The existing `OnboardingResponse` table already accepts arbitrary JSON in the `Response` column; the `CompleteOnboardingCommand` already writes `SpendingPlan` + `UserDebt` + `Goal`. We extend additively (new step slots, new goal types, new persisted entities for category selection and secondary income) rather than rewriting.

## User flow (the 13-screen wizard)

```
PRE-SIGNUP                              POST-SIGNUP
─────────                               ──────────
welcome                                 phase2-welcome
  ↓                                       ↓
question-1 (priorities, multi)          phase2-intro (3 framework cards, skip → goal-pick)
  ↓                                       ↓
question-2 (stress, multi)              phase2-slider (50/30/20 teach-by-playing)
  ↓                                       ↓
question-3 (month-end, single)          goal-pick (save/debt/emergency, recommended)
  ↓                                       ↓
question-4 (savings cushion, single)    categories (needs + wants pills, SA-extras)
  ↓                                       ↓
question-5 (debt types, multi)          estimates (per-category monthly amounts)
  ↓                                       ↓
transition ("nice one!")                income (primary + secondary sources)
  ↓                                       ↓
signup (email; OAuth deferred)          goal-detail (target + months + affordability)
  ↓                                       ↓
   [batched POST /onboarding/response]   final ("all set!" + bank-connect teaser)
   [POST /auth/register]                   ↓
   [POST /onboarding/response × 5]       Dashboard with FTUX banner
   [redirect to /onboarding]
```

**Pre-signup persistence**: 5 question answers in localStorage. On register success, batched `POST /onboarding/response` × 5 fires before redirecting to `/onboarding`. Failure mode: user clears cache between answering and signing up → answers lost; acceptable since none of the 5 questions store sensitive data.

**Post-signup persistence**: each screen `POST /onboarding/response` immediately on advance (matches existing flow). State also held in Zustand store for cross-screen access (e.g. goal-detail needs income + expenses from earlier screens to compute affordability).

**Completion**: final-screen "Got it" calls `POST /onboarding/complete`, which sets `IsOnboardingComplete = true` and creates `SpendingPlan` + per-category `BudgetAllocation` rows + `UserDebt` rows + the chosen `Goal` (typed by D1).

## Data model changes

**Additive only.** No destructive migrations.

### `GoalType` enum additions

Current values inferred: `DebtPayoff`, plus possibly Savings/Other. Add:
- `EmergencyFund` — for the mini buffer + full emergency fund stages
- `Savings` — for the generic "save more money" goal
- `Investing` — reserved for the post-onboarding goal-sequencing engine; not used by the onboarding flow itself

### `OnboardingResponse` step semantics (1..13)

| Step | Name | Response shape |
|---|---|---|
| 1 | Priorities | `["debt","saving",...]` (multi) |
| 2 | Stress points | `["unexpected","not-saving",...]` (multi) |
| 3 | Month-end state | `"break-even"` (single) |
| 4 | Savings cushion | `"under-10k"` (single) |
| 5 | Debt types | `["credit-card","overdraft"]` (multi; `["none"]` exclusive) |
| 6 | Goal pick | `"emergency"` (single) |
| 7 | Needs categories | `["rent","groceries","stokvel",...]` (array of category IDs) |
| 8 | Wants categories | `["dining","subscriptions",...]` (array of category IDs) |
| 9 | Per-category estimates | `{"rent":12000,"groceries":4500,...}` (object) |
| 10 | Primary income | `35000` (number) |
| 11 | Secondary income sources | `[{"type":"freelance","amount":5000},...]` (array) |
| 12 | Goal target amount | `50000` (number) |
| 13 | Goal target months | `12` (number; **omitted entirely** for emergency goal — emergency uses leftover-rate to derive timeline) |

Validator changes:
- `RuleFor(x => x.StepNumber).InclusiveBetween(1, 13)`
- Step 13 is conditionally required: handler accepts the step missing if the step-6 response is `"emergency"`, otherwise step-13 must be present before `CompleteOnboardingCommand` succeeds.

### Categories table seeding

`Cactus.Infrastructure/Data/Configurations` seeds `Category` rows. Confirm the following are present (add if missing):

**Needs**: Rent / Bond, Groceries, Transport, Utilities, Insurance, Medical Aid, Minimum Debt Payments, School Fees, Petrol, Childcare, **Stokvel**, Home Security, **Levies / Body Corp**.

**Wants**: Dining Out, Entertainment, Shopping, Subscriptions, Personal Care, Hobbies, Gym / Fitness, Travel, Pets, Gifts, Coffee & Snacks, Clothing.

The SA-specific entries (Stokvel, Levies, School Fees, Petrol) are **first-class defaults**, not hidden in an "extras" panel — they reflect the target market.

### `BudgetAllocation` rows from estimates

`CompleteOnboardingCommand` reads step-9 response and creates one `BudgetAllocation` per category with `AllocatedAmount = estimate`. The plan's `MonthlyIncome` comes from step-10 + sum-of-step-11.

### Secondary income — minimal model

Add a JSON column `SpendingPlan.SecondaryIncomeSources` (string, nullable) storing the array as-is. Avoid a full `IncomeSource` entity until we have a use case beyond onboarding (YAGNI). Schema upgrade if/when the in-product income editor lands.

### Goal creation in `CompleteOnboardingCommand`

Replace the hardcoded `DebtPayoff`-only logic with a switch on step-6 response:

- `"save"` → `Goal { GoalType = Savings, Name = "Save R{target}", TargetAmount = step-12, TargetDate = today + step-13 months }`
- `"debt"` → `Goal { GoalType = DebtPayoff, Name = "Pay off R{target}", TargetAmount = step-12, TargetDate = today + step-13 months, LinkedDebtId = …}` (link to the largest user debt if available)
- `"emergency"` → `Goal { GoalType = EmergencyFund, Name = "Emergency fund", TargetAmount = step-12, TargetDate = null }` (no fixed deadline; methodology says "ready when you're ready")

In all cases, `IsPrimary = true` and `Priority = 1`.

## Brand system

**Tokens** (Tailwind theme extension in `tailwind.config.js`):

```js
colors: {
  cactus: {
    charcoal: '#333333',
    sage:     '#77DD77',
    desert:   '#FFCC00',
    prickly:  '#FF6F61',
    sandstone:'#F5F5F1',
    'sage-light':  '#E8F8E8',
    'needs-bg':    '#E6F9E6',
    'wants-bg':    '#FFF5E0',
    'goals-bg':    '#FFE8E8',
    overlay:       'rgba(51,51,51,0.06)',
  }
},
fontFamily: {
  cactus: ['Quicksand', 'system-ui', 'sans-serif'],
}
```

**Typography**: Quicksand 400/500/600/700 via `@fontsource/quicksand`. Body 14–15px / 500w. Headings 22–28px / 700w. Labels 12–13px / 600w.

**Components** (live in `pages/onboarding/components/`):
- `<CactusLogo />` — the SVG mark + wordmark
- `<Btn />` — primary CTA with disabled state, sage bg, sage shadow
- `<MoneyInput />` — R-prefixed numeric input
- `<Dots />` — animated progress dots (sage active, charcoal-overlay inactive)
- `<WhyDisclosure />` — collapsible "Why are we asking this?" panel
- `<OptionPill />` — multi/single-select option button with icon + checkmark + sage selected state

**Animation**: a single `@keyframes fadeUp` (translate 16px + fade) applied via Tailwind utility `.animate-fade-up`. Respects `prefers-reduced-motion`.

**Layout container**: mobile-first, `max-w-md mx-auto bg-cactus-sandstone min-h-screen`. The phone-frame look from the prototype is *not* reproduced in production — it was a presentation device. Real users get full-viewport mobile, centered on tablet/desktop.

**Accessibility minimums** (non-negotiable):
- All option buttons are real `<button>` elements with `role="radio"` or `role="checkbox"` as appropriate
- Slider has `aria-valuemin/max/now` and a visible label
- Focus rings preserved (visible 2px sage outline)
- Keyboard nav: Tab moves through options, Space/Enter selects, Arrow keys for slider
- All emoji icons have `aria-hidden` since they're decorative; the text label carries the meaning

## PR sequence

| PR | Title | Frontend | Backend | Depends |
|----|-------|---------|---------|---------|
| **O-1** | Brand foundation tokens | ~300 | — | — |
| **O-2** | Pre-signup welcome + 5-question survey | ~600 | ~100 | O-1 |
| **O-3** | Phase 2 framework intro + interactive slider | ~400 | — | O-2 |
| **O-4** | Goal pick + goal-detail with affordability | ~500 | ~250 | O-3 |
| **O-5** | Categories + per-category estimates | ~600 | ~300 | O-4 |
| **O-6** | Multi-source income + final screen | ~250 | ~200 | O-5 |
| **O-7** | Brand rollout: Dashboard + Layout/nav | ~600 | — | O-1 (parallel to O-2..O-6) |
| **O-8** | Brand rollout: Transactions/Goals/Insights/Settings/Import | ~400 | — | O-7 |

**Critical path**: O-1 → O-2 → O-3 → O-4 → O-5 → O-6 (six PRs). O-7 and O-8 run in parallel branches once O-1 lands.

**Per-PR design docs** follow the Axis A pattern: each PR gets its own `2026-MM-DD-axis-o-pr-N-<topic>-design.md` written immediately before that PR is implemented. This umbrella spec is the authority on *what* and *why*; per-PR docs are the authority on *how* for that specific PR.

**Total**: ~3,250 frontend LOC + ~850 backend LOC across 8 PRs. ≈8 working days at the Axis A cadence, possibly less if O-7/O-8 run truly parallel.

## Acceptance criteria (Axis O complete when all are true)

1. A new user lands on `/welcome`, completes the pre-signup 5-question survey, registers, completes the post-signup wizard, and lands on Dashboard within 5 minutes.
2. The 5 pre-signup answers are persisted (localStorage during, `OnboardingResponse` rows post-register).
3. Goal pick screen shows a personalized recommendation derived from the survey answers (rule-based; no ML).
4. Goal-detail screen displays affordability classification (✅ doable / ⚠️ stretch) within 200ms of last keystroke; computation uses the leftover formula `income − sum(per-category estimates)`.
5. Completing onboarding creates exactly one `SpendingPlan` for the current month, one `Goal` of the correct type, one `BudgetAllocation` per selected category, and (if any) `UserDebt` rows from step-5.
6. Existing users with `IsOnboardingComplete = true` are unaffected — no forced re-onboarding.
7. Brand tokens (Quicksand, sage/desert/prickly) applied consistently across the wizard, Dashboard, and Layout chrome.
8. Lighthouse Accessibility score ≥ 95 on every wizard screen.
9. Backend coverage for `Cactus.Application.Features.Onboarding.*` ≥ 60% (handlers, validators, response-parsing).
10. Frontend tests cover the wizard's golden path (welcome → final) and at least three branches: skip-Phase-2, debt path, emergency path.
11. CI gates (Axis A) all pass; Codecov no regressions; deploy automation lands the new bundle on the Hetzner box.

## Out of scope

Explicitly **not** in Axis O:

- **OAuth signup** (Google/Facebook). Prototype buttons render as "coming soon" or are hidden behind a feature flag. Separate later ticket.
- **Bank connection flow.** The final screen teases it; the flow itself lives in **Axis D — bank feeds**.
- **Dashboard rebuild around bucket depletion** (the methodology's "Staying on Track" Phase 3). The brand is applied to the existing Dashboard in O-7; the *visual structure* of the dashboard does not change. The full bucket-depletion redesign is a separate axis (provisionally **Axis P — Plan execution**), brainstormed after Axis O ships.
- **Goal sequencing engine** beyond rule-based recommendations on the goal-pick screen. Methodology's full 4-stage progression (mini buffer → high-interest debt → full emergency fund → long-term investing) is implemented as a goal-pick *recommendation* but not as an automatic goal-stack workflow.
- **Methodology's Phase 1 "Awareness output"** views (the macro/micro spending breakdown shown to Nadia after she fills the spreadsheet). That is a Dashboard concern.
- **Account ledger / net worth tracking** (Nadia walkthrough Phase 1 Step 3). The current model has `Account` and `UserDebt` entities; the *experience* of seeing them as a position snapshot is a Dashboard concern, not onboarding.

## Open risks

1. **Pre-signup state-loss**. User answers 5 questions, navigates away, comes back, has to redo. Mitigation: localStorage persists across tabs/sessions; show "we kept your answers" banner if state is found on welcome-screen revisit. If not enough, fall back to anonymous-session UUID issued on welcome screen.
2. **Brand inconsistency window**. Between O-1 and O-7 landing, parts of the app look new-brand (onboarding) and parts look generic-Tailwind (everywhere else). User-visible. Acceptable trade-off; the alternative is a single 4000-LOC PR which is worse. We can shorten the window by running O-7 in parallel with O-2.
3. **Coverage threshold drag**. New screens add untested LOC. Codecov gate is "auto + 1% threshold" (Axis A PR 7). Frontend coverage in `src/pages/` baselines at 25.26%. Each onboarding PR must include component-level tests for the new screens to avoid pulling the gate down.
4. **The interactive slider screen is the highest-risk single component.** It does live computation, has accessibility requirements, and is the one screen that "demos" the framework. Budget extra time for O-3.
5. **Categories seeding & migration timing.** If we add new SA-specific category rows to `Cactus.Infrastructure/Data/Configurations`, the migration must run on the prod box during deploy. This is already automatic (`db.Database.MigrateAsync()` on startup), but an EF migration is required, not just a config change.
6. **Existing 8-step rows in production.** Verify count before O-2 merges (`SELECT COUNT(*) FROM "OnboardingResponses" GROUP BY "StepNumber"` on prod). If non-zero, the renumbering is confusing in the data but harmless to behavior. If we want clean data, run a one-time delete of `IsOnboardingComplete = false` users' responses before O-2 deploys.
7. **The methodology document evolves.** v0.1 is in repo root; later revisions may shift the framework. Each per-PR design doc reaffirms grounding against the *current* version of the methodology doc.

## Naming

The axis is **O** — for Onboarding, mnemonic for "the front door". This breaks the alphabetical sequence (A-B-C-D-E-F in the roadmap) but is more memorable than reusing a letter or shoehorning "B′". The roadmap doc gets a one-line update appending Axis O ahead of D.

## Appendix: prototype reference

Source: `cactus-onboarding-phase1.jsx` (660 LOC, delivered 2026-05-05 via WhatsApp document share).

The prototype is a single-file React mock with inline styles; it is **not** the production code. It is the design authority for screen content, copy tone, and visual language. Production translation:

- Inline styles → Tailwind utilities with the Cactus theme
- 660-line single file → folder structure under `src/frontend/src/pages/onboarding/`
- Phone-frame container → `max-w-md` centered layout with sandstone background
- `useState` wizard state → Zustand store with `persist` middleware
- Hardcoded data (questions, categories, framework cards) → `pages/onboarding/data.ts` (static) + DB-seeded categories
- Custom slider thumb CSS → preserved as a small global stylesheet
