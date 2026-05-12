import { describe, it, expect, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { renderWithProviders } from '../../test/render';
import { useAuthStore } from '../../store/authStore';
import { Layout } from './Layout';

function HomeStub() {
  return <div data-testid="home-stub">home</div>;
}

function seedAuthedUser() {
  useAuthStore.setState({
    user: {
      userId: 'u1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      isOnboardingComplete: true,
      isEmailVerified: true,
    },
    isAuthenticated: true,
    isLoading: false,
  });
}

describe('Layout', () => {
  beforeEach(() => {
    seedAuthedUser();
  });

  it('renders the cactus brand logo (canonical component) in the sidebar', () => {
    renderWithProviders(
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomeStub />} />
        </Route>
      </Routes>
    );
    expect(screen.getAllByText(/cactus/i).length).toBeGreaterThan(0);
  });

  it('lists the five post-auth nav items', () => {
    renderWithProviders(
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomeStub />} />
        </Route>
      </Routes>
    );
    for (const label of ['Dashboard', 'Transactions', 'Budget', 'Goals', 'Insights']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it('highlights the active nav item based on the current route', () => {
    renderWithProviders(
      <Routes>
        <Route element={<Layout />}>
          <Route path="/transactions" element={<HomeStub />} />
        </Route>
      </Routes>,
      { initialRoute: '/transactions' }
    );
    const active = screen
      .getAllByText('Transactions')
      .find((el) => el.closest('[aria-current="page"]'));
    expect(active).toBeTruthy();
  });

  it('opens and closes the mobile drawer when the hamburger is toggled', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomeStub />} />
        </Route>
      </Routes>
    );
    expect(screen.queryByRole('dialog', { name: /menu/i })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /open menu/i }));
    expect(screen.getByRole('dialog', { name: /menu/i })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /close menu/i }));
    expect(screen.queryByRole('dialog', { name: /menu/i })).not.toBeInTheDocument();
  });
});
