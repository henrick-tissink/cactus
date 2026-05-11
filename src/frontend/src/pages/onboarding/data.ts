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
    subtitle: 'No judgment — it varies, we get it. Pick what feels closest.',
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
