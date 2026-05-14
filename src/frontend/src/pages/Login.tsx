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
      <div className="flex-1 bg-cactus-sandstone p-6 md:p-12 flex flex-col font-cactus">
        <div className="mb-8 md:hidden">
          <CactusLogo />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm animate-fade-in">
            <h1 className="font-cactus font-bold text-2xl text-cactus-charcoal mb-2">
              Welcome back
            </h1>
            <p className="font-cactus text-sm text-cactus-charcoal/60 mb-6">
              Great to see you again. Sign in to pick up where you left off.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-cactus-goals-bg border border-cactus-overlay text-cactus-charcoal rounded-xl p-3 font-cactus text-sm mb-4 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-cactus-prickly flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="font-cactus font-semibold text-sm text-cactus-charcoal block mb-1.5"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl px-4 py-3 font-cactus text-cactus-charcoal outline-none"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="font-cactus font-semibold text-sm text-cactus-charcoal block mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl px-4 py-3 pr-12 font-cactus text-cactus-charcoal outline-none"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-cactus-charcoal/40 hover:text-cactus-charcoal"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-4 rounded-2xl font-cactus font-bold text-base text-white transition-all bg-cactus-sage shadow-[0_4px_16px_rgba(119,221,119,0.25)] hover:brightness-95 active:brightness-90 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <p className="mt-4 text-center">
              <Link
                to="/forgot-password"
                className="text-cactus-sage font-cactus font-semibold hover:underline"
              >
                Forgot password?
              </Link>
            </p>

            <p className="mt-4 text-center font-cactus text-sm text-cactus-charcoal/60">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="text-cactus-sage font-cactus font-semibold hover:underline"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
