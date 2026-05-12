import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/render';
import { server } from '../../../test/mocks/server';
import { IncomeScreen } from './IncomeScreen';

describe('IncomeScreen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('disables Next until primary income has a value', async () => {
    renderWithProviders(<IncomeScreen onContinue={() => {}} />);
    expect(screen.getByRole('button', { name: /^next$/i })).toBeDisabled();
  });

  it('persists primary + secondary on Next and forwards total to onContinue', async () => {
    const captured: Array<{ stepNumber: number; stepName: string; response: string }> = [];
    server.use(
      http.post('/api/onboarding/response', async ({ request }) => {
        captured.push((await request.json()) as (typeof captured)[number]);
        return HttpResponse.json({});
      })
    );
    const onContinue = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<IncomeScreen onContinue={onContinue} />);

    const inputs = screen.getAllByRole('textbox');
    await user.type(inputs[0], '35000');
    await user.click(screen.getByRole('button', { name: /add other income source/i }));
    await user.click(screen.getByRole('button', { name: /freelance/i }));
    const allInputs = screen.getAllByRole('textbox');
    await user.type(allInputs[allInputs.length - 1], '5000');

    await user.click(screen.getByRole('button', { name: /^next$/i }));

    await waitFor(() => expect(onContinue).toHaveBeenCalledOnce());
    expect(captured).toHaveLength(2);
    const primaryPost = captured.find((c) => c.stepNumber === 5);
    expect(primaryPost!.response).toContain('35000');
    const secondaryPost = captured.find((c) => c.stepNumber === 11);
    const parsed = JSON.parse(secondaryPost!.response) as Array<{ type: string; amount: number }>;
    expect(parsed[0]).toEqual({ type: 'freelance', amount: 5000 });
    expect(onContinue).toHaveBeenCalledWith(40000); // 35000 + 5000
  });

  it('allows submission with primary only (no secondary)', async () => {
    server.use(http.post('/api/onboarding/response', () => HttpResponse.json({})));
    const onContinue = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<IncomeScreen onContinue={onContinue} />);
    await user.type(screen.getAllByRole('textbox')[0], '20000');
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await waitFor(() => expect(onContinue).toHaveBeenCalledWith(20000));
  });
});
