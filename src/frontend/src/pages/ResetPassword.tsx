import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react';
import { apiClient } from '../api/client';
import { AuthBrandPanel } from '../components/auth/AuthBrandPanel';
import { CactusLogo } from '../components/brand/CactusLogo';

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { token, newPassword: password });
      setSuccess(true);
    } catch {
      setError('Invalid or expired reset link. Please request a new one.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen">
        <AuthBrandPanel />
        <div className="flex-1 bg-cactus-sandstone p-6 md:p-12 flex flex-col font-cactus">
          <div className="mb-8 md:hidden">
            <CactusLogo />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-sm animate-fade-in text-center">
              <div className="bg-cactus-goals-bg border border-cactus-overlay text-cactus-charcoal rounded-xl p-3 font-cactus text-sm mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-cactus-prickly shrink-0" />
                <span>Invalid reset link.</span>
              </div>
              <Link
                to="/forgot-password"
                className="text-cactus-sage font-cactus font-semibold hover:underline"
              >
                Request a new reset link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              Set your new password
            </h1>
            <p className="font-cactus text-sm text-cactus-charcoal/60 mb-6">
              Choose a strong password to keep your account secure.
            </p>

            {success ? (
              <>
                <div className="bg-cactus-sage-light border border-cactus-overlay text-cactus-charcoal rounded-xl p-3 font-cactus text-sm mb-4 flex items-center gap-2">
                  <Check className="w-4 h-4 text-cactus-sage shrink-0" />
                  <span>Password reset successfully!</span>
                </div>
                <p className="text-center">
                  <Link
                    to="/login"
                    className="text-cactus-sage font-cactus font-semibold hover:underline"
                  >
                    Sign in with your new password
                  </Link>
                </p>
              </>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-cactus-goals-bg border border-cactus-overlay text-cactus-charcoal rounded-xl p-3 font-cactus text-sm mb-4 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-cactus-prickly shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label
                    htmlFor="password"
                    className="font-cactus font-semibold text-sm text-cactus-charcoal block mb-1.5"
                  >
                    New Password
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
                      minLength={8}
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
                  <p className="font-cactus text-xs text-cactus-charcoal/60 mt-1">
                    At least 8 characters with uppercase, lowercase, and a digit
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="font-cactus font-semibold text-sm text-cactus-charcoal block mb-1.5"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl px-4 py-3 pr-12 font-cactus text-cactus-charcoal outline-none"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-cactus-charcoal/40 hover:text-cactus-charcoal"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full px-6 py-4 rounded-2xl font-cactus font-bold text-base text-white transition-all bg-cactus-sage shadow-[0_4px_16px_rgba(119,221,119,0.25)] hover:brightness-95 active:brightness-90 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
