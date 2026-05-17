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

    expect(screen.getByRole('heading', { name: /let's get to know/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /let's do this/i }));

    expect(screen.getByRole('heading', { name: /what matters most/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /get out of debt/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    await user.click(screen.getByRole('button', { name: /unexpected expenses/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    await user.click(screen.getByRole('button', { name: /break even/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    await user.click(screen.getByRole('button', { name: /less than r10,000/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    await user.click(screen.getByRole('button', { name: /credit card debt/i }));
    await user.click(screen.getByRole('button', { name: /^finish$/i }));

    expect(screen.getByRole('heading', { name: /hard part done/i })).toBeInTheDocument();
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
    await user.click(screen.getByRole('button', { name: /let's do this/i }));
    await user.click(screen.getByRole('button', { name: /get out of debt/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await user.click(screen.getByRole('button', { name: /unexpected expenses/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await user.click(screen.getByRole('button', { name: /break even/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await user.click(screen.getByRole('button', { name: /less than r10,000/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    await user.click(screen.getByRole('button', { name: /credit card debt/i }));
    expect(useOnboardingWizardStore.getState().answers[5]).toEqual(['credit_card']);
    await user.click(screen.getByRole('button', { name: /none of these/i }));
    expect(useOnboardingWizardStore.getState().answers[5]).toEqual(['none']);

    await user.click(screen.getByRole('button', { name: /credit card debt/i }));
    expect(useOnboardingWizardStore.getState().answers[5]).toEqual(['credit_card']);
  });

  it('back button returns to the previous question and preserves the answer', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WelcomePage />);
    await user.click(screen.getByRole('button', { name: /let's do this/i }));
    await user.click(screen.getByRole('button', { name: /get out of debt/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    // Now on Q2; click Back
    await user.click(screen.getByRole('button', { name: /^back$/i }));

    // Should be back on Q1, with the previous answer preserved
    expect(screen.getByRole('heading', { name: /what matters most/i })).toBeInTheDocument();
    expect(useOnboardingWizardStore.getState().answers[1]).toEqual(['debt']);
  });

  it('single-select question replaces the answer when a different option is picked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<WelcomePage />);
    await user.click(screen.getByRole('button', { name: /let's do this/i }));
    await user.click(screen.getByRole('button', { name: /get out of debt/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await user.click(screen.getByRole('button', { name: /unexpected expenses/i }));
    await user.click(screen.getByRole('button', { name: /^next$/i }));

    // On Q3 (single-select). Click "Run out of money" then "Break even".
    await user.click(screen.getByRole('button', { name: /run out of money/i }));
    expect(useOnboardingWizardStore.getState().answers[3]).toEqual(['run_out']);
    await user.click(screen.getByRole('button', { name: /break even/i }));
    expect(useOnboardingWizardStore.getState().answers[3]).toEqual(['break_even']);
  });
});
