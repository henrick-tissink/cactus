import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../test/render';
import { server } from '../test/mocks/server';
import { AccountType } from '../types';
import { ImportTransactionsPage } from './ImportTransactions';

describe('ImportTransactionsPage', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/accounts', () =>
        HttpResponse.json([
          {
            id: 'a1',
            name: 'Cheque',
            accountType: AccountType.Cheque,
            balance: 1000,
            currency: 'ZAR',
            isManual: false,
            isActive: true,
          },
        ])
      )
    );
  });

  it('renders the import transactions heading', () => {
    renderWithProviders(<ImportTransactionsPage />);
    expect(screen.getByRole('heading', { name: /import transactions/i })).toBeInTheDocument();
  });

  it('renders the upload step indicator label', () => {
    renderWithProviders(<ImportTransactionsPage />);
    expect(screen.getByText('Upload')).toBeInTheDocument();
    expect(screen.getByText('Review')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('renders the dropzone copy', () => {
    renderWithProviders(<ImportTransactionsPage />);
    expect(screen.getByText(/drag and drop|select a file/i)).toBeInTheDocument();
  });

  it('renders the account selector populated from /accounts', async () => {
    renderWithProviders(<ImportTransactionsPage />);
    expect(await screen.findByText(/Cheque/)).toBeInTheDocument();
  });

  it('renders the supported banks chips', () => {
    renderWithProviders(<ImportTransactionsPage />);
    expect(screen.getByText('FNB')).toBeInTheDocument();
    expect(screen.getByText('Capitec')).toBeInTheDocument();
  });
});
