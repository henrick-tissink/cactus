# Axis H — PR-4: App shell rebrand

**Date:** 2026-05-14
**Branch:** `axis-h/pr-4-app-shell`
**Worktree:** `.worktrees/axis-h-pr-4`
**Spec:** `docs/superpowers/specs/2026-05-13-axis-h-ui-rebrand-design.md` §PR-4
**Effort:** ~4–5 h (small)

## Goal

Migrate the authenticated `Layout` (sidebar + mobile header + mobile drawer + bottom tab bar) and the unauthenticated `AuthBrandPanel` from `cactus-*` tokens to `brand-*` tokens, and switch headings to `font-display` (Fraunces). No structural changes; net-zero feature delta. Sets up PR-8 cleanup to delete `cactus-*` once all pages are migrated.

## Files in scope

| File | What changes |
|---|---|
| `src/components/layout/Layout.tsx` | Token rename across sidebar, mobile header, mobile drawer, bottom tab bar, `UserSection`; refined hover/active/focus using `brand-sage-soft` and `brand-border`. |
| `src/components/auth/AuthBrandPanel.tsx` | Flip from deep-forest panel to cream gradient; heading uses `font-display`; logo flips to `tone="light"`. |
| `src/components/layout/Layout.test.tsx` | Update assertions if any reference `cactus-*` class names. |

## Token swap mapping

Used throughout Layout.tsx (PR-2 already flipped `cactus-*` VALUES to match `brand-*`, so this is a name-rename, not a color shift):

| Old (`cactus-*`) | New (`brand-*`) |
|---|---|
| `bg-cactus-sandstone` | `bg-brand-cream` |
| `border-cactus-overlay` | `border-brand-border` |
| `bg-cactus-sage-light` | `bg-brand-sage-soft` |
| `bg-cactus-sage-light/40` (hover) | `bg-brand-sage-soft/60` (preserves the lighter hover-vs-active contrast) |
| `text-cactus-charcoal` | `text-brand-text` |
| `text-cactus-charcoal/60` | `text-brand-text-muted` |
| `text-cactus-charcoal/50` (inactive tab) | `text-brand-text-faint` |
| `text-cactus-sage` (active tab) | `text-brand-sage` |
| `border-cactus-sage` (active border-l) | `border-brand-sage` |
| `bg-cactus-sage` (avatar circle) | `bg-brand-sage` |
| `font-cactus` (everywhere) | `font-sans-brand` |

Focus rings (currently absent on nav links — add):
- All `NavItem` links and `UserSection` button: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream`

## Detailed changes per file

### `Layout.tsx`

1. **Imports** — unchanged.
2. **`NavItem` (tab variant)** — active `text-brand-sage`, inactive `text-brand-text-faint`; font class `font-sans-brand`; add focus-visible ring.
3. **`NavItem` (sidebar variant)** — active `bg-brand-sage-soft text-brand-text border-l-[3px] border-brand-sage`; inactive `text-brand-text-muted hover:bg-brand-sage-soft/60 hover:text-brand-text`; font class `font-sans-brand`; add focus-visible ring.
4. **`UserSection`** — border `border-brand-border`; button hover `hover:bg-brand-sage-soft/60`; avatar `bg-brand-sage text-white font-sans-brand`; name `text-brand-text font-sans-brand`; email `text-brand-text-muted font-sans-brand`; dropdown `bg-brand-surface border-brand-border`; logout `text-brand-text hover:bg-brand-sage-soft/60`; add focus-visible ring to both buttons.
5. **Root `<div>`** — `bg-brand-cream font-sans-brand`.
6. **Desktop sidebar `<aside>`** — `bg-brand-cream border-r border-brand-border`. Logo header `border-b border-brand-border`.
7. **Mobile header** — `bg-brand-cream border-b border-brand-border`; menu button `text-brand-text` + focus ring.
8. **Mobile drawer** — `bg-brand-cream`.
9. **Mobile bottom tab bar** — `bg-brand-cream border-t border-brand-border`.

### `AuthBrandPanel.tsx`

Replace the dark forest panel with a cream gradient. Visual reference: same panel, sage-toned, warmth from terracotta-soft accent.

```tsx
export function AuthBrandPanel({ heading, tagline }: AuthBrandPanelProps) {
  return (
    <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-brand-cream via-brand-cream to-brand-terracotta-soft text-brand-text p-12 flex-col justify-between">
      <CactusLogo tone="light" />
      <div>
        <h1 className="font-display font-medium text-4xl mb-3 leading-tight tracking-tight text-brand-text">{heading}</h1>
        <p className="font-sans-brand text-[15px] text-brand-text-muted leading-relaxed">{tagline}</p>
      </div>
      <p className="font-sans-brand text-xs text-brand-text-faint">© Cactus Finance</p>
    </div>
  );
}
```

Notes:
- `font-display` is Fraunces (per `--font-display`). `font-medium` is the right weight for a display serif at this size; bold reads too heavy.
- `text-4xl` (was `text-3xl`) — Fraunces with optical size benefits from a touch more presence than Inter at the same point size.
- `tone="light"` on `CactusLogo` renders the sage glyph + charcoal wordmark — the existing default.
- Gradient end uses `brand-terracotta-soft` (#fdf0e6) for a subtle warm wash at bottom-right. Direction `to-br` so the warmth is opposite the logo.

### `Layout.test.tsx`

Audit for any class-string assertions on `cactus-sage`, `cactus-charcoal`, `cactus-sandstone`, etc. Update or replace with `brand-*` equivalents. Skip if the tests assert only on rendered text / `aria-current` semantics (which is the more robust pattern).

## Verification

In order, in the PR-4 worktree:

1. `npm run typecheck` → clean.
2. `npm run lint` → clean.
3. `npm test` → 94/94 still green (or higher if new tests added).
4. `npm run dev` and visually inspect:
   - `/` authenticated → desktop sidebar, hover states, active state, user menu open/close.
   - `/login` and `/register` unauthenticated → cream gradient `AuthBrandPanel` on desktop; on mobile the panel hides per existing breakpoint.
   - Mobile viewport (DevTools 375×812): top header, hamburger drawer open/close, bottom tab bar active state.
5. Keyboard pass: Tab through sidebar links → focus ring visible; Tab through user menu → focus ring; Tab through mobile tab bar → focus ring.
6. axe-core extension (or the CI run on push) → no new violations.
7. Bundle size delta: `npm run build` and compare gzip main JS to PR-3 baseline (252.95 KB). Expected delta: **net-zero** (only class swaps, no new code).
8. Screenshot updates: capture `screenshots/shell-desktop.png`, `screenshots/shell-mobile.png`, `screenshots/auth-shell.png` (optional, but spec mentions screenshots in PR-5+; defer if not yet a convention here).

## Commit plan

Two commits to keep review tractable:

1. `feat(axis-h-pr-4): rebrand Layout sidebar + mobile nav to brand-* tokens` — Layout.tsx + Layout.test.tsx updates.
2. `feat(axis-h-pr-4): rebrand AuthBrandPanel — cream gradient + Fraunces heading` — AuthBrandPanel.tsx.

Both squash-merge into one PR titled **"Axis H PR-4 — app shell rebrand"**.

## Risks / things to watch

- **Class-string test brittleness.** `Layout.test.tsx` may break if it asserts on the old class names. Fix is mechanical; prefer assertions on `aria-current`/text content where possible.
- **Hover contrast on `brand-sage-soft/60`.** `brand-sage-soft` is already at 12% opacity; halving to 60% of that gives ~7% — make sure hover state is still perceptible against `brand-cream`. If too subtle, use `brand-sage-soft` for hover and a slightly stronger token (or `bg-brand-sage/15`) for active. Verify in browser.
- **AuthBrandPanel gradient subtlety.** `brand-cream → brand-terracotta-soft` is a narrow range; on small displays the warmth may be invisible. If it reads too flat, push the gradient endpoint to a slightly bolder warm token or add a centered watermark glyph. Keep the option open; decide in-browser.
- **`--cactus-forest` orphan.** After this PR, `AuthBrandPanel` is the only caller of `--cactus-forest` in `index.css:65`. Remove the `:root { --cactus-forest }` rule in this same PR — it becomes dead code.
- **PR-8 cleanup readiness.** After PR-4 there will still be `cactus-*` usage in pages (Dashboard, Transactions, etc. — handled by PR-5/6/7). Don't try to land PR-8 early. Just confirm Layout + AuthBrandPanel are clean of `cactus-*`.

## Out of scope

- Page-level rebranding (PR-5/6/7).
- New primitives.
- Mobile bottom-tab visual redesign beyond token rename (the spec is a token-driven refresh, not a structural mobile-nav rework).
- Deleting the `cactus-*` token definitions in `index.css` (PR-8).

## Definition of done

- All four shell surfaces (sidebar, mobile header, mobile drawer, bottom tab bar) and `AuthBrandPanel` use only `brand-*` tokens and `font-sans-brand`/`font-display`.
- `--cactus-forest` removed from `index.css`.
- 94/94 tests pass; lint + typecheck clean.
- Visual check across desktop + mobile breakpoints passes.
- Branch pushed; PR created via the `pull/new/...` URL workflow; PR body lists what changed + verification checklist.
