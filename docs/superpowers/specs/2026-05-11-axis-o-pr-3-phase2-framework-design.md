# Axis O — PR 3: Phase 2 Framework Intro + Interactive Slider

**Date:** 2026-05-11
**Parent umbrella:** [2026-05-07-axis-o-onboarding-design.md](2026-05-07-axis-o-onboarding-design.md)
**Status:** Draft, executing
**Effort:** ~1 day
**Depth:** Solid

---

## What this PR ships

The Phase 2 "teach the framework" experience that runs **immediately after a user registers** and lands on `/onboarding`. Three new screens precede the existing 6-step questionnaire:

1. **Phase2Welcome** — "You're in! Welcome." splash with a "Show me" CTA.
2. **Phase2Intro** — Three framework cards (Needs 50%, Wants 30%, Goals 20%) with examples. "See it in action" advances to the slider; "Skip for now" jumps straight to the existing wizard.
3. **Phase2Slider** — Interactive 50/30/20 sliders with live "Pay off R20,000 debt → done in N months" preview. Default income R35,000. Dragging Needs/Wants rebalances Goals automatically. "Show income" disclosure reveals an income slider. "Got it — let's build mine" advances to the wizard.

This is **pure UI with zero persistence** — the slider is a teaching tool. None of its values are stored; the user enters real income later (PR O-6).

After Phase 2 completes (or is skipped), the existing 6-step questionnaire (Onboarding.tsx from PR O-2) takes over as today.

## Decisions specific to this PR

| # | Decision | Rationale |
|---|---|---|
| O3-D1 | **State machine lives inside `Onboarding.tsx`**, not in a separate route. A `phase` state with values `'phase2-welcome' \| 'phase2-intro' \| 'phase2-slider' \| 'questions'` gates the render. | Avoids a routing cycle (`/welcome` → register → `/onboarding/intro` → `/onboarding`). Onboarding.tsx becomes a state machine like WelcomePage was in O-2. |
| O3-D2 | **No persistence anywhere in Phase 2.** Slider values live in component state and disappear when Phase 2 ends. | The methodology framework doc calls Phase 2 "discovery, not data entry" — values entered here are illustrative, not committed. |
| O3-D3 | **Skip path goes from `phase2-intro` → `'questions'` (existing wizard), NOT to goal-pick.** | Goal-pick lives in PR O-4. Until then, the natural skip target is the existing wizard. |
| O3-D4 | **Slider clamps at 0..80 per axis** (prototype behavior). Goals = `max(0, 100 - needs - wants)`. The Goals axis is **derived, not slidable**. | Prevents a user from setting Goals = 100% (which would zero out Needs and break the framework's "live within means" premise). Matches prototype. |
| O3-D5 | **Three framework cards data lives in `pages/onboarding/phase2/data.ts`.** Static; no localization concern for this PR. | Mirrors the `pages/onboarding/data.ts` pattern from O-2. Reusing the same `WizardQuestion`-style separation isn't appropriate since framework cards have different shape (`title`, `subtitle`, `emoji`, `percent`, `color`, `bg`, `examples`). |
| O3-D6 | **Slider implementation uses native `<input type="range">` with custom Tailwind/CSS styling for thumb/track.** | Browser-native, accessible by default (arrow keys work). Custom thumb via the existing `index.css` slider styles is acceptable. No need for a slider library. |
| O3-D7 | **Live "Pay off R20,000" preview is hardcoded as the example.** Future PRs may parameterize. | The prototype hardcodes R20,000 — keeps the demo tangible. Personalization comes in PR O-4 (goal pick + goal-detail). |

## File structure

**Created:**
- `src/frontend/src/pages/onboarding/phase2/data.ts` — 3 framework cards (Needs / Wants / Goals)
- `src/frontend/src/pages/onboarding/phase2/Phase2Welcome.tsx`
- `src/frontend/src/pages/onboarding/phase2/Phase2Welcome.test.tsx`
- `src/frontend/src/pages/onboarding/phase2/Phase2Intro.tsx`
- `src/frontend/src/pages/onboarding/phase2/Phase2Intro.test.tsx`
- `src/frontend/src/pages/onboarding/phase2/Phase2Slider.tsx`
- `src/frontend/src/pages/onboarding/phase2/Phase2Slider.test.tsx`

**Modified:**
- `src/frontend/src/pages/Onboarding.tsx` — add `phase` state, route Phase 2 phases through the new components, render existing wizard only when `phase === 'questions'`.

## Component contracts

### `Phase2Welcome`

Props: `{ onContinue: () => void }`. Renders 👋 emoji, "You're in! Welcome." heading, subtitle copy about "let us show you how Cactus thinks about money", "Show me" `<Btn>` that calls `onContinue`.

### `Phase2Intro`

Props: `{ onContinue: () => void; onSkip: () => void }`. Renders 💡 emoji + "Meet your Spending Plan" heading + 3 framework cards (from `data.ts`) + tagline "Based on the 50/30/20 guideline" + "See it in action" `<Btn>` + a "Skip for now" text button.

### `Phase2Slider`

Props: `{ onContinue: () => void }`. Renders:
- Heading + subtitle
- "Monthly income" disclosure pill (shows current income); expanded reveals an income slider (R5,000 – R150,000)
- Stacked bar chart showing Needs/Wants/Goals proportions
- Two sliders: Needs (0..80), Wants (0..80)
- Auto-computed Goals bar
- Live preview card: "Pay off R20,000 debt" → either "Set a goal % first" / "Done in 1 month 🎉" / "Done in N months"
- "Got it — let's build mine" `<Btn>` that calls `onContinue`

### `Onboarding.tsx` (modified)

Add at the top of `OnboardingPage`:

```tsx
const [phase, setPhase] = useState<'phase2-welcome' | 'phase2-intro' | 'phase2-slider' | 'questions'>(
  'phase2-welcome'
);

if (phase === 'phase2-welcome') {
  return <Phase2Welcome onContinue={() => setPhase('phase2-intro')} />;
}
if (phase === 'phase2-intro') {
  return (
    <Phase2Intro
      onContinue={() => setPhase('phase2-slider')}
      onSkip={() => setPhase('questions')}
    />
  );
}
if (phase === 'phase2-slider') {
  return <Phase2Slider onContinue={() => setPhase('questions')} />;
}

// phase === 'questions' — fall through to existing wizard render
```

The existing fast-forward `useQuery` + render-phase derivation logic continues to fire on mount even during Phase 2 — that's fine; it pre-computes `currentStep` so the wizard is ready when the user reaches it.

## Slider math

```ts
income: number               // R35,000 default
needs: number                // 0..80 (% of income)
wants: number                // 0..80 (% of income)
goals = Math.max(0, 100 - needs - wants)

// User drags Needs slider to value v:
needs = Math.min(v, 100 - wants)   // clamp so goals doesn't go negative

// User drags Wants slider to value v:
wants = Math.min(v, 100 - needs)

// Absolute amounts:
nA = Math.round((needs / 100) * income)
wA = Math.round((wants / 100) * income)
gA = income - nA - wA              // residual rather than (goals/100)*income, avoids rounding drift

// Pay-off-R20,000 example:
mo = gA > 0 ? Math.ceil(20000 / gA) : Infinity

// Display:
//   gA === 0           → "Set a goal % first"
//   mo === 1           → "Done in 1 month 🎉"
//   otherwise          → `Done in ${mo} months`
```

## Acceptance criteria

1. Newly-registered user lands on `/onboarding` and sees Phase2Welcome.
2. Clicking "Show me" → Phase2Intro renders with 3 framework cards.
3. Clicking "Skip for now" → existing 6-step wizard renders (Phase 2 bypassed entirely).
4. Clicking "See it in action" → Phase2Slider renders.
5. Slider math: at default income R35,000 and 50/30/20 split, Goals shows "R7,000" and pay-off preview shows "Done in 3 months" (`ceil(20000/7000) = 3`).
6. Dragging Needs to 60% pulls Wants down proportionally; Goals shows `max(0, 100 - newNeeds - newWants)`.
7. Income disclosure expands/collapses on click and reveals an income slider (R5,000–R150,000).
8. Clicking "Got it — let's build mine" → existing 6-step wizard renders.
9. All Phase 2 values are NOT persisted — refreshing the browser mid-Phase-2 takes the user back to Phase2Welcome.
10. Frontend tests: ≥3 tests per new component (welcome render, intro render + skip, slider math + interaction). Page-level test for the phase transitions in Onboarding.tsx.
11. Lint / format / build clean. Full suite passes.

## Out of scope

- OAuth/social signup integration (umbrella D10).
- Replacing the existing 6-step wizard with the prototype's new screen flow (PRs O-4..O-6).
- Persisting Phase 2 slider values (umbrella + O3-D2).
- Brand rollout to non-onboarding pages (O-7/O-8).
- "Pay off R20,000" being personalized by user's actual debt (the prototype hardcodes it; we follow suit).

## Open risks

1. **Slider thumb styling cross-browser.** Webkit and Firefox need separate selectors. The prototype's CSS lives inline `<style>` tags; in our build we put it in `index.css` or scoped CSS. Risk: subtle visual mismatch on the demo screen. Mitigation: copy the prototype's selectors verbatim into `index.css`.
2. **Phase 2 user clicks browser back from `phase2-slider` → tries to return to `phase2-intro`.** Since phase is component state, browser back leaves the page entirely. Acceptable for v1; future PRs may add a Back button on Phase 2 screens.
3. **Refreshing mid-Phase-2 resets to Phase 2 welcome.** Per O3-D2 this is intentional (no persistence), but worth confirming the existing fast-forward `useQuery` doesn't have side effects that re-trigger.
