import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/render';
import { server } from '../../../test/mocks/server';
import { GoalPickScreen } from './GoalPickScreen';

describe('GoalPickScreen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('fetches and shows the recommendation banner, marks recommended card', async () => {
    server.use(
      http.get('/api/onboarding/goal-recommendation', () =>
        HttpResponse.json({
          recommendedType: 'emergency',
          reason: 'Building a safety net first.',
        })
      )
    );
    renderWithProviders(<GoalPickScreen onContinue={() => {}} />);

    await waitFor(() =>
      expect(screen.getByText(/building a safety net first/i)).toBeInTheDocument()
    );
    expect(screen.getByText(/^recommended$/i)).toBeInTheDocument();
  });

  it('renders all 3 goal options', async () => {
    server.use(
      http.get('/api/onboarding/goal-recommendation', () =>
        HttpResponse.json({ recommendedType: 'save', reason: 'You are doing great.' })
      )
    );
    renderWithProviders(<GoalPickScreen onContinue={() => {}} />);

    await waitFor(() => expect(screen.getByText(/you are doing great/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /save more money/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reduce my debt/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /build an emergency fund/i })).toBeInTheDocument();
  });

  it('persists the user pick and advances on lock-in', async () => {
    let captured: { stepNumber: number; stepName: string; response: string } | null = null;
    server.use(
      http.get('/api/onboarding/goal-recommendation', () =>
        HttpResponse.json({ recommendedType: 'emergency', reason: 'r' })
      ),
      http.post('/api/onboarding/response', async ({ request }) => {
        captured = (await request.json()) as typeof captured;
        return HttpResponse.json({});
      })
    );
    const onContinue = vi.fn();
    renderWithProviders(<GoalPickScreen onContinue={onContinue} />);

    await waitFor(() => expect(screen.getByText(/^recommended$/i)).toBeInTheDocument());

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /reduce my debt/i }));
    await user.click(screen.getByRole('button', { name: /lock in this goal/i }));

    await waitFor(() => {
      expect(captured).not.toBeNull();
    });
    expect(captured).toEqual({
      stepNumber: 6,
      stepName: 'Goal type pick',
      response: JSON.stringify(['debt']),
    });
    expect(onContinue).toHaveBeenCalledWith('debt');
  });

  it('disables the lock-in CTA until something is selected', async () => {
    server.use(
      http.get('/api/onboarding/goal-recommendation', () =>
        HttpResponse.json({ recommendedType: 'save', reason: 'r' })
      )
    );
    renderWithProviders(<GoalPickScreen onContinue={() => {}} />);

    await waitFor(() => expect(screen.getByText(/^recommended$/i)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: /lock in this goal/i })).toBeDisabled();
  });
});
