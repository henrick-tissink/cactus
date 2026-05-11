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
