# Axis H PR-1: Foundation tokens + /styleguide route — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the new `brand-*` design tokens (cream/sage/terracotta palette, Fraunces+Inter type, radius scale) into the Tailwind 4 `@theme` block; self-host the fonts; create a dev-only `/styleguide` route that renders every token + every primitive variant so we have one place to verify the brand decisions before any page work. No existing components are touched. The app must look identical to today after this PR ships (additive only).

**Architecture:** Tailwind 4 uses a CSS-first config — new tokens land in `src/frontend/src/index.css` inside the existing `@theme {}` block under new names (`--color-brand-*`, `--font-display`, `--radius-*`). Existing `cactus-*` tokens stay in place. Two new fonts (Fraunces + Inter) are self-hosted via `@fontsource-variable` packages, replacing the current Google Fonts CDN imports for the same fonts. The new `/styleguide` page is mounted only when `import.meta.env.DEV` is true so it doesn't ship to production.

**Tech Stack:** Tailwind CSS 4 (`@tailwindcss/vite`), React 19, React Router 7, Vite, Vitest, `@fontsource-variable/fraunces`, `@fontsource-variable/inter`.

---

## File Structure

**Modify:**
- `src/frontend/package.json` — add font packages
- `src/frontend/src/index.css` — add `brand-*` tokens to existing `@theme` block; switch fonts from Google Fonts CDN to self-hosted
- `src/frontend/src/App.tsx` — conditionally register `/styleguide` route in dev

**Create:**
- `src/frontend/src/pages/StyleGuide.tsx` — single page rendering every token + every primitive variant
- `src/frontend/src/pages/StyleGuide.test.tsx` — smoke test
- `docs/superpowers/specs/2026-05-13-axis-h-ui-rebrand-design.md` — already committed in `da4fd7e`, no work here
- (Update) `docs/superpowers/specs/2026-05-03-100x-roadmap.md` — add Axis H entry per spec

**Branch:** `axis-h/pr-1-tokens-styleguide`

---

## Pre-flight

- [ ] **Step 0: Branch from main**

```bash
cd /Users/henricktissink/Sauce/cactus
git checkout main
git pull --ff-only
git checkout -b axis-h/pr-1-tokens-styleguide
```

Confirm branch with `git branch --show-current` — expect `axis-h/pr-1-tokens-styleguide`.

---

## Task 1: Install self-hosted font packages

**Files:**
- Modify: `src/frontend/package.json`

- [ ] **Step 1: Install packages**

```bash
cd src/frontend
npm install --save-exact @fontsource-variable/fraunces@5.2.5 @fontsource-variable/inter@5.2.5
```

Versions are pinned to `5.2.5` (current latest in the `@fontsource-variable/*` namespace as of 2026-05-13). If a newer version exists at execution time, use that — pin whatever lands.

- [ ] **Step 2: Verify the packages installed**

Run: `npm ls @fontsource-variable/fraunces @fontsource-variable/inter`
Expected: both listed at the installed version with no peer-dep warnings related to them.

- [ ] **Step 3: Commit**

```bash
cd /Users/henricktissink/Sauce/cactus
git add src/frontend/package.json src/frontend/package-lock.json
git commit -m "feat(axis-h-pr-1): install self-hosted fraunces + inter via @fontsource-variable"
```

---

## Task 2: Switch index.css fonts from CDN to self-hosted; add brand tokens

**Files:**
- Modify: `src/frontend/src/index.css`

This task does TWO related things in one commit:
- Replace the Google Fonts `@import` lines with `@fontsource-variable` imports so fonts ship in the bundle.
- Add the new `--color-brand-*`, `--font-display`, `--radius-*` tokens to the existing `@theme {}` block. **Additive only** — existing `cactus-*` tokens are not changed or removed.

- [ ] **Step 1: Read the current index.css to confirm structure before editing**

Run: `head -30 src/frontend/src/index.css`
Expected: the first three lines are `@import 'tailwindcss';` followed by two `@import url('https://fonts.googleapis.com/...');` lines.

- [ ] **Step 2: Replace the top of `src/frontend/src/index.css`**

Old (lines 1-3):
```css
@import 'tailwindcss';
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600;700&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap');
```

New:
```css
@import 'tailwindcss';

/* Self-hosted fonts (Axis H PR-1, 2026-05-13). JetBrains Mono kept on CDN until a future PR replaces it. Quicksand removed — no longer used by the brand. */
@import '@fontsource-variable/fraunces/wght.css';
@import '@fontsource-variable/fraunces/wght-italic.css';
@import '@fontsource-variable/inter/wght.css';
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;600;700&display=swap');
```

Note: `@fontsource-variable/fraunces/wght.css` ships the upright variable font; `wght-italic.css` ships the italic axis (used by Option B sample but kept available for future). `@fontsource-variable/inter/wght.css` ships Inter Variable.

- [ ] **Step 3: Add `brand-*` tokens to the existing `@theme {}` block**

In `src/frontend/src/index.css`, find the existing `@theme {` block (currently around line 6). Add the following lines INSIDE the `@theme {}` block, immediately after the existing `--color-cactus-overlay: rgba(51, 51, 51, 0.06);` line (do not modify or remove any existing tokens):

```css
  /* ── Axis H brand tokens (2026-05-13) — coexist with cactus-* until PR-8 cleanup ── */
  --color-brand-cream: #faf5ec;
  --color-brand-surface: #ffffff;
  --color-brand-border: #ebe5d5;
  --color-brand-sage: #1f6f4a;
  --color-brand-sage-soft: rgb(31 111 74 / 0.12);
  --color-brand-terracotta: #c9743a;
  --color-brand-terracotta-soft: #fdf0e6;
  --color-brand-accent-ink: #8c4a1e;
  --color-brand-text: #2d2418;
  --color-brand-text-muted: #6b5e4a;
  --color-brand-text-faint: #a59982;
  --color-brand-danger: #b54838;
  --color-brand-info: #4a6b8a;

  --font-display: 'Fraunces Variable', 'Fraunces', 'Iowan Old Style', Cambria, Georgia, serif;
  --font-sans-brand: 'Inter Variable', 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;

  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;
  --radius-pill: 9999px;
```

Use `--font-sans-brand` (not `--font-sans`) because Tailwind 4 already registers `--font-sans` from Preflight; we don't want to override the global default until PR-2 begins migrating components.

- [ ] **Step 4: Add a tabular-lining-figures helper class**

In `src/frontend/src/index.css`, find the existing `.tabular-nums` rule (currently around line 100). Add a new class immediately after it:

```css
.tabular-lining {
  font-variant-numeric: tabular-nums lining-nums;
  font-feature-settings: 'lnum' 1, 'tnum' 1;
}
```

This will be the standard class for currency display in the new brand system (Fraunces has Old Style figures by default; financial UIs need Lining + Tabular).

- [ ] **Step 5: Build to verify no CSS parsing regressions**

Run: `cd src/frontend && npm run build`
Expected: TypeScript compile + Vite build both succeed. No CSS warnings about unknown `@import` or `@theme` syntax. Build output `dist/` exists.

- [ ] **Step 6: Visually verify existing UI is unchanged**

Run: `cd src/frontend && npm run dev`
Open `http://localhost:5173/login` in a browser.
Expected: Login page renders exactly as before (still using `cactus-*` tokens + Inter + Quicksand fallback). New tokens are present in CSS but no class names use them yet, so visually nothing changes.

Kill the dev server (Ctrl+C) before continuing.

- [ ] **Step 7: Commit**

```bash
cd /Users/henricktissink/Sauce/cactus
git add src/frontend/src/index.css
git commit -m "feat(axis-h-pr-1): add brand-* tokens; self-host fraunces+inter via @fontsource"
```

---

## Task 3: Create StyleGuide page

**Files:**
- Create: `src/frontend/src/pages/StyleGuide.tsx`

This is a single-component page that renders every brand token + every typographic style. It's the living style guide we eyeball before/after every subsequent PR. No interactivity beyond visual scroll.

- [ ] **Step 1: Create the file**

Write `src/frontend/src/pages/StyleGuide.tsx`:

```tsx
/**
 * Style Guide — dev-only route at /styleguide
 * Renders every brand token + every typographic + every radius variant.
 * Added in Axis H PR-1 (2026-05-13). Expanded in subsequent PRs as primitives land.
 */

const swatches = [
  { name: 'brand-cream', hex: '#faf5ec', use: 'app background' },
  { name: 'brand-surface', hex: '#ffffff', use: 'card / elevated panel' },
  { name: 'brand-border', hex: '#ebe5d5', use: '1px hairline between surfaces' },
  { name: 'brand-sage', hex: '#1f6f4a', use: 'primary; links; positive numbers' },
  { name: 'brand-terracotta', hex: '#c9743a', use: 'accent (decorative)' },
  { name: 'brand-terracotta-soft', hex: '#fdf0e6', use: 'alert bg' },
  { name: 'brand-accent-ink', hex: '#8c4a1e', use: 'text on terracotta-soft' },
  { name: 'brand-text', hex: '#2d2418', use: 'primary text' },
  { name: 'brand-text-muted', hex: '#6b5e4a', use: 'secondary text' },
  { name: 'brand-text-faint', hex: '#a59982', use: 'disabled / decorative only' },
  { name: 'brand-danger', hex: '#b54838', use: 'error states' },
  { name: 'brand-info', hex: '#4a6b8a', use: 'informational chips' },
] as const;

const radii = [
  { name: 'radius-sm', value: '6px' },
  { name: 'radius-md', value: '10px' },
  { name: 'radius-lg', value: '12px' },
  { name: 'radius-xl', value: '16px' },
  { name: 'radius-2xl', value: '20px' },
  { name: 'radius-pill', value: '9999px' },
] as const;

export function StyleGuidePage() {
  return (
    <div style={{ background: 'var(--color-brand-cream)', minHeight: '100vh', padding: '48px 32px', fontFamily: 'var(--font-sans-brand)', color: 'var(--color-brand-text)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        <header style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--color-brand-text-muted)', fontWeight: 600 }}>Cactus · Axis H · style guide</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 56, lineHeight: 1.05, letterSpacing: '-0.025em', margin: '8px 0 0', fontVariationSettings: '"opsz" 144, "SOFT" 100' }}>
            Brand tokens &amp; primitives
          </h1>
          <p style={{ marginTop: 8, color: 'var(--color-brand-text-muted)', fontSize: 15 }}>
            Living reference. Updated as each Axis H PR lands.
          </p>
        </header>

        {/* ── Colour ─────────────────────────────── */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 28, letterSpacing: '-0.02em', margin: '0 0 16px', fontVariationSettings: '"opsz" 60, "SOFT" 50' }}>Colour</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {swatches.map((s) => (
              <div key={s.name} style={{ background: 'var(--color-brand-surface)', border: '1px solid var(--color-brand-border)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
                <div style={{ width: '100%', height: 64, borderRadius: 'var(--radius-md)', background: s.hex, border: s.name === 'brand-surface' || s.name === 'brand-cream' ? '1px solid var(--color-brand-border)' : 'none' }} />
                <div style={{ marginTop: 10, fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--color-brand-text-muted)', fontFamily: 'ui-monospace, monospace' }}>{s.hex}</div>
                <div style={{ fontSize: 12, color: 'var(--color-brand-text-muted)', marginTop: 4 }}>{s.use}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Typography ─────────────────────────── */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 28, letterSpacing: '-0.02em', margin: '0 0 16px', fontVariationSettings: '"opsz" 60, "SOFT" 50' }}>Typography</h2>

          <div style={{ background: 'var(--color-brand-surface)', border: '1px solid var(--color-brand-border)', borderRadius: 'var(--radius-xl)', padding: 28, marginBottom: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-brand-text-muted)', fontWeight: 600, marginBottom: 8 }}>Display · Fraunces · 400 · opsz 144 · SOFT 100</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 64, lineHeight: 1, letterSpacing: '-0.03em', fontVariationSettings: '"opsz" 144, "SOFT" 100', color: 'var(--color-brand-sage)' }}>cactus</div>
          </div>

          <div style={{ background: 'var(--color-brand-surface)', border: '1px solid var(--color-brand-border)', borderRadius: 'var(--radius-xl)', padding: 28, marginBottom: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-brand-text-muted)', fontWeight: 600, marginBottom: 8 }}>Heading · Fraunces · 500 · opsz 60 · SOFT 50</div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 32, lineHeight: 1.15, letterSpacing: '-0.02em', fontVariationSettings: '"opsz" 60, "SOFT" 50' }}>
              Where did your money go in March?
            </div>
          </div>

          <div style={{ background: 'var(--color-brand-surface)', border: '1px solid var(--color-brand-border)', borderRadius: 'var(--radius-xl)', padding: 28, marginBottom: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-brand-text-muted)', fontWeight: 600, marginBottom: 8 }}>Body · Inter · 400/500/600/700</div>
            <p style={{ fontSize: 16, lineHeight: 1.55, margin: 0 }}>
              You spent <strong style={{ fontWeight: 600 }}>R&nbsp;8,437</strong> on dining last month — 38% more than your three-month average.
              Spotify, Uber Eats, and Mr Price account for most of the variance.
            </p>
          </div>

          <div style={{ background: 'var(--color-brand-surface)', border: '1px solid var(--color-brand-border)', borderRadius: 'var(--radius-xl)', padding: 28 }}>
            <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-brand-text-muted)', fontWeight: 600, marginBottom: 8 }}>Tabular lining numerals · class <code>.tabular-lining</code></div>
            <table style={{ width: '100%', fontFamily: 'var(--font-display)', fontSize: 22 }} className="tabular-lining">
              <tbody>
                <tr><td style={{ padding: '4px 0' }}>Income</td><td style={{ textAlign: 'right', color: 'var(--color-brand-sage)' }}>R&nbsp;35,000</td></tr>
                <tr><td style={{ padding: '4px 0' }}>Spent</td><td style={{ textAlign: 'right' }}>R&nbsp;20,672</td></tr>
                <tr><td style={{ padding: '4px 0' }}>Remaining</td><td style={{ textAlign: 'right' }}>R&nbsp;14,328</td></tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── Radii ──────────────────────────────── */}
        <section style={{ marginBottom: 56 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 28, letterSpacing: '-0.02em', margin: '0 0 16px', fontVariationSettings: '"opsz" 60, "SOFT" 50' }}>Radii</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 16 }}>
            {radii.map((r) => (
              <div key={r.name} style={{ textAlign: 'center' }}>
                <div style={{ width: 80, height: 80, margin: '0 auto', background: 'var(--color-brand-sage)', borderRadius: `var(--${r.name})` }} />
                <div style={{ marginTop: 8, fontSize: 12, fontWeight: 600 }}>{r.name}</div>
                <div style={{ fontSize: 11, color: 'var(--color-brand-text-muted)', fontFamily: 'ui-monospace, monospace' }}>{r.value}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Primitives placeholder ─────────────── */}
        <section>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 28, letterSpacing: '-0.02em', margin: '0 0 16px', fontVariationSettings: '"opsz" 60, "SOFT" 50' }}>Primitives</h2>
          <p style={{ color: 'var(--color-brand-text-muted)', fontStyle: 'italic' }}>
            Components arrive in Axis H PR-2 (Button, Card, Input, Badge, Alert, Tag, Stat, TransactionRow).
            This section gets populated incrementally as each primitive lands.
          </p>
        </section>

      </div>
    </div>
  );
}

export default StyleGuidePage;
```

Note: this component intentionally uses inline `style={{}}` with CSS variables rather than Tailwind utility classes. Reason: Tailwind utilities for the new `brand-*` tokens (e.g. `bg-brand-cream`) will exist once the `@theme` block is registered, but we want this page to render correctly even if Tailwind's JIT misses one. Inline-style + CSS variables is the most robust verification path for PR-1. PR-2's primitives will move to utility classes.

- [ ] **Step 2: Check it compiles**

Run: `cd src/frontend && npm run build`
Expected: build succeeds; no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/henricktissink/Sauce/cactus
git add src/frontend/src/pages/StyleGuide.tsx
git commit -m "feat(axis-h-pr-1): add /styleguide page rendering brand tokens + type + radii"
```

---

## Task 4: Register /styleguide route in App.tsx (dev only)

**Files:**
- Modify: `src/frontend/src/App.tsx`

- [ ] **Step 1: Add the import**

In `src/frontend/src/App.tsx`, find the existing imports (lines 5-18) and add the new line in alphabetical-ish order. Specifically, after line 18 (`import { WelcomePage } from './pages/onboarding/welcome/WelcomePage';`), add:

```tsx
import { StyleGuidePage } from './pages/StyleGuide';
```

- [ ] **Step 2: Register the route conditionally**

In `src/frontend/src/App.tsx`, find the existing routes section. The route block starts at line 60 (`<Routes>`) and ends at line 120. Find the `{/* Catch all */}` comment around line 118 — the new route goes IMMEDIATELY BEFORE it.

Insert these lines before `<Route path="*" element={<Navigate to="/" replace />} />`:

```tsx
          {/* Style guide — dev only, removed from production bundle by Vite tree-shaking the conditional */}
          {import.meta.env.DEV && (
            <Route path="/styleguide" element={<StyleGuidePage />} />
          )}

```

- [ ] **Step 3: Verify dev server serves the route**

Run: `cd src/frontend && npm run dev`
Open `http://localhost:5173/styleguide` in a browser.
Expected:
- Page renders with cream background, "Brand tokens & primitives" heading in Fraunces serif (warm/soft).
- Color section shows 12 swatches with hex codes and use labels.
- Typography section shows the wordmark "cactus" at ~64px in sage; sample heading; sample body text; tabular numerals table aligned right.
- Radii section shows 6 sage squares with progressively rounded corners.
- Primitives section shows the placeholder paragraph.

Kill dev server (Ctrl+C) before continuing.

- [ ] **Step 4: Verify production build does NOT include the route**

Run: `cd src/frontend && npm run build && npm run preview`
Open `http://localhost:4173/styleguide` in a browser.
Expected: redirects to `/` (or `/welcome` if not authenticated) because the conditional in `App.tsx` only registers the route in dev mode, so the catch-all `<Route path="*" element={<Navigate to="/" replace />} />` handles it in production.

Kill preview server (Ctrl+C).

- [ ] **Step 5: Commit**

```bash
cd /Users/henricktissink/Sauce/cactus
git add src/frontend/src/App.tsx
git commit -m "feat(axis-h-pr-1): mount /styleguide route in dev mode only"
```

---

## Task 5: Add a smoke test for StyleGuidePage

**Files:**
- Create: `src/frontend/src/pages/StyleGuide.test.tsx`

- [ ] **Step 1: Write the test**

Write `src/frontend/src/pages/StyleGuide.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StyleGuidePage } from './StyleGuide';

describe('StyleGuidePage', () => {
  it('renders the main heading', () => {
    render(<StyleGuidePage />);
    expect(screen.getByText('Brand tokens & primitives')).toBeInTheDocument();
  });

  it('renders all 12 colour swatches', () => {
    render(<StyleGuidePage />);
    const swatchNames = [
      'brand-cream',
      'brand-surface',
      'brand-border',
      'brand-sage',
      'brand-terracotta',
      'brand-terracotta-soft',
      'brand-accent-ink',
      'brand-text',
      'brand-text-muted',
      'brand-text-faint',
      'brand-danger',
      'brand-info',
    ];
    for (const name of swatchNames) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it('renders the wordmark sample', () => {
    render(<StyleGuidePage />);
    // The wordmark text appears in the typography section
    expect(screen.getByText('cactus')).toBeInTheDocument();
  });

  it('renders the radii samples', () => {
    render(<StyleGuidePage />);
    const radiusNames = ['radius-sm', 'radius-md', 'radius-lg', 'radius-xl', 'radius-2xl', 'radius-pill'];
    for (const name of radiusNames) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it('renders the primitives placeholder noting future PRs', () => {
    render(<StyleGuidePage />);
    expect(screen.getByText(/Components arrive in Axis H PR-2/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test**

Run: `cd src/frontend && npm test -- StyleGuide`
Expected: all 5 tests pass.

If a test fails, the most likely cause is a typo in either the test or the page component — diff the expected text against what `StyleGuide.tsx` actually renders. Do NOT silence the test by changing the assertion to match a buggy render; fix the render.

- [ ] **Step 3: Commit**

```bash
cd /Users/henricktissink/Sauce/cactus
git add src/frontend/src/pages/StyleGuide.test.tsx
git commit -m "test(axis-h-pr-1): smoke test for StyleGuidePage rendering all sections"
```

---

## Task 6: Update 100x roadmap to include Axis H

**Files:**
- Modify: `docs/superpowers/specs/2026-05-03-100x-roadmap.md`

Spec section "100x roadmap integration" says the roadmap edit happens as part of PR-1.

- [ ] **Step 1: Add Axis H to the Iteration depth list**

In `docs/superpowers/specs/2026-05-03-100x-roadmap.md`, find the line:

```markdown
**Iteration depth:** Mixed — solid on foundation axes (A, B, D), walking-skeleton on product axes (C, O, E, F, G).
```

Change to:

```markdown
**Iteration depth:** Mixed — solid on foundation axes (A, B, D), walking-skeleton on product axes (C, O, E, F, G, H).
```

And in the in-body Iteration depth section (around line 49-50), update the bullet:

```markdown
- **Walking-skeleton** on C, O, E, F, G — product surfaces will get rewritten as real users push back. Ship the smallest version that delivers 80% of value, learn, iterate.
```

Change to:

```markdown
- **Walking-skeleton** on C, O, E, F, G, H — product surfaces will get rewritten as real users push back. Ship the smallest version that delivers 80% of value, learn, iterate.
```

- [ ] **Step 2: Update axis count headings**

Find `## Program (Phase 0 + 8 axes)` and change to `## Program (Phase 0 + 9 axes)`.

Find the vision paragraph line:

```markdown
This is a multi-week program covering 8 axes (A–G plus the mid-program-added Axis O) and a cleanup phase.
```

Change to:

```markdown
This is a multi-week program covering 9 axes (A–H plus the mid-program-added Axis O) and a cleanup phase.
```

And update the Status one-liner near the top:

```markdown
**Status:** Active, in execution. Phase 0 + Axis A + Axis O complete; product-wedge work (B, D, C, E, F, G) ahead.
```

Change to:

```markdown
**Status:** Active, in execution. Phase 0 + Axis A + Axis O complete; product-wedge work (B, D, C, E, F, G) and visual rebrand (H) ahead.
```

- [ ] **Step 3: Add a new Axis H block in the Program section**

After the Axis G section ends (last line of Axis G's `**Out of scope (Axis G)**:`), and before the `---` separator that precedes `## Sequence & dependencies`, add:

```markdown

---

### Axis H — UI rebrand + design system (Walking skeleton, decomposed)

**Goal:** Replace the MVP-feeling Tailwind look with a warm, optimistic brand that respects the audience (mature high-earning South Africans). Fraunces + Inter typography, soft sage + terracotta palette on cream, refined components, real visual hierarchy. No new product behaviour — same pages, new clothes.

Spec: `docs/superpowers/specs/2026-05-13-axis-h-ui-rebrand-design.md` (brainstormed 2026-05-13).

**Decomposition:** 7 PRs (foundation tokens → primitives → brand mark → app shell → Dashboard → Transactions → bulk pages) + 1 cleanup PR removing deprecated `cactus-*` tokens. ~7-8 engineering days, ~2-3 calendar weeks.

**Dependencies:** Replicate API token for PR-3 (brand mark exploration). All other PRs are pure frontend.

**Success criteria:** Every page rebranded; `/styleguide` route serves as living style guide; bundle delta ≤60 KB gzip after Latin font subset; axe-core green on every primitive; Lighthouse mobile ≥85 on rebranded pages.

**Out of scope (Axis H):** dark mode; illustration system beyond brand mark; animation/motion system; generated Figma library; Percy/Chromatic visual regression; PWA manifest.

---
```

- [ ] **Step 4: Add Axis H to the sequence diagram**

In `## Sequence & dependencies`, the existing diagram is:

```
Phase 0  ─▶  A  ─┬─▶  B  ─┐
                 ├─▶  D  ─┼─▶  E1 ─┬─▶ E2/E3/E4 (any order) ─▶ F1 ─▶ F2/F3
                 └─▶  C  ─┘       └─▶ G1 ─▶ G2

                                                            [F4 deferred, post-100x]
```

Change to:

```
Phase 0  ─▶  A  ─┬─▶  B  ─┐
                 ├─▶  D  ─┼─▶  E1 ─┬─▶ E2/E3/E4 (any order) ─▶ F1 ─▶ F2/F3
                 ├─▶  C  ─┘       └─▶ G1 ─▶ G2
                 └─▶  H (independent — parallel anywhere after A)

                                                            [F4 deferred, post-100x]
```

And add a bullet after the existing G bullet:

```markdown
- **H (UI rebrand) is independent** — runs in parallel with anything after A; touches only frontend, no cross-axis dependencies. Recommended to land before E1 ships so bank-fed pages inherit the new look from the start, but not strictly blocking.
```

- [ ] **Step 5: Verify markdown still renders correctly**

Run: `wc -l docs/superpowers/specs/2026-05-03-100x-roadmap.md`
Expected: line count is higher than before by ~20 lines (the Axis H block addition).

Open the file and skim for: no duplicate headings, the new section sits between Axis G and "## Sequence & dependencies", the diagram update is intact.

- [ ] **Step 6: Commit**

```bash
cd /Users/henricktissink/Sauce/cactus
git add docs/superpowers/specs/2026-05-03-100x-roadmap.md
git commit -m "docs(axis-h-pr-1): add Axis H entry to 100x roadmap"
```

---

## Task 7: Final verification gate

This is the gate before opening the PR. All five checks must pass.

- [ ] **Step 1: Lint**

Run: `cd src/frontend && npm run lint`
Expected: zero errors. If warnings appear in files touched by this PR, fix them; warnings in untouched files can pass through.

- [ ] **Step 2: Format check**

Run: `cd src/frontend && npm run format:check`
Expected: zero formatting issues. If fails, run `npm run format` and commit the formatting fix.

- [ ] **Step 3: Full test suite**

Run: `cd src/frontend && npm test`
Expected: all tests pass, including the new StyleGuide smoke tests. Any pre-existing test failure must be investigated — do not assume "it was already broken."

- [ ] **Step 4: Production build**

Run: `cd src/frontend && npm run build`
Expected: build succeeds; `dist/` produced; bundle size for the main JS chunk should NOT increase by more than 60 KB gzip vs the previous main build (font assets land in separate chunks via `@fontsource-variable`).

To measure the delta: compare the new `dist/assets/index-*.js` size against the previous prod build (you can find the previous size on the deployed Hetzner box, or run `git stash && npm run build` on `main`, note size, then `git stash pop && npm run build`).

- [ ] **Step 5: Manual visual smoke**

Run: `cd src/frontend && npm run dev`

Open each of these URLs and confirm visual parity with pre-PR state (except `/styleguide` which is new):
- `http://localhost:5173/login` — login screen looks unchanged
- `http://localhost:5173/welcome` — welcome screen looks unchanged
- `http://localhost:5173/` (after login) — dashboard looks unchanged
- `http://localhost:5173/styleguide` — renders correctly with Fraunces + sage palette

Kill dev server.

---

## Task 8: Push branch and open PR

- [ ] **Step 1: Push**

```bash
cd /Users/henricktissink/Sauce/cactus
git push -u origin axis-h/pr-1-tokens-styleguide
```

- [ ] **Step 2: Open the PR**

```bash
gh pr create --title "Axis H PR-1: foundation tokens + /styleguide route" --body "$(cat <<'EOF'
## Summary
- Adds `brand-*` design tokens (cream/sage/terracotta palette, Fraunces+Inter type, radius scale) into the Tailwind 4 `@theme` block. Additive only — existing `cactus-*` tokens untouched.
- Self-hosts Fraunces and Inter via `@fontsource-variable` (replaces Google Fonts CDN for both). JetBrains Mono stays on CDN for now (separate cleanup later).
- New `/styleguide` route (dev only, removed from production bundle via `import.meta.env.DEV` conditional). Renders every token + typography sample + radius variant; will grow as PR-2 primitives land.
- Updates 100x roadmap to include Axis H.

## Test plan
- [ ] `npm test` — full Vitest suite green
- [ ] `npm run lint` and `npm run format:check` — clean
- [ ] `npm run build` — succeeds, bundle delta ≤60 KB gzip on main chunk
- [ ] Manual: `/login`, `/welcome`, `/` (dashboard) all look unchanged
- [ ] Manual: `/styleguide` (dev) renders Fraunces wordmark in sage on cream, 12 swatches, 6 radii
- [ ] Manual: `/styleguide` (production preview) redirects (route not mounted)

Part of [Axis H — UI rebrand + design system](docs/superpowers/specs/2026-05-13-axis-h-ui-rebrand-design.md).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Verify PR opened and CI started**

Run: `gh pr view`
Expected: PR exists; CI status shows "pending" or already running. The Axis A workflows (PR build + lint + test) will gate the merge.

---

## Done state

- Branch `axis-h/pr-1-tokens-styleguide` pushed; PR open.
- `brand-*` tokens registered; existing `cactus-*` tokens untouched.
- Fraunces + Inter self-hosted; Google Fonts CDN call for those two fonts removed.
- `/styleguide` route accessible at `http://localhost:5173/styleguide` in dev only.
- Axis H added to 100x roadmap.
- All CI green; ready for review and merge.

## What's next (PR-2 preview)

PR-2 (core primitive set) refactors Button, Card, Input/Textarea/Select, Badge/Tag, Alert, Stat, TransactionRow to use the new `brand-*` tokens while preserving their existing prop APIs. Plan for PR-2 will be written when PR-1 lands and we have the actual tokens in production CSS to anchor against.
