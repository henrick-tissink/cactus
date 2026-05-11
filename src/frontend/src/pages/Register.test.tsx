import { describe, it, expect, beforeEach } from 'vitest';
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
        const body = (await request.json()) as {
          stepNumber: number;
          stepName: string;
          response: string;
        };
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
