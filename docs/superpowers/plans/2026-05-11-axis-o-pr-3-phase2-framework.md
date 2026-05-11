# Axis O — PR 3: Phase 2 Framework Intro + Interactive Slider — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Parent specs:**
- Umbrella: [2026-05-07-axis-o-onboarding-design.md](../specs/2026-05-07-axis-o-onboarding-design.md)
- PR-3 design: [2026-05-11-axis-o-pr-3-phase2-framework-design.md](../specs/2026-05-11-axis-o-pr-3-phase2-framework-design.md)

**Goal:** Add three Phase 2 screens (welcome, intro with 3 framework cards, interactive slider) before the existing post-signup 6-step wizard. Pure UI with no persistence — the slider is a teaching tool.

**Architecture:** Three new presentational components live under `src/frontend/src/pages/onboarding/phase2/`. A new `data.ts` file holds the 3 framework cards. `Onboarding.tsx` gains a 4-value `phase` state that gates which screen renders; existing wizard logic runs unchanged when `phase === 'questions'`. Slider uses native `<input type="range">` with thumb styles in `index.css`.

**Tech Stack:** React 19, Tailwind v4, Vitest 2.1 + RTL. No new dependencies, no backend changes.

---

## File Structure

**Created:**
- `src/frontend/src/pages/onboarding/phase2/data.ts` — 3 framework cards
- `src/frontend/src/pages/onboarding/phase2/Phase2Welcome.tsx` + `.test.tsx`
- `src/frontend/src/pages/onboarding/phase2/Phase2Intro.tsx` + `.test.tsx`
- `src/frontend/src/pages/onboarding/phase2/Phase2Slider.tsx` + `.test.tsx`

**Modified:**
- `src/frontend/src/pages/Onboarding.tsx` — `phase` state machine wrapper
- `src/frontend/src/index.css` — add custom slider thumb styles

---

## Task 1: Slider thumb styles + framework cards data

**Files:**
- Modify: `src/frontend/src/index.css`
- Create: `src/frontend/src/pages/onboarding/phase2/data.ts`

- [ ] **Step 1: Add slider thumb styles to `index.css`**

Append at the end of `src/frontend/src/index.css`:

```css
/* ── Phase 2 slider thumb (cross-browser) ── */
.cactus-slider {
  -webkit-appearance: none;
  appearance: none;
  outline: none;
  cursor: pointer;
  height: 8px;
  border-radius: 4px;
}
.cactus-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid currentColor;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  margin-top: -8px;
}
.cactus-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  border: 3px solid currentColor;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
}
```

- [ ] **Step 2: Create the framework cards data file**

Path: `src/frontend/src/pages/onboarding/phase2/data.ts`

```ts
export interface FrameworkCard {
  title: 'Needs' | 'Wants' | 'Goals';
  subtitle: string;
  emoji: string;
  percent: 50 | 30 | 20;
  /** Tailwind class for the percent text color */
  colorClass: string;
  /** Tailwind class for the card background */
  bgClass: string;
  examples: string;
}

export const frameworkCards: FrameworkCard[] = [
  {
    title: 'Needs',
    subtitle: 'The stuff that keeps life running',
    emoji: '🏠',
    percent: 50,
    colorClass: 'text-cactus-sage',
    bgClass: 'bg-cactus-needs-bg',
    examples: 'Rent, groceries, transport, utilities, insurance, minimum debt payments',
  },
  {
    title: 'Wants',
    subtitle: 'The stuff that makes life fun',
    emoji: '🛍️',
    percent: 30,
    colorClass: 'text-cactus-desert',
    bgClass: 'bg-cactus-wants-bg',
    examples: 'Dining out, entertainment, subscriptions, shopping, hobbies',
  },
  {
    title: 'Goals',
    subtitle: 'The stuff that builds your future',
    emoji: '🎯',
    percent: 20,
    colorClass: 'text-cactus-prickly',
    bgClass: 'bg-cactus-goals-bg',
    examples: 'Emergency fund, extra debt payoff, savings targets, investments',
  },
];
```

- [ ] **Step 3: Verify build still passes**

`cd src/frontend && npm run build`

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
cd /Users/henricktissink/Sauce/cactus/.claude/worktrees/axis-o+pr-3-phase2-framework
git add src/frontend/src/index.css src/frontend/src/pages/onboarding/phase2/data.ts
git commit -m "feat(onboarding): add Phase 2 framework cards data + slider thumb styles"
```

---

## Task 2: `<Phase2Welcome />` (TDD)

**Files:**
- Create: `src/frontend/src/pages/onboarding/phase2/Phase2Welcome.tsx`
- Create: `src/frontend/src/pages/onboarding/phase2/Phase2Welcome.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Phase2Welcome } from './Phase2Welcome';

describe('Phase2Welcome', () => {
  it('renders the welcome heading and "Show me" CTA', () => {
    render(<Phase2Welcome onContinue={() => {}} />);
    expect(screen.getByRole('heading', { name: /you're in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show me/i })).toBeInTheDocument();
  });

  it('calls onContinue when the CTA is clicked', async () => {
    const fn = vi.fn();
    render(<Phase2Welcome onContinue={fn} />);
    await userEvent.click(screen.getByRole('button', { name: /show me/i }));
    expect(fn).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run to verify failure**

`cd src/frontend && npm run test -- Phase2Welcome`

- [ ] **Step 3: Implement**

```tsx
import { Btn } from '../../../components/brand/Btn';

interface Phase2WelcomeProps {
  onContinue: () => void;
}

export function Phase2Welcome({ onContinue }: Phase2WelcomeProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10 text-center bg-cactus-sandstone font-cactus animate-fade-up">
      <div className="text-5xl mb-3" aria-hidden="true">
        👋
      </div>
      <h1 className="font-cactus font-bold text-2xl text-cactus-charcoal m-0 mb-2">
        You're in! Welcome.
      </h1>
      <p className="font-cactus text-base text-cactus-charcoal/60 font-medium m-0 mb-2 leading-relaxed max-w-xs">
        Before we connect your bank, let us show you how Cactus thinks about money.
      </p>
      <p className="font-cactus text-sm text-cactus-charcoal/40 font-medium m-0 mb-9 leading-relaxed max-w-[260px]">
        It's simpler than you think. Three buckets. That's it. 🪣🪣🪣
      </p>
      <div className="w-auto">
        <Btn onClick={onContinue} className="px-12">
          Show me
        </Btn>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass**

Expected: 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/pages/onboarding/phase2/Phase2Welcome.tsx src/frontend/src/pages/onboarding/phase2/Phase2Welcome.test.tsx
git commit -m "feat(onboarding): add <Phase2Welcome /> splash screen"
```

---

## Task 3: `<Phase2Intro />` (TDD)

**Files:**
- Create: `src/frontend/src/pages/onboarding/phase2/Phase2Intro.tsx`
- Create: `src/frontend/src/pages/onboarding/phase2/Phase2Intro.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Phase2Intro } from './Phase2Intro';

describe('Phase2Intro', () => {
  it('renders the heading and the 3 framework cards', () => {
    render(<Phase2Intro onContinue={() => {}} onSkip={() => {}} />);
    expect(screen.getByRole('heading', { name: /meet your spending plan/i })).toBeInTheDocument();
    expect(screen.getByText('Needs')).toBeInTheDocument();
    expect(screen.getByText('Wants')).toBeInTheDocument();
    expect(screen.getByText('Goals')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('30%')).toBeInTheDocument();
    expect(screen.getByText('20%')).toBeInTheDocument();
  });

  it('calls onContinue when "See it in action" is clicked', async () => {
    const fn = vi.fn();
    render(<Phase2Intro onContinue={fn} onSkip={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: /see it in action/i }));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('calls onSkip when "Skip for now" is clicked', async () => {
    const fn = vi.fn();
    render(<Phase2Intro onContinue={() => {}} onSkip={fn} />);
    await userEvent.click(screen.getByRole('button', { name: /skip for now/i }));
    expect(fn).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run to verify failure**

- [ ] **Step 3: Implement**

```tsx
import { Btn } from '../../../components/brand/Btn';
import { frameworkCards } from './data';

interface Phase2IntroProps {
  onContinue: () => void;
  onSkip: () => void;
}

export function Phase2Intro({ onContinue, onSkip }: Phase2IntroProps) {
  return (
    <div className="flex flex-col min-h-screen bg-cactus-sandstone font-cactus px-6 animate-fade-up">
      <div className="flex-1 pt-6 overflow-auto">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2" aria-hidden="true">
            💡
          </div>
          <h1 className="font-cactus font-bold text-[22px] text-cactus-charcoal m-0 mb-1.5">
            Meet your Spending Plan
          </h1>
          <p className="font-cactus text-sm text-cactus-charcoal/40 font-medium m-0 leading-relaxed max-w-[300px] mx-auto">
            We split your money into three simple buckets. No spreadsheets. No stress.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {frameworkCards.map((card) => (
            <div
              key={card.title}
              className={`${card.bgClass} rounded-2xl p-4 px-[18px] flex items-start gap-3.5 animate-fade-up`}
            >
              <div className="text-3xl shrink-0 pt-0.5" aria-hidden="true">
                {card.emoji}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <span className="font-cactus font-bold text-[17px] text-cactus-charcoal">
                    {card.title}
                  </span>
                  <span className={`font-cactus font-bold text-xl ${card.colorClass}`}>
                    {card.percent}%
                  </span>
                </div>
                <p className="font-cactus text-[13px] text-cactus-charcoal/50 font-semibold m-0 mb-1">
                  {card.subtitle}
                </p>
                <p className="font-cactus text-[11.5px] text-cactus-charcoal/40 font-medium m-0">
                  e.g. {card.examples}
                </p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-center font-cactus text-[12.5px] text-cactus-charcoal/40 font-medium mt-4 mb-0 leading-relaxed">
          Based on the 50/30/20 guideline — a great starting point.
          <br />
          You can always adjust it to fit your life.
        </p>
      </div>
      <div className="py-4 pb-7 shrink-0">
        <Btn onClick={onContinue}>See it in action</Btn>
        <button
          type="button"
          onClick={onSkip}
          className="block mx-auto mt-3 bg-transparent border-none font-cactus font-semibold text-[13px] text-cactus-charcoal/40 cursor-pointer"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass**

Expected: 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/pages/onboarding/phase2/Phase2Intro.tsx src/frontend/src/pages/onboarding/phase2/Phase2Intro.test.tsx
git commit -m "feat(onboarding): add <Phase2Intro /> 3-card framework explainer"
```

---

## Task 4: `<Phase2Slider />` (TDD)

**Files:**
- Create: `src/frontend/src/pages/onboarding/phase2/Phase2Slider.tsx`
- Create: `src/frontend/src/pages/onboarding/phase2/Phase2Slider.test.tsx`

This is the heaviest component in the PR — interactive math with default values matching prototype.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { fireEvent } from '@testing-library/react';
import { Phase2Slider } from './Phase2Slider';

describe('Phase2Slider', () => {
  it('renders default values: income R35,000, Needs 50%, Wants 30%, Goals 20%', () => {
    render(<Phase2Slider onContinue={() => {}} />);
    expect(screen.getByText(/monthly income/i)).toBeInTheDocument();
    expect(screen.getByText(/r35,000/i)).toBeInTheDocument();
    // Default split is rendered as percentages in the bar chart labels
    expect(screen.getByText(/50%/)).toBeInTheDocument();
    expect(screen.getByText(/30%/)).toBeInTheDocument();
    expect(screen.getByText(/20%/)).toBeInTheDocument();
  });

  it('shows "Done in 3 months" at default 35,000 income / 20% goals (R7,000/mo for R20,000 debt)', () => {
    render(<Phase2Slider onContinue={() => {}} />);
    expect(screen.getByText(/done in 3 months/i)).toBeInTheDocument();
  });

  it('rebalances Goals when Needs slider is dragged up to 60%', () => {
    render(<Phase2Slider onContinue={() => {}} />);
    const needsSlider = screen.getByLabelText(/needs/i, { selector: 'input[type="range"]' });
    fireEvent.change(needsSlider, { target: { value: '60' } });
    // Needs becomes 60%; Wants stays at 30; Goals drops to 10%
    expect(screen.getByText(/60%/)).toBeInTheDocument();
    expect(screen.getByText(/10%/)).toBeInTheDocument();
  });

  it('expands the income disclosure on click', async () => {
    render(<Phase2Slider onContinue={() => {}} />);
    expect(screen.queryByLabelText(/income amount/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /monthly income/i }));
    expect(screen.getByLabelText(/income amount/i)).toBeInTheDocument();
  });

  it('calls onContinue when "Got it" is clicked', async () => {
    const fn = vi.fn();
    render(<Phase2Slider onContinue={fn} />);
    await userEvent.click(screen.getByRole('button', { name: /got it/i }));
    expect(fn).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run to verify failure**

- [ ] **Step 3: Implement**

```tsx
import { useState } from 'react';
import { Btn } from '../../../components/brand/Btn';

const fmt = (n: number) => 'R' + Math.round(n).toLocaleString('en-ZA');

interface Phase2SliderProps {
  onContinue: () => void;
}

export function Phase2Slider({ onContinue }: Phase2SliderProps) {
  const [income, setIncome] = useState(35000);
  const [needs, setNeeds] = useState(50);
  const [wants, setWants] = useState(30);
  const [showIncome, setShowIncome] = useState(false);

  const goals = Math.max(0, 100 - needs - wants);
  const nA = Math.round((needs / 100) * income);
  const wA = Math.round((wants / 100) * income);
  const gA = income - nA - wA;
  const monthsToPayoff = gA > 0 ? Math.ceil(20000 / gA) : Infinity;

  const handleNeeds = (v: number) => setNeeds(Math.min(v, 100 - wants));
  const handleWants = (v: number) => setWants(Math.min(v, 100 - needs));

  const sliderStyle = (color: string, value: number, max = 80) => ({
    width: '100%',
    background: `linear-gradient(to right, ${color} 0%, ${color} ${(value / max) * 100}%, #E8E8E8 ${
      (value / max) * 100
    }%, #E8E8E8 100%)`,
    color,
  });

  const bars = [
    { label: 'Needs', percent: needs, color: '#77DD77' },
    { label: 'Wants', percent: wants, color: '#FFCC00' },
    { label: 'Goals', percent: goals, color: '#FF6F61' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-cactus-sandstone font-cactus px-6 animate-fade-up">
      <div className="pt-6 text-center mb-4">
        <h2 className="font-cactus font-bold text-xl text-cactus-charcoal m-0 mb-1">
          Play with your plan
        </h2>
        <p className="font-cactus text-[13px] text-cactus-charcoal/40 font-medium m-0">
          Drag the sliders to see how your money moves.
        </p>
      </div>

      <div className="text-center mb-4">
        <button
          type="button"
          onClick={() => setShowIncome((s) => !s)}
          className="inline-flex items-center gap-1.5 bg-cactus-sandstone border-[1.5px] border-cactus-overlay rounded-full py-2 px-4 cursor-pointer font-cactus font-semibold text-[13px] text-cactus-charcoal/50"
          aria-expanded={showIncome}
        >
          Monthly income: {fmt(income)}{' '}
          <span
            className={`text-[10px] transition-transform inline-block ${
              showIncome ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          >
            ▼
          </span>
        </button>
        {showIncome && (
          <div className="mt-3 animate-fade-up">
            <input
              type="range"
              min="5000"
              max="150000"
              step="1000"
              value={income}
              onChange={(e) => setIncome(parseInt(e.target.value))}
              aria-label="Income amount"
              className="cactus-slider w-4/5"
              style={sliderStyle('#999', income - 5000, 145000)}
            />
            <p className="font-cactus text-[11px] text-cactus-charcoal/40 font-medium mt-1.5 m-0">
              Adjust to see your real numbers
            </p>
          </div>
        )}
      </div>

      <div className="flex rounded-xl overflow-hidden h-[52px] mb-6">
        {bars.map((b) => (
          <div
            key={b.label}
            style={{ width: `${b.percent}%`, background: b.color }}
            className="flex flex-col items-center justify-center transition-[width] duration-300 overflow-hidden"
          >
            {b.percent > 5 && (
              <>
                <span className="font-cactus font-bold text-[10px] text-cactus-charcoal/70 uppercase">
                  {b.label}
                </span>
                <span className="font-cactus font-bold text-[15px] text-cactus-charcoal">
                  {b.percent}%
                </span>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 mb-5">
        <SliderRow
          label="🏠 Needs"
          value={needs}
          colorClass="text-cactus-sage"
          colorHex="#77DD77"
          absolute={nA}
          onChange={handleNeeds}
          sliderStyle={sliderStyle}
          inputAriaLabel="Needs"
        />
        <SliderRow
          label="🛍️ Wants"
          value={wants}
          colorClass="text-cactus-desert"
          colorHex="#FFCC00"
          absolute={wA}
          onChange={handleWants}
          sliderStyle={sliderStyle}
          inputAriaLabel="Wants"
        />
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="font-cactus font-semibold text-sm text-cactus-charcoal">
              🎯 Goals
            </span>
            <span className="font-cactus font-bold text-sm text-cactus-prickly">
              {goals}% · {fmt(gA)}
            </span>
          </div>
          <div className="h-2 rounded bg-cactus-overlay overflow-hidden">
            <div
              className="h-full bg-cactus-prickly rounded transition-[width] duration-300"
              style={{ width: `${(goals / 80) * 100}%` }}
            />
          </div>
          <p className="font-cactus text-[11px] text-cactus-charcoal/40 font-medium mt-1.5 m-0">
            Auto-calculated — this is your future fund
          </p>
        </div>
      </div>

      <div className="bg-cactus-goals-bg rounded-2xl py-3.5 px-4 mb-3">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base" aria-hidden="true">
            🎯
          </span>
          <span className="font-cactus font-semibold text-[13px] text-cactus-charcoal">
            Example: Pay off R20,000 debt
          </span>
        </div>
        <div className="font-cactus font-bold text-[22px] text-cactus-prickly mb-0.5">
          {monthsToPayoff === Infinity
            ? 'Set a goal % first'
            : monthsToPayoff <= 1
              ? 'Done in 1 month 🎉'
              : `Done in ${monthsToPayoff} months`}
        </div>
        <p className="font-cactus text-xs text-cactus-charcoal/50 font-medium m-0">
          {gA > 0
            ? `Based on putting ${fmt(gA)}/month toward goals`
            : 'Move the sliders to see the magic'}
        </p>
      </div>

      <div className="py-2 pb-7 shrink-0">
        <Btn onClick={onContinue}>Got it — let's build mine</Btn>
      </div>
    </div>
  );
}

interface SliderRowProps {
  label: string;
  value: number;
  colorClass: string;
  colorHex: string;
  absolute: number;
  onChange: (v: number) => void;
  sliderStyle: (color: string, value: number, max?: number) => React.CSSProperties;
  inputAriaLabel: string;
}

function SliderRow({
  label,
  value,
  colorClass,
  colorHex,
  absolute,
  onChange,
  sliderStyle,
  inputAriaLabel,
}: SliderRowProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <span className="font-cactus font-semibold text-sm text-cactus-charcoal">{label}</span>
        <span className={`font-cactus font-bold text-sm ${colorClass}`}>
          {value}% · {fmt(absolute)}
        </span>
      </div>
      <input
        type="range"
        min="0"
        max="80"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        aria-label={inputAriaLabel}
        className="cactus-slider"
        style={sliderStyle(colorHex, value)}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass**

Expected: 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/pages/onboarding/phase2/Phase2Slider.tsx src/frontend/src/pages/onboarding/phase2/Phase2Slider.test.tsx
git commit -m "feat(onboarding): add <Phase2Slider /> interactive 50/30/20 teaching tool"
```

---

## Task 5: Wire Phase 2 into `Onboarding.tsx`

**Files:**
- Modify: `src/frontend/src/pages/Onboarding.tsx`

- [ ] **Step 1: Add the Phase 2 imports**

Add to the top of `Onboarding.tsx` imports (after the existing `apiClient` import):

```tsx
import { Phase2Welcome } from './onboarding/phase2/Phase2Welcome';
import { Phase2Intro } from './onboarding/phase2/Phase2Intro';
import { Phase2Slider } from './onboarding/phase2/Phase2Slider';
```

- [ ] **Step 2: Add the `phase` state and early returns**

Inside the `OnboardingPage` component, **at the very top of the function body** (before `useState(0)` for currentStep), add:

```tsx
  const [phase, setPhase] = useState<
    'phase2-welcome' | 'phase2-intro' | 'phase2-slider' | 'questions'
  >('phase2-welcome');
```

Then **immediately before the existing `return (` statement** (around line ~250 — find the JSX block that starts with the page background `<div className="min-h-screen bg-cactus-sandstone font-cactus flex flex-col">`), add:

```tsx
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
```

The existing `return (` for the 6-step wizard then runs only when `phase === 'questions'`.

- [ ] **Step 3: Run the full test suite**

`cd src/frontend && npm run test`

Expected: previous baseline + N new Phase2-* tests passing. No regressions.

- [ ] **Step 4: Run lint + format + build**

```bash
cd src/frontend
npm run lint
npm run format:check
npm run build
```

All clean.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/pages/Onboarding.tsx
git commit -m "$(cat <<'EOF'
feat(onboarding): wire Phase 2 (welcome / intro / slider) before the 6-step wizard

Adds a phase state machine to Onboarding.tsx that runs the 3 Phase 2 teaching screens before falling through to the existing 6-step wizard. Phase 2 is purely UI — no values are persisted. Skip-from-intro and finish-from-slider both transition to the wizard.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Open the PR

> **Pre-task setup:** the executor should be on branch `axis-o/pr-3-phase2-framework`.

- [ ] **Step 1: Run final gates from worktree root**

```bash
cd /Users/henricktissink/Sauce/cactus/.claude/worktrees/axis-o+pr-3-phase2-framework
cd src/frontend && npm run test && npm run lint && npm run format:check && npm run build
```

All must be green.

- [ ] **Step 2: Push the branch**

```bash
git push -u origin worktree-axis-o+pr-3-phase2-framework:axis-o/pr-3-phase2-framework
```

- [ ] **Step 3: Create the PR**

```bash
gh pr create --title "Axis O PR 3: Phase 2 framework intro + interactive slider" --body "$(cat <<'EOF'
## Summary
- Three new screens that run immediately after register: Phase2Welcome ("You're in!"), Phase2Intro (3 framework cards), Phase2Slider (interactive 50/30/20 with live pay-off-R20,000 preview)
- `Onboarding.tsx` becomes a phase state machine; existing 6-step wizard runs unchanged when `phase === 'questions'`
- Skip-for-now button on Phase2Intro bypasses the slider and goes straight to the wizard
- No persistence anywhere — the slider is purely educational

## Out of scope (deferred)
- Goal pick + goal-detail with affordability classification (PR O-4)
- Multi-source income + secondary income sources (PR O-6)
- Brand rollout to Login/Dashboard/etc. (PRs O-7..O-8)

## Test plan
- [x] Frontend: previous baseline + 10 new tests across 3 new component files
- [x] `npm run lint`, `npm run format:check`, `npm run build` all clean
- [ ] Manual: register a new account → land on Phase2Welcome → walk through to slider → "Got it" → existing wizard appears
- [ ] Manual: at default values, slider shows "Done in 3 months" for R20,000 debt
- [ ] Manual: dragging Needs to 60% rebalances Wants/Goals
- [ ] Manual: Skip-for-now from Phase2Intro bypasses the slider
- [ ] Manual: refreshing during Phase 2 resets to Phase2Welcome (no persistence per O3-D2)

## Spec / plan
- [Umbrella spec](docs/superpowers/specs/2026-05-07-axis-o-onboarding-design.md)
- [PR-3 design](docs/superpowers/specs/2026-05-11-axis-o-pr-3-phase2-framework-design.md)
- [PR-3 plan](docs/superpowers/plans/2026-05-11-axis-o-pr-3-phase2-framework.md)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

If `gh` is not authenticated, report the URL `https://github.com/henrick-tissink/cactus/pull/new/axis-o/pr-3-phase2-framework` and the title + body for manual creation.

- [ ] **Step 4: Hand off to user for merge**

---

## Self-Review

**Spec coverage:** Walked the PR-3 design's 11 acceptance criteria against the 6 tasks.
- AC1-2 (phase2-welcome + show me) — Task 2
- AC3 (skip → wizard) — Task 3
- AC4 (intro → slider) — Task 3 + Task 5
- AC5-6 (slider math) — Task 4
- AC7 (income disclosure) — Task 4
- AC8 (got it → wizard) — Tasks 4 + 5
- AC9 (no persistence) — by design; all state in component-level useState
- AC10 (≥3 tests/component) — Tasks 2-4
- AC11 (lint/format/build clean) — Task 5 + Task 6

**Placeholder scan:** No TBD / TODO / "implement later" — every step has concrete code.

**Type consistency:** `FrameworkCard.title` is `'Needs' | 'Wants' | 'Goals'` literal-union; matches the prototype. `Phase2Slider`'s slider math uses `Math.round`/`Math.ceil` consistently; no division by zero (guarded by `gA > 0`).

**Risks / followups for next PR (O-4):**
- Phase 2 doesn't yet read the survey answers (Q1-5 from O-2). Goal-pick recommendations in O-4 will read them.
- The hardcoded R20,000 example will be replaced with the user's actual debt total in O-4.
- The slider math is centralized in `Phase2Slider`; if O-4 needs to surface similar affordability math, it should be extracted to a shared utility.
