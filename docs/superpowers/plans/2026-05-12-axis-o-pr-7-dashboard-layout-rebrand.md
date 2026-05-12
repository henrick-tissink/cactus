# Axis O — PR 7: Dashboard + Layout Brand Rollout — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Parent specs:**
- Umbrella: [2026-05-07-axis-o-onboarding-design.md](../specs/2026-05-07-axis-o-onboarding-design.md)
- PR-7 design: [2026-05-12-axis-o-pr-7-dashboard-layout-rebrand-design.md](../specs/2026-05-12-axis-o-pr-7-dashboard-layout-rebrand-design.md)

**Goal:** Paint pass on `Layout.tsx` + `Dashboard.tsx` to land the cactus brand (sandstone/sage/desert/prickly/charcoal + Quicksand) on the post-auth shell. Add `Layout.test.tsx` smoke tests. No new content, no new CSS tokens, no backend.

**Tech Stack:** React 19, TanStack Query, react-router-dom 7, Tailwind v4, Vitest+RTL, MSW. No backend touches.

---

## File Structure

**Created:**
- `src/frontend/src/components/layout/Layout.test.tsx`

**Modified:**
- `src/frontend/src/components/layout/Layout.tsx`
- `src/frontend/src/pages/Dashboard.tsx`

**Verifications:**
- `grep` confirms zero legacy `--cactus-green` / `--cactus-forest` / `--cactus-mint` / `--surface` / `--text-primary|secondary|muted` references survive in the two rewritten files.

---

## Task 1: Layout rebrand + smoke tests (TDD)

**Files:**
- Create: `src/frontend/src/components/layout/Layout.test.tsx`
- Modify: `src/frontend/src/components/layout/Layout.tsx`

### Step 1: Write the failing smoke tests

Create `Layout.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '../../test/render';
import { useAuthStore } from '../../store/authStore';
import { Layout } from './Layout';

function HomeStub() {
  return <div data-testid="home-stub">home</div>;
}

function seedAuthedUser() {
  useAuthStore.setState({
    user: {
      userId: 'u1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      isOnboardingComplete: true,
      isEmailVerified: true,
    },
    isAuthenticated: true,
    isLoading: false,
  });
}

describe('Layout', () => {
  beforeEach(() => {
    seedAuthedUser();
  });

  it('renders the cactus brand logo (canonical component) in the sidebar', () => {
    renderWithProviders(
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomeStub />} />
        </Route>
      </Routes>
    );
    // The canonical CactusLogo renders both an SVG and the "cactus" wordmark.
    // Assert by text since the SVG itself has no accessible name.
    expect(screen.getAllByText(/cactus/i).length).toBeGreaterThan(0);
  });

  it('lists the five post-auth nav items', () => {
    renderWithProviders(
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomeStub />} />
        </Route>
      </Routes>
    );
    // Desktop sidebar + mobile bottom nav both list the same items; getAllByRole
    // will pick up duplicates. Just check each label appears at least once.
    for (const label of ['Dashboard', 'Transactions', 'Budget', 'Goals', 'Insights']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it('highlights the active nav item based on the current route', () => {
    renderWithProviders(
      <Routes>
        <Route element={<Layout />}>
          <Route path="/transactions" element={<HomeStub />} />
        </Route>
      </Routes>,
      { initialRoute: '/transactions' }
    );
    // Active item should be inside an element marked aria-current="page".
    const active = screen.getAllByText('Transactions').find((el) =>
      el.closest('[aria-current="page"]')
    );
    expect(active).toBeTruthy();
  });

  it('opens and closes the mobile drawer when the hamburger is toggled', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomeStub />} />
        </Route>
      </Routes>
    );
    // Drawer starts hidden.
    expect(screen.queryByRole('dialog', { name: /menu/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /open menu/i }));
    expect(screen.getByRole('dialog', { name: /menu/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /close menu/i }));
    expect(screen.queryByRole('dialog', { name: /menu/i })).not.toBeInTheDocument();
  });
});
```

Run it to confirm failures:

```bash
cd src/frontend && npm run test -- Layout
```

Expected: at minimum, the mobile-drawer test fails (the existing Layout uses a different button accessibility pattern), and the active-state test fails (the existing Layout uses class-based highlight, not `aria-current`). Other tests may already pass — that's fine. The point is to lock in the contract the rewrite must satisfy.

### Step 2: Rewrite `Layout.tsx`

**High-level diff:**
- DELETE the inline `cactusIcon` function (lines ~25-39 in current file)
- DELETE the `DEBT_TYPES`-style local constants if any are unused after the rewrite
- DELETE every reference to `--cactus-green`, `--cactus-forest`, `--cactus-mint`, `--surface`, `--text-primary|secondary|muted`, `sidebar-nav-item`, `sidebar-nav-item-active`
- IMPORT `<CactusLogo />` from `'../brand/CactusLogo'`
- ADD `aria-current="page"` to active nav items
- ADD `role="dialog"` + `aria-label="menu"` to the mobile drawer (when open)
- ADD `aria-label="open menu"` / `aria-label="close menu"` to hamburger toggle

**Sidebar (desktop):**

```tsx
<aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 bg-cactus-sandstone border-r border-cactus-overlay font-cactus">
  <div className="h-16 flex items-center px-5 border-b border-cactus-overlay">
    <CactusLogo />
  </div>
  <nav className="flex-1 px-3 py-4 space-y-1">
    {navItems.map((item) => <NavItem key={item.path} item={item} active={isActive(item.path)} />)}
  </nav>
  <UserSection user={user} onLogout={logout} />
</aside>
```

**NavItem (single component, used in sidebar + drawer):**

```tsx
function NavItem({ item, active, onClick }: { item: NavItemDef; active: boolean; onClick?: () => void }) {
  const baseClasses =
    'flex items-center gap-3 px-4 py-2.5 rounded-xl font-cactus font-semibold text-sm transition-colors';
  const activeClasses =
    'bg-cactus-sage-light text-cactus-charcoal border-l-[3px] border-cactus-sage';
  const inactiveClasses =
    'text-cactus-charcoal/60 hover:bg-cactus-sage-light/40 hover:text-cactus-charcoal';
  return (
    <Link
      to={item.path}
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}
    >
      <item.icon className="w-5 h-5 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}
```

**Mobile header:**

```tsx
<header className="md:hidden fixed top-0 inset-x-0 h-14 bg-cactus-sandstone border-b border-cactus-overlay flex items-center justify-between px-4 z-40">
  <CactusLogo />
  <button
    type="button"
    aria-label={mobileNavOpen ? 'close menu' : 'open menu'}
    onClick={() => setMobileNavOpen((v) => !v)}
    className="p-2 text-cactus-charcoal"
  >
    {mobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
  </button>
</header>
```

**Mobile drawer** (only render when open; use `role="dialog"` and label):

```tsx
{mobileNavOpen && (
  <div
    role="dialog"
    aria-label="menu"
    aria-modal="true"
    className="md:hidden fixed inset-0 top-14 z-30 bg-cactus-sandstone animate-slide-in"
  >
    <nav className="px-4 py-4 space-y-1">
      {navItems.map((item) => (
        <NavItem key={item.path} item={item} active={isActive(item.path)} onClick={() => setMobileNavOpen(false)} />
      ))}
    </nav>
    <UserSection user={user} onLogout={logout} />
  </div>
)}
```

**Mobile bottom nav:** tab bar style, no active pill, just sage text color when active.

```tsx
<nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-cactus-sandstone border-t border-cactus-overlay flex items-center justify-around z-40">
  {navItems.map((item) => {
    const active = isActive(item.path);
    return (
      <Link
        key={item.path}
        to={item.path}
        aria-current={active ? 'page' : undefined}
        className={`flex flex-col items-center gap-0.5 px-3 py-2 ${active ? 'text-cactus-sage' : 'text-cactus-charcoal/50'}`}
      >
        <item.icon className="w-5 h-5" />
        <span className="text-[10px] font-cactus font-semibold">{item.label}</span>
      </Link>
    );
  })}
</nav>
```

**Main content wrapper:**

```tsx
<main className="md:pl-64 pt-14 md:pt-0 pb-16 md:pb-0 min-h-screen bg-cactus-sandstone font-cactus">
  <Outlet />
</main>
```

**UserSection** (bottom of sidebar + drawer):

```tsx
function UserSection({ user, onLogout }: { user: User | null; onLogout: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  if (!user) return null;
  const initial = user.firstName?.[0] ?? user.email[0];
  return (
    <div className="p-3 border-t border-cactus-overlay relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 w-full p-2 rounded-xl hover:bg-cactus-sage-light/40 transition-colors"
      >
        <div className="w-9 h-9 rounded-full bg-cactus-sage text-white font-cactus font-bold flex items-center justify-center text-sm">
          {initial.toUpperCase()}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="font-cactus font-semibold text-sm text-cactus-charcoal truncate">
            {user.firstName ?? user.email}
          </p>
          <p className="font-cactus text-xs text-cactus-charcoal/50 truncate">{user.email}</p>
        </div>
      </button>
      {open && (
        <div className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-cactus-overlay rounded-xl shadow-lg overflow-hidden">
          <button
            type="button"
            onClick={onLogout}
            className="w-full px-4 py-3 text-left font-cactus font-semibold text-sm text-cactus-charcoal hover:bg-cactus-sage-light/40"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
```

**Imports at top of Layout.tsx (final shape):**

```tsx
import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, PieChart, Target, TrendingUp, Menu, X } from 'lucide-react';
import { CactusLogo } from '../brand/CactusLogo';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../types';
```

**`navItems` const stays the same** (keep `path`/`label`/`icon` shape; only icons may swap if you prefer different `lucide-react` choices, but keep current ones unless they clash).

**`isActive` helper:**

```tsx
const location = useLocation();
const isActive = (path: string) => {
  if (path === '/') return location.pathname === '/';
  if (path === '/budget')
    return location.pathname === '/budget' || location.pathname === '/spending-plan';
  return location.pathname.startsWith(path);
};
```

### Step 3: Run tests, lint, format

```bash
cd src/frontend
npm run test -- Layout
npm run lint
npm run format:check
```

All clean. If `Dashboard.test.tsx` runs and fails (because Dashboard isn't rebranded yet — assertions could break), proceed to T2 anyway; T2 will fix Dashboard.

### Step 4: Commit

```bash
git add src/frontend/src/components/layout/Layout.tsx \
  src/frontend/src/components/layout/Layout.test.tsx
git commit -m "feat(layout): rebrand sidebar + mobile nav to cactus brand (sandstone/sage/charcoal); consolidate CactusLogo"
```

---

## Task 2: Dashboard rebrand

**Files:**
- Modify: `src/frontend/src/pages/Dashboard.tsx`
- Update if needed: `src/frontend/src/pages/Dashboard.test.tsx`

### Step 1: Read both files first

The current Dashboard is ~463 LOC across 7 visual sections (see spec D5-D11). The existing test (~42 LOC) covers loading, populated-summary, and onboarding-checklist empty state via copy assertions. The test does NOT assert colors or classes, so most of it should survive untouched.

Run baseline:

```bash
cd src/frontend && npm run test -- Dashboard
```

Note which tests pass.

### Step 2: Paint pass — Dashboard.tsx

Apply each design decision verbatim. Below is the full set of replacements; perform them in order and skim-verify each section after editing.

**Outer page container:**
- `bg-[var(--surface)]` → `bg-cactus-sandstone`
- Add `font-cactus` to the root wrapper

**Header (month title):**
- `text-[var(--text-primary)]` → `text-cactus-charcoal`
- Use `font-cactus font-bold`

**Unclassified banner:**
- bg: `bg-cactus-goals-bg` (replaces `bg-amber-100`)
- text: `text-cactus-charcoal` (replaces amber)
- icon color: `text-cactus-prickly`
- link to /transactions filter: `text-cactus-charcoal underline`

**Hero metric card:**
- bg: `bg-white` (kept) with `border border-cactus-overlay` (replaces shadow-sm)
- Big number: `text-cactus-charcoal font-cactus font-bold` (kept large size)
- "remaining of …" caption: `text-cactus-charcoal/40`
- progress track: `bg-cactus-overlay` (replaces `bg-[var(--cactus-mint)]`)
- progress fill: `bg-cactus-sage` (replaces `bg-[var(--cactus-green)]`)
- Strip any `font-mono-financial`; we lean on `font-cactus font-bold` plus `tabular-nums`

**Spending Plan bucket bar:**
- Section heading: `text-cactus-charcoal font-cactus font-bold`
- Bucket fills (hardcoded hex → tokens):
  - Needs: `bg-cactus-sage`
  - Wants: `bg-cactus-desert`
  - Goals: `bg-cactus-prickly`
- Legend chips:
  - Needs chip bg: `bg-cactus-needs-bg`, dot: `bg-cactus-sage`
  - Wants chip bg: `bg-cactus-wants-bg`, dot: `bg-cactus-desert`
  - Goals chip bg: `bg-cactus-goals-bg`, dot: `bg-cactus-prickly`
- Chip text: `text-cactus-charcoal`, amounts `text-cactus-charcoal/60`

**Primary Goal card:**
- bg: `bg-cactus-sage-light` (replaces `bg-gradient-to-br from-amber-50 to-amber-100`)
- "Primary" badge: `bg-cactus-sage text-white font-cactus font-bold text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full`
- Title (`goal.name`): `text-cactus-charcoal font-cactus font-bold text-base`
- Subtitle (`R{current} of R{target}`): `text-cactus-charcoal/60 font-cactus`
- Progress track: `bg-cactus-overlay`
- Progress fill: `bg-cactus-sage`
- "to go" amount: `text-cactus-sage font-cactus font-bold`

**Recent Transactions:**
- Section heading: `text-cactus-charcoal font-cactus font-bold`
- "Import" / "View all" links: `text-cactus-sage font-cactus font-semibold`
- Each row:
  - bg: `bg-white border border-cactus-overlay`
  - merchant: `text-cactus-charcoal font-cactus font-semibold`
  - category: `text-cactus-charcoal/50 font-cactus`
  - amount on credit (positive): `text-cactus-sage font-cactus font-bold`
  - amount on debit (negative): `text-cactus-prickly font-cactus font-bold`
  - TrendingUp icon: `text-cactus-sage`
  - TrendingDown icon: `text-cactus-prickly`
  - unclassified marker (currently amber left border): `border-l-2 border-cactus-prickly`

**Onboarding FTUX checklist (no-data state):**
- container: `bg-cactus-sandstone`
- Outer card: `bg-white border border-cactus-overlay rounded-2xl p-8`
- Header copy `Let's get your finances in order`: `text-cactus-charcoal font-cactus font-bold text-xl`
- Step indicator circles:
  - Active step (currently amber): `bg-cactus-sage text-white`
  - Completed: `bg-cactus-sage text-white` with check
  - Pending: `border-2 border-cactus-overlay text-cactus-charcoal/40`
- Step labels: `text-cactus-charcoal font-cactus font-semibold` (active), `text-cactus-charcoal/40` (pending)
- CTA button (e.g., "Import transactions"): use existing `<Btn />` from `components/brand/Btn` — `bg-cactus-sage`

**Eradication grep — run after editing:**

```bash
grep -nE 'cactus-green|cactus-forest|cactus-mint|var\(--surface\)|var\(--text-(primary|secondary|muted)\)|amber-|--bucket-' src/frontend/src/pages/Dashboard.tsx src/frontend/src/components/layout/Layout.tsx
```

Expected output: empty.

### Step 3: Update `Dashboard.test.tsx` only if it breaks

Run:

```bash
cd src/frontend && npm run test -- Dashboard
```

The test asserts on copy ("R38,000", "Spending Plan", "let's get your finances in order"). If a copy string changed during the rebrand (it shouldn't — we're only painting), update the assertion. Otherwise leave the test as-is. Add new assertions ONLY if a test gap is obvious; resist scope creep.

### Step 4: Run full gates

```bash
cd src/frontend
npm run test
npm run lint
npm run format:check
npm run build
```

All clean.

### Step 5: Commit

```bash
git add src/frontend/src/pages/Dashboard.tsx
# Only add Dashboard.test.tsx if you changed it:
# git add src/frontend/src/pages/Dashboard.test.tsx
git commit -m "feat(dashboard): rebrand all sections to cactus brand (sage/desert/prickly/charcoal); replace amber goal card with sage-light"
```

---

## Task 3: Open the PR

> **Pre-task setup:** branch `axis-o/pr-7-dashboard-layout-rebrand` (created via `EnterWorktree` named `axis-o/pr-7-dashboard-layout-rebrand`).

### Step 1: Final gates

```bash
cd /Users/henricktissink/Sauce/cactus/.claude/worktrees/axis-o+pr-7-dashboard-layout-rebrand/src/frontend
npm run test && npm run lint && npm run format:check && npm run build
```

### Step 2: Push (refspec rename — `gh` is not authed)

```bash
git push origin worktree-axis-o+pr-7-dashboard-layout-rebrand:refs/heads/axis-o/pr-7-dashboard-layout-rebrand
```

### Step 3: Try `gh pr create`; on failure, surface URL + body for manual

```bash
gh pr create --title "Axis O PR 7: Dashboard + Layout brand rollout (consolidate CactusLogo in shell)" --body "$(cat <<'EOF'
## Summary
- Post-auth shell now lands in the cactus brand: sandstone background, sage/desert/prickly accents, charcoal text, Quicksand `font-cactus` throughout
- `Layout.tsx` swaps its inline 64-viewBox `cactusIcon` for the canonical `<CactusLogo />` from `components/brand/`. Active nav becomes a `bg-cactus-sage-light` pill with a 3px sage left border on both desktop and mobile
- `Dashboard.tsx` rebrands all sections: hero progress sage, bucket bar uses Needs=sage / Wants=desert / Goals=prickly (matching the onboarding semantics), Primary Goal card swaps amber → sage-light, transactions use sage/prickly trend icons, FTUX checklist matches onboarding voice
- `Layout.test.tsx` introduced (the file had no tests) — covers logo, nav items, active state, mobile drawer
- Zero legacy `--cactus-green` / `--cactus-forest` / `--cactus-mint` / `--surface` / `--text-*` references survive in the rewritten files (auth pages and other shell routes still use them; cleanup follows in subsequent PRs)

## Out of scope (deferred)
- Auth pages (Login / Register / ForgotPassword / ResetPassword) — they share a distinct brand panel theme; logo consolidation handled in a follow-up
- Other shell routes (Transactions / Budget / Goals / Insights / Settings / Import) — PR O-8
- New Dashboard content (bank-connect CTA, goals carousel, etc.) — this is a paint pass

## Visual change to flag
- Sidebar switches from deep forest (`#0f2419`) to sandstone (`#f5f5f1`). Big shift; deliberate choice per spec D1. Trivial to swap if dogfooding feedback prefers a dark anchor.

## Test plan
- [x] Frontend: `Layout.test.tsx` 4 new tests + existing `Dashboard.test.tsx` still green; full suite passes
- [x] Lint / format / build clean
- [x] `grep` confirms eradication of legacy CSS-var references in the two rewritten files

## Spec / plan
- [Umbrella](docs/superpowers/specs/2026-05-07-axis-o-onboarding-design.md)
- [PR-7 design](docs/superpowers/specs/2026-05-12-axis-o-pr-7-dashboard-layout-rebrand-design.md)
- [PR-7 plan](docs/superpowers/plans/2026-05-12-axis-o-pr-7-dashboard-layout-rebrand.md)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

If `gh` reports "not authed", surface the GitHub URL (`https://github.com/henrick-tissink/cactus/pull/new/axis-o/pr-7-dashboard-layout-rebrand`) and the body above for manual creation.

### Step 4: Hand off to user for merge.

---

## Self-Review

**Spec coverage:** Acceptance criteria 1-13 map to Tasks 1-2; T3 is the PR mechanics. The grep-eradication check (AC #12) runs at the end of T2.

**Risks:**
- T2 is a large surface-area edit on a single 463-LOC file. If the implementer paint-passes a section incorrectly, the test won't catch it (tests assert copy, not colors). Mitigation: the spec gives section-by-section before/after replacements that an implementer can apply mechanically. A code-quality reviewer can do a final visual diff pass.
- The mobile drawer's `role="dialog"` + `aria-label="menu"` contract is new; the existing Layout uses a different pattern. Test 4 in T1 locks this in via TDD — so the new contract is enforced.
- `Dashboard.test.tsx` is light. If the rebrand inadvertently breaks an assertion that wasn't anticipated, fix the assertion (don't tweak the rebrand). The implementer should call this out in their report.

**No backend, no migrations, no API contract changes.** This is purely visual.
