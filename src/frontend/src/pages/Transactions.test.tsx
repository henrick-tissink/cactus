import { describe, it, expect } from 'vitest';
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/render';
import { TransactionsPage } from './Transactions';

describe('TransactionsPage', () => {
  it('renders a transaction row from the API', async () => {
    renderWithProviders(<TransactionsPage />);

    expect(
      await screen.findByText(/woolworths/i)
    ).toBeInTheDocument();
  });

  it('toggles the filters panel when the Filters button is clicked', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TransactionsPage />);

    expect(screen.queryByText(/^account$/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /filters/i }));

    expect(await screen.findByText(/^account$/i)).toBeInTheDocument();
    expect(screen.getByText(/^status$/i)).toBeInTheDocument();
  });

  it('opens the Add Transaction modal', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TransactionsPage />);

    await user.click(screen.getByRole('button', { name: /add transaction/i }));

    expect(
      await screen.findByRole('heading', { name: /add transaction/i })
    ).toBeInTheDocument();
  });
});
