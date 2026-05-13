# Axis H — UI Rebrand + Design System Design

**Date:** 2026-05-13
**Status:** Draft, awaiting user review
**Iteration depth:** Walking skeleton (per 100x program). New axis to be added to `2026-05-03-100x-roadmap.md`.
**Engineering days:** 7–8 (~2–3 calendar weeks at the program's normal velocity factor)

---

## Vision

Replace the current MVP-feeling Tailwind look with a proper warm-and-optimistic brand that respects the audience the interviews surfaced: mature high-earning South Africans who don't need to be sold to. The visual system should read confident-but-friendly, never childish or generic, and should make the Axis O onboarding flow + every product surface feel like a real product instead of a hand-rolled prototype.

This axis is design-led, not product-feature-led. No new screens, no new behaviour. Same pages, new clothes.

## Brand direction: Warm & Optimistic

Decided 2026-05-13 in brainstorm against four mood candidates (Considered & Calm / Editorial & Confident / Warm & Optimistic / SA & Distinct). Warm & Optimistic was chosen because it pairs naturally with the "cactus" name (organic, slightly playful), respects the high-earner audience without going cold/clinical, and reads as approachable for advisor-led conversations (Axis G). The editorial sharpness comes from typography and copy, not from a colder palette.

---

## Identity tokens

### Typography

| Role | Family | Weight / Variation | Notes |
|---|---|---|---|
| Display / wordmark | **Fraunces** (variable) | `400`, `opsz` 144, `SOFT` 100 | Warm humanist serif, soft optical axis at large sizes. **Upright**, not italic. Self-hosted via `@fontsource-variable/fraunces`. |
| Heading | Fraunces | `500`, `opsz` 60, `SOFT` 50 | Slightly less expressive than wordmark; still warm. |
| Body | **Inter** (variable) | `400`/`500`/`600`/`700` | Workhorse sans, self-hosted via `@fontsource-variable/inter`. |
| Numerals (financial) | Fraunces | `font-feature-settings: 'lnum' 1, 'tnum' 1` | Lining + tabular figures for amounts so columns align. |
| Numerals (inline) | Inter | `'tnum' 1` | Tabular for tables, normal proportional for prose. |
| Mono (debug / IDs) | system mono | n/a | No custom mono font; system stack is fine. |

**Subsetting:** Both fonts shipped as Latin + Latin-Extended only. Expected weight after subset: ~50–60 KB combined. Loaded via `@fontsource-variable` so they're bundled, not CDN-fetched. `font-display: swap`.

**Fallback stack:**
- Display: `'Fraunces Variable', 'Fraunces', Iowan Old Style, Cambria, Georgia, serif`
- Body: `'Inter Variable', 'Inter', system-ui, -apple-system, Segoe UI, sans-serif`

### Color palette

Hex values; OKLCH variants generated if/when Tailwind 4 lands.

| Token | Hex | Use | Contrast on cream |
|---|---|---|---|
| `brand-cream` | `#faf5ec` | App background | — |
| `brand-surface` | `#ffffff` | Card / elevated panel | 1.05:1 (decorative only; separate with `brand-border`) |
| `brand-border` | `#ebe5d5` | 1px hairline between surfaces | — |
| `brand-sage` | `#1f6f4a` | Primary; links; positive numbers; logo glyph | ~5.7:1 (AA body, fails AAA) |
| `brand-sage-soft` | `rgba(31,111,74,0.12)` | Primary chip backgrounds | — |
| `brand-terracotta` | `#c9743a` | Accent (decorative only); button bg | ~3.3:1 (**fails AA for body text — see constraint**) |
| `brand-terracotta-soft` | `#fdf0e6` | Alert bg, warning chip bg | — |
| `accent-ink` | `#8c4a1e` | Text on `brand-terracotta-soft` | ~6.0:1 on `#fdf0e6` (AA) |
| `text` | `#2d2418` | Primary text on cream | ~13:1 (AAA) |
| `text-muted` | `#6b5e4a` | Secondary text, labels | ~5.2:1 (AA) |
| `text-faint` | `#a59982` | **Disabled / decorative only** | ~2.4:1 (fails AA — never primary content) |
| `danger` | `#b54838` | Error text + bg-tinted alerts | ~4.7:1 (AA) |
| `info` | `#4a6b8a` | Informational chips | ~4.6:1 (AA) |

**Accessibility constraints:**
- `brand-terracotta` is for non-text UI only (button backgrounds, icon fills, large stat values ≥18pt or ≥14pt bold). For text-on-terracotta-tint surfaces, use `accent-ink`.
- `text-faint` is for disabled inputs, decorative dividers, watermark-style hints — never running copy.
- All button/alert/badge designs must pass `axe-core` in CI (already wired from Axis A). Add `pa11y` contrast checks to `/styleguide` route on every primitive.

### Spacing, radii, shadows

- **Spacing scale:** Keep Tailwind defaults; add `prose-narrow: 60ch` and `prose-wide: 76ch` for content blocks.
- **Radii:** `sm 6px`, `md 10px`, `lg 12px`, `xl 16px`, `2xl 20px`, `pill 9999px`. Buttons default `pill`; cards default `xl`; inputs default `md`.
- **Shadows:** Mostly none — separate surfaces with the `brand-border` hairline. One soft elevation shadow available: `0 8px 24px rgba(45,36,24,0.08)`, used sparingly (modal, hovered card).

### Numerals & locale

- Currency display: `R 8,437` (comma thousands, no decimals unless decimal-relevant — savings goals, balances >0 with cents shown only when non-zero).
- Decimal separator: `.` (SA convention).
- Negative amounts: `-R 1,234` (minus prefix, not parentheses).
- All currency uses `tabular-nums` for column alignment.

---

## Brand mark

### Current state

The existing `CactusLogo` is a hand-rolled SVG of three sage rectangles + a pink flower circle (see `src/frontend/src/components/brand/CactusLogo.tsx`). Functional, but visibly developer-built. Replace.

### Exploration via Replicate

**Primary model:** [Recraft v3](https://replicate.com/recraft-ai/recraft-v3) — purpose-built for design assets including logos, with SVG output mode (`output_format: 'svg'`). Better odds of usable vector output than general image-gen models.

**Backup model:** [FLUX 1.1 Pro](https://replicate.com/black-forest-labs/flux-1.1-pro) — for raster illustration if Recraft's SVG output is poor. PNG output requires tracing.

**Prompt direction (kickoff seed):**
> Minimal hand-illustrated saguaro cactus glyph. Single sage-green color `#1f6f4a` on cream background `#faf5ec`. Organic, slightly rounded forms, no text, no shadow, no gradient, no realism. Vector-friendly flat illustration with strong silhouette. Inspired by the visual language of botanical illustration but distilled to a single confident shape. Square composition centered.

Iterate the prompt during PR-3 — first 5 generations will calibrate; next 20–25 will explore. Cost ~$1.50 total. **Dependency: user has a Replicate account + API token in `.env.local` as `REPLICATE_API_TOKEN`.** Spec assumes this exists before PR-3 starts; setup link: <https://replicate.com/account/api-tokens>.

### Tracing & cleanup

If Recraft's SVG output is clean, use as-is after manual review.
If only raster output is usable, run through `vtracer` (open-source raster→SVG) with:
```
vtracer --colormode binary --filter_speckle 4 --mode polygon input.png output.svg
```
Manual cleanup in Boxy SVG or Figma: simplify nodes, ensure consistent stroke logic, optimize file size <3 KB.

### Final asset set (PR-3 deliverables)

- `CactusGlyph.tsx` — SVG component, accepts `size` (number or `'sm'|'md'|'lg'`) and `color` (defaults to `currentColor`)
- `CactusLogo.tsx` — composes `CactusGlyph` + Fraunces wordmark; keeps current `tone='light'|'dark'` prop API
- `public/favicon.ico` — 32×32 multi-resolution
- `public/icon-16.png`, `public/icon-32.png`, `public/icon-180.png` (apple-touch)
- `public/icon-512.png` for PWA manifest (manifest itself is **out of scope**)
- `public/social-card.png` — 1200×630 Open Graph image with mark + working tagline (draft: *"where the small money went"* — confirm during PR-3)
- Update `<link>` tags in `index.html`

### Component prop API

`CactusLogo` keeps its current API (`className`, `tone`) so no existing callsite needs to change. The only difference is what it renders inside. This is a recurring rule across PR-2 too (see Component Primitives).

---

## Component primitives

### PR-2 in-scope (core primitive set)

Refactored to use new tokens. **All preserve existing prop APIs** — visual change only, no callsite migrations forced.

- `Button` — variants `primary` (sage), `secondary` (border + text), `ghost`, `danger`; sizes `sm`/`md`/`lg`; pill radius default
- `Card` — surface bg, `brand-border` 1px, `xl` radius; optional `elevated` variant for hover/modal contexts
- `Input` / `Textarea` / `Select` — `brand-border` resting, sage focus ring, `md` radius
- `Badge` / `Tag` — soft-bg color variants (sage-soft, terracotta-soft, danger-soft, info-soft) with corresponding `*-ink` text
- `Alert` — same color logic as Badge but with optional icon + dismiss
- `Stat` — label (`text-muted` Inter `xs uppercase`) + value (Fraunces tabular) + delta line (sage positive, terracotta negative, muted neutral). Used everywhere there's a financial figure.
- `TransactionRow` — consistent typographic rhythm for the dense Transactions table. Merchant Inter 500; date Inter 400 muted; badge small; amount Fraunces tabular right-aligned.

### Touched in their owning page PRs (in-context refactor)

These exist already and will get the same visual treatment but only when their containing page is rebuilt:

- `Modal` / `Dialog` (used in onboarding, edit flows)
- `Toast` / `Notification` (action feedback)
- `Tabs` (Insights, Settings)
- `Toggle` / `Switch` (preferences)
- `Avatar` (sidebar user section)
- `Progress` (goals progress bars)
- `Spinner` (async)
- `EmptyState` (transactions/goals empty — currently bare per Axis C audit)
- `Skeleton` (loading — Axis C scoped but not done)

Each page PR (5–7) lists which secondary primitives it refactors in its description.

---

## Token migration strategy

Existing tokens (`cactus-mint`, `cactus-charcoal`, `cactus-sage`, `cactus-prickly`, `cactus-desert`, `font-cactus`) are used throughout the codebase. **Migration is additive, not destructive.**

- **PR-1** adds new `brand-*` tokens alongside the old ones. Both coexist. Nothing visible changes until a component opts in.
- **PR-2 through PR-7** migrate component-by-component: each PR's diff includes the swap from `cactus-*` → `brand-*` for the components it touches.
- **A final cleanup PR** (PR-8, post-bulk) removes deprecated `cactus-*` tokens after `grep`-verifying zero usage remains.

`font-cactus` becomes a deprecated alias for `font-display` (`Fraunces`) in PR-1, removed in the cleanup PR.

---

## Rollout plan (7 PRs + 1 cleanup)

### PR-1 — Tokens + styleguide (~4–6 h)

- `tailwind.config.ts`: add `brand-*` colors, `display: ['Fraunces Variable', ...]`, `sans: ['Inter Variable', ...]`, radius scale, spacing additions.
- `index.css`: `@fontsource-variable/fraunces` + `@fontsource-variable/inter` imports with Latin subset; `font-display: swap`.
- `package.json`: add `@fontsource-variable/fraunces`, `@fontsource-variable/inter`.
- New route `/styleguide` (rendered only when `import.meta.env.DEV` or for authenticated admin) showing every token, every primitive, every state, every contrast pair, every font weight. Stays in the codebase as the living style guide.
- No existing component touched.

**Verification:** `/styleguide` renders; existing pages look identical (since they still use `cactus-*` tokens); bundle size delta ≤60 KB gzip; axe-core green on `/styleguide`.

### PR-2 — Core primitives (~1–1.5 d)

- Refactor the seven primitives above to use `brand-*` tokens.
- Preserve every existing prop API.
- Update component unit tests (Vitest) where the rendered HTML structure changes (e.g. new wrapper class).
- `/styleguide` updated to show every variant.

**Verification:** existing pages render with new primitive styling but unchanged content/layout; visual regression check via screenshot diff against PR-1 baseline; axe-core green; all existing tests pass.

### PR-3 — Brand mark (~1 d)

- Replicate session: generate ~30 candidates against the prompt seed; pick top 3-5; choose final.
- Trace (if needed) + clean up final SVG to <3 KB.
- Implement `CactusGlyph.tsx` + new `CactusLogo.tsx`.
- Favicon set + social card.
- Update `<link>` tags in `index.html`.

**Verification:** new mark renders at 16/24/32/48/96 px without artifacts; favicon appears in browser tab; social card preview validates on <https://opengraph.dev>; `CactusLogo` test (`src/frontend/src/components/brand/CactusLogo.test.tsx`) updated for new structure and green.

### PR-4 — App shell (~0.5 d)

- `Layout.tsx`: sidebar uses cream surface variant, sage logo, refined hover/active/focus states using `brand-*` tokens.
- `AuthBrandPanel.tsx`: cream gradient background, new mark, Fraunces tagline.
- Mobile nav: same treatment.

**Verification:** authenticated layout, unauthenticated auth shell, and mobile breakpoints all look right; `Layout.test.tsx` still green.

### PR-5 — Dashboard (~1 d)

- `pages/Dashboard.tsx`: hero greeting in Fraunces; Stat row using new `Stat` primitive; Buckets section with refined card design; Recent Transactions preview using `TransactionRow`.
- May touch secondary primitives: `EmptyState` (if no transactions), `Spinner`.

**Verification:** dashboard renders correctly with seed data and with empty state; visual diff screenshots committed to `screenshots/dashboard.png`.

### PR-6 — Transactions (~1 d)

- `pages/Transactions.tsx`: dense table rebuilt with `TransactionRow`; tabular Fraunces numerals; terracotta-soft for unclassified state; sage-soft for classified.
- Filters and search styled with new primitives.
- Touches `EmptyState`.

**Verification:** transactions list with 100+ rows scrolls well; classification badge variants all visible; new screenshot.

### PR-7 — Bulk pages (~1.5–2 d)

- Goals, Insights, SpendingPlan, Settings, Import, ForgotPassword, ResetPassword, Register, Login, plus all onboarding `phase2/*` screens.
- Same pattern: tokens + primitives + page-level layout polish. No new functionality.
- Touches secondary primitives in-context as needed: `Modal`, `Tabs`, `Toggle`, `Avatar`, `Progress`.

**Verification:** each page screenshot updated in `screenshots/`; Lighthouse mobile ≥85 on every rebranded page; axe-core green.

### PR-8 — Cleanup (~2–3 h)

- Grep verify zero usage of deprecated `cactus-*` tokens and `font-cactus`.
- Remove from `tailwind.config.ts`.
- Remove dev-only `/styleguide` admin guard if any (keep route).

**Verification:** build succeeds; no regression on any page.

---

## Per-PR verification gates (recap)

1. `/styleguide` renders without console errors
2. axe-core CI (from Axis A) stays green; new contrast checks pass for any new primitive
3. Visual regression via committed `screenshots/*.png` diff
4. Lighthouse mobile score ≥85 on every rebranded page (≥90 once Axis C's bundle work lands)
5. Bundle size delta gzip: PR-1 ≤60 KB (fonts); PR-2 ≤5 KB; PR-3 ≤4 KB; PR-4–7 net-zero (only swapping classes)
6. All existing Vitest + RTL tests green after each PR

---

## Out of scope

- Dark mode (palette is designed cream-first; deferred to a follow-up axis)
- Custom illustration system beyond the brand mark (no hero illustrations on every page)
- Animation/motion design system (subtle CSS transitions only)
- Generated Figma library (we work code-first; if Figma becomes useful later, generate from code via the figma plugin)
- Visual regression tooling like Percy/Chromatic (manual screenshot diff is what we have; Percy is its own future axis)
- PWA manifest + offline (out of program per 100x roadmap "native mobile apps — PWA only" note; revisit later)
- A11y beyond what axe-core catches automatically (screen-reader walkthroughs deferred)

## Dependencies

- **Replicate API token** in user's `.env.local` as `REPLICATE_API_TOKEN` before PR-3 starts. Setup: <https://replicate.com/account/api-tokens>. If not present by PR-3, that PR blocks.
- All other PRs are pure frontend; no backend or infra dependency.

## Risks & open questions

- **Token churn risk:** PR-1 tokens will likely need patches in subsequent PRs once real pages reveal needs. Plan for ~1–2 token tweaks per page PR; revisit as a non-blocking debt rather than redoing PR-1.
- **Replicate output quality variance:** AI illustration can be inconsistent; if 30 generations don't yield a usable mark, fall back to hand-illustrated SVG in Figma. Add ~0.5 d if this happens.
- **Font subset weight:** worst-case Fraunces + Inter variable + Latin Extended could push past the 60 KB estimate. Mitigation: drop Latin Extended and accept basic Latin only (~40 KB combined).
- **Bundle impact on Axis C target:** Axis C targets initial bundle ≤200 KB gzip on Dashboard. New fonts add ~50 KB. C still has ~700 KB → ~200 KB to find from code splitting before fonts. Coordinated — H's bundle delta noted in C's success criteria check.
- **Existing onboarding screens just shipped (Axis O, 2026-05-12).** PR-7 rebrands them. No functional change; user reviews must confirm flow still works post-rebrand.
- **No designer in the loop.** Every visual judgment is made via the Visual Companion mockups + code iteration. Risk: subjective taste calls. Mitigation: 2–3 mockup variants for any non-trivial visual decision; ship the conservative one.

## 100x roadmap integration

This spec adds **Axis H — UI rebrand + design system (Walking skeleton, decomposed)** to the 100x roadmap. Roadmap update is a one-line entry in the Program section, an entry in the Iteration depth note, an entry in the sequence diagram (branches off A; independent of B/D/C/E/F/G; can run in parallel), and a Progress section update when complete.

The roadmap edit happens as part of PR-1 (so the roadmap reflects active work).

## Status & next step

Awaiting user review of this spec. On approval:

1. Invoke `superpowers:writing-plans` skill to expand this into per-PR implementation plans under `docs/superpowers/plans/2026-05-13-axis-h-pr-{1..8}-*.md`.
2. Begin execution with PR-1 in a feature branch.
