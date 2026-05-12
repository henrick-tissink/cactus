# Axis O — PR 8: Remaining Shell Pages + Auth-Page Logo Consolidation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Parent specs:**
- Umbrella: [2026-05-07-axis-o-onboarding-design.md](../specs/2026-05-07-axis-o-onboarding-design.md)
- PR-8 design: [2026-05-12-axis-o-pr-8-shell-pages-rebrand-design.md](../specs/2026-05-12-axis-o-pr-8-shell-pages-rebrand-design.md)

**Goal:** Finish Axis O brand rollout. 6 post-auth pages painted; 3 auth-page inline logos consolidated into one shared `<AuthBrandPanel />` + canonical `<CactusLogo />`. ~3,800 LOC across 9 files.

**Tech Stack:** React 19, TanStack Query, react-router-dom 7, Tailwind v4, Vitest+RTL, MSW, Recharts. No backend changes.

---

## Brand quick-reference (use this exact vocabulary)

| Use | Class |
|---|---|
| Page bg | `bg-cactus-sandstone` |
| Card frame | `bg-white border border-cactus-overlay rounded-2xl` |
| Heading | `text-cactus-charcoal font-cactus font-bold` |
| Body | `text-cactus-charcoal` |
| Secondary text | `text-cactus-charcoal/60` |
| Muted text | `text-cactus-charcoal/40` |
| Number | `font-cactus font-bold tabular-nums` |
| Primary CTA | `<Btn />` from `components/brand/Btn` |
| Sage accent | `bg-cactus-sage` / `text-cactus-sage` |
| Sage soft bg | `bg-cactus-sage-light` |
| Desert accent | `bg-cactus-desert` |
| Prickly accent | `bg-cactus-prickly` / `text-cactus-prickly` |
| Soft warning bg | `bg-cactus-goals-bg` |
| Needs soft bg | `bg-cactus-needs-bg` |
| Wants soft bg | `bg-cactus-wants-bg` |
| Hairlines | `border-cactus-overlay` |
| Backdrop (modal) | `bg-cactus-charcoal/40` |
| Input | `border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl px-4 py-3 font-cactus text-cactus-charcoal` |

**Bucket mapping (canonical):** Needs = sage, Wants = desert, Goals = prickly. Soft variants: `cactus-needs-bg` / `cactus-wants-bg` / `cactus-goals-bg`.

**Forbidden in this PR's scope** (eradicate per task): `font-mono-financial`, `--cactus-green`, `--cactus-forest`, `--cactus-mint` (except inside `<CactusLogo tone="dark">` impl), `--surface`, `--text-primary|secondary|muted`, `--bucket-needs|wants|goals`, `--card`, hardcoded `bg-amber-*` / `bg-blue-50|100|500|600|700|800` / `bg-purple-50|100|500|600|700|800` / `bg-green-50|100|500|600|700|800` for branding (status-indicator-only colors may remain if absolutely necessary — but prefer cactus equivalents).

---

## Task 1: Auth pages — extract `<AuthBrandPanel />`, extend `<CactusLogo />`, paint forms

**Files:**
- Create: `src/frontend/src/components/auth/AuthBrandPanel.tsx`
- Modify: `src/frontend/src/components/brand/CactusLogo.tsx` (add `tone` prop)
- Modify: `src/frontend/src/components/brand/CactusLogo.test.tsx` (test dark tone)
- Modify: `src/frontend/src/pages/Login.tsx`
- Modify: `src/frontend/src/pages/ForgotPassword.tsx`
- Modify: `src/frontend/src/pages/ResetPassword.tsx`

### Step 1: Extend `<CactusLogo />` with `tone?: 'light' | 'dark'`

Read the current `CactusLogo.tsx`. The wordmark `<span>` is `text-cactus-charcoal`. Default behavior stays. When `tone="dark"`, the span becomes `text-cactus-mint` (kept legacy mint to avoid widening this PR's token migration; brand audit will revisit).

Update the props interface and the JSX. Backwards-compatible. Then update the test to add:

```tsx
it('renders the dark-tone variant with mint wordmark color', () => {
  render(<CactusLogo tone="dark" />);
  const wordmark = screen.getByText('cactus');
  expect(wordmark).toHaveClass('text-cactus-mint');
});
```

(Existing test should already assert charcoal text by default — confirm by reading the file. If it does, the dark-tone test confirms the prop works.)

### Step 2: Create `<AuthBrandPanel />`

`src/frontend/src/components/auth/AuthBrandPanel.tsx`:

```tsx
import { CactusLogo } from '../brand/CactusLogo';

interface AuthBrandPanelProps {
  heading: string;
  tagline: string;
}

export function AuthBrandPanel({ heading, tagline }: AuthBrandPanelProps) {
  return (
    <div className="hidden md:flex md:w-1/2 bg-[var(--cactus-forest)] text-white p-12 flex-col justify-between">
      <CactusLogo tone="dark" />
      <div>
        <h1 className="font-cactus font-bold text-3xl mb-3 leading-tight">{heading}</h1>
        <p className="font-cactus text-[15px] text-white/70 leading-relaxed">{tagline}</p>
      </div>
      <p className="font-cactus text-xs text-white/40">© Cactus Finance</p>
    </div>
  );
}
```

(The forest CSS var is kept here intentionally — auth-page brand panel stays forest. `index.css` cleanup deferred.)

### Step 3: Rewrite the 3 auth pages

For each of `Login.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx`:

- DELETE the inline `cactusIcon` function (top of file, ~lines 5-25)
- DELETE the inline brand-panel JSX block
- IMPORT `<AuthBrandPanel />` and `<CactusLogo />`
- Render layout as `flex min-h-screen`: `<AuthBrandPanel ... />` on left + form panel on right (`flex-1 bg-cactus-sandstone p-8 flex flex-col`)
- Form panel header logo: `<CactusLogo />` (default light tone)
- Form heading: `text-cactus-charcoal font-cactus font-bold text-2xl`
- Inputs: cactus input style per brand reference
- Submit button: `<Btn>` from `components/brand/Btn` (replacing the existing `bg-[var(--cactus-green)]` button)
- Links (forgot password / register / login): `text-cactus-sage font-cactus font-semibold`
- Error banners: `bg-cactus-goals-bg border border-cactus-overlay text-cactus-charcoal rounded-xl p-3 font-cactus`
- Success banners (ForgotPassword success, ResetPassword success): `bg-cactus-sage-light border border-cactus-overlay text-cactus-charcoal rounded-xl p-3 font-cactus`

**Suggested heading/tagline copy for `<AuthBrandPanel />`** (consistent across all 3 pages):
- heading: `"Build a Spending Plan that actually works"`
- tagline: `"Track where every Rand goes, hit your goals, and feel calm about money."`

### Step 4: Run tests, lint, format, build

```bash
cd src/frontend && npm run test -- "Login|CactusLogo" && npm run lint && npm run format:check && npm run build
```

### Step 5: Eradication grep (auth scope)

```bash
grep -nE 'cactusIcon|var\(--cactus-green\)|var\(--cactus-forest\)' \
  src/frontend/src/pages/Login.tsx \
  src/frontend/src/pages/ForgotPassword.tsx \
  src/frontend/src/pages/ResetPassword.tsx
```

Expected: empty (the only place forest survives is `AuthBrandPanel.tsx`).

### Step 6: Commit

```bash
git add src/frontend/src/components/auth/AuthBrandPanel.tsx \
  src/frontend/src/components/brand/CactusLogo.tsx \
  src/frontend/src/components/brand/CactusLogo.test.tsx \
  src/frontend/src/pages/Login.tsx \
  src/frontend/src/pages/ForgotPassword.tsx \
  src/frontend/src/pages/ResetPassword.tsx
git commit -m "feat(auth): extract AuthBrandPanel + CactusLogo tone prop; consolidate inline auth-page logos"
```

---

## Task 2: Settings + ImportTransactions (combined; both small)

**Files:**
- Modify: `src/frontend/src/pages/Settings.tsx`
- Create: `src/frontend/src/pages/Settings.test.tsx`
- Modify: `src/frontend/src/pages/ImportTransactions.tsx`
- Create: `src/frontend/src/pages/ImportTransactions.test.tsx`

### Step 1: Settings.test.tsx (TDD)

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/render';
import { server } from '../test/mocks/server';
import { useAuthStore } from '../store/authStore';
import { SettingsPage } from './Settings';

function seedUser(overrides: Partial<{ isEmailVerified: boolean }> = {}) {
  useAuthStore.setState({
    user: {
      userId: 'u1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      isOnboardingComplete: true,
      isEmailVerified: overrides.isEmailVerified ?? true,
    },
    isAuthenticated: true,
    isLoading: false,
  });
}

describe('SettingsPage', () => {
  beforeEach(() => seedUser());

  it('shows verified-email badge when user is verified', () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText(/email verified/i)).toBeInTheDocument();
  });

  it('shows unverified prompt when email not verified', () => {
    seedUser({ isEmailVerified: false });
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
  });

  it('posts to /auth/profile on save', async () => {
    let posted = false;
    server.use(
      http.put('/api/auth/profile', () => {
        posted = true;
        return HttpResponse.json({});
      })
    );
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);
    await user.click(screen.getByRole('button', { name: /save changes/i }));
    await waitFor(() => expect(posted).toBe(true));
  });
});
```

(Adjust regex matches if existing Settings.tsx uses different copy — read the file first. If the page uses default-export named `Settings` instead of `SettingsPage`, update import accordingly.)

Run to confirm failure (e.g., `screen.getByText(/email verified/i)` may not match current copy). Then proceed to the paint pass which can include adjusting copy to match the test.

### Step 2: Paint Settings.tsx

Apply standard recipe. Specifics:
- Page outer: `bg-cactus-sandstone min-h-screen font-cactus p-6`
- Section heading: `text-cactus-charcoal font-cactus font-bold text-xl`
- Card frames: `bg-white border border-cactus-overlay rounded-2xl p-6`
- Email-verified banner: `bg-cactus-sage-light border border-cactus-overlay text-cactus-charcoal` with sage check icon
- Email-unverified banner: `bg-cactus-goals-bg border border-cactus-overlay text-cactus-charcoal` with prickly alert icon
- Inputs: `border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl px-4 py-3 font-cactus text-cactus-charcoal`
- Save / Change / Resend Verification buttons: `<Btn>` from `components/brand/`
- Error message: `bg-cactus-goals-bg border border-cactus-overlay text-cactus-charcoal rounded-xl p-3 font-cactus`
- Success message: `bg-cactus-sage-light border border-cactus-overlay text-cactus-charcoal rounded-xl p-3 font-cactus`

### Step 3: ImportTransactions.test.tsx (TDD)

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/render';
import { server } from '../test/mocks/server';
import { ImportTransactionsPage } from './ImportTransactions';

beforeEach(() => {
  server.use(
    http.get('/api/accounts', () => HttpResponse.json([
      { id: 'a1', name: 'Cheque', currency: 'ZAR' },
    ]))
  );
});

describe('ImportTransactionsPage', () => {
  it('renders the upload step indicator and dropzone on initial load', async () => {
    renderWithProviders(<ImportTransactionsPage />);
    expect(await screen.findByText(/upload/i)).toBeInTheDocument();
    expect(screen.getByText(/drag.*drop|select a file/i)).toBeInTheDocument();
  });

  it('lists supported banks', async () => {
    renderWithProviders(<ImportTransactionsPage />);
    expect(await screen.findByText(/supported banks/i)).toBeInTheDocument();
  });

  it('renders the account selector with seeded accounts', async () => {
    renderWithProviders(<ImportTransactionsPage />);
    expect(await screen.findByText('Cheque')).toBeInTheDocument();
  });
});
```

(Same caveat — read the page first, adjust regex/import to match actual exports.)

### Step 4: Paint ImportTransactions.tsx

Apply standard recipe. Specifics:
- Step indicator circles: completed `bg-cactus-sage text-white`; active `bg-cactus-sage-light text-cactus-sage border-2 border-cactus-sage`; pending `bg-cactus-overlay text-cactus-charcoal/40`
- Step indicator connector line: `bg-cactus-overlay` with `bg-cactus-sage` for completed segments
- Dropzone: `border-2 border-dashed border-cactus-overlay rounded-2xl p-8 hover:border-cactus-sage hover:bg-cactus-sage-light/30`
- Supported-banks chips: `bg-white border border-cactus-overlay rounded-xl px-3 py-1.5 font-cactus text-cactus-charcoal text-sm`
- Preview table row: `bg-white border border-cactus-overlay`; debit amount `text-cactus-prickly`; credit `text-cactus-sage`; unclassified row left border `border-l-2 border-cactus-prickly`
- Success state card: `bg-cactus-sage-light border border-cactus-overlay rounded-2xl p-8 text-center` with `text-cactus-sage` check icon
- All amounts: `font-cactus font-bold tabular-nums`

### Step 5: Run tests, lint, format

```bash
cd src/frontend && npm run test -- "Settings|ImportTransactions" && npm run lint && npm run format:check
```

### Step 6: Eradication grep

```bash
grep -nE 'font-mono-financial|var\(--cactus-(green|forest|mint)\)|var\(--surface\)|var\(--text-(primary|secondary|muted)\)|var\(--bucket-|var\(--card\)|bg-amber-|bg-blue-(50|100|500|600|700|800)|bg-purple-(50|100|500|600|700|800)|bg-green-(50|100|500|600|700|800)' \
  src/frontend/src/pages/Settings.tsx \
  src/frontend/src/pages/ImportTransactions.tsx
```

Expected: empty.

### Step 7: Commit

```bash
git add src/frontend/src/pages/Settings.tsx \
  src/frontend/src/pages/Settings.test.tsx \
  src/frontend/src/pages/ImportTransactions.tsx \
  src/frontend/src/pages/ImportTransactions.test.tsx
git commit -m "feat(shell): rebrand Settings + ImportTransactions to cactus brand; add smoke tests"
```

---

## Task 3: SpendingPlan (`/budget`) page

**Files:**
- Modify: `src/frontend/src/pages/SpendingPlan.tsx`

### Step 1: Paint pass

566 LOC, 2 sub-components inside (`BudgetBar`, `ActualVsAllocated`). No test file (acceptable per spec D12).

Apply standard recipe page-wide. Section-specific:

**Suggestion card** (currently amber/orange gradient):
- bg: `bg-cactus-sage-light border border-cactus-overlay rounded-2xl p-5`
- Title: `text-cactus-charcoal font-cactus font-bold`
- Visual comparison: keep structure, use sage/desert/prickly bucket bars

**Sliders:**
- Needs: `accent-cactus-sage`
- Wants: `accent-cactus-desert`
- Goals: `accent-cactus-prickly`
- Track behind sliders: `bg-cactus-overlay`

**Allocation visual bar:**
- Needs fill: `bg-cactus-sage`
- Wants fill: `bg-cactus-desert`
- Goals fill: `bg-cactus-prickly`

**Actual vs Allocated (3-column grid):**
- Card frames: `bg-white border border-cactus-overlay rounded-2xl`
- Circular progress strokes: `stroke-cactus-sage` / `stroke-cactus-desert` / `stroke-cactus-prickly` (set via inline `stroke` attribute if using raw SVG, or `style={{ stroke: '#77DD77' }}` etc.)
- Bg track: `stroke-cactus-overlay`

**`BudgetBar` sub-component:**
- Background: `bg-cactus-overlay`
- Fill colors by bucket: same mapping
- Labels: `text-cactus-charcoal font-cactus`
- Amounts: `font-cactus font-bold tabular-nums text-cactus-charcoal`

**Quick Tips section** (currently green/emerald gradient):
- bg: `bg-cactus-sage-light border border-cactus-overlay rounded-2xl`
- Tips text: `text-cactus-charcoal font-cactus`
- Tip icons: `text-cactus-sage`

**Loading skeleton:**
- All `bg-gray-200` → `bg-cactus-overlay`
- Wrapper bg: `bg-cactus-sandstone`

**Income input:** standard cactus input style.

**Save button:** `<Btn />` from `components/brand/`.

### Step 2: Run tests + lint + format

```bash
cd src/frontend && npm run test && npm run lint && npm run format:check
```

### Step 3: Eradication grep

```bash
grep -nE 'font-mono-financial|var\(--cactus-(green|forest|mint)\)|var\(--surface\)|var\(--text-(primary|secondary|muted)\)|var\(--bucket-|var\(--card\)|bg-amber-|bg-blue-(50|100|500|600|700|800)|bg-purple-(50|100|500|600|700|800)|bg-green-(50|100|500|600|700|800)|accent-(blue|purple|green)-' \
  src/frontend/src/pages/SpendingPlan.tsx
```

Expected: empty.

### Step 4: Commit

```bash
git add src/frontend/src/pages/SpendingPlan.tsx
git commit -m "feat(budget): rebrand SpendingPlan page to cactus brand (sage/desert/prickly sliders + buckets)"
```

---

## Task 4: Insights page

**Files:**
- Modify: `src/frontend/src/pages/Insights.tsx`

### Step 1: Paint pass

647 LOC with 8 sub-components + Recharts. No test file.

Add a constant block near the top:

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
// Hex strings used directly because Recharts props don't read CSS vars at runtime.
// If brand tokens shift, update this map alongside index.css.
```

Apply to all `LineChart` / `BarChart` / `CircularProgress` props. Replace previous hardcoded hexes (`#22c55e`, `#f59e0b`, `#3b82f6`, `#ef4444`, `#e5e7eb`).

**Per-section paint:**

**Page wrapper:** `bg-cactus-sandstone font-cactus`

**Header** (with date range): heading cactus charcoal; range chips `bg-white border border-cactus-overlay text-cactus-charcoal`.

**Trend Summary Card:**
- Positive trend bg: `bg-cactus-sage-light`; icon `text-cactus-sage`
- Negative trend bg: `bg-cactus-goals-bg`; icon `text-cactus-prickly`
- Neutral bg: `bg-white border border-cactus-overlay`
- Title: charcoal bold; message: charcoal/70

**Average Split (3 circular progress):** sage/desert/prickly per bucket.

**Monthly Spending Trend (LineChart):** lines colored via `BRAND_CHART_COLORS.needs/wants/goals`. Axis labels `BRAND_CHART_COLORS.axisText`. Grid `BRAND_CHART_COLORS.gridline`.

**Monthly Surplus/Deficit (BarChart):** positive bars `BRAND_CHART_COLORS.surplus`; negative bars `BRAND_CHART_COLORS.deficit`.

**Category Averages (grouped cards):**
- Needs group container: `bg-cactus-needs-bg/40 border border-cactus-overlay rounded-2xl`
- Wants group: `bg-cactus-wants-bg/40 ...`
- Goals group: `bg-cactus-goals-bg/40 ...`
- Group headers: charcoal bold
- Category rows: white card with cactus-overlay border

**Guideline Comparison:**
- Bars: bucket mapping (sage/desert/prickly)
- Status icons: sage check / prickly alert
- Guideline marker lines: charcoal/40

**LoadingState / ErrorState / EmptyState:** standard cactus treatment (sandstone, cactus icons, sage spinner via `text-cactus-sage`).

### Step 2: Run tests + lint + format

```bash
cd src/frontend && npm run test && npm run lint && npm run format:check
```

### Step 3: Eradication grep

```bash
grep -nE 'font-mono-financial|var\(--cactus-(green|forest|mint)\)|var\(--surface\)|var\(--text-(primary|secondary|muted)\)|var\(--bucket-|var\(--card\)|bg-amber-|bg-blue-(50|100|500|600|700|800)|bg-purple-(50|100|500|600|700|800)|bg-green-(50|100|500|600|700|800)|#22c55e|#f59e0b|#3b82f6|#ef4444' \
  src/frontend/src/pages/Insights.tsx
```

Expected: empty.

(Note: the BRAND_CHART_COLORS object DOES contain `#77DD77` / `#FFCC00` / `#FF6F61` — those are brand tokens, expected to survive. The grep above explicitly does NOT match those.)

### Step 4: Commit

```bash
git add src/frontend/src/pages/Insights.tsx
git commit -m "feat(insights): rebrand to cactus brand with BRAND_CHART_COLORS constant for Recharts"
```

---

## Task 5: Goals page

**Files:**
- Modify: `src/frontend/src/pages/Goals.tsx`

### Step 1: Paint pass

754 LOC, `Goals.test.tsx` exists.

**Page wrapper:** `bg-cactus-sandstone font-cactus`.

**Header + "New Goal" button:** standard cactus + `<Btn />`.

**Recommended Goal Sequence card** (currently green/emerald gradient):
- bg: `bg-cactus-sage-light border border-cactus-overlay rounded-2xl p-5`
- Step circles: `bg-cactus-sage text-white`
- Step labels: charcoal bold

**Primary Focus card** (currently amber/orange gradient):
- bg: `bg-cactus-sage-light border border-cactus-overlay rounded-2xl p-6`
- "Primary" badge: `bg-cactus-sage text-white text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded-full`
- Progress: sage fill on cactus-overlay track
- "to go" amount: `text-cactus-sage font-cactus font-bold`

**`GoalCard` sub-component:**
- Card frame: `bg-white border border-cactus-overlay rounded-2xl p-5`
- Goal type icon bg by type:
  - Savings: `bg-cactus-sage-light text-cactus-sage`
  - DebtPayoff: `bg-cactus-goals-bg text-cactus-prickly`
  - EmergencyFund: `bg-cactus-wants-bg text-cactus-charcoal` (desert is light; charcoal text reads on cream)
  - Other: `bg-cactus-overlay text-cactus-charcoal/60`
- Title: charcoal bold; subtitle (R{x} of R{y}): charcoal/60
- Progress bar: sage fill on cactus-overlay track
- Action buttons: cactus charcoal/60 hover sage

**Completed Goals section:** `bg-white border border-cactus-overlay rounded-2xl` with trophy icon `text-cactus-sage`.

**`CreateGoalModal`:**
- Backdrop: `fixed inset-0 bg-cactus-charcoal/40 flex items-center justify-center z-50`
- Panel: `bg-white border border-cactus-overlay rounded-2xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-auto`
- Header: charcoal bold + close X button charcoal/40
- Type selector buttons: inactive `bg-white border border-cactus-overlay`; active matches type color from `GoalCard` mapping
- Inputs: standard cactus
- Submit: `<Btn />`

**`UpdateProgressModal`:**
- Same modal frame
- Quick-amount buttons: `bg-cactus-sage-light text-cactus-sage font-cactus font-semibold border border-cactus-overlay rounded-xl px-4 py-2 hover:bg-cactus-sage hover:text-white`
- Save: `<Btn />`

**Loading skeleton:** `bg-cactus-overlay`.

### Step 2: Run tests + lint + format

```bash
cd src/frontend && npm run test -- Goals && npm run lint && npm run format:check
```

### Step 3: Eradication grep

```bash
grep -nE 'font-mono-financial|var\(--cactus-(green|forest|mint)\)|var\(--surface\)|var\(--text-(primary|secondary|muted)\)|var\(--bucket-|var\(--card\)|bg-amber-|bg-blue-(50|100|500|600|700|800)|bg-purple-(50|100|500|600|700|800)|bg-green-(50|100|500|600|700|800)|bg-orange-' \
  src/frontend/src/pages/Goals.tsx
```

Expected: empty.

### Step 4: Commit

```bash
git add src/frontend/src/pages/Goals.tsx
git commit -m "feat(goals): rebrand Goals page + modals to cactus brand (sage-light primary focus, bucket-mapped goal types)"
```

---

## Task 6: Transactions page (BIG)

**Files:**
- Modify: `src/frontend/src/pages/Transactions.tsx`

### Step 1: Paint pass

1,447 LOC with 4 sub-modals (`ClassifyModal`, `AddTransactionModal`, `BulkClassifyModal`, `RecurringPatternsPanel`). `Transactions.test.tsx` exists — must continue to pass.

**Strategy:** because the file is huge, paint section-by-section with focused Edit calls. Don't attempt a single Write rewrite — too error-prone.

**Page wrapper:** `bg-cactus-sandstone font-cactus`.

**Header + action button row:**
- Action buttons: primary (Add Transaction, Import) use `<Btn />`; secondary (Recurring, Filters, Bulk Classify) use `bg-white border border-cactus-overlay text-cactus-charcoal hover:bg-cactus-sage-light/40 px-4 py-2 rounded-xl font-cactus font-semibold`

**Filter pills row:**
- Active filter pill: `bg-cactus-sage-light text-cactus-charcoal border border-cactus-sage font-cactus font-semibold`
- Inactive pill: `bg-white text-cactus-charcoal/60 border border-cactus-overlay font-cactus`

**Transaction list row:**
- Container: `bg-white border border-cactus-overlay rounded-xl hover:bg-cactus-sage-light/30`
- Merchant: charcoal semibold
- Category badge using **macro-category** mapping:
  - Needs: `bg-cactus-needs-bg text-cactus-charcoal`
  - Wants: `bg-cactus-wants-bg text-cactus-charcoal`
  - Goals: `bg-cactus-goals-bg text-cactus-charcoal`
  - Unclassified: `bg-cactus-overlay text-cactus-charcoal/60`
- Amount on debit: `text-cactus-prickly font-cactus font-bold tabular-nums`
- Amount on credit: `text-cactus-sage font-cactus font-bold tabular-nums`
- Unclassified left border indicator: `border-l-2 border-cactus-prickly`

**Pagination:** cactus charcoal page number, sage active highlight.

**`ClassifyModal`:**
- Backdrop + panel: same modal frame as Task 5
- Step indicator: cactus
- Macro-category buttons: bucket mapping (needs-bg/wants-bg/goals-bg)
- Category grid: white card per category with cactus-overlay border; selected = `border-cactus-sage bg-cactus-sage-light`
- Similar-count chip: `bg-cactus-sage-light text-cactus-sage border border-cactus-overlay`
- Save: `<Btn />`

**`AddTransactionModal`:**
- Modal frame
- Inputs: standard cactus
- Account / Category dropdowns: cactus input style; native `<select>` with cactus border
- Submit: `<Btn />`

**`BulkClassifyModal`:**
- Modal frame
- Same category selection treatment as `ClassifyModal`
- Submit: `<Btn />`

**`RecurringPatternsPanel`:**
- Panel: `bg-white border border-cactus-overlay rounded-2xl`
- Row treatment: same as transaction list row
- Status badges: sage (active) / charcoal/40 (paused)

**Empty state:** sandstone with charcoal text + cactus icons.

**Loading skeleton:** `bg-cactus-overlay`.

### Step 2: Run full test suite

```bash
cd src/frontend && npm run test && npm run lint && npm run format:check && npm run build
```

If `Transactions.test.tsx` fails, read the failures: if a test asserted on copy that you changed, restore the copy. If it asserted on a class that disappeared, surface the failure — don't tweak the test to mask.

### Step 3: Eradication grep

```bash
grep -nE 'font-mono-financial|var\(--cactus-(green|forest|mint)\)|var\(--surface\)|var\(--text-(primary|secondary|muted)\)|var\(--bucket-|var\(--card\)|bg-amber-|bg-blue-(50|100|500|600|700|800)|bg-purple-(50|100|500|600|700|800)|bg-green-(50|100|500|600|700|800)' \
  src/frontend/src/pages/Transactions.tsx
```

Expected: empty.

### Step 4: Commit

```bash
git add src/frontend/src/pages/Transactions.tsx
git commit -m "feat(transactions): rebrand Transactions page + 4 modals to cactus brand (bucket-mapped badges, sage/prickly amounts)"
```

---

## Task 7: Final gates + PR

> Worktree: `axis-o/pr-8-shell-pages-rebrand`. Branch on origin: `axis-o/pr-8-shell-pages-rebrand` (refspec push).

### Step 1: Final gates

```bash
cd /Users/henricktissink/Sauce/cactus/.claude/worktrees/axis-o+pr-8-shell-pages-rebrand/src/frontend
npm run test && npm run lint && npm run format:check && npm run build
```

### Step 2: Run the global eradication grep

```bash
cd /Users/henricktissink/Sauce/cactus/.claude/worktrees/axis-o+pr-8-shell-pages-rebrand
grep -rnE 'font-mono-financial|cactusIcon|var\(--cactus-(green|forest|mint)\)|var\(--surface\)|var\(--text-(primary|secondary|muted)\)|var\(--bucket-|var\(--card\)' \
  src/frontend/src/pages/ src/frontend/src/components/ \
  | grep -v 'AuthBrandPanel.tsx' \
  | grep -v 'CactusLogo.tsx'
```

Expected: empty (the only places forest/mint legitimately survive are `AuthBrandPanel.tsx` and `CactusLogo.tsx`).

### Step 3: Push

```bash
git push origin worktree-axis-o+pr-8-shell-pages-rebrand:refs/heads/axis-o/pr-8-shell-pages-rebrand
```

### Step 4: Try `gh pr create`; on failure surface URL + body

```bash
gh pr create --title "Axis O PR 8: shell pages brand rollout + auth-page logo consolidation" --body "$(cat <<'EOF'
## Summary
Finishes the Axis O brand rollout.

**Painted (post-auth shell pages):**
- `Transactions` + 4 sub-modals (ClassifyModal, AddTransactionModal, BulkClassifyModal, RecurringPatternsPanel)
- `SpendingPlan` (`/budget`) — sliders use sage/desert/prickly accents; suggestion + tips cards reframed in sage-light
- `Goals` + `GoalCard` + 2 modals — Primary Focus card swaps amber → sage-light; goal-type icon backgrounds bucket-mapped
- `Insights` — Recharts colors pulled into a `BRAND_CHART_COLORS` constant; category-average groups bucket-themed
- `Settings` — sage-light verified banner / goals-bg unverified banner; `<Btn />` everywhere
- `ImportTransactions` — sage step indicator, sage dropzone hover, sage success state

**Auth-page consolidation:**
- New `<AuthBrandPanel />` at `components/auth/` extracts the verbatim-duplicated brand panel from Login / ForgotPassword / ResetPassword
- `<CactusLogo />` gains a `tone?: 'light' | 'dark'` prop (dark = mint wordmark for the forest brand panel)
- Inline `cactusIcon` SVG functions deleted from the 3 auth pages

**New tests:**
- `Settings.test.tsx` (3 tests covering verified/unverified states + profile-save mutation)
- `ImportTransactions.test.tsx` (3 tests covering step-1 dropzone + accounts seed)
- `CactusLogo.test.tsx` adds dark-tone variant assertion

## Out of scope (deferred)
- `WelcomePage` / `RegisterPage` / `VerifyEmailPage` — legacy styling, separate small follow-up PR
- Removing legacy CSS vars from `:root` of `index.css` — once the 3 deferred pages are audited, a cleanup PR can drop `--cactus-green` / `--cactus-forest` / `--cactus-mint` (kept around for `<CactusLogo tone="dark">`) / `--surface` / `--text-*` / `--bucket-*` / `--card`
- Removing the `font-mono-financial` CSS class definition from `index.css`
- Test backfill for SpendingPlan / Insights / Goals / Transactions (existing `Transactions.test.tsx` + `Goals.test.tsx` still pass; no new tests added for the larger pages — separate effort)

## Visual changes to flag
- Bucket color mapping is now canonical app-wide: Needs = sage, Wants = desert, Goals = prickly. Replaces the pre-rebrand blue/purple/teal/amber zoo.
- Primary Focus / Recommended Sequence cards on Goals were amber gradient — now sage-light. Consistent with Dashboard's Primary Goal card from O-7.
- `<CactusLogo tone="dark">` is the only place still consuming `--cactus-mint`. That CSS var will be removed in a follow-up audit PR.

## Test plan
- [x] Frontend full suite passes (Layout + Dashboard from O-7 + Settings/Import smoke tests new + existing Login/Goals/Transactions still green)
- [x] Lint / format / build clean
- [x] Eradication grep across `pages/` + `components/` confirms only `AuthBrandPanel.tsx` + `CactusLogo.tsx` retain forest/mint legacy refs

## Spec / plan
- [Umbrella](docs/superpowers/specs/2026-05-07-axis-o-onboarding-design.md)
- [PR-8 design](docs/superpowers/specs/2026-05-12-axis-o-pr-8-shell-pages-rebrand-design.md)
- [PR-8 plan](docs/superpowers/plans/2026-05-12-axis-o-pr-8-shell-pages-rebrand.md)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

If `gh` not authed, surface URL + body for manual.

### Step 5: Hand off to user for merge.

---

## Self-Review

**Spec coverage:** AC #1-#10 mapped to T1-T6, with T7 enforcing the global eradication grep (AC #9 + #10).

**Risks:**
- T6 (Transactions, 1,447 LOC) is the largest paint pass. Risk: a subagent might miss a section. Mitigation: spec gives section-by-section replacements; if `Transactions.test.tsx` breaks, that flags it.
- Insights uses Recharts which can't read CSS vars. The `BRAND_CHART_COLORS` constant is a brand-token mirror; document the trade-off in code.
- `<AuthBrandPanel />` retains `bg-[var(--cactus-forest)]` — that's intentional, not a regression. Same for `<CactusLogo tone="dark">` retaining `text-cactus-mint`. The global grep in T7 explicitly skips these two files.

**No backend touches. No migrations. No API changes.** Purely visual + one new shared component + 2 new test files.
