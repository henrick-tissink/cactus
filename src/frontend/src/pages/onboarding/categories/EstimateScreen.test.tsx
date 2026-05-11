import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/render';
import { server } from '../../../test/mocks/server';
import { EstimateScreen } from './EstimateScreen';

describe('EstimateScreen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders one row per selected category grouped by bucket', () => {
    renderWithProviders(
      <EstimateScreen
        selectedNeeds={['Rent / Bond', 'Groceries']}
        selectedWants={['Dining Out']}
        onContinue={() => {}}
      />
    );
    expect(screen.getByText('Rent / Bond')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Dining Out')).toBeInTheDocument();
  });

  it('persists estimates on Next and advances', async () => {
    let captured: { stepNumber: number; stepName: string; response: string } | null = null;
    server.use(
      http.post('/api/onboarding/response', async ({ request }) => {
        captured = (await request.json()) as typeof captured;
        return HttpResponse.json({});
      })
    );
    const onContinue = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <EstimateScreen
        selectedNeeds={['Rent / Bond']}
        selectedWants={['Dining Out']}
        onContinue={onContinue}
      />
    );

    const inputs = screen.getAllByRole('textbox');
    await user.clear(inputs[0]);
    await user.type(inputs[0], '12000');
    await user.clear(inputs[1]);
    await user.type(inputs[1], '1500');

    await user.click(screen.getByRole('button', { name: /^next$/i }));

    await waitFor(() => {
      expect(captured).not.toBeNull();
      expect(onContinue).toHaveBeenCalledOnce();
    });
    expect(captured!.stepNumber).toBe(4);
    const payload = JSON.parse(captured!.response) as Record<string, number>;
    expect(payload['Rent / Bond']).toBe(12000);
    expect(payload['Dining Out']).toBe(1500);
  });

  it('allows submission with zero values', async () => {
    let captured: { stepNumber: number; stepName: string; response: string } | null = null;
    server.use(
      http.post('/api/onboarding/response', async ({ request }) => {
        captured = (await request.json()) as typeof captured;
        return HttpResponse.json({});
      })
    );
    const onContinue = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(
      <EstimateScreen selectedNeeds={['Rent / Bond']} selectedWants={[]} onContinue={onContinue} />
    );
    await user.click(screen.getByRole('button', { name: /^next$/i }));
    await waitFor(() => expect(onContinue).toHaveBeenCalledOnce());
    const payload = JSON.parse(captured!.response) as Record<string, number>;
    expect(payload['Rent / Bond'] ?? 0).toBe(0);
  });
});
