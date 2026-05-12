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
    'w-full px-4 py-3 border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl font-cactus text-cactus-charcoal outline-none placeholder:text-cactus-charcoal/30 transition-colors';
  const labelClasses = 'block font-cactus font-semibold text-sm text-cactus-charcoal mb-1.5';

  return (
    <div className="min-h-screen flex items-center justify-center bg-cactus-sandstone font-cactus py-12 px-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="bg-white rounded-2xl border border-cactus-overlay p-8">
          <div className="flex flex-col items-center mb-8">
            <CactusLogo />
            <p className="font-cactus text-cactus-charcoal/60 mt-3 text-center">
              Create your account to get started.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-cactus-goals-bg border border-cactus-overlay text-cactus-charcoal rounded-xl p-3 font-cactus text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-cactus-prickly shrink-0" />
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
                  placeholder="John"
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
              <p className="mt-1.5 text-xs font-cactus text-cactus-charcoal/50">
                At least 8 characters with uppercase, lowercase, and a number
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
              className="w-full px-6 py-4 rounded-2xl font-cactus font-bold text-base text-white transition-all bg-cactus-sage shadow-[0_4px_16px_rgba(119,221,119,0.25)] hover:brightness-95 active:brightness-90 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="mt-6 text-center font-cactus text-cactus-charcoal/60">
            Already have an account?{' '}
            <Link to="/login" className="text-cactus-sage font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
