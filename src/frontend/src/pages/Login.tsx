import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { AuthBrandPanel } from '../components/auth/AuthBrandPanel';
import { CactusLogo } from '../components/brand/CactusLogo';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.login({ email, password });
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

      if (response.isOnboardingComplete) {
        navigate('/');
      } else {
        navigate('/onboarding');
      }
    } catch {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <AuthBrandPanel />
      <div className="flex-1 bg-brand-cream p-6 md:p-12 lg:p-16 flex flex-col font-sans-brand">
        <div className="mb-8 md:hidden">
          <CactusLogo />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[22rem] animate-fade-in">
            <h1 className="font-display font-medium text-[2.25rem] leading-[1.1] tracking-[-0.015em] text-brand-text mb-3">
              Welcome back.
            </h1>
            <p className="font-sans-brand text-[15px] leading-relaxed text-brand-text-muted mb-9">
              Great to see you again. Sign in to pick up where you left off.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-brand-terracotta-soft border-l-[3px] border-brand-terracotta rounded-r-xl pl-4 pr-3 py-3 font-sans-brand text-[14px] text-brand-accent-ink mb-1 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-brand-terracotta flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted block mb-2"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-brand-surface border border-brand-border focus:border-brand-sage focus:ring-2 focus:ring-brand-sage/15 rounded-xl px-4 py-3.5 font-sans-brand text-[15px] text-brand-text placeholder:text-brand-text-faint outline-none transition-all"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted block mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-brand-surface border border-brand-border focus:border-brand-sage focus:ring-2 focus:ring-brand-sage/15 rounded-xl px-4 py-3.5 pr-12 font-sans-brand text-[15px] text-brand-text placeholder:text-brand-text-faint outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-brand-text-faint hover:text-brand-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 px-6 py-3.5 rounded-2xl font-sans-brand font-semibold text-[15px] text-white bg-brand-sage shadow-[0_8px_24px_-6px_rgba(31,111,74,0.45)] hover:shadow-[0_12px_32px_-6px_rgba(31,111,74,0.55)] hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream disabled:bg-brand-border disabled:text-brand-text-faint disabled:shadow-none disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all"
              >
                {isLoading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <p className="mt-6 text-center">
              <Link
                to="/forgot-password"
                className="font-sans-brand text-[13px] font-semibold text-brand-sage hover:text-brand-accent-ink underline-offset-4 hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </p>

            <div className="mt-10 pt-6 border-t border-brand-border text-center">
              <p className="font-sans-brand text-[13px] text-brand-text-muted">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  className="font-semibold text-brand-sage hover:text-brand-accent-ink underline-offset-4 hover:underline transition-colors"
                >
                  Create an account
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
