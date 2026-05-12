import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/render';
import { server } from '../../../test/mocks/server';
import { useAuthStore } from '../../../store/authStore';
import { FinalScreen } from './FinalScreen';

describe('FinalScreen', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: {
        userId: 'u1',
        email: 'x@y.z',
        firstName: null,
        lastName: null,
        isOnboardingComplete: false,
        isEmailVerified: false,
      },
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it('renders the all-set splash with goal summary', () => {
    renderWithProviders(<FinalScreen goalType="save" monthlyGoalAmount={5000} />);
    expect(screen.getByRole('heading', { name: /you're all set/i })).toBeInTheDocument();
    expect(screen.getByText(/r5,000/i)).toBeInTheDocument();
  });

  it('POSTs /onboarding/complete and updates auth store on CTA click', async () => {
    let postedComplete = false;
    server.use(
      http.post('/api/onboarding/complete', () => {
        postedComplete = true;
        return HttpResponse.json({});
      })
    );
    const user = userEvent.setup();
    renderWithProviders(<FinalScreen goalType="save" monthlyGoalAmount={5000} />);
    await user.click(screen.getByRole('button', { name: /take me to my dashboard/i }));

    await waitFor(() => {
      expect(postedComplete).toBe(true);
      expect(useAuthStore.getState().user?.isOnboardingComplete).toBe(true);
    });
  });
});
