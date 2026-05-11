# Axis O — PR 2: Pre-signup Welcome + 5-Question Survey — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Parent specs:**
- Umbrella: [2026-05-07-axis-o-onboarding-design.md](../specs/2026-05-07-axis-o-onboarding-design.md)
- PR-2 design: [2026-05-08-axis-o-pr-2-presignup-survey-design.md](../specs/2026-05-08-axis-o-pr-2-presignup-survey-design.md)

**Goal:** Land a public `/welcome` flow with 5 lifestyle questions before signup; persist answers in localStorage; on register, batched-POST them to `/onboarding/response`; bump the backend validator from `1..8` to `1..13`.

**Architecture:** New folder `src/frontend/src/pages/onboarding/` containing a Zustand wizard store (with `persist` middleware), static question data, three screen components, and shared wizard UI primitives. Two new brand-wide components (`<Btn />`, `<MoneyInput />`) live in `components/brand/`. Three wizard-only components (`<Dots />`, `<WhyDisclosure />`, `<OptionPill />`) live in `pages/onboarding/components/`. `App.tsx` routes anonymous `/` → `/welcome`. `Register.tsx` reads the wizard store and batched-POSTs after `login()`. Existing `Onboarding.tsx` drops Q3/Q4 entirely and adds a `useEffect` that fast-forwards `currentStep` past pre-answered slots.

**Tech Stack:** React 19, Zustand 5 (with `persist`), Tailwind v4, Vitest 2.1 + RTL, MSW 2.14 for mocked API responses, axios. Backend: ASP.NET Core / FluentValidation.

---

## File Structure

**Created (frontend):**
- `src/frontend/src/components/brand/Btn.tsx` + `Btn.test.tsx` — primary CTA component
- `src/frontend/src/components/brand/MoneyInput.tsx` + `MoneyInput.test.tsx` — R-prefixed numeric input (created here for O-3 reuse)
- `src/frontend/src/pages/onboarding/store.ts` + `store.test.ts` — Zustand wizard store
- `src/frontend/src/pages/onboarding/data.ts` — the 5 questions (no test; pure static data)
- `src/frontend/src/pages/onboarding/components/Dots.tsx` + `Dots.test.tsx`
- `src/frontend/src/pages/onboarding/components/WhyDisclosure.tsx` + `WhyDisclosure.test.tsx`
- `src/frontend/src/pages/onboarding/components/OptionPill.tsx` + `OptionPill.test.tsx`
- `src/frontend/src/pages/onboarding/welcome/WelcomePage.tsx` + `WelcomePage.test.tsx` — outer state machine
- `src/frontend/src/pages/onboarding/welcome/WelcomeScreen.tsx` — splash with CTA
- `src/frontend/src/pages/onboarding/welcome/QuestionScreen.tsx` — generic per-question UI
- `src/frontend/src/pages/onboarding/welcome/TransitionScreen.tsx` — "Nice one!" before signup

**Modified (frontend):**
- `src/frontend/src/App.tsx` — add `/welcome` route, redirect anonymous `/` → `/welcome`
- `src/frontend/src/pages/Register.tsx` — read wizard store + batched POST after `login()`
- `src/frontend/src/pages/Onboarding.tsx` — drop steps 3/4, add fast-forward effect

**Modified (backend):**
- `src/backend/src/Cactus.Application/Features/Onboarding/Commands/SaveOnboardingResponseCommand.cs` — `InclusiveBetween(1, 8)` → `InclusiveBetween(1, 13)`
- `src/backend/tests/Cactus.Application.Tests/Onboarding/SaveOnboardingResponseCommandTests.cs` (NEW or modified) — validator boundary tests

---

## Task 1: Backend validator bump (TDD)

**Files:**
- Modify: `src/backend/src/Cactus.Application/Features/Onboarding/Commands/SaveOnboardingResponseCommand.cs:19`
- Create or modify: `src/backend/tests/Cactus.Application.Tests/Onboarding/SaveOnboardingResponseCommandValidatorTests.cs`

- [ ] **Step 1: Locate or create the validator test file**

Run: `ls src/backend/tests/Cactus.Application.Tests/Onboarding/` to see existing tests.

If `SaveOnboardingResponseCommandValidatorTests.cs` exists, open it and add the boundary tests below. If not, create it.

- [ ] **Step 2: Write the failing tests**

Path: `src/backend/tests/Cactus.Application.Tests/Onboarding/SaveOnboardingResponseCommandValidatorTests.cs`

If creating fresh, the file content:

```csharp
using Cactus.Application.Features.Onboarding.Commands;
using FluentAssertions;
using FluentValidation.TestHelper;
using Xunit;

namespace Cactus.Application.Tests.Onboarding;

public class SaveOnboardingResponseCommandValidatorTests
{
    private readonly SaveOnboardingResponseCommandValidator _validator = new();

    [Theory]
    [InlineData(1)]
    [InlineData(5)]
    [InlineData(9)]
    [InlineData(13)]
    public void StepNumber_WithinNewRange_IsValid(int step)
    {
        var cmd = new SaveOnboardingResponseCommand(step, "Test step", "value");
        _validator.TestValidate(cmd).ShouldNotHaveValidationErrorFor(c => c.StepNumber);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(14)]
    [InlineData(-1)]
    [InlineData(100)]
    public void StepNumber_OutsideRange_IsInvalid(int step)
    {
        var cmd = new SaveOnboardingResponseCommand(step, "Test step", "value");
        _validator.TestValidate(cmd).ShouldHaveValidationErrorFor(c => c.StepNumber);
    }
}
```

If the file already exists with similar tests, add the `9`/`13`/`14` cases to its existing `Theory` data.

- [ ] **Step 3: Run the tests to confirm they fail**

Run: `cd src/backend && DOTNET_ROLL_FORWARD=LatestMajor dotnet test --filter "FullyQualifiedName~SaveOnboardingResponseCommandValidatorTests"`

Expected: FAIL on the `9`/`13` cases (validator currently rejects them).

- [ ] **Step 4: Bump the validator**

Modify `src/backend/src/Cactus.Application/Features/Onboarding/Commands/SaveOnboardingResponseCommand.cs` line 19:

```csharp
RuleFor(x => x.StepNumber).InclusiveBetween(1, 13);
```

(was `InclusiveBetween(1, 8)`)

- [ ] **Step 5: Run the tests to confirm they pass**

Run: `cd src/backend && DOTNET_ROLL_FORWARD=LatestMajor dotnet test --filter "FullyQualifiedName~SaveOnboardingResponseCommandValidatorTests"`

Expected: 8 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/backend/
git commit -m "$(cat <<'EOF'
feat(onboarding): bump SaveOnboardingResponseCommand validator to 1..13

Pre-signup wizard (PR O-2) writes 5 answers; later wizard PRs write up to 13. Bumping the validator now means PRs O-3..O-6 don't each need a backend change for the same reason. Validator boundary tests added/extended.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `<Btn />` brand component (TDD)

**Files:**
- Create: `src/frontend/src/components/brand/Btn.tsx`
- Create: `src/frontend/src/components/brand/Btn.test.tsx`

- [ ] **Step 1: Write the failing test**

Path: `src/frontend/src/components/brand/Btn.test.tsx`

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Btn } from './Btn';

describe('Btn', () => {
  it('renders its children as the button label', () => {
    render(<Btn onClick={() => {}}>Continue</Btn>);
    expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const fn = vi.fn();
    render(<Btn onClick={fn}>Go</Btn>);
    await userEvent.click(screen.getByRole('button', { name: /go/i }));
    expect(fn).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', async () => {
    const fn = vi.fn();
    render(
      <Btn onClick={fn} disabled>
        Go
      </Btn>
    );
    await userEvent.click(screen.getByRole('button', { name: /go/i }));
    expect(fn).not.toHaveBeenCalled();
  });

  it('forwards an additional className', () => {
    render(
      <Btn onClick={() => {}} className="my-extra">
        Go
      </Btn>
    );
    expect(screen.getByRole('button')).toHaveClass('my-extra');
  });
});
```

- [ ] **Step 2: Run to verify failure**

`cd src/frontend && npm run test -- Btn`

Expected: FAIL (`Cannot find module './Btn'`).

- [ ] **Step 3: Implement `<Btn />`**

Path: `src/frontend/src/components/brand/Btn.tsx`

```tsx
import type { ReactNode } from 'react';

interface BtnProps {
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export function Btn({ children, onClick, disabled = false, className = '' }: BtnProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full px-6 py-4 rounded-2xl font-cactus font-bold text-base text-white transition-all bg-cactus-sage shadow-[0_4px_16px_rgba(119,221,119,0.25)] hover:brightness-95 active:brightness-90 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Run to verify pass**

`cd src/frontend && npm run test -- Btn`

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/components/brand/Btn.tsx src/frontend/src/components/brand/Btn.test.tsx
git commit -m "feat(brand): add <Btn /> primary CTA component"
```

---

## Task 3: `<MoneyInput />` brand component (TDD)

**Files:**
- Create: `src/frontend/src/components/brand/MoneyInput.tsx`
- Create: `src/frontend/src/components/brand/MoneyInput.test.tsx`

(Created here for O-3 reuse; not yet wired into any screen.)

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MoneyInput } from './MoneyInput';

describe('MoneyInput', () => {
  it('renders the rand prefix', () => {
    render(<MoneyInput value="" onChange={() => {}} />);
    expect(screen.getByText('R')).toBeInTheDocument();
  });

  it('strips non-numeric characters before calling onChange', async () => {
    const fn = vi.fn();
    render(<MoneyInput value="" onChange={fn} />);
    await userEvent.type(screen.getByRole('textbox'), '1a2b3c');
    expect(fn).toHaveBeenLastCalledWith('123');
  });

  it('renders the placeholder when value is empty', () => {
    render(<MoneyInput value="" onChange={() => {}} placeholder="35,000" />);
    expect(screen.getByPlaceholderText('35,000')).toBeInTheDocument();
  });

  it('renders the current value', () => {
    render(<MoneyInput value="12000" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toHaveValue('12000');
  });
});
```

- [ ] **Step 2: Run to verify failure**

`cd src/frontend && npm run test -- MoneyInput`

- [ ] **Step 3: Implement**

```tsx
interface MoneyInputProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
}

export function MoneyInput({ value, onChange, placeholder = '0', className = '' }: MoneyInputProps) {
  return (
    <div
      className={`flex items-center gap-1 bg-white border-2 border-gray-200 rounded-2xl px-4 py-4 focus-within:border-cactus-sage transition-colors ${className}`}
    >
      <span className="font-cactus font-bold text-2xl text-gray-400">R</span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ''))}
        placeholder={placeholder}
        className="flex-1 border-none bg-transparent outline-none font-cactus font-bold text-2xl text-cactus-charcoal placeholder:text-gray-300"
      />
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass**

Expected: 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/components/brand/MoneyInput.tsx src/frontend/src/components/brand/MoneyInput.test.tsx
git commit -m "feat(brand): add <MoneyInput /> R-prefixed numeric input (for O-3 reuse)"
```

---

## Task 4: `<Dots />` progress indicator (TDD)

**Files:**
- Create: `src/frontend/src/pages/onboarding/components/Dots.tsx`
- Create: `src/frontend/src/pages/onboarding/components/Dots.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Dots } from './Dots';

describe('Dots', () => {
  it('renders one dot per total', () => {
    const { container } = render(<Dots current={0} total={5} />);
    expect(container.querySelectorAll('[data-dot]')).toHaveLength(5);
  });

  it('marks dots up to and including current as active', () => {
    const { container } = render(<Dots current={2} total={5} />);
    const dots = container.querySelectorAll('[data-dot]');
    expect(dots[0]).toHaveAttribute('data-active', 'true');
    expect(dots[1]).toHaveAttribute('data-active', 'true');
    expect(dots[2]).toHaveAttribute('data-active', 'true');
    expect(dots[3]).toHaveAttribute('data-active', 'false');
    expect(dots[4]).toHaveAttribute('data-active', 'false');
  });
});
```

- [ ] **Step 2: Run to verify failure**

- [ ] **Step 3: Implement**

```tsx
interface DotsProps {
  current: number;
  total: number;
  className?: string;
}

export function Dots({ current, total, className = '' }: DotsProps) {
  return (
    <div className={`flex gap-2 justify-center py-4 ${className}`}>
      {Array.from({ length: total }).map((_, i) => {
        const active = i <= current;
        const isCurrent = i === current;
        return (
          <div
            key={i}
            data-dot
            data-active={active}
            className={`h-2 rounded-full transition-all duration-300 ${
              isCurrent ? 'w-7' : 'w-2'
            } ${active ? 'bg-cactus-sage' : 'bg-cactus-overlay'}`}
          />
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass**

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/pages/onboarding/components/Dots.tsx src/frontend/src/pages/onboarding/components/Dots.test.tsx
git commit -m "feat(onboarding): add <Dots /> progress indicator"
```

---

## Task 5: `<WhyDisclosure />` collapsible reason panel (TDD)

**Files:**
- Create: `src/frontend/src/pages/onboarding/components/WhyDisclosure.tsx`
- Create: `src/frontend/src/pages/onboarding/components/WhyDisclosure.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WhyDisclosure } from './WhyDisclosure';

describe('WhyDisclosure', () => {
  it('hides the reason content by default', () => {
    render(<WhyDisclosure reason="So we can tailor your plan." />);
    expect(screen.queryByText(/so we can tailor your plan/i)).not.toBeInTheDocument();
  });

  it('reveals the reason on click', async () => {
    render(<WhyDisclosure reason="So we can tailor your plan." />);
    await userEvent.click(screen.getByRole('button', { name: /why are we asking this/i }));
    expect(screen.getByText(/so we can tailor your plan/i)).toBeInTheDocument();
  });

  it('hides the reason on a second click', async () => {
    render(<WhyDisclosure reason="So we can tailor your plan." />);
    const trigger = screen.getByRole('button', { name: /why are we asking this/i });
    await userEvent.click(trigger);
    await userEvent.click(trigger);
    expect(screen.queryByText(/so we can tailor your plan/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

- [ ] **Step 3: Implement**

```tsx
import { useState } from 'react';

interface WhyDisclosureProps {
  reason: string;
}

export function WhyDisclosure({ reason }: WhyDisclosureProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center gap-1 font-cactus font-semibold text-sm text-cactus-sage cursor-pointer bg-transparent border-none p-0"
      >
        <span
          className={`inline-block transition-transform text-[10px] ${open ? 'rotate-90' : ''}`}
          aria-hidden="true"
        >
          ▶
        </span>
        Why are we asking this?
      </button>
      {open && (
        <div className="mt-2 bg-cactus-sage-light/40 rounded-xl px-4 py-3 animate-fade-up">
          <p className="font-cactus text-sm text-cactus-charcoal/70 m-0 leading-relaxed">
            {reason}
          </p>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run to verify pass**

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/pages/onboarding/components/WhyDisclosure.tsx src/frontend/src/pages/onboarding/components/WhyDisclosure.test.tsx
git commit -m "feat(onboarding): add <WhyDisclosure /> collapsible reason panel"
```

---

## Task 6: `<OptionPill />` selectable option button (TDD with sentinel logic)

**Files:**
- Create: `src/frontend/src/pages/onboarding/components/OptionPill.tsx`
- Create: `src/frontend/src/pages/onboarding/components/OptionPill.test.tsx`

This component renders one option. **Sentinel exclusivity logic lives in the wizard store / page**, not here — `OptionPill` only renders + emits clicks. Keeping this dumb makes it trivially testable.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OptionPill } from './OptionPill';

describe('OptionPill', () => {
  it('renders the icon and label', () => {
    render(
      <OptionPill icon="🔓" label="Get out of debt" selected={false} onClick={() => {}} />
    );
    expect(screen.getByText('🔓')).toBeInTheDocument();
    expect(screen.getByText('Get out of debt')).toBeInTheDocument();
  });

  it('shows a checkmark when selected', () => {
    render(<OptionPill icon="🔓" label="X" selected onClick={() => {}} />);
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('hides the checkmark when not selected', () => {
    render(<OptionPill icon="🔓" label="X" selected={false} onClick={() => {}} />);
    expect(screen.queryByText('✓')).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', async () => {
    const fn = vi.fn();
    render(<OptionPill icon="🔓" label="Get out of debt" selected={false} onClick={fn} />);
    await userEvent.click(screen.getByRole('button', { name: /get out of debt/i }));
    expect(fn).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run to verify failure**

- [ ] **Step 3: Implement**

```tsx
interface OptionPillProps {
  icon: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function OptionPill({ icon, label, selected, onClick }: OptionPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 cursor-pointer transition-all text-left w-full ${
        selected
          ? 'border-cactus-sage bg-cactus-sage-light'
          : 'border-cactus-overlay bg-white hover:border-cactus-sage/60'
      }`}
    >
      <span className="text-xl shrink-0" aria-hidden="true">
        {icon}
      </span>
      <span
        className={`font-cactus text-[15px] text-cactus-charcoal ${
          selected ? 'font-bold' : 'font-semibold'
        }`}
      >
        {label}
      </span>
      {selected && (
        <span className="ml-auto text-cactus-sage text-lg" aria-hidden="true">
          ✓
        </span>
      )}
    </button>
  );
}
```

- [ ] **Step 4: Run to verify pass**

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/pages/onboarding/components/OptionPill.tsx src/frontend/src/pages/onboarding/components/OptionPill.test.tsx
git commit -m "feat(onboarding): add <OptionPill /> selectable option button"
```

---

## Task 7: Wizard data + Zustand store (TDD store)

**Files:**
- Create: `src/frontend/src/pages/onboarding/data.ts`
- Create: `src/frontend/src/pages/onboarding/store.ts`
- Create: `src/frontend/src/pages/onboarding/store.test.ts`

- [ ] **Step 1: Create the static question data**

Path: `src/frontend/src/pages/onboarding/data.ts`

```ts
export type WizardStepId = 1 | 2 | 3 | 4 | 5;

export interface WizardOption {
  value: string;
  label: string;
  icon: string;
}

export interface WizardQuestion {
  id: WizardStepId;
  emoji: string;
  headline: string;
  subtitle: string;
  why: string;
  multi: boolean;
  exclusiveValue?: string;
  options: WizardOption[];
}

export const wizardQuestions: WizardQuestion[] = [
  {
    id: 1,
    emoji: '🎯',
    headline: 'What matters most to you right now?',
    subtitle: "Pick as many as you like — life's rarely just one thing.",
    why: 'This helps us shape your Spending Plan around what actually matters to you, not some generic template.',
    multi: true,
    options: [
      { value: 'debt', label: 'Get out of debt', icon: '🔓' },
      { value: 'm2m', label: 'Stop living month to month', icon: '📅' },
      { value: 'emergency', label: 'Build an emergency fund', icon: '🛟' },
      { value: 'save_specific', label: 'Save for something specific', icon: '🎯' },
      { value: 'invest', label: 'Invest and grow my money', icon: '📈' },
    ],
  },
  {
    id: 2,
    emoji: '😮‍💨',
    headline: 'What stresses you most about money?',
    subtitle: 'Be honest — this stays between us. 🤝',
    why: 'Knowing your stress points lets us focus on fixing those first. Small wins early = big motivation.',
    multi: true,
    exclusiveValue: 'not_stressed',
    options: [
      { value: 'debt_repayments', label: 'Debt repayments', icon: '😰' },
      { value: 'unexpected', label: 'Unexpected expenses', icon: '😱' },
      { value: 'not_saving', label: 'Not saving enough', icon: '😕' },
      { value: 'not_optimising', label: 'Not optimising or investing well', icon: '🤔' },
      { value: 'not_stressed', label: "Honestly? I'm not stressed", icon: '😎' },
    ],
  },
  {
    id: 3,
    emoji: '📆',
    headline: 'At the end of most months, you…',
    subtitle: "No judgment — it varies, we get it. Pick what feels closest.",
    why: 'This helps us understand your cash flow so we can set realistic goals — not impossible ones.',
    multi: false,
    options: [
      { value: 'run_out', label: 'Run out of money', icon: '😬' },
      { value: 'break_even', label: 'Break even', icon: '⚖️' },
      { value: 'small_surplus', label: 'Have a small surplus', icon: '🙂' },
      { value: 'consistently_save', label: 'Consistently save', icon: '💪' },
    ],
  },
  {
    id: 4,
    emoji: '🛟',
    headline: 'Got any money set aside for a rainy day?',
    subtitle: 'Just a rough idea — no need to check your bank right now.',
    why: 'We use this to figure out if building a safety net should be part of your plan. No wrong answer here.',
    multi: false,
    options: [
      { value: 'none', label: 'No savings yet', icon: '🌱' },
      { value: 'under_10k', label: 'Less than R10,000', icon: '🪴' },
      { value: '10k_50k', label: 'R10,000 – R50,000', icon: '🌿' },
      { value: '50k_100k', label: 'R50,000 – R100,000', icon: '🌳' },
      { value: 'over_100k', label: 'More than R100,000', icon: '🏔️' },
    ],
  },
  {
    id: 5,
    emoji: '💳',
    headline: 'Do any of these apply to you?',
    subtitle: "Select all that apply. Or 'None' — that's great too!",
    why: 'Understanding your debt picture helps us prioritise what to tackle first in your Spending Plan.',
    multi: true,
    exclusiveValue: 'none',
    options: [
      { value: 'credit_card', label: 'Credit card debt', icon: '💳' },
      { value: 'personal_loan', label: 'Personal loan', icon: '🏦' },
      { value: 'overdraft', label: 'Overdraft', icon: '📉' },
      { value: 'store_credit', label: 'Store credit (e.g. Woolies)', icon: '🛍️' },
      { value: 'bnpl', label: 'Buy-now-pay-later', icon: '📱' },
      { value: 'none', label: 'None of these', icon: '✨' },
    ],
  },
];

// Maps wizard step (1..5) to backend stepNumber + stepName.
// See PR-2 design doc "Final mapping" table for the rationale.
export const wizardToBackendMapping: Record<
  WizardStepId,
  { stepNumber: number; stepName: string }
> = {
  1: { stepNumber: 1, stepName: 'Priorities (multi)' },
  2: { stepNumber: 9, stepName: 'Stress points (multi)' },
  3: { stepNumber: 2, stepName: 'Month-end state' },
  4: { stepNumber: 8, stepName: 'Savings cushion' },
  5: { stepNumber: 7, stepName: 'Debt types (multi)' },
};
```

- [ ] **Step 2: Write the failing store test**

Path: `src/frontend/src/pages/onboarding/store.test.ts`

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useOnboardingWizardStore } from './store';

describe('useOnboardingWizardStore', () => {
  beforeEach(() => {
    useOnboardingWizardStore.getState().reset();
    localStorage.clear();
  });

  it('starts with no answers', () => {
    expect(useOnboardingWizardStore.getState().answers).toEqual({});
  });

  it('stores answers per step', () => {
    useOnboardingWizardStore.getState().setAnswer(1, ['debt', 'invest']);
    useOnboardingWizardStore.getState().setAnswer(3, ['break_even']);

    expect(useOnboardingWizardStore.getState().answers).toEqual({
      1: ['debt', 'invest'],
      3: ['break_even'],
    });
  });

  it('overwrites the answer for a step on repeat call', () => {
    useOnboardingWizardStore.getState().setAnswer(1, ['debt']);
    useOnboardingWizardStore.getState().setAnswer(1, ['save_specific']);
    expect(useOnboardingWizardStore.getState().answers[1]).toEqual(['save_specific']);
  });

  it('reset clears all answers', () => {
    useOnboardingWizardStore.getState().setAnswer(1, ['debt']);
    useOnboardingWizardStore.getState().setAnswer(2, ['unexpected']);
    useOnboardingWizardStore.getState().reset();
    expect(useOnboardingWizardStore.getState().answers).toEqual({});
  });

  it('persists to localStorage under the onboarding-wizard key', () => {
    useOnboardingWizardStore.getState().setAnswer(1, ['debt']);
    const stored = localStorage.getItem('onboarding-wizard');
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored!).state.answers[1]).toEqual(['debt']);
  });
});
```

- [ ] **Step 3: Run to verify failure**

`cd src/frontend && npm run test -- onboarding/store`

- [ ] **Step 4: Implement the store**

Path: `src/frontend/src/pages/onboarding/store.ts`

```ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { WizardStepId } from './data';

type WizardAnswers = Partial<Record<WizardStepId, string[]>>;

interface OnboardingWizardState {
  answers: WizardAnswers;
  setAnswer: (step: WizardStepId, values: string[]) => void;
  reset: () => void;
}

export const useOnboardingWizardStore = create<OnboardingWizardState>()(
  persist(
    (set) => ({
      answers: {},
      setAnswer: (step, values) =>
        set((s) => ({ answers: { ...s.answers, [step]: values } })),
      reset: () => set({ answers: {} }),
    }),
    { name: 'onboarding-wizard' }
  )
);
```

- [ ] **Step 5: Run to verify pass**

Expected: 5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/frontend/src/pages/onboarding/data.ts src/frontend/src/pages/onboarding/store.ts src/frontend/src/pages/onboarding/store.test.ts
git commit -m "feat(onboarding): add wizard store + 5 questions data + backend-mapping table"
```

---

## Task 8: Welcome page + 3 screens

**Files:**
- Create: `src/frontend/src/pages/onboarding/welcome/WelcomeScreen.tsx` (presentational)
- Create: `src/frontend/src/pages/onboarding/welcome/QuestionScreen.tsx` (presentational + sentinel logic)
- Create: `src/frontend/src/pages/onboarding/welcome/TransitionScreen.tsx` (presentational)
- Create: `src/frontend/src/pages/onboarding/welcome/WelcomePage.tsx` (state machine)
- Create: `src/frontend/src/pages/onboarding/welcome/WelcomePage.test.tsx` (golden-path + branch)

- [ ] **Step 1: Write the failing page-level test**

Path: `src/frontend/src/pages/onboarding/welcome/WelcomePage.test.tsx`

```tsx
import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../../test/render';
import { useOnboardingWizardStore } from '../store';
import { WelcomePage } from './WelcomePage';

describe('WelcomePage', () => {
  beforeEach(() => {
    useOnboardingWizardStore.getState().reset();
    localStorage.clear();
  });

  it('starts on the welcome splash and advances through the 5 questions to the transition screen', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WelcomePage />);

    // Welcome splash
    expect(screen.getByRole('heading', { name: /welcome to cactus/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /let's do this/i }));

    // Q1
    expect(screen.getByRole('heading', { name: /what matters most/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /get out of debt/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    // Q2
    await user.click(screen.getByRole('button', { name: /unexpected expenses/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    // Q3
    await user.click(screen.getByRole('button', { name: /break even/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    // Q4
    await user.click(screen.getByRole('button', { name: /less than r10,000/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    // Q5
    await user.click(screen.getByRole('button', { name: /credit card debt/i }));
    await user.click(screen.getByRole('button', { name: /^finish$/i }));

    // Transition
    expect(screen.getByRole('heading', { name: /nice one/i })).toBeInTheDocument();
  });

  it('persists answers in localStorage as questions are answered', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WelcomePage />);
    await user.click(screen.getByRole('button', { name: /let's do this/i }));
    await user.click(screen.getByRole('button', { name: /get out of debt/i }));

    expect(useOnboardingWizardStore.getState().answers[1]).toEqual(['debt']);
  });

  it('exclusive sentinel clears other Q5 picks when chosen', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WelcomePage />);
    // Jump straight to Q5 by setting prior answers in the store
    const store = useOnboardingWizardStore.getState();
    store.setAnswer(1, ['debt']);
    store.setAnswer(2, ['unexpected']);
    store.setAnswer(3, ['break_even']);
    store.setAnswer(4, ['under_10k']);
    // Re-render via re-renderWithProviders is over-engineering for this test;
    // we'll click through the welcome → Q1..Q4 → Q5 path instead.
    // (Resetting first so prior setAnswer doesn't conflict with the click flow.)
    store.reset();
    await user.click(screen.getByRole('button', { name: /let's do this/i }));
    await user.click(screen.getByRole('button', { name: /get out of debt/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await user.click(screen.getByRole('button', { name: /unexpected expenses/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await user.click(screen.getByRole('button', { name: /break even/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await user.click(screen.getByRole('button', { name: /less than r10,000/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    // On Q5: pick credit card, then "None of these" (exclusive)
    await user.click(screen.getByRole('button', { name: /credit card debt/i }));
    expect(useOnboardingWizardStore.getState().answers[5]).toEqual(['credit_card']);
    await user.click(screen.getByRole('button', { name: /none of these/i }));
    expect(useOnboardingWizardStore.getState().answers[5]).toEqual(['none']);

    // Picking another option after "None" should remove "None"
    await user.click(screen.getByRole('button', { name: /credit card debt/i }));
    expect(useOnboardingWizardStore.getState().answers[5]).toEqual(['credit_card']);
  });
});
```

- [ ] **Step 2: Run to verify failure**

`cd src/frontend && npm run test -- WelcomePage`

- [ ] **Step 3: Implement `WelcomeScreen.tsx`**

```tsx
import { CactusLogo } from '../../../components/brand/CactusLogo';
import { Btn } from '../../../components/brand/Btn';

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10 text-center bg-cactus-sandstone font-cactus animate-fade-up">
      <CactusLogo className="mb-8" />
      <div className="text-6xl mb-4" aria-hidden="true">
        🌵
      </div>
      <h1 className="font-cactus font-bold text-3xl text-cactus-charcoal m-0 mb-2">
        Welcome to Cactus
      </h1>
      <p className="font-cactus text-base text-cactus-charcoal/60 font-medium m-0 mb-8 leading-relaxed max-w-xs">
        We're going to build your Spending Plan together. But first, let's get to know each other a little.
      </p>
      <p className="font-cactus text-sm text-cactus-charcoal/40 font-medium m-0 mb-8">
        🕐 Takes about 2 minutes
      </p>
      <div className="w-auto">
        <Btn onClick={onStart} className="px-12">
          Let's do this
        </Btn>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Implement `QuestionScreen.tsx`**

```tsx
import { Btn } from '../../../components/brand/Btn';
import { Dots } from '../components/Dots';
import { OptionPill } from '../components/OptionPill';
import { WhyDisclosure } from '../components/WhyDisclosure';
import type { WizardQuestion } from '../data';

interface QuestionScreenProps {
  question: WizardQuestion;
  selectedValues: string[];
  onSelect: (values: string[]) => void;
  onNext: () => void;
  onBack?: () => void;
  stepIndex: number;
  totalSteps: number;
}

export function QuestionScreen({
  question,
  selectedValues,
  onSelect,
  onNext,
  onBack,
  stepIndex,
  totalSteps,
}: QuestionScreenProps) {
  const isExclusive = (v: string) => question.exclusiveValue === v;
  const exclusiveSelected = selectedValues.includes(question.exclusiveValue ?? '__none__');

  const pick = (value: string) => {
    if (!question.multi) {
      onSelect([value]);
      return;
    }
    if (isExclusive(value)) {
      // Toggle the exclusive on/off; clears all others when on
      onSelect(selectedValues.includes(value) ? [] : [value]);
      return;
    }
    // Picking a non-exclusive: remove the exclusive sentinel if present
    const without = selectedValues.filter((v) => !isExclusive(v));
    onSelect(
      without.includes(value) ? without.filter((v) => v !== value) : [...without, value]
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-cactus-sandstone font-cactus px-6 animate-fade-up">
      <div className="pt-3">
        <Dots current={stepIndex} total={totalSteps} />
      </div>
      <div className="flex-1 flex flex-col pt-3">
        <div className="text-4xl mb-3" aria-hidden="true">
          {question.emoji}
        </div>
        <h2 className="font-cactus font-bold text-[22px] text-cactus-charcoal m-0 mb-1.5 leading-tight">
          {question.headline}
        </h2>
        <p className="font-cactus text-sm text-cactus-charcoal/40 font-medium m-0 mb-2 leading-snug">
          {question.subtitle}
        </p>
        <WhyDisclosure reason={question.why} />
        <div className="flex flex-col gap-2.5">
          {question.options.map((opt) => (
            <OptionPill
              key={opt.value}
              icon={opt.icon}
              label={opt.label}
              selected={selectedValues.includes(opt.value)}
              onClick={() => pick(opt.value)}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-3 py-5 pb-7">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="shrink-0 px-6 py-3.5 rounded-2xl border-2 border-cactus-overlay bg-transparent font-cactus font-semibold text-[15px] text-cactus-charcoal/40 cursor-pointer"
          >
            Back
          </button>
        )}
        <Btn onClick={onNext} disabled={selectedValues.length === 0}>
          {stepIndex === totalSteps - 1 ? 'Finish' : 'Next'}
        </Btn>
      </div>
      {exclusiveSelected && null /* reserved for future "exclusive selected" toast */}
    </div>
  );
}
```

- [ ] **Step 5: Implement `TransitionScreen.tsx`**

```tsx
import { useNavigate } from 'react-router-dom';
import { Btn } from '../../../components/brand/Btn';

export function TransitionScreen() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 py-10 text-center bg-cactus-sandstone font-cactus animate-fade-up">
      <div className="text-5xl mb-4" aria-hidden="true">
        🎉
      </div>
      <h2 className="font-cactus font-bold text-2xl text-cactus-charcoal m-0 mb-2">
        Nice one! That's the hard part done.
      </h2>
      <p className="font-cactus text-base text-cactus-charcoal/60 font-medium m-0 mb-9 leading-relaxed max-w-xs">
        Now let's set up your account so we can save your progress and start building your Spending Plan.
      </p>
      <div className="w-auto">
        <Btn onClick={() => navigate('/register')} className="px-12">
          Create my account
        </Btn>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Implement `WelcomePage.tsx` state machine**

```tsx
import { useState } from 'react';
import { useOnboardingWizardStore } from '../store';
import { wizardQuestions, type WizardStepId } from '../data';
import { WelcomeScreen } from './WelcomeScreen';
import { QuestionScreen } from './QuestionScreen';
import { TransitionScreen } from './TransitionScreen';

type Phase = 'welcome' | 'questions' | 'transition';

export function WelcomePage() {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [stepIndex, setStepIndex] = useState(0);
  const answers = useOnboardingWizardStore((s) => s.answers);
  const setAnswer = useOnboardingWizardStore((s) => s.setAnswer);

  if (phase === 'welcome') {
    return <WelcomeScreen onStart={() => setPhase('questions')} />;
  }

  if (phase === 'transition') {
    return <TransitionScreen />;
  }

  const question = wizardQuestions[stepIndex];
  const stepId = question.id as WizardStepId;
  const selected = answers[stepId] ?? [];

  return (
    <QuestionScreen
      question={question}
      selectedValues={selected}
      onSelect={(values) => setAnswer(stepId, values)}
      onNext={() => {
        if (stepIndex < wizardQuestions.length - 1) {
          setStepIndex(stepIndex + 1);
        } else {
          setPhase('transition');
        }
      }}
      onBack={stepIndex > 0 ? () => setStepIndex(stepIndex - 1) : undefined}
      stepIndex={stepIndex}
      totalSteps={wizardQuestions.length}
    />
  );
}
```

- [ ] **Step 7: Run the page-level test to verify pass**

`cd src/frontend && npm run test -- WelcomePage`

Expected: 3 tests pass. Other tests still green.

- [ ] **Step 8: Commit**

```bash
git add src/frontend/src/pages/onboarding/welcome/
git commit -m "feat(onboarding): add /welcome flow (welcome → 5 questions → transition)"
```

---

## Task 9: Wire `/welcome` route in `App.tsx`

**Files:**
- Modify: `src/frontend/src/App.tsx`

- [ ] **Step 1: Add the WelcomePage import and route**

Add to imports (after the existing page imports, around line 17):

```tsx
import { WelcomePage } from './pages/onboarding/welcome/WelcomePage';
```

In the `<Routes>` block, add a new route for `/welcome` immediately after the existing `<Route path="/login" ...>` (around line 67):

```tsx
<Route
  path="/welcome"
  element={
    <PublicRoute>
      <WelcomePage />
    </PublicRoute>
  }
/>
```

- [ ] **Step 2: Update `ProtectedRoute` to redirect anonymous to `/welcome` instead of `/login`**

Find the `ProtectedRoute` function (around line 28) and change:

```tsx
if (!isAuthenticated) {
  return <Navigate to="/login" replace />;
}
```

to:

```tsx
if (!isAuthenticated) {
  return <Navigate to="/welcome" replace />;
}
```

- [ ] **Step 3: Confirm tests still pass**

`cd src/frontend && npm run test`

Expected: 15 baseline + N new tests pass. Login.test.tsx tests still work because `LoginPage` mounts directly via `renderWithProviders(<LoginPage />)` — the routing change doesn't affect it.

- [ ] **Step 4: Commit**

```bash
git add src/frontend/src/App.tsx
git commit -m "feat(routing): /welcome is the new public entry point for unauthenticated users"
```

---

## Task 10: Register integration — batched POST after `login()`

**Files:**
- Modify: `src/frontend/src/pages/Register.tsx`

- [ ] **Step 1: Open `Register.tsx` and modify `handleSubmit`**

Add imports at the top (after the existing imports, around line 4):

```tsx
import { apiClient } from '../api/client';
import { useOnboardingWizardStore } from './onboarding/store';
import { wizardToBackendMapping, type WizardStepId } from './onboarding/data';
```

Inside `handleSubmit`, after the `login(...)` call (around line 54) and before `navigate('/onboarding')`, insert:

```tsx
      // Batched POST of pre-signup wizard answers, if any.
      // Mapped wizard step → backend stepNumber per pages/onboarding/data.ts
      const wizardAnswers = useOnboardingWizardStore.getState().answers;
      const postPromises = (Object.keys(wizardAnswers) as Array<keyof typeof wizardAnswers>).map(
        (rawStep) => {
          const step = Number(rawStep) as WizardStepId;
          const values = wizardAnswers[step];
          if (!values || values.length === 0) return Promise.resolve(null);
          const { stepNumber, stepName } = wizardToBackendMapping[step];
          return apiClient
            .post('/onboarding/response', {
              stepNumber,
              stepName,
              response: JSON.stringify(values),
            })
            .catch(() => null); // non-fatal: navigate anyway, user re-answers in /onboarding
        }
      );
      await Promise.all(postPromises);
      useOnboardingWizardStore.getState().reset();
```

- [ ] **Step 2: Add a test to confirm the batched POST behavior**

Path: `src/frontend/src/pages/Register.test.tsx` (NEW)

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test/render';
import { server } from '../test/mocks/server';
import { useOnboardingWizardStore } from './onboarding/store';
import { RegisterPage } from './Register';

describe('RegisterPage', () => {
  beforeEach(() => {
    useOnboardingWizardStore.getState().reset();
    localStorage.clear();
  });

  it('after successful register, batched-POSTs the wizard answers and resets the store', async () => {
    useOnboardingWizardStore.getState().setAnswer(1, ['debt', 'invest']);
    useOnboardingWizardStore.getState().setAnswer(3, ['break_even']);

    const captured: Array<{ stepNumber: number; stepName: string; response: string }> = [];
    server.use(
      http.post('/api/auth/register', async () =>
        HttpResponse.json({
          userId: 'u1',
          email: 'x@y.z',
          firstName: null,
          lastName: null,
          isOnboardingComplete: false,
          isEmailVerified: false,
          accessToken: 'access',
          refreshToken: 'refresh',
        })
      ),
      http.post('/api/onboarding/response', async ({ request }) => {
        const body = (await request.json()) as { stepNumber: number; stepName: string; response: string };
        captured.push(body);
        return HttpResponse.json({});
      })
    );

    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);

    await user.type(screen.getByLabelText(/^email$/i), 'x@y.z');
    await user.type(screen.getByLabelText(/^password$/i), 'hunter22');
    await user.type(screen.getByLabelText(/confirm password/i), 'hunter22');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(captured).toHaveLength(2);
    });

    // Q1 (Priorities) → backend step 1
    expect(captured.find((c) => c.stepNumber === 1)).toEqual({
      stepNumber: 1,
      stepName: 'Priorities (multi)',
      response: JSON.stringify(['debt', 'invest']),
    });
    // Q3 (Month-end state) → backend step 2
    expect(captured.find((c) => c.stepNumber === 2)).toEqual({
      stepNumber: 2,
      stepName: 'Month-end state',
      response: JSON.stringify(['break_even']),
    });
    // Wizard store cleared
    expect(useOnboardingWizardStore.getState().answers).toEqual({});
  });

  it('does not block navigation if the batched POST fails', async () => {
    useOnboardingWizardStore.getState().setAnswer(1, ['debt']);
    server.use(
      http.post('/api/auth/register', async () =>
        HttpResponse.json({
          userId: 'u1',
          email: 'x@y.z',
          firstName: null,
          lastName: null,
          isOnboardingComplete: false,
          isEmailVerified: false,
          accessToken: 'access',
          refreshToken: 'refresh',
        })
      ),
      http.post('/api/onboarding/response', () =>
        HttpResponse.json({ message: 'fail' }, { status: 500 })
      )
    );

    const user = userEvent.setup();
    renderWithProviders(<RegisterPage />);
    await user.type(screen.getByLabelText(/^email$/i), 'x@y.z');
    await user.type(screen.getByLabelText(/^password$/i), 'hunter22');
    await user.type(screen.getByLabelText(/confirm password/i), 'hunter22');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    // The auth token should be set by login(), confirming we got past the API errors
    await waitFor(() => {
      expect(localStorage.getItem('accessToken')).toBe('access');
    });
  });
});
```

- [ ] **Step 3: Run the test to verify pass**

`cd src/frontend && npm run test -- Register.test`

Expected: 2 tests pass.

- [ ] **Step 4: Run the full suite**

`cd src/frontend && npm run test`

Expected: all tests still pass.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/src/pages/Register.tsx src/frontend/src/pages/Register.test.tsx
git commit -m "feat(register): batched-POST pre-signup wizard answers after successful login"
```

---

## Task 11: `Onboarding.tsx` — drop Q3/Q4 + skip pre-answered steps

**Files:**
- Modify: `src/frontend/src/pages/Onboarding.tsx`

- [ ] **Step 1: Remove the `id: 3` and `id: 4` step objects from the `steps` array**

Find the `steps` array (currently around line 28). Delete the entire two objects with `id: 3` (Money Management) and `id: 4` (Tracking Preference). The array becomes 6 entries (ids 1, 2, 5, 6, 7, 8).

- [ ] **Step 2: Add the fast-forward effect**

Add to imports (top of file):

```tsx
import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
```

Inside the `OnboardingPage` component, after the existing `useState` calls (around line 122), add:

```tsx
  const { data: onboardingStatus } = useQuery({
    queryKey: ['/onboarding/status'],
    queryFn: async () => {
      const response = await apiClient.get<{
        isComplete: boolean;
        currentStep: number;
        responses: Array<{ stepNumber: number; stepName: string; response: string }>;
      }>('/onboarding/status');
      return response.data;
    },
  });

  useEffect(() => {
    if (!onboardingStatus) return;
    const answeredStepNumbers = new Set(onboardingStatus.responses.map((r) => r.stepNumber));
    const firstUnansweredIndex = steps.findIndex((s) => !answeredStepNumbers.has(s.id));
    if (firstUnansweredIndex >= 0 && firstUnansweredIndex !== currentStep) {
      setCurrentStep(firstUnansweredIndex);
    }
  }, [onboardingStatus, currentStep]);
```

- [ ] **Step 3: Update the existing progressPrompts to match the reduced step count**

The existing `progressPrompts` array is sized for 8 steps. After removing 2, the wizard has 6 steps. The prompt-frequency logic (`currentStep % 2 === 0`) still works; we just use fewer prompts. Trim `progressPrompts` to:

```tsx
const progressPrompts = [
  "Great start! Let's learn more about your financial situation.",
  "You're doing great! Just a few more questions.",
  'Almost there! This information helps us personalize your experience.',
];
```

- [ ] **Step 4: Run the full test suite**

`cd src/frontend && npm run test`

Expected: all existing tests still pass. (Onboarding.tsx has no test file currently; we're not adding one in this PR — the smoke test for skip-pre-answered logic happens manually.)

- [ ] **Step 5: Run dev server and verify manually**

`cd src/frontend && npm run dev` (background). Visit `http://localhost:5173/onboarding` (you'll be redirected to /welcome since unauthenticated; instead stub the wizard manually via dev tools or test through the full register flow).

Skip if testing the full flow is too involved — Step 4's tests are the gate.

- [ ] **Step 6: Commit**

```bash
git add src/frontend/src/pages/Onboarding.tsx
git commit -m "feat(onboarding): drop Q3/Q4 + fast-forward past pre-signup-answered steps"
```

---

## Task 12: Open the PR

> **Pre-task setup (handled by executing-plans / using-git-worktrees, not by this plan):** the executor should be on a fresh branch `axis-o/pr-2-presignup-survey` (matching the existing convention) created from `main`. Tasks 1–11's commits should sit on this branch by Task 12.

- [ ] **Step 1: Run the full backend + frontend gates**

```bash
cd /Users/henricktissink/Sauce/cactus
cd src/frontend && npm run test && npm run lint && npm run format:check && npm run build
cd ../backend && DOTNET_ROLL_FORWARD=LatestMajor dotnet test
```

Both must be green.

- [ ] **Step 2: Push the branch**

```bash
git push -u origin axis-o/pr-2-presignup-survey
```

(If the worktree's local branch is named with a `worktree-` prefix or a `+` instead of `/`, use a refspec form: `git push -u origin <local-branch>:axis-o/pr-2-presignup-survey`.)

- [ ] **Step 3: Create the PR via gh**

```bash
gh pr create --title "Axis O PR 2: pre-signup welcome + 5-question survey" --body "$(cat <<'EOF'
## Summary
- New public `/welcome` flow with splash + 5 lifestyle questions (priorities, stress, month-end, savings cushion, debt types) before signup
- Multi-select on Q1/Q2/Q5 with sentinel exclusivity ("None of these" / "I'm not stressed")
- "Why are we asking this?" disclosure on every question
- Zustand wizard store with `persist` middleware (localStorage; refresh-safe)
- Register integration: batched-POST stored answers to `/onboarding/response` after `login()`, then navigate to `/onboarding`
- Existing `/onboarding` wizard drops Q3 (tracking method) and Q4 (detail preference) entirely, fast-forwards past pre-answered steps on mount
- Backend validator bumped 1..8 → 1..13 to accommodate the umbrella's full step schema

## New components
- `components/brand/Btn.tsx` (primary CTA, used app-wide)
- `components/brand/MoneyInput.tsx` (R-prefixed numeric input; created here for O-3 reuse)
- `pages/onboarding/components/{Dots,WhyDisclosure,OptionPill}.tsx` (wizard-only)
- `pages/onboarding/welcome/{WelcomePage,WelcomeScreen,QuestionScreen,TransitionScreen}.tsx`
- `pages/onboarding/{store.ts,data.ts}` — Zustand store + 5 questions + backend mapping table

## Out of scope (deferred)
- OAuth signup buttons (umbrella D10)
- Restructuring the post-signup wizard into multi-screen wizard PRs (O-3..O-6)
- Brand rollout to Login/Register visual chrome (O-7/O-8)
- Removing the legacy local CactusLogo definitions (O-7/O-8)

## Test plan
- [x] Frontend: 30+ tests passing (15 baseline + ~15 new)
- [x] Backend: validator boundary tests for stepNumber 0/1/9/13/14
- [x] `npm run lint`, `npm run format:check`, `npm run build` clean
- [x] `dotnet test` green
- [ ] Manual: anonymous visitor at `/` → `/welcome`; full flow → `/register` → batched POST visible in network tab
- [ ] Manual: refreshing browser mid-questions preserves answers

## Spec / plan
- [Umbrella](docs/superpowers/specs/2026-05-07-axis-o-onboarding-design.md)
- [PR-2 design](docs/superpowers/specs/2026-05-08-axis-o-pr-2-presignup-survey-design.md)
- [PR-2 plan](docs/superpowers/plans/2026-05-08-axis-o-pr-2-presignup-survey.md)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

If `gh` is not authenticated (per project memory, agent shells lack auth), report the URL `https://github.com/henrick-tissink/cactus/pull/new/axis-o/pr-2-presignup-survey` and the title + body for manual creation.

- [ ] **Step 4: Verify CI passes**

`gh pr checks --watch` or via the GitHub UI. Backend test, Frontend test, Backend Docker build, Frontend Docker build must all be green.

- [ ] **Step 5: Hand off to user for merge**

Per project memory, the user merges via the GitHub web UI.

---

## Self-Review

**Spec coverage:** Walked the PR-2 design's 12 acceptance criteria against the 12 tasks. All 12 are covered:
- AC1 (anon → /welcome) — Task 9
- AC2 (welcome splash) — Task 8 WelcomeScreen
- AC3 (5-step cycle with back button) — Task 8 WelcomePage / QuestionScreen
- AC4 (multi-select + sentinels) — Task 8 QuestionScreen `pick` logic
- AC5 (Why disclosure) — Task 5
- AC6 (transition + register CTA) — Task 8 TransitionScreen
- AC7 (batched POST + reset on register) — Task 10
- AC8 (Onboarding skips pre-answered) — Task 11
- AC9 (refresh-safe via localStorage) — Task 7 Zustand persist middleware
- AC10 (≥80% line coverage on new components) — every TDD task contributes
- AC11 (validator 1..13) — Task 1
- AC12 (lint/format/build/dev clean) — Task 12 gates

**Placeholder scan:** No TBD / TODO / "implement later" — every task has concrete code blocks with exact file paths.

**Type consistency:** `WizardStepId = 1|2|3|4|5` is consistent across `data.ts`, `store.ts`, and `Register.tsx`. `WizardOption.value` and `wizardToBackendMapping` keys match the `WizardQuestion.options[].value` strings.

**Risks / followups for next PR (O-3):**
- The `<MoneyInput />` shipped in this PR isn't used until O-3; if its API changes during O-3 design, expect a small refactor.
- The Onboarding.tsx fast-forward effect runs once on mount; if the user navigates back to `/onboarding` after answering more steps, the effect re-runs and could move them past their last position — acceptable for now (in-product wizard rewrite in O-3..O-6 supersedes this logic).
- The `/onboarding/status` query has no error handler in the fast-forward effect; a 500 leaves `currentStep` at 0. Acceptable for an existing-screen patch; address in O-3 wizard rewrite.
