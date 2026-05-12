import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/render';
import { server } from '../test/mocks/server';
import { useAuthStore } from '../store/authStore';
import { SettingsPage } from './Settings';

function seedUser(overrides: { isEmailVerified?: boolean } = {}) {
  useAuthStore.setState({
    user: {
      userId: 'u1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      isOnboardingComplete: true,
      isEmailVerified: overrides.isEmailVerified ?? true,
    },
    isAuthenticated: true,
    isLoading: false,
  });
}

describe('SettingsPage', () => {
  beforeEach(() => seedUser());

  it('renders the profile section heading', () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByRole('heading', { name: /profile/i })).toBeInTheDocument();
  });

  it('shows the verified-email banner when the user is verified', () => {
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText(/email verified/i)).toBeInTheDocument();
  });

  it('shows an unverified-email banner when the user is not verified', () => {
    seedUser({ isEmailVerified: false });
    renderWithProviders(<SettingsPage />);
    expect(screen.getByText(/not verified/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /resend/i })).toBeInTheDocument();
  });

  it('posts to /auth/profile when save profile is clicked', async () => {
    let posted = false;
    server.use(
      http.put('/api/auth/profile', () => {
        posted = true;
        return HttpResponse.json({
          userId: 'u1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
        });
      })
    );
    const user = userEvent.setup();
    renderWithProviders(<SettingsPage />);
    await user.click(screen.getByRole('button', { name: /save profile/i }));
    await waitFor(() => expect(posted).toBe(true));
  });
});
