# Axis O — PR 1: Brand Foundation Tokens

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Parent spec:** [2026-05-07-axis-o-onboarding-design.md](../specs/2026-05-07-axis-o-onboarding-design.md)

**Goal:** Land the Cactus prototype brand identity (Quicksand + sage/desert/prickly palette + canonical `<CactusLogo />`) into the codebase as Tailwind v4 `@theme` tokens, and apply them to the existing `Onboarding.tsx` as a smoke test — without touching the legacy palette that Layout/Login/Dashboard depend on.

**Architecture:** Tailwind v4 (already installed) reads design tokens from `@theme` blocks in CSS. We add a new `@theme` block in `index.css` defining `--color-cactus-*` tokens that match the prototype, plus `--font-cactus` (Quicksand) and `--animate-fade-up`. The existing `:root { --cactus-green: ... }` legacy tokens (no `--color-` prefix) are untouched and continue to back Layout/Login/Dashboard via `var()`. New canonical `<CactusLogo />` lives at `components/brand/CactusLogo.tsx`; the two legacy local copies in Layout.tsx and Login.tsx remain in place until O-7/O-8.

**Tech Stack:** Tailwind v4 (`@tailwindcss/vite` 4.2), Vite 7, React 19, Vitest 2.1 + Testing Library, Quicksand via Google Fonts `@import` (consistent with existing Inter pattern in `index.css`).

---

## File Structure

**Created:**
- `src/frontend/src/components/brand/CactusLogo.tsx` — canonical brand logo (prototype-style: green stem + arms, prickly red bud, desert yellow highlight, "cactus" wordmark in Quicksand)
- `src/frontend/src/components/brand/CactusLogo.test.tsx` — Vitest + RTL component tests

**Modified:**
- `src/frontend/src/index.css` — add Quicksand `@import`, `@theme` block with new `--color-cactus-*` tokens, `--font-cactus`, `--animate-fade-up`, and `@keyframes fadeUp`
- `src/frontend/src/pages/Onboarding.tsx` — swap green-Tailwind colors → `cactus-*` utilities; add Quicksand via `font-cactus`; render `<CactusLogo />` at the top of the page

**Untouched:**
- `tailwind.config.*` — does not exist in Tailwind v4; tokens live in CSS
- All legacy `--cactus-green`/`--cactus-forest`/`--cactus-mint` references in Login/Dashboard/Layout/ForgotPassword

---

### Task 1: Add Quicksand font + new Cactus brand tokens to `index.css`

**Files:**
- Modify: `src/frontend/src/index.css`

- [ ] **Step 1: Open `src/frontend/src/index.css` and add the Quicksand `@import` line**

Add immediately after the existing Google Fonts `@import` (line 2). The existing line stays untouched.

```css
@import 'tailwindcss';
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap');
```

- [ ] **Step 2: Add `@theme` block with the new tokens, immediately above the existing `:root` declaration**

Insert this block before the line `/* ── Design Tokens ── */` (currently line 4):

```css
/* ── Cactus brand tokens (prototype palette) — registered with Tailwind v4 ── */
@theme {
  --color-cactus-charcoal: #333333;
  --color-cactus-sage: #77dd77;
  --color-cactus-sage-light: #e8f8e8;
  --color-cactus-desert: #ffcc00;
  --color-cactus-prickly: #ff6f61;
  --color-cactus-sandstone: #f5f5f1;
  --color-cactus-needs-bg: #e6f9e6;
  --color-cactus-wants-bg: #fff5e0;
  --color-cactus-goals-bg: #ffe8e8;
  --color-cactus-overlay: rgba(51, 51, 51, 0.06);

  --font-cactus: 'Quicksand', system-ui, -apple-system, sans-serif;

  --animate-fade-up: fadeUp 0.45s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes fadeUp {
  0% {
    opacity: 0;
    transform: translateY(16px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- [ ] **Step 3: Verify the file still parses by starting the dev server**

Run: `cd src/frontend && npm run dev`

Expected: Vite starts cleanly, no CSS parse errors in terminal. Open `http://localhost:5173` in browser; existing pages should render with no visual change (legacy tokens untouched).

Stop the server with Ctrl+C after verifying.

- [ ] **Step 4: Commit**

```bash
cd /Users/henricktissink/Sauce/cactus
git add src/frontend/src/index.css
git commit -m "$(cat <<'EOF'
feat(brand): add Cactus prototype palette + Quicksand font as Tailwind v4 theme tokens

Adds new --color-cactus-* tokens (charcoal, sage, desert, prickly, sandstone, plus pastel bucket bgs) registered with Tailwind v4 @theme so they generate utilities like bg-cactus-sage / text-cactus-charcoal / font-cactus. Legacy --cactus-green etc. are unchanged and continue to back Layout/Login/Dashboard.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Write the failing test for `<CactusLogo />`

**Files:**
- Create: `src/frontend/src/components/brand/CactusLogo.test.tsx`

- [ ] **Step 1: Create the test file**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CactusLogo } from './CactusLogo';

describe('CactusLogo', () => {
  it('renders the cactus wordmark', () => {
    render(<CactusLogo />);
    expect(screen.getByText('cactus')).toBeInTheDocument();
  });

  it('marks the SVG mark as decorative for assistive tech', () => {
    const { container } = render(<CactusLogo />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('forwards an additional className onto the wrapper', () => {
    const { container } = render(<CactusLogo className="my-custom-class" />);
    expect(container.firstChild).toHaveClass('my-custom-class');
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `cd src/frontend && npm run test -- CactusLogo`

Expected: FAIL with module-resolution error like `Cannot find module './CactusLogo' from '.../CactusLogo.test.tsx'`. The component doesn't exist yet — that's intentional.

---

### Task 3: Implement `<CactusLogo />` to make the test pass

**Files:**
- Create: `src/frontend/src/components/brand/CactusLogo.tsx`

- [ ] **Step 1: Create the component file**

```tsx
interface CactusLogoProps {
  className?: string;
}

export function CactusLogo({ className = '' }: CactusLogoProps) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="11" y="4" width="6" height="20" rx="3" className="fill-cactus-sage" />
        <rect
          x="4"
          y="10"
          width="8"
          height="4"
          rx="2"
          transform="rotate(-15 8 12)"
          className="fill-cactus-sage"
        />
        <rect
          x="16"
          y="8"
          width="8"
          height="4"
          rx="2"
          transform="rotate(15 20 10)"
          className="fill-cactus-sage"
        />
        <circle cx="14" cy="3" r="2" className="fill-cactus-prickly" />
        <circle cx="15" cy="2.2" r="0.8" className="fill-cactus-desert" />
      </svg>
      <span className="font-cactus font-bold text-xl text-cactus-charcoal tracking-tight">
        cactus
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Run the tests and verify they pass**

Run: `cd src/frontend && npm run test -- CactusLogo`

Expected output: 3 tests pass.

```
✓ CactusLogo > renders the cactus wordmark
✓ CactusLogo > marks the SVG mark as decorative for assistive tech
✓ CactusLogo > forwards an additional className onto the wrapper
```

- [ ] **Step 3: Commit**

```bash
git add src/frontend/src/components/brand/CactusLogo.tsx src/frontend/src/components/brand/CactusLogo.test.tsx
git commit -m "$(cat <<'EOF'
feat(brand): add canonical CactusLogo component

Prototype-style logo (sage stem with two arms, prickly bud, desert highlight) with the 'cactus' wordmark in Quicksand. Three tests cover wordmark rendering, decorative aria-hidden on the SVG, and className forwarding.

Legacy local CactusLogo definitions in Layout.tsx and Login.tsx are left untouched; they get retired during the Axis O brand rollout (PRs O-7/O-8).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Apply Cactus tokens to `Onboarding.tsx` as a smoke test

**Files:**
- Modify: `src/frontend/src/pages/Onboarding.tsx`

- [ ] **Step 1: Add the import for the new logo**

At the top of `src/frontend/src/pages/Onboarding.tsx`, add the import after the existing imports (after the `apiClient` import on line 6):

```tsx
import { CactusLogo } from '../components/brand/CactusLogo';
```

- [ ] **Step 2: Replace the page background gradient**

Find this line (currently around line 245):

```tsx
<div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex flex-col">
```

Replace with:

```tsx
<div className="min-h-screen bg-cactus-sandstone font-cactus flex flex-col">
```

- [ ] **Step 3: Replace the progress-bar colors**

Find the progress-bar block (currently around lines 247–252):

```tsx
<div className="h-1 bg-green-200">
  <div
    className="h-full bg-green-600 transition-all duration-500"
    style={{ width: `${progress}%` }}
  />
</div>
```

Replace with:

```tsx
<div className="h-1 bg-cactus-overlay">
  <div
    className="h-full bg-cactus-sage transition-all duration-500"
    style={{ width: `${progress}%` }}
  />
</div>
```

- [ ] **Step 4: Add the `<CactusLogo />` to the header strip**

Find the header block (currently around lines 254–259):

```tsx
{/* Header */}
<div className="p-6">
  <p className="text-sm text-gray-500">
    Step {currentStep + 1} of {steps.length}
  </p>
</div>
```

Replace with:

```tsx
{/* Header */}
<div className="p-6 flex items-center justify-between">
  <CactusLogo />
  <p className="text-sm text-cactus-charcoal/60">
    Step {currentStep + 1} of {steps.length}
  </p>
</div>
```

- [ ] **Step 5: Replace the progress-prompt banner colors**

Find the prompt block (currently around lines 272–277):

```tsx
{showPrompt && (
  <div className="mb-6 p-4 bg-green-100 rounded-lg text-green-800 text-center">
    <Check className="w-5 h-5 inline-block mr-2" />
    {progressPrompts[promptIndex]}
  </div>
)}
```

Replace with:

```tsx
{showPrompt && (
  <div className="mb-6 p-4 bg-cactus-needs-bg rounded-lg text-cactus-charcoal text-center">
    <Check className="w-5 h-5 inline-block mr-2 text-cactus-sage" />
    {progressPrompts[promptIndex]}
  </div>
)}
```

- [ ] **Step 6: Replace the question heading color**

Find this line (currently around line 280):

```tsx
<h2 className="text-2xl font-bold text-gray-900 mb-2">{step.question}</h2>
```

Replace with:

```tsx
<h2 className="text-2xl font-bold text-cactus-charcoal mb-2">{step.question}</h2>
```

- [ ] **Step 7: Replace the option-button selected state**

Find the option button (currently around lines 287–298). Replace the `className` template literal with:

```tsx
className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
  responses[step.id] === option.value
    ? 'border-cactus-sage bg-cactus-sage-light'
    : 'border-gray-200 hover:border-cactus-sage/60 hover:bg-cactus-sandstone'
}`}
```

And replace the inner `<span className="font-medium text-gray-900">` with:

```tsx
<span className="font-medium text-cactus-charcoal">{option.label}</span>
```

- [ ] **Step 8: Replace the currency-input focus ring**

Find this input (currently around lines 310–316):

```tsx
<input
  type="number"
  value={monthlyIncome}
  onChange={(e) => setMonthlyIncome(e.target.value)}
  className="w-full pl-10 pr-4 py-4 text-2xl font-semibold border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-0"
  placeholder="30,000"
/>
```

Replace the `className` with:

```tsx
className="w-full pl-10 pr-4 py-4 text-2xl font-semibold border-2 border-gray-200 rounded-xl focus:border-cactus-sage focus:ring-0"
```

- [ ] **Step 9: Replace the slider accent and label colors**

Find the three slider blocks (currently around lines 322–381). For each, update the label colors and slider accent:

For the **Needs** slider, change `text-green-700` → `text-cactus-sage` (label and value), `bg-green-200` → `bg-cactus-overlay`, `accent-green-600` → `accent-cactus-sage`.

For the **Wants** slider, leave `text-amber-700` / `bg-amber-200` / `accent-amber-500` as-is — these map to `desert` later in O-3, but a swap here without the matching token feels like premature cleanup for this smoke test.

For the **Goals** slider, change `text-blue-700` → `text-cactus-prickly`, `bg-blue-200` → `bg-cactus-overlay`, `bg-blue-500` → `bg-cactus-prickly`.

Concretely:

```tsx
{/* Needs */}
<div>
  <div className="flex justify-between mb-2">
    <span className="font-medium text-cactus-sage">Needs</span>
    <span className="font-bold text-cactus-sage">{allocation.needs}%</span>
  </div>
  <input
    type="range"
    min="0"
    max="100"
    value={allocation.needs}
    onChange={(e) => {
      const needs = Number(e.target.value);
      const remaining = 100 - needs;
      const wantsRatio = allocation.wants / (allocation.wants + allocation.goals) || 0.5;
      setAllocation({
        needs,
        wants: Math.round(remaining * wantsRatio),
        goals: Math.round(remaining * (1 - wantsRatio)),
      });
    }}
    className="w-full h-2 bg-cactus-overlay rounded-lg appearance-none cursor-pointer accent-cactus-sage"
  />
</div>
```

```tsx
{/* Goals */}
<div>
  <div className="flex justify-between mb-2">
    <span className="font-medium text-cactus-prickly">Goals</span>
    <span className="font-bold text-cactus-prickly">{allocation.goals}%</span>
  </div>
  <div className="w-full h-2 bg-cactus-overlay rounded-lg">
    <div
      className="h-full bg-cactus-prickly rounded-lg"
      style={{ width: `${allocation.goals}%` }}
    />
  </div>
</div>
```

The Wants block stays in amber for this PR — it gets brought into the cactus palette during O-3 when the prototype's interactive slider replaces this entire screen.

- [ ] **Step 10: Replace the primary CTA button colors**

Find the Continue/Get Started button (currently around lines 526–537):

```tsx
className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
```

Replace with:

```tsx
className="flex items-center gap-2 px-6 py-3 bg-cactus-sage text-white font-bold rounded-xl hover:brightness-95 transition-all shadow-[0_4px_16px_rgba(119,221,119,0.25)] disabled:opacity-50 disabled:cursor-not-allowed"
```

- [ ] **Step 11: Run the full frontend test suite to confirm nothing regressed**

Run: `cd src/frontend && npm run test`

Expected: All existing tests still pass (Login, Dashboard, Transactions, Goals, plus the new CactusLogo tests). No Onboarding-specific tests exist, so no surprises there.

- [ ] **Step 12: Run the dev server and visually verify the smoke test**

Run: `cd src/frontend && npm run dev`

Open `http://localhost:5173/onboarding` in a browser. Expected:

- Sandstone background (warm off-white, not green gradient)
- `<CactusLogo />` visible at top-left of header strip
- Quicksand font on all text (notably rounder than Inter)
- Sage progress bar
- Sage focus ring on the question buttons when hovered
- Sage CTA button on `Continue`

If any of these are wrong, the most likely cause is a missed Tailwind class — re-check Steps 2–10. Note: API calls will fail with 401 unless authenticated; that's expected and not the smoke test's concern.

Stop the dev server with Ctrl+C.

- [ ] **Step 13: Run lint + format checks**

```bash
cd src/frontend
npm run lint
npm run format:check
```

Both should pass. If `format:check` fails, run `npm run format` and re-stage.

- [ ] **Step 14: Commit**

```bash
git add src/frontend/src/pages/Onboarding.tsx
git commit -m "$(cat <<'EOF'
feat(onboarding): apply Cactus brand tokens to existing onboarding flow as smoke test

Swaps green-Tailwind colors for cactus-* utilities (sage, prickly, sandstone, charcoal). Adds Quicksand via font-cactus. Renders the canonical <CactusLogo /> in the header. Wants slider stays in amber for now — gets replaced wholesale by the Phase 2 interactive slider in PR O-3.

Smoke test for the Axis O brand foundation: confirms tokens generate the expected Tailwind utilities and the page renders end-to-end without disturbing legacy palette consumers.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Open the PR

> **Pre-task setup (handled by executing-plans / using-git-worktrees, not by this plan):** the executor should be on a fresh branch named `axis-o/pr-1-brand-foundation` (matching the existing `axis a/pr N name` convention) created from current `main`. Tasks 1–4's commits should already sit on this branch by the time we reach Task 5.

- [ ] **Step 1: Push the branch and open a PR via gh**

```bash
git push -u origin axis-o/pr-1-brand-foundation
gh pr create --title "Axis O PR 1: brand foundation tokens" --body "$(cat <<'EOF'
## Summary
- Adds Cactus prototype palette (sage / desert / prickly / sandstone / charcoal) as Tailwind v4 @theme tokens
- Adds Quicksand font via Google Fonts @import (consistent with existing Inter/JetBrains Mono pattern)
- Adds canonical `<CactusLogo />` component at `components/brand/CactusLogo.tsx`
- Applies the new tokens to the existing Onboarding.tsx as a smoke test

## Out of scope (deferred to later Axis O PRs)
- Restructure of Onboarding.tsx into a multi-screen wizard (PRs O-2..O-6)
- Brand rollout to Layout / Dashboard / Login / Transactions etc. (PRs O-7..O-8)
- Retirement of legacy local CactusLogo definitions in Layout.tsx and Login.tsx (PRs O-7..O-8)

## Test plan
- [x] `npm run test -- CactusLogo` passes (3 new tests)
- [x] `npm run test` — full suite green
- [x] `npm run lint`, `npm run format:check` — green
- [x] Manual: `/onboarding` renders with sandstone bg, Quicksand font, sage CTA, cactus logo at top
- [x] Manual: `/`, `/login`, `/transactions` — visually unchanged (legacy palette intact)

## Spec
[Axis O umbrella](docs/superpowers/specs/2026-05-07-axis-o-onboarding-design.md)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 2: Verify CI passes**

Watch CI on the PR (`gh pr checks --watch` or via the GitHub UI). Backend test, Frontend test, Backend Docker build, Frontend Docker build must all be green before merging.

- [ ] **Step 3: Merge the PR via the GitHub web UI**

The user merges PRs (per agent-shell convention — `gh` is not authenticated in agent shells). Notify them when CI is green.

---

## Self-Review

**Spec coverage:** PR O-1's spec scope is "Brand foundation tokens — Quicksand load, design tokens as Tailwind theme + CSS vars, reusable `<CactusLogo/>`, apply to existing Onboarding.tsx as smoke test". Tasks 1–4 cover all four deliverables. ✓

**Placeholder scan:** No `TBD`, `TODO`, `add appropriate error handling`, or "similar to Task N" patterns found.

**Type consistency:** `CactusLogo` props (`{ className?: string }`) are consistent across the test file and component file. The CSS variable naming (`--color-cactus-*`) is consistent across `index.css` and the Tailwind utilities used in CactusLogo.tsx and Onboarding.tsx (`bg-cactus-sage`, `text-cactus-charcoal`, `font-cactus`).

**Risks / followups for next PR (O-2):**
- The `Wants` slider intentionally stays amber-colored. O-3 replaces this entire screen with the prototype's interactive slider, so colour-aligning it now would be churn.
- Vitest currently doesn't process CSS (`css: false` in `vitest.config.ts`), so component tests won't catch a typo'd Tailwind class. Visual verification in the browser at Step 12 is the actual gate.
- The Onboarding smoke test mixes new Cactus utilities with legacy `text-gray-200` / `border-gray-200` etc. that haven't been ported. This is intentional — full restyling lives in O-2/O-3 where the wizard is restructured.
- Coverage gate (Codecov auto + 1%): the new `components/brand/` folder is outside the `src/pages/`/`src/api/`/`src/store/` coverage scope (per `vitest.config.ts`), so adding it doesn't drag coverage. If we later want it covered, extend the `coverage.include` glob.
