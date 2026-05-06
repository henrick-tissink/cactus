import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/render';
import { server } from '../test/mocks/server';
import { GoalsPage } from './Goals';

describe('GoalsPage', () => {
  it("renders the user's goal from the API", async () => {
    renderWithProviders(<GoalsPage />);

    expect(await screen.findByRole('heading', { name: /emergency fund/i })).toBeInTheDocument();
  });

  it('shows an empty/zero state when there are no goals', async () => {
    server.use(
      http.get('/api/goals', () => HttpResponse.json([])),
      http.get('/api/goals/recommended-sequence', () => HttpResponse.json([]))
    );

    renderWithProviders(<GoalsPage />);

    // Wait for post-load state, then assert the goal isn't rendered.
    await screen.findByText(/0 active goals?/i);
    expect(screen.queryByRole('heading', { name: /emergency fund/i })).not.toBeInTheDocument();
  });

  it('opens the create-goal modal', async () => {
    const user = userEvent.setup();
    renderWithProviders(<GoalsPage />);

    await screen.findByRole('heading', { name: /emergency fund/i });

    await user.click(screen.getByRole('button', { name: /new goal/i }));

    expect(await screen.findByRole('heading', { name: /create new goal/i })).toBeInTheDocument();
  });
});
