# Axis O — PR 7: Dashboard + Layout Brand Rollout — Design

**Parent umbrella spec:** [2026-05-07-axis-o-onboarding-design.md](2026-05-07-axis-o-onboarding-design.md)

## Goal

Roll the cactus brand (sandstone + sage + desert + prickly + charcoal palette, Quicksand `font-cactus`, soft cards, sage-anchored progress) into the post-auth shell: `Layout` (sidebar + mobile header + bottom tab nav) and the `Dashboard` page. Consolidate the duplicate `CactusLogo` inline definition in `Layout.tsx` to the canonical exported component at `components/brand/CactusLogo.tsx`.

After this PR, the user lands in a post-auth shell that visually flows from the onboarding wizard — no jarring "different app" feel.

## Non-goals (deferred)

- **Auth pages** (`Login`, `Register`, `ForgotPassword`, `ResetPassword`) — they use 3 separate inline `currentColor`-themed logos that live on a distinct brand-panel theme. Logo consolidation there is a follow-up PR.
- **Other shell pages** (`Transactions`, `Budget` aka SpendingPlan, `Goals`, `Insights`, `Settings`, `Import`) — that's PR O-8.
- **New Dashboard content** (e.g., bank-connection CTA card, recent goals carousel, projected savings). This PR is a paint pass; FTUX content stays as-is.

## Design decisions

**D1: Sidebar background — sandstone, not forest.**
The current sidebar is deep forest (`#0f2419`, `--cactus-forest`). Onboarding is all warm sandstone + sage accents — the brand voice is "warm, friendly, light." Carrying the forest sidebar into the post-auth experience would feel like two different products. Switching the sidebar to `bg-cactus-sandstone` with `border-r border-cactus-overlay` keeps the visual continuity. Logo+text use `text-cactus-charcoal`.

**D2: Active nav state — sage-light pill with sage left border.**
Pre-rebrand active state was `text-white bg-[var(--cactus-green)]/dark forest` — high contrast inversion. New treatment: `bg-cactus-sage-light text-cactus-charcoal font-bold` with a 3px `border-l border-cactus-sage` running the height. Hover (inactive): `bg-cactus-sage-light/40`.

**D3: Logo unification — Layout uses the exported `<CactusLogo />`.**
`Layout.tsx` defines an inline 64-viewBox SVG with hardcoded `#1B7A4A`/`#E8F5EE` fills (pre-rebrand colors). Replace it with the canonical `<CactusLogo />` from `src/frontend/src/components/brand/CactusLogo.tsx` which already renders the new-brand SVG (sage/prickly/desert fills) plus the "cactus" wordmark via `font-cactus`. The canonical component already includes the text label, so the adjacent `<span>` in Layout becomes redundant — delete it.

**D4: Mobile header + bottom tab bar — same sandstone treatment.**
Mobile header: sandstone bg, charcoal text, hamburger as charcoal icon. Mobile bottom nav: sandstone bg with `border-t border-cactus-overlay`, active tab uses `text-cactus-sage` (no pill — tab bars stay compact).

**D5: Dashboard page background + typography.**
Page: `bg-cactus-sandstone font-cactus` (replaces current `bg-[var(--surface)]`). All headings: `text-cactus-charcoal`. All secondary text: `text-cactus-charcoal/60` (instead of `text-gray-500`).

**D6: Hero metric — sage progress fill.**
The "R{remaining} remaining of R{income}" card currently uses `bg-[var(--cactus-green)]` for the fill and `bg-[var(--cactus-mint)]` for the track. New: track is `bg-cactus-overlay`, fill is `bg-cactus-sage`. Number copy: `text-cactus-charcoal` for the figure, `text-cactus-charcoal/40` for the caption.

**D7: Bucket bar — sage / desert / prickly mapping.**
Currently buckets are hardcoded `#2563EB` (Needs blue) / `#8B5CF6` (Wants purple) / `#10B981` (Goals teal). New mapping carries the onboarding's bucket semantics:
- **Needs → `bg-cactus-sage`** — healthy, growing essentials
- **Wants → `bg-cactus-desert`** — sunshine, joy
- **Goals → `bg-cactus-prickly`** — passionate striving toward something

Legend chip backgrounds use the existing soft variants: `bg-cactus-needs-bg` / `bg-cactus-wants-bg` / `bg-cactus-goals-bg`.

**D8: Primary Goal card — sage-light, not amber.**
Today the primary-goal section uses an amber gradient (`bg-gradient-to-br from-amber-50 to-amber-100`) with amber-600 accents and a `bg-amber-100 text-amber-600` "Primary" badge. Replace with:
- Card bg: `bg-cactus-sage-light` (consistent with sage-as-goal-anchor)
- "Primary" badge: `bg-cactus-sage text-white`
- Progress bar fill: `bg-cactus-sage`
- Headings: `text-cactus-charcoal`

(Side note: long-term we may want goal-card color to vary by goal type — sage for savings, prickly for debt — but that's a refinement, not this PR.)

**D9: Transaction icons — sage for credit, prickly for debit.**
TrendingUp icon on credit transactions: `text-cactus-sage`. TrendingDown on debit: `text-cactus-prickly`. Replaces `text-green-600` / `text-red-500`. Amount text follows the same coloring.

**D10: Unclassified banner — goals-bg tinted alert.**
Currently amber-100 alert background. Use `bg-cactus-goals-bg` (`#ffe8e8`, light pink — already in palette) with `text-cactus-charcoal` body and `text-cactus-prickly` icon. Reads as "attention" without being alarming.

**D11: FTUX checklist — match onboarding voice.**
The "let's get your finances in order" 3-step checklist (rendered when Dashboard has no data) gets:
- Container: `bg-cactus-sandstone` (still on sandstone page; outer border + inner card stay)
- Active step indicator: `bg-cactus-sage text-white` circle (currently amber)
- Completed checkmarks: `text-cactus-sage`
- Inactive steps: charcoal/40 outline

Keep all copy unchanged — this is purely a paint pass.

**D12: Animations — keep current `animate-fade-in` for Dashboard.**
Onboarding uses `animate-fade-up` for screen-by-screen transitions, which fits a wizard. Dashboard is a landing page; `animate-fade-in` (already in use) is the right call. Don't gratuitously change animations.

**D13: No new tokens needed.**
Every Tailwind class above resolves to an existing `--color-cactus-*` token in `index.css`. No additions to `@theme`.

**D14: Tests — add `Layout.test.tsx`, keep `Dashboard.test.tsx` minimal.**
Layout currently has no test file. Add a smoke test covering: renders the brand logo, lists the 5 nav items (Dashboard/Transactions/Budget/Goals/Insights), highlights the active route, mobile drawer toggles open/closed. Dashboard test already covers loading/empty/populated states; keep it — only update copy/structural assertions if a rebrand change removes a tested string. Color classes are not asserted.

**D15: Eradicate legacy tokens from O-7 scope.**
After this PR, `Layout.tsx` and `Dashboard.tsx` must contain zero references to `--cactus-green`, `--cactus-forest`, `--cactus-mint`, `--surface`, `--text-primary`, `--text-secondary`, `--text-muted`. Those legacy CSS variables will linger in auth pages until a follow-up PR; that's fine. The scope here is the post-auth shell entry point.

## File structure

**Modified:**
- `src/frontend/src/components/layout/Layout.tsx` — swap inline logo for canonical, rebrand all sections, drop legacy CSS-var classes
- `src/frontend/src/pages/Dashboard.tsx` — paint pass on every section per D5-D11

**Created:**
- `src/frontend/src/components/layout/Layout.test.tsx` — smoke tests per D14

**No backend changes. No new components. No new CSS tokens.**

## Acceptance criteria

1. `Layout.tsx` imports `<CactusLogo />` from `components/brand/CactusLogo` and renders it in both the desktop sidebar header and the mobile top header. The inline `cactusIcon` function and the adjacent "Cactus" `<span>` are deleted.
2. Sidebar bg is `bg-cactus-sandstone`. Active nav item has `bg-cactus-sage-light` + sage left border. Hover state uses `bg-cactus-sage-light/40`.
3. Mobile header + bottom nav use the same sandstone + sage active treatment.
4. Dashboard page is `bg-cactus-sandstone font-cactus`. Hero metric uses `bg-cactus-sage` for the progress fill.
5. Bucket bar uses Needs=`cactus-sage` / Wants=`cactus-desert` / Goals=`cactus-prickly`. Legend chips use `cactus-needs-bg` / `cactus-wants-bg` / `cactus-goals-bg`.
6. Primary Goal card uses `bg-cactus-sage-light` with sage progress and a `bg-cactus-sage text-white` "Primary" badge.
7. Recent Transactions use sage TrendingUp / prickly TrendingDown icons + matching amount colors.
8. Unclassified banner uses `bg-cactus-goals-bg` with charcoal body + prickly icon.
9. FTUX checklist (empty Dashboard state) uses sandstone container and sage progress indicators per D11.
10. `Layout.test.tsx` exists with at minimum: renders CactusLogo, lists 5 nav items, highlights active route, mobile drawer toggles.
11. `Dashboard.test.tsx` still passes. `Layout.test.tsx` passes.
12. `grep -rn "cactus-green\|cactus-forest\|cactus-mint\|var(--surface)\|var(--text-primary)\|var(--text-secondary)\|var(--text-muted)" src/frontend/src/pages/Dashboard.tsx src/frontend/src/components/layout/Layout.tsx` returns NOTHING.
13. `npm run test`, `npm run lint`, `npm run format:check`, `npm run build` all clean.

## Risks

- **Visual regression for existing users.** Sandstone sidebar is a noticeable change from the dark forest. If users dislike it during dogfooding, a partial revert (sandstone → charcoal sidebar) is trivial — single bg class swap. Document this in the PR description so reviewers can call it out.
- **Bucket color semantics shift.** Existing dashboard users may have associated blue=Needs, purple=Wants, teal=Goals. New mapping (sage/desert/prickly) overrides that. Acceptable because onboarding already trains the new mapping in the slider and estimate screens.
- **Test file added without backfill.** `Layout.test.tsx` only adds smoke tests for the rebranded markup, not the full nav behavior matrix (we never had those tests). That's by design — a backfill is a separate effort, not gated on this PR.

## Out-of-scope follow-ups noted in code

- A `// TODO: O-8 — replace legacy --surface / --text-* tokens` comment is NOT added; the legacy tokens just disappear from O-7 files and live on in O-8 files until that PR.
- Auth-page CactusLogo consolidation: NOT touched here. Three duplicate inline logos in `Login.tsx`, `ForgotPassword.tsx`, `ResetPassword.tsx` remain pending.
