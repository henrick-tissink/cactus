import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/render';
import { server } from '../../../test/mocks/server';
import { GoalDetailScreen } from './GoalDetailScreen';

describe('GoalDetailScreen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders save-goal copy and inputs', () => {
    renderWithProviders(
      <GoalDetailScreen
        goalType="save"
        totalIncome={35000}
        totalExpenses={20000}
        onContinue={() => {}}
      />
    );
    expect(
      screen.getByRole('heading', { name: /how much do you want to save/i })
    ).toBeInTheDocument();
    expect(screen.getAllByRole('textbox')).toHaveLength(2); // amount + months
  });

  it('shows ✅ doable verdict when monthly fits leftover', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <GoalDetailScreen
        goalType="save"
        totalIncome={35000}
        totalExpenses={20000}
        onContinue={() => {}}
      />
    );
    await user.type(screen.getAllByRole('textbox')[0], '50000');
    await user.type(screen.getAllByRole('textbox')[1], '12');
    // 50000/12 = 4167; leftover = 15000 → doable
    expect(screen.getByText(/that's doable/i)).toBeInTheDocument();
  });

  it('shows ⚠️ stretch verdict when monthly exceeds leftover', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <GoalDetailScreen
        goalType="save"
        totalIncome={35000}
        totalExpenses={32000}
        onContinue={() => {}}
      />
    );
    await user.type(screen.getAllByRole('textbox')[0], '60000');
    await user.type(screen.getAllByRole('textbox')[1], '6');
    // 60000/6 = 10000; leftover = 3000 → stretch
    expect(screen.getByText(/might be a stretch/i)).toBeInTheDocument();
  });

  it('persists steps 12 + 13 on lock-in and advances', async () => {
    const captured: Array<{ stepNumber: number; stepName: string; response: string }> = [];
    server.use(
      http.post('/api/onboarding/response', async ({ request }) => {
        captured.push((await request.json()) as (typeof captured)[number]);
        return HttpResponse.json({});
      })
    );
    const onContinue = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <GoalDetailScreen
        goalType="save"
        totalIncome={35000}
        totalExpenses={20000}
        onContinue={onContinue}
      />
    );
    await user.type(screen.getAllByRole('textbox')[0], '50000');
    await user.type(screen.getAllByRole('textbox')[1], '12');
    await user.click(screen.getByRole('button', { name: /lock in my goal/i }));

    await waitFor(() => expect(onContinue).toHaveBeenCalledOnce());
    expect(captured.find((c) => c.stepNumber === 12)?.response).toContain('50000');
    expect(captured.find((c) => c.stepNumber === 13)?.response).toContain('12');
  });
});
