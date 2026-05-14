import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test/render';
import { server } from '../test/mocks/server';
import { DashboardPage } from './Dashboard';

describe('DashboardPage', () => {
  it('shows a loading state initially', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it('renders the monthly summary once data resolves', async () => {
    renderWithProviders(<DashboardPage />);

    expect(await screen.findByText(/r38[\s,]000/i)).toBeInTheDocument();
    expect(screen.getByText(/spending plan/i)).toBeInTheDocument();
  });

  it('shows the onboarding checklist when there are no transactions or income', async () => {
    server.use(
      http.get('/api/dashboard/summary', () =>
        HttpResponse.json({
          monthlyIncome: 0,
          totalSpent: 0,
          buckets: [],
          unclassifiedCount: 0,
          recentTransactions: [],
        })
      ),
      http.get('/api/goals', () => HttpResponse.json([]))
    );

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/let's get your finances in order/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/import your first bank statement/i)).toBeInTheDocument();
  });
});
