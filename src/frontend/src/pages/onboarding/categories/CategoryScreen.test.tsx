import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../../test/render';
import { server } from '../../../test/mocks/server';
import { CategoryScreen } from './CategoryScreen';

describe('CategoryScreen', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders all 8 Needs defaults and 6 Wants defaults pre-selected', () => {
    renderWithProviders(<CategoryScreen onContinue={() => {}} />);
    expect(screen.getByRole('button', { name: /rent \/ bond/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /groceries/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dining out/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /hobbies/i })).toBeInTheDocument();
  });

  it('exposes extras under a "+ Add" toggle in each bucket', async () => {
    const user = userEvent.setup();
    renderWithProviders(<CategoryScreen onContinue={() => {}} />);
    expect(screen.queryByRole('button', { name: /stokvel/i })).not.toBeInTheDocument();
    const addButtons = screen.getAllByRole('button', { name: /\+ add/i });
    await user.click(addButtons[0]); // first is Needs
    expect(screen.getByRole('button', { name: /stokvel/i })).toBeInTheDocument();
  });

  it('persists selection on "Looks good" and forwards lists to onContinue', async () => {
    let captured: { stepNumber: number; stepName: string; response: string } | null = null;
    server.use(
      http.post('/api/onboarding/response', async ({ request }) => {
        captured = (await request.json()) as typeof captured;
        return HttpResponse.json({});
      })
    );
    const onContinue = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<CategoryScreen onContinue={onContinue} />);

    // Deselect Hobbies (one of the default Wants)
    await user.click(screen.getByRole('button', { name: /hobbies/i }));

    await user.click(screen.getByRole('button', { name: /looks good/i }));

    await waitFor(() => {
      expect(captured).not.toBeNull();
      expect(onContinue).toHaveBeenCalledOnce();
    });
    expect(captured!.stepNumber).toBe(3);
    expect(captured!.stepName).toBe('Category selection');
    const payload = JSON.parse(captured!.response) as { needs: string[]; wants: string[] };
    expect(payload.needs).toContain('Rent / Bond');
    expect(payload.wants).not.toContain('Hobbies');
    expect(onContinue).toHaveBeenCalledWith(payload.needs, payload.wants);
  });
});
