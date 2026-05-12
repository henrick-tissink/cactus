# Axis O — PR 8: Remaining Shell Pages + Auth-Page Logo Consolidation — Design

**Parent umbrella spec:** [2026-05-07-axis-o-onboarding-design.md](2026-05-07-axis-o-onboarding-design.md)

## Goal

Finish the Axis O brand rollout. Paint the remaining 6 post-auth pages (`Transactions`, `SpendingPlan` aka `/budget`, `Goals`, `Insights`, `Settings`, `ImportTransactions`) with the cactus brand. Consolidate the 3 inline `CactusLogo` SVG functions duplicated across `Login` / `ForgotPassword` / `ResetPassword` into a single shared `<AuthBrandPanel />` that imports the canonical `<CactusLogo />` from `components/brand/`.

After this PR, the codebase has **one** `CactusLogo` and the only places still using legacy CSS vars (`--cactus-green`, `--cactus-forest`, `--cactus-mint`, `--surface`, `--text-*`, `--bucket-*`) are auth/onboarding entry pages we haven't audited (`WelcomePage`, `RegisterPage`, `VerifyEmailPage`) — they're explicit follow-up.

## Non-goals (deferred)

- **`WelcomePage` / `RegisterPage` / `VerifyEmailPage`** — these auth-flow pages also have legacy styling but weren't on the Axis O backlog. Cleanup follows in a small follow-up PR once O-8 lands.
- **Component extraction beyond `<AuthBrandPanel>`.** The survey identified shared patterns (modal wrapper, badge system, progress bar). Extracting them is a refactor — separate PR. Resist scope creep here.
- **`index.css` legacy token removal.** Leave `--cactus-green` / `--cactus-forest` / `--cactus-mint` / `--surface` / `--text-*` / `--bucket-*` in `:root` for now — three unaudited auth pages still reference them. A cleanup PR can remove them once all callers are confirmed gone.
- **New page content** (e.g., a "connect bank" CTA on the dashboard, new insights, etc.). This is a paint pass.

## Brand vocabulary (recap from PR O-7)

| Use case | Token / class |
|---|---|
| Page bg | `bg-cactus-sandstone` |
| Card bg | `bg-white` with `border border-cactus-overlay rounded-2xl` |
| Headings | `text-cactus-charcoal font-cactus font-bold` |
| Body text | `text-cactus-charcoal` |
| Secondary text | `text-cactus-charcoal/60` |
| Muted text | `text-cactus-charcoal/40` |
| Primary action color | `bg-cactus-sage` |
| Positive / income / "doable" | `text-cactus-sage` |
| Negative / spending / warning | `text-cactus-prickly` |
| Wants / sunshine accent | `bg-cactus-desert` |
| Goals / passionate striving | `bg-cactus-prickly` |
| Alert / soft warning bg | `bg-cactus-goals-bg` (light pink) |
| Sage-tinted card (success/affordable) | `bg-cactus-sage-light` |
| Hairline borders | `border-cactus-overlay` |
| Numeric values | `font-cactus font-bold tabular-nums` (replaces `font-mono-financial`) |
| Page entry animation | `animate-fade-in` |
| Active nav item | `bg-cactus-sage-light` + 3px sage left border (sidebar) / `text-cactus-sage` (tab) — already standardized in Layout |

**Bucket color mapping (canonical, from O-7):** Needs → `cactus-sage`, Wants → `cactus-desert`, Goals → `cactus-prickly`. All bucket-color references across the 6 shell pages should map to this triplet (and the matching `-bg` variants where soft fills are needed).

## Design decisions

**D1: Auth pages — extract `<AuthBrandPanel />` + use canonical `<CactusLogo />`.**

The three auth pages have a verbatim-duplicated left-side brand panel (forest bg, mint logo) + verbatim-duplicated inline `cactusIcon` function. Extract:

- New shared component: `src/frontend/src/components/auth/AuthBrandPanel.tsx`
- Renders the existing forest panel (sticking with the dark forest aesthetic on auth pages — the auth flow is intentionally a different visual register from the post-onboarding app)
- Uses `<CactusLogo />` from `components/brand/` (the canonical one); apply a wrapper `text-cactus-mint` so the SVG (which uses `currentColor` via the canonical component? — verify; if it uses fixed fills, pass a variant prop or accept that the panel uses the canonical sage variant on a forest bg).

**Verification side-effect:** The canonical `<CactusLogo />` uses fixed `fill-cactus-sage / fill-cactus-prickly / fill-cactus-desert` classes — NOT `currentColor`. So on a forest panel the colors stay sage/prickly/desert (sage on dark forest reads well, prickly is a coral pop, desert is a yellow pop). The wordmark is `text-cactus-charcoal` which on dark bg is unreadable — we need to either:
  - **(a)** Add a `tone="onDark"` prop to `<CactusLogo />` that switches the wordmark color to white/mint
  - **(b)** Override the wordmark color from outside via a parent class wrapper if Tailwind allows (it does not — the inner span has its own text color)
  - **(c)** Inline the SVG only inside `<AuthBrandPanel />` (no wordmark) and place the "cactus" text separately styled

  **Decision: (a)** — extend `<CactusLogo />` with an optional `tone?: 'light' | 'dark'` prop (default `'light'` matches today's behavior). Dark variant: text becomes `text-cactus-mint` (kept legacy mint token for now — defer mint→sage-light migration to the follow-up audit PR). Add a test for the dark variant.

**D2: Auth-page form panels — paint cactus.**

The right-side form panels of the 3 auth pages still use `bg-[var(--cactus-green)]` / `bg-[var(--cactus-forest)]` for buttons and `focus:ring-[var(--cactus-green)]` for inputs. Replace with `bg-cactus-sage`, `focus:ring-cactus-sage`. Page background: `bg-cactus-sandstone` (replacing whatever it is today). Form headings: `text-cactus-charcoal font-cactus`.

The forest brand panel itself stays forest — that's the intentional contrast on auth pages.

**D3: Settings page — straightforward paint pass.**

Smallest of the shell pages (278 LOC). Apply the standard recipe:
- Page bg + `font-cactus`
- Email verification banner: replace amber/green with `bg-cactus-sage-light` (verified) / `bg-cactus-goals-bg` (unverified, soft warning)
- Profile/Password card frames: `bg-white border border-cactus-overlay rounded-2xl`
- Inputs: `border-cactus-overlay focus:border-cactus-sage`
- Save/Change buttons: use `<Btn />` from `components/brand/`
- Success/error messages: `bg-cactus-sage-light` / `bg-cactus-goals-bg`

Add `Settings.test.tsx` (no test exists). Cover: renders email verification status, profile form submit posts to `/auth/profile`, change-password form submit posts to `/auth/change-password`. 3 tests minimum.

**D4: ImportTransactions — paint pass + replace amber dashed dropzone with sage.**

Apply standard recipe. Specific replacements:
- Step indicator: completed step `bg-cactus-sage`, active `bg-cactus-sage-light` with sage text, pending `bg-cactus-overlay`
- Dropzone: dashed `border-cactus-overlay` → `border-cactus-sage` on hover/drag-over; replace amber tint with `bg-cactus-sage-light/40` hint
- Supported-banks list chips: `bg-cactus-overlay/50` instead of amber
- Preview table: same as Transactions paint pass (charcoal text, sage/prickly for credit/debit, charcoal borders)
- Success state: `bg-cactus-sage-light` card with sage check

Add `ImportTransactions.test.tsx`. Cover: step-1 dropzone visible, step-2 preview renders parsed rows, step-3 success copy. 3 tests minimum.

**D5: SpendingPlan (`/budget`) — paint pass + new slider styles.**

Has 3 range sliders for Needs/Wants/Goals percentages. Currently `accent-blue-500` / `accent-purple-500` / `accent-green-500`. Replace with the new bucket mapping:
- Needs slider: `accent-cactus-sage`
- Wants slider: `accent-cactus-desert`
- Goals slider: `accent-cactus-prickly`

Other replacements:
- Suggestion card: replace amber/orange gradient with `bg-cactus-sage-light` (this is a "we recommend X" card — sage feels confident)
- Income input: standard cactus input style
- "Plan vs Actual" `BudgetBar`: bucket fill maps as above
- "Actual vs Allocated" circular progress: use sage/desert/prickly per bucket
- Quick Tips green/emerald gradient: replace with `bg-cactus-sage-light` with charcoal text
- Loading skeleton: `bg-cactus-overlay`

No test added for SpendingPlan (~566 LOC; complex; defer test backfill to a separate effort — call out in PR description).

**D6: Goals — paint pass on Goals.tsx + 3 sub-components.**

Has `GoalCard`, `CreateGoalModal`, `UpdateProgressModal` inside the file. Replacements:
- Recommended Goal Sequence (green/emerald gradient): `bg-cactus-sage-light` card
- Primary Focus (amber/orange gradient): `bg-cactus-sage-light` (consistent with O-7's Primary Goal card on Dashboard)
- Goal type color mapping in `GoalCard`:
  - Savings → sage
  - DebtPayoff → prickly
  - EmergencyFund → desert
  - Other → charcoal/40
- Progress bars: sage fill on cactus-overlay track
- Trophy / completion icons: `text-cactus-sage`
- Modals (`CreateGoalModal`, `UpdateProgressModal`): white modal body with cactus-overlay border, sandstone backdrop, cactus inputs, `<Btn />` for CTAs. Backdrop: `bg-cactus-charcoal/40`.

`Goals.test.tsx` exists — verify it still passes; add no new tests.

**D7: Insights — paint pass + recharts color update.**

The most chart-heavy page. Hardcoded hex colors in chart props need to map to brand tokens.

Define a small constant block at the top of `Insights.tsx`:

```ts
const BRAND_CHART_COLORS = {
  needs: '#77DD77',     // cactus-sage
  wants: '#FFCC00',     // cactus-desert
  goals: '#FF6F61',     // cactus-prickly
  surplus: '#77DD77',   // cactus-sage
  deficit: '#FF6F61',   // cactus-prickly
  gridline: 'rgba(51, 51, 51, 0.06)', // cactus-overlay
  axisText: '#333333',  // cactus-charcoal
};
```

Apply to `LineChart`, `BarChart`, `CircularProgress`, guideline bars. The literal hex strings keep the chart library compatible (it doesn't read CSS vars at runtime).

Other replacements:
- Trend Summary Card: tone-aware bg — `bg-cactus-sage-light` (positive trend), `bg-cactus-goals-bg` (negative trend), `bg-white` (neutral)
- Average Split Card: 3 circles using bucket mapping
- Category Averages grouped cards: bucket-themed backgrounds (`cactus-needs-bg` / `wants-bg` / `goals-bg`)
- Guideline comparison: sage/desert/prickly bars

No test added (defer; ~647 LOC; chart-heavy).

**D8: Transactions — paint pass on Transactions.tsx + 4 sub-modals (BIG).**

1,447 LOC. The biggest paint pass in the PR. Sections:
- Header + action buttons row
- Filter pills (currently a mix of bg-gray and bg-green for active)
- Transaction list rows (currently same hardcoded color scheme as Dashboard before O-7)
- `ClassifyModal` (a multi-step modal with macro-category badges, category grid, similar-count chip, save controls)
- `AddTransactionModal` (form with amount, date, account, category dropdowns)
- `BulkClassifyModal` (multi-select + classify together)
- `RecurringPatternsPanel` (collapsible side panel)

Standard recipe applied to all. Specifics:
- Macro-category badges: replace hardcoded `bg-blue-100 text-blue-800` (Needs) / `bg-purple-100 text-purple-800` (Wants) / `bg-green-100 text-green-800` (Goals) with `bg-cactus-needs-bg text-cactus-charcoal` / `bg-cactus-wants-bg text-cactus-charcoal` / `bg-cactus-goals-bg text-cactus-charcoal`
- Filter pill active state: `bg-cactus-sage-light text-cactus-charcoal border-cactus-sage`
- Filter pill inactive: `bg-white text-cactus-charcoal/60 border-cactus-overlay`
- Row hover: `hover:bg-cactus-sage-light/30`
- Credit amount: `text-cactus-sage`
- Debit amount: `text-cactus-prickly`
- Modal backdrop: `bg-cactus-charcoal/40`
- Modal panel: `bg-white border border-cactus-overlay rounded-2xl`
- Pagination buttons: `<Btn />` or inline cactus button
- Action buttons (Recurring/Filters/Bulk Classify/Import/Add): `bg-cactus-sage text-white` for primary; `bg-white border border-cactus-overlay text-cactus-charcoal` for secondary

`Transactions.test.tsx` exists — verify it still passes.

**D9: `font-mono-financial` eradication.**

Every page using `font-mono-financial` for currency values should switch to `font-cactus font-bold tabular-nums` (matches O-7 Dashboard). The `font-mono-financial` class will linger in `index.css` (unused) until a follow-up cleanup.

**D10: Animation consistency.**

Wherever pages already use `animate-fade-in`, keep it (already brand-aligned per O-7). Don't add `animate-fade-up` — that's for wizard step transitions, not shell pages. Skeletons keep `animate-pulse` (Tailwind default, no brand opinion).

**D11: No new components beyond `<AuthBrandPanel />`.**

`<CactusLogo />` already exists. `<Btn />` already exists. Resist the temptation to extract `<Modal>`, `<Alert>`, `<SectionHeader>`, etc. — that's a separate refactor PR.

**D12: Test scope discipline.**

Add new tests ONLY for Settings + ImportTransactions (small, well-bounded files where TDD pays). Don't backfill tests for SpendingPlan / Insights / Goals / Transactions — they're large, existing covers some, and a backfill is its own effort. Existing tests on Transactions / Goals / Login must continue to pass.

## File structure

**Created:**
- `src/frontend/src/components/auth/AuthBrandPanel.tsx`
- `src/frontend/src/pages/Settings.test.tsx`
- `src/frontend/src/pages/ImportTransactions.test.tsx`

**Modified:**
- `src/frontend/src/components/brand/CactusLogo.tsx` — add `tone?: 'light' | 'dark'` prop
- `src/frontend/src/components/brand/CactusLogo.test.tsx` — add dark-tone test
- `src/frontend/src/pages/Login.tsx` — use `<AuthBrandPanel />`, delete inline `cactusIcon`, paint form
- `src/frontend/src/pages/ForgotPassword.tsx` — same
- `src/frontend/src/pages/ResetPassword.tsx` — same
- `src/frontend/src/pages/Settings.tsx`
- `src/frontend/src/pages/ImportTransactions.tsx`
- `src/frontend/src/pages/SpendingPlan.tsx`
- `src/frontend/src/pages/Goals.tsx`
- `src/frontend/src/pages/Insights.tsx`
- `src/frontend/src/pages/Transactions.tsx`

**Unchanged on purpose:**
- `src/frontend/src/index.css` — no token additions or removals
- All onboarding files
- `Layout.tsx`, `Dashboard.tsx` (already O-7)
- `WelcomePage`, `RegisterPage`, `VerifyEmailPage` (deferred — explicit follow-up)

## Acceptance criteria

1. `<AuthBrandPanel />` exists at `components/auth/AuthBrandPanel.tsx` and is the only place defining the forest brand panel JSX. Login / ForgotPassword / ResetPassword import and render it. Inline `cactusIcon` functions are deleted from all 3 auth pages.
2. `<CactusLogo />` has a `tone?: 'light' | 'dark'` prop; dark tone uses `text-cactus-mint` for the wordmark. `CactusLogo.test.tsx` covers the dark variant.
3. Settings page uses `bg-cactus-sandstone font-cactus`, cactus inputs, sage/goals-bg banners; `Settings.test.tsx` exists with at least 3 tests.
4. ImportTransactions uses cactus brand throughout: sage step indicator, sage dropzone hover, sage success state. `ImportTransactions.test.tsx` exists with at least 3 tests.
5. SpendingPlan uses sage/desert/prickly slider accents (matching bucket mapping), sage-light suggestion card, brand-token Plan-vs-Actual bars and circular progress. Tests (if any added) pass.
6. Goals uses sage-light Primary Focus card (no amber), bucket-mapped goal type colors, cactus modals. `Goals.test.tsx` still passes.
7. Insights uses brand-token chart colors (sage/desert/prickly via `BRAND_CHART_COLORS` constant), tone-aware Trend Summary, bucket-themed Category Averages. Tests (if any added) pass.
8. Transactions uses brand-token macro-category badges, sage/prickly amounts, cactus filter pills, cactus modals across all 4 sub-modals. `Transactions.test.tsx` still passes.
9. Zero references to `font-mono-financial`, `--cactus-green`, `--cactus-forest`, `--cactus-mint`, `--surface`, `--text-primary|secondary|muted`, `--bucket-needs|wants|goals`, `--card`, or hardcoded `bg-amber-*` / `bg-blue-*` / `bg-purple-*` / `bg-green-50|100|600` color classes (used for branding, not status indicators) survive in the 9 rewritten files. Eradication grep enforced per task.
10. Full frontend test suite passes. Lint, format:check, build clean.

## Risks

- **Test backfill gap.** SpendingPlan, Insights, Goals (existing covers some), and parts of Transactions go untested for the paint pass. A subagent could break a section visually with no test catching it. Mitigation: spec gives section-by-section replacements; a code-quality reviewer subagent reads the diff at the end. If a regression sneaks through it's recoverable via a quick fix-up PR — but flag this in the PR description.
- **Recharts color contract.** `BRAND_CHART_COLORS` uses literal hex values (matching brand tokens). If `index.css` brand tokens are ever re-tuned, charts won't follow automatically. Document this trade-off in code via a single inline comment near the constant.
- **Tone prop on `<CactusLogo />`.** Adding a prop touches a component used elsewhere (Layout, onboarding). Default of `'light'` preserves existing behavior; verified via existing `CactusLogo.test.tsx` continuing to pass.
- **Large PR surface.** 9 files, ~3,800 LOC. Internal task split (7 tasks, with auth + 5 page paint passes + PR) keeps each subagent's job tractable.

## Follow-up audit (post-O-8)

A small "Axis O wrap" PR should later:
- Audit `WelcomePage` / `RegisterPage` / `VerifyEmailPage` for legacy brand
- Remove legacy CSS vars from `:root` once all callers confirmed gone
- Remove `font-mono-financial` class definition from `index.css`
- Optionally migrate `--cactus-mint` references in `<CactusLogo tone="dark">` to a brand token
