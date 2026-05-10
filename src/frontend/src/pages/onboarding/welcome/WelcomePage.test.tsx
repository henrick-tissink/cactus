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

    expect(screen.getByRole('heading', { name: /welcome to cactus/i })).toBeInTheDocument();
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
});
