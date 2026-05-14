import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { apiClient } from '../api/client';
import { CactusLogo } from '../components/brand/CactusLogo';
import { useOnboardingWizardStore } from './onboarding/store';
import { wizardToBackendMapping, type WizardStepId } from './onboarding/data';

export function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
      });

      login(
        {
          userId: response.userId,
          email: response.email,
          firstName: response.firstName,
          lastName: response.lastName,
          isOnboardingComplete: response.isOnboardingComplete,
          isEmailVerified: response.isEmailVerified,
        },
        response.accessToken,
        response.refreshToken
      );

      const wizardAnswers = useOnboardingWizardStore.getState().answers;
      const postPromises = Object.keys(wizardAnswers).map((rawStep) => {
        const step = Number(rawStep) as WizardStepId;
        const values = wizardAnswers[step];
        if (!values || values.length === 0) return Promise.resolve(null);
        const { stepNumber, stepName } = wizardToBackendMapping[step];
        return apiClient
          .post('/onboarding/response', {
            stepNumber,
            stepName,
            response: JSON.stringify(values),
          })
          .catch(() => null);
      });
      await Promise.all(postPromises);
      useOnboardingWizardStore.getState().reset();

      navigate('/onboarding');
    } catch {
      setError('Email already registered or invalid data');
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses =
    'w-full bg-brand-cream/40 border border-brand-border focus:border-brand-sage focus:bg-brand-surface focus:ring-2 focus:ring-brand-sage/15 rounded-xl px-4 py-3.5 font-sans-brand text-[15px] text-brand-text placeholder:text-brand-text-faint outline-none transition-all';
  const labelClasses =
    'block font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2';

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream font-sans-brand py-12 px-6">
      <div className="w-full max-w-[28rem] animate-fade-in">
        <div className="flex justify-center mb-8">
          <CactusLogo />
        </div>

        <div className="bg-brand-surface rounded-3xl border border-brand-border shadow-[0_24px_56px_-16px_rgba(31,111,74,0.12)] p-8 sm:p-10">
          <div className="mb-8">
            <h1 className="font-display font-medium text-[2rem] leading-[1.1] tracking-[-0.015em] text-brand-text mb-2">
              Create your account.
            </h1>
            <p className="font-sans-brand text-[14px] leading-relaxed text-brand-text-muted">
              Start building a spending plan in five minutes.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-brand-terracotta-soft border-l-[3px] border-brand-terracotta rounded-r-xl pl-4 pr-3 py-3 font-sans-brand text-[14px] text-brand-accent-ink flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-brand-terracotta shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className={labelClasses}>
                  First name
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className={inputClasses}
                  placeholder="Jane"
                />
              </div>
              <div>
                <label htmlFor="lastName" className={labelClasses}>
                  Last name
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className={inputClasses}
                  placeholder="Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className={labelClasses}>
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={inputClasses}
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className={labelClasses}>
                Password
              </label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={inputClasses}
                placeholder="••••••••"
                required
              />
              <p className="mt-2 font-sans-brand text-[12px] text-brand-text-faint">
                At least 8 characters with uppercase, lowercase, and a digit.
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className={labelClasses}>
                Confirm password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={inputClasses}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 px-6 py-3.5 rounded-2xl font-sans-brand font-semibold text-[15px] text-white bg-brand-sage shadow-[0_8px_24px_-6px_rgba(31,111,74,0.45)] hover:shadow-[0_12px_32px_-6px_rgba(31,111,74,0.55)] hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface disabled:bg-brand-border disabled:text-brand-text-faint disabled:shadow-none disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all"
            >
              {isLoading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center font-sans-brand text-[13px] text-brand-text-muted">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-sage hover:text-brand-accent-ink underline-offset-4 hover:underline transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
