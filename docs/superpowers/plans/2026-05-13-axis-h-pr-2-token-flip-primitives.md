# Axis H PR-2: Token Flip + Primitive Refactor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the warm Axis H direction visible across the entire app in one PR — *without* touching page-level code. Flip the `cactus-*` token VALUES (keeping their names) so every page using `bg-cactus-sage`, `text-cactus-charcoal`, etc. instantly inherits the new palette. Then fix the two existing primitive components (`Btn`, `MoneyInput`) whose hardcoded RGB values would otherwise look wrong against the new sage. `CactusLogo` stays untouched — PR-3 replaces it with the new mark.

**Architecture:** This is a token-redefinition PR, not a refactor. The `cactus-*` token names persist throughout the codebase but their hex values map to the new warm palette. Names lie slightly (`cactus-sage` now means proper sage, not bright lime) — that's accepted tech debt; the `cactus-*` namespace is scheduled for removal in PR-8 anyway. The two component refactors are surgical: replace hardcoded `rgba(...)` shadow / colour values that won't auto-inherit.

**Tech Stack:** Tailwind 4 (`@theme` block in `src/frontend/src/index.css`), React 19, TypeScript, Vitest.

---

## File Structure

**Modify:**
- `src/frontend/src/index.css` — flip 4 token values + 1 font value in `@theme` block
- `src/frontend/src/components/brand/Btn.tsx` — replace hardcoded lime-RGB shadow with sage-RGB; switch `font-cactus` to `font-semibold`
- `src/frontend/src/components/brand/MoneyInput.tsx` — warm the border + R prefix; switch the amount numerals to `font-display` (Fraunces) for elegance
- `src/frontend/src/pages/StyleGuide.tsx` — add the refreshed primitives section so they're visible in the dev styleguide

**Branch:** `axis-h/pr-2-token-flip-primitives` (already created)

**Worktree:** `/Users/henricktissink/Sauce/cactus/.worktrees/axis-h-pr-2`

---

## Pre-flight

- [ ] **Step 0: Verify on the right branch**

```bash
cd /Users/henricktissink/Sauce/cactus/.worktrees/axis-h-pr-2
git branch --show-current
```
Expected: `axis-h/pr-2-token-flip-primitives`

`npm install` must already have been run in this worktree (parent context did this; if not, run `cd src/frontend && npm install` first).

---

## Task 1: Flip token values in @theme

**Files:**
- Modify: `src/frontend/src/index.css`

The existing `@theme {}` block defines `cactus-*` tokens with their old (bright/cool) values. This task changes the **values** to match the warm Axis H direction. **Token names do not change** — that's by design, so all existing class references (`bg-cactus-sage`, `text-cactus-charcoal`, etc.) auto-inherit the new colours.

**Tokens that change:**

| Token | Old value | New value | Reason |
|---|---|---|---|
| `--color-cactus-charcoal` | `#333333` | `#2d2418` | Warm text colour (matches `--color-brand-text`) |
| `--color-cactus-sage` | `#77dd77` | `#1f6f4a` | Proper sage (matches `--color-brand-sage`) |
| `--color-cactus-sage-light` | `#e8f8e8` | `#e8f5ee` | Slightly warmer mint-tinged |
| `--color-cactus-sandstone` | `#f5f5f1` | `#faf5ec` | Cream background (matches `--color-brand-cream`) |
| `--color-cactus-prickly` | `#ff6f61` | `#c9743a` | Terracotta replaces coral for errors/debits (matches `--color-brand-terracotta`) |
| `--font-cactus` | `'Quicksand', system-ui, -apple-system, sans-serif` | `'Inter Variable', 'Inter', system-ui, -apple-system, sans-serif` | Body type becomes Inter; CactusLogo wordmark will look "off" until PR-3 replaces the mark — acceptable |

**Tokens that DO NOT change:**

| Token | Value | Reason |
|---|---|---|
| `--color-cactus-mint` | `#e8f5ee` | Soft sage tint, still useful |
| `--color-cactus-desert` | `#ffcc00` | "Wants" bucket yellow — semantic, no clean warm equivalent |
| `--color-cactus-needs-bg` | `#e6f9e6` | "Needs" bucket bg — semantic |
| `--color-cactus-wants-bg` | `#fff5e0` | "Wants" bucket bg — semantic |
| `--color-cactus-goals-bg` | `#ffe8e8` | "Goals" bucket bg — semantic |
| `--color-cactus-overlay` | `rgba(51, 51, 51, 0.06)` | Generic faint overlay — leave |
| All `--color-brand-*` (PR-1) | as-is | These are the new palette; nothing else changes |
| All `--radius-*` (PR-1) | as-is | |
| `--font-display`, `--font-sans-brand` (PR-1) | as-is | |

- [ ] **Step 1: Make the 6 token-value changes in `src/frontend/src/index.css`**

Use the Edit tool with exact string matching, one find/replace per token.

Find:
```
  --color-cactus-charcoal: #333333;
```
Replace:
```
  --color-cactus-charcoal: #2d2418;
```

Find:
```
  --color-cactus-sage: #77dd77;
```
Replace:
```
  --color-cactus-sage: #1f6f4a;
```

Find:
```
  --color-cactus-sage-light: #e8f8e8;
```
Replace:
```
  --color-cactus-sage-light: #e8f5ee;
```

Find:
```
  --color-cactus-sandstone: #f5f5f1;
```
Replace:
```
  --color-cactus-sandstone: #faf5ec;
```

Find:
```
  --color-cactus-prickly: #ff6f61;
```
Replace:
```
  --color-cactus-prickly: #c9743a;
```

Find:
```
  --font-cactus: 'Quicksand', system-ui, -apple-system, sans-serif;
```
Replace:
```
  --font-cactus: 'Inter Variable', 'Inter', system-ui, -apple-system, sans-serif;
```

- [ ] **Step 2: Remove the now-unused Quicksand CDN import**

In `src/frontend/src/index.css`, find:
```
@import url('https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&display=swap');
```
Delete this entire line. Quicksand is no longer referenced anywhere after the `--font-cactus` flip.

- [ ] **Step 3: Verify build still succeeds**

Run: `cd src/frontend && npm run build 2>&1 | tail -5`
Expected: build succeeds.

- [ ] **Step 4: Verify all tests still pass**

Run: `cd src/frontend && npm test 2>&1 | tail -3`
Expected: 94/94 passing (tokens changed values, not names — no tests should break).

- [ ] **Step 5: Commit**

```bash
cd /Users/henricktissink/Sauce/cactus/.worktrees/axis-h-pr-2
git add src/frontend/src/index.css
git commit -m "feat(axis-h-pr-2): flip cactus-* token values to warm Axis H palette"
```

---

## Task 2: Refactor Btn.tsx — fix hardcoded shadow + font

**Files:**
- Modify: `src/frontend/src/components/brand/Btn.tsx`

The current `Btn` has a hardcoded lime-RGB shadow (`rgba(119,221,119,0.25)`) that won't auto-inherit the sage flip. It also uses `font-cactus font-bold` — after Task 1's `--font-cactus` flip this becomes Inter-bold, which is fine, but cleaner to use `font-semibold` directly so the dependency on `font-cactus` is gone.

- [ ] **Step 1: Read the current Btn.tsx**

Run: `cat src/frontend/src/components/brand/Btn.tsx`

You should see a component using:
- `bg-cactus-sage`
- `shadow-[0_4px_16px_rgba(119,221,119,0.25)]`
- `font-cactus font-bold`

- [ ] **Step 2: Update className string**

Find this exact line in `src/frontend/src/components/brand/Btn.tsx`:
```tsx
      className={`w-full px-6 py-4 rounded-2xl font-cactus font-bold text-base text-white transition-all bg-cactus-sage shadow-[0_4px_16px_rgba(119,221,119,0.25)] hover:brightness-95 active:brightness-90 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed ${className}`}
```

Replace with:
```tsx
      className={`w-full px-6 py-4 rounded-2xl font-semibold text-base text-white transition-all bg-cactus-sage shadow-[0_4px_16px_rgba(31,111,74,0.25)] hover:brightness-95 active:brightness-90 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed ${className}`}
```

Three changes:
- `font-cactus font-bold` → `font-semibold`
- `rgba(119,221,119,0.25)` → `rgba(31,111,74,0.25)` (sage at 25% opacity for the drop shadow)
- Everything else unchanged (width, padding, radius, colour token, disabled states)

- [ ] **Step 3: Run the Btn tests**

Run: `cd src/frontend && npm test -- Btn 2>&1 | tail -5`
Expected: 4/4 passing. The tests assert behaviour, not specific class names, so they should still pass.

If a test fails because it asserts `font-cactus` or `font-bold` in the class list, update the assertion to match the new class string. Don't silence by removing the assertion.

- [ ] **Step 4: Commit**

```bash
cd /Users/henricktissink/Sauce/cactus/.worktrees/axis-h-pr-2
git add src/frontend/src/components/brand/Btn.tsx
git commit -m "feat(axis-h-pr-2): rebrand Btn — sage shadow, Inter-semibold (drop font-cactus dep)"
```

---

## Task 3: Refactor MoneyInput.tsx — warm border + Fraunces numerals

**Files:**
- Modify: `src/frontend/src/components/brand/MoneyInput.tsx`

Currently uses `border-gray-200` (cold neutral) and `font-cactus` (which becomes Inter after Task 1) for the amount value. Switch to a warm border colour and use Fraunces (`font-display`) for the numerals — financial amounts in Fraunces tabular look much more elegant on the warm direction than Inter does.

- [ ] **Step 1: Read the current MoneyInput.tsx**

Run: `cat src/frontend/src/components/brand/MoneyInput.tsx`

- [ ] **Step 2: Update the outer wrapper className**

Find:
```tsx
      className={`flex items-center gap-1 bg-white border-2 border-gray-200 rounded-2xl px-4 py-4 focus-within:border-cactus-sage transition-colors ${className}`}
```

Replace:
```tsx
      className={`flex items-center gap-1 bg-white border-2 border-cactus-mint rounded-2xl px-4 py-4 focus-within:border-cactus-sage transition-colors ${className}`}
```

Single change: `border-gray-200` → `border-cactus-mint`. The mint token (#e8f5ee) gives a soft sage-tinged border that warms the input without being loud. Focus state already uses `cactus-sage` which auto-inherits the new sage from Task 1.

- [ ] **Step 3: Update the "R" prefix className**

Find:
```tsx
      <span className="font-cactus font-bold text-2xl text-gray-400">R</span>
```

Replace:
```tsx
      <span className="font-display font-medium text-2xl text-cactus-charcoal/40">R</span>
```

Changes:
- `font-cactus font-bold` → `font-display font-medium` (Fraunces medium-weight for the R)
- `text-gray-400` → `text-cactus-charcoal/40` (warm charcoal at 40% opacity — coordinates with the amount)

- [ ] **Step 4: Update the amount input className**

Find:
```tsx
        className="flex-1 border-none bg-transparent outline-none font-cactus font-bold text-2xl text-cactus-charcoal placeholder:text-gray-300"
```

Replace:
```tsx
        className="flex-1 border-none bg-transparent outline-none font-display font-medium text-2xl text-cactus-charcoal tabular-lining placeholder:text-cactus-charcoal/30"
```

Changes:
- `font-cactus font-bold` → `font-display font-medium tabular-lining` (Fraunces medium with the tabular-lining utility added in PR-1 — numerals align in columns and use lining figures)
- `placeholder:text-gray-300` → `placeholder:text-cactus-charcoal/30` (warm placeholder)

- [ ] **Step 5: Run the MoneyInput tests**

Run: `cd src/frontend && npm test -- MoneyInput 2>&1 | tail -5`
Expected: passes (assertions are behaviour-based).

If assertions check for `font-cactus` or `text-gray-400` class names, update them to the new class names.

- [ ] **Step 6: Commit**

```bash
cd /Users/henricktissink/Sauce/cactus/.worktrees/axis-h-pr-2
git add src/frontend/src/components/brand/MoneyInput.tsx
git commit -m "feat(axis-h-pr-2): rebrand MoneyInput — warm border, Fraunces tabular numerals"
```

---

## Task 4: Add primitives section to StyleGuide

**Files:**
- Modify: `src/frontend/src/pages/StyleGuide.tsx`

PR-1 left a "Primitives" placeholder section. Now that we have rebranded `Btn` and `MoneyInput`, populate that section so `/styleguide` shows them.

- [ ] **Step 1: Read the placeholder section**

Run: `grep -A 6 'Primitives placeholder' src/frontend/src/pages/StyleGuide.tsx`

You should see the placeholder `<section>` near the end of the component, currently rendering:
```
<p style={{ color: 'var(--color-brand-text-muted)', fontStyle: 'italic' }}>
  Components arrive in Axis H PR-2 (Button, Card, Input, Badge, Alert, Stat, TransactionRow).
  This section gets populated incrementally as each primitive lands.
</p>
```

- [ ] **Step 2: Add imports at the top of StyleGuide.tsx**

Find the comment at the top of the file:
```tsx
/**
 * Style Guide — dev-only route at /styleguide
 * Renders every brand token + every typographic + every radius variant.
 * Added in Axis H PR-1 (2026-05-13). Expanded in subsequent PRs as primitives land.
 */
```

Immediately after, add (before the `const swatches` declaration):
```tsx
import { Btn } from '../components/brand/Btn';
import { useState } from 'react';
import { MoneyInput } from '../components/brand/MoneyInput';
```

- [ ] **Step 3: Replace the Primitives placeholder section**

Find this block in `src/frontend/src/pages/StyleGuide.tsx`:
```tsx
        {/* ── Primitives placeholder ─────────────── */}
        <section>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 28, letterSpacing: '-0.02em', margin: '0 0 16px', fontVariationSettings: '"opsz" 60, "SOFT" 50' }}>Primitives</h2>
          <p style={{ color: 'var(--color-brand-text-muted)', fontStyle: 'italic' }}>
            Components arrive in Axis H PR-2 (Button, Card, Input, Badge, Alert, Stat, TransactionRow).
            This section gets populated incrementally as each primitive lands.
          </p>
        </section>
```

Replace with:
```tsx
        {/* ── Primitives (Axis H PR-2 onwards) ─────────────── */}
        <PrimitivesSection />
```

- [ ] **Step 4: Add the PrimitivesSection component at the bottom of the file**

Find the closing `export default StyleGuidePage;` at the end of the file. Immediately BEFORE it, add:

```tsx
function PrimitivesSection() {
  const [amount, setAmount] = useState('');
  return (
    <section>
      <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: 28, letterSpacing: '-0.02em', margin: '0 0 16px', fontVariationSettings: '"opsz" 60, "SOFT" 50' }}>Primitives</h2>

      <div style={{ background: 'var(--color-brand-surface)', border: '1px solid var(--color-brand-border)', borderRadius: 'var(--radius-xl)', padding: 28, marginBottom: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-brand-text-muted)', fontWeight: 600, marginBottom: 12 }}>Btn — primary button</div>
        <Btn onClick={() => {}}>Continue</Btn>
        <div style={{ marginTop: 12 }}>
          <Btn onClick={() => {}} disabled>Disabled</Btn>
        </div>
      </div>

      <div style={{ background: 'var(--color-brand-surface)', border: '1px solid var(--color-brand-border)', borderRadius: 'var(--radius-xl)', padding: 28, marginBottom: 16 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--color-brand-text-muted)', fontWeight: 600, marginBottom: 12 }}>MoneyInput</div>
        <MoneyInput value={amount} onChange={setAmount} placeholder="0" />
      </div>

      <p style={{ color: 'var(--color-brand-text-muted)', fontStyle: 'italic', marginTop: 12 }}>
        New primitives (Card, Stat, TransactionRow, Badge, Alert) extracted from page-level inline styles will land in later PRs.
      </p>
    </section>
  );
}
```

- [ ] **Step 5: Verify everything compiles and renders**

Run: `cd src/frontend && npm run build 2>&1 | tail -5`
Expected: build succeeds.

Run: `cd src/frontend && npm test 2>&1 | tail -3`
Expected: 94/94 passing.

(Existing StyleGuide.test.tsx assertion `Components arrive in Axis H PR-2` will no longer match. Update that assertion in Task 5 below.)

- [ ] **Step 6: Update StyleGuide.test.tsx**

Find this assertion in `src/frontend/src/pages/StyleGuide.test.tsx`:
```tsx
  it('renders the primitives placeholder noting future PRs', () => {
    render(<StyleGuidePage />);
    expect(screen.getByText(/Components arrive in Axis H PR-2/)).toBeInTheDocument();
  });
```

Replace with:
```tsx
  it('renders the primitives section with Btn and MoneyInput samples', () => {
    render(<StyleGuidePage />);
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Disabled' })).toBeInTheDocument();
    expect(screen.getByText(/New primitives.*will land in later PRs/)).toBeInTheDocument();
  });
```

- [ ] **Step 7: Run full test suite**

Run: `cd src/frontend && npm test 2>&1 | tail -5`
Expected: 94/94 passing.

- [ ] **Step 8: Commit**

```bash
cd /Users/henricktissink/Sauce/cactus/.worktrees/axis-h-pr-2
git add src/frontend/src/pages/StyleGuide.tsx src/frontend/src/pages/StyleGuide.test.tsx
git commit -m "feat(axis-h-pr-2): populate StyleGuide primitives section with Btn + MoneyInput"
```

---

## Task 5: Final verification gate

- [ ] **Step 1: Lint**

Run: `cd src/frontend && npm run lint 2>&1 | tail -5`
Expected: clean.

- [ ] **Step 2: Format check**

Run: `cd src/frontend && npm run format:check 2>&1 | tail -5`
Expected: clean.

- [ ] **Step 3: Full test suite**

Run: `cd src/frontend && npm test 2>&1 | tail -5`
Expected: 94/94 passing.

- [ ] **Step 4: Production build**

Run: `cd src/frontend && npm run build 2>&1 | tail -10`
Expected: succeeds. Bundle should be roughly the same size or slightly smaller (we removed the Quicksand CDN import — saves a network request but doesn't affect bundle weight directly).

- [ ] **Step 5: Manual visual smoke (skip if dispatching subagent; this is for the human reviewer)**

Run: `cd src/frontend && npm run dev`

Open `http://localhost:5173/login` — login button should be sage `#1f6f4a` (not bright lime). Background should be cream `#faf5ec` if the page uses `cactus-sandstone`. Body text should be Inter (not Quicksand).

Open `http://localhost:5173/styleguide` (after login as dev) — primitives section should show a sage "Continue" button and a Fraunces-numeral MoneyInput.

Open `http://localhost:5173/` (dashboard) — buckets, cards, and accent colours should all read as the warm palette.

Open the browser dev tools and inspect a `bg-cactus-sage` element — its computed background should be `rgb(31, 111, 74)`, not `rgb(119, 221, 119)`.

Kill dev server.

---

## Task 6: Push branch + open PR

- [ ] **Step 1: Push**

```bash
cd /Users/henricktissink/Sauce/cactus/.worktrees/axis-h-pr-2
git push -u origin axis-h/pr-2-token-flip-primitives
```

- [ ] **Step 2: Open PR**

Since `gh` is not authed in this environment, the controller hands off the URL + suggested title/body for the user to paste into GitHub's web UI.

**URL:** `https://github.com/henrick-tissink/cactus/pull/new/axis-h/pr-2-token-flip-primitives`

**Suggested title:** `Axis H PR-2: token flip + primitive refactor (warm rebrand visible app-wide)`

**Suggested body:**
```markdown
## Summary
- Flip `cactus-*` token VALUES in `@theme` to the warm Axis H palette (charcoal → warm dark, sage → sage proper, sandstone → cream, prickly → terracotta). Token names persist — every existing `bg-cactus-sage` / `text-cactus-charcoal` / etc. reference auto-inherits the new palette.
- `--font-cactus` now points to Inter Variable (was Quicksand). Body text + CactusLogo wordmark switch to Inter. Quicksand CDN @import removed.
- `Btn.tsx`: hardcoded lime-RGB shadow swapped for sage-RGB; `font-cactus font-bold` → `font-semibold`.
- `MoneyInput.tsx`: warm border (`cactus-mint`), Fraunces tabular-lining numerals for the amount, warm placeholder.
- `/styleguide`: primitives section now renders the refreshed `Btn` and `MoneyInput`.

## Test plan
- [x] 94/94 Vitest tests pass
- [x] Lint + format clean
- [x] Build succeeds
- [ ] Manual: `/login` button is sage (#1f6f4a), not lime
- [ ] Manual: `/styleguide` shows the refreshed primitives
- [ ] Manual: dashboard / transactions / goals all visibly warmer

Part of [Axis H — UI rebrand](docs/superpowers/specs/2026-05-13-axis-h-ui-rebrand-design.md). Next: PR-3 brand mark.
```

---

## Risks & notes

- **CactusLogo will look "off"** after this PR — the wordmark text "cactus" will render in Inter (was Quicksand) inside an SVG group that's structured for a softer typeface. The mark itself (rectangles + pink circle) is also the wrong colours now: the rectangles use `fill-cactus-sage` which becomes the new dark sage, and the circle uses `fill-cactus-prickly` which becomes terracotta. That's intentionally "broken-looking" until PR-3 replaces the mark entirely. Note this in the PR body so the reviewer doesn't think it's a bug.
- **`cactus-desert` (yellow) and the bucket bgs stay** — these still look right against the new palette. If they end up clashing, follow-up in a later PR.
- **Hardcoded RGB in pages** — if any page has `rgb(119, 221, 119)` or similar literals (rather than `cactus-sage` token usage), this PR won't fix those. A grep should turn up zero or near-zero matches; flag any in DONE_WITH_CONCERNS.
- **Bundle size delta** — removing the Quicksand `@import url(...)` from CSS doesn't reduce bundle weight (the CDN font isn't bundled), it removes a render-time network request. Slight LCP/CLS improvement on first paint. Worth noting but not gating.
