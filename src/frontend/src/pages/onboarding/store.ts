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
      setAnswer: (step, values) => set((s) => ({ answers: { ...s.answers, [step]: values } })),
      reset: () => set({ answers: {} }),
    }),
    { name: 'onboarding-wizard' }
  )
);
