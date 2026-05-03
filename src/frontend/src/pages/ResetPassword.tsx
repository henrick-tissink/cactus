import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { apiClient } from '../api/client';

function CactusLogo({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M16 4C16 4 14 8 14 14V28H18V14C18 8 16 4 16 4Z"
        fill="currentColor"
      />
      <path
        d="M14 16C14 16 10 14 8 12C6 10 6 8 6 8C6 8 6 10 7 12C8 14 10 16 14 17V16Z"
        fill="currentColor"
      />
      <path
        d="M18 12C18 12 22 10 24 8C26 6 26 4 26 4C26 4 26 6 25 8C24 10 22 12 18 13V12Z"
        fill="currentColor"
      />
      <path
        d="M18 20C18 20 21 18 23 17C25 16 26 14 26 14C26 14 25 16 24 18C23 19 21 20 18 21V20Z"
        fill="currentColor"
      />
    </svg>
  );
}

function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 bg-[var(--cactus-forest)] relative overflow-hidden flex-col items-center justify-center p-12">
      {/* Abstract SVG decoration */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.06]"
        viewBox="0 0 600 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="100" cy="200" r="200" fill="white" />
        <circle cx="500" cy="600" r="250" fill="white" />
        <circle cx="400" cy="100" r="120" fill="white" />
        <path d="M0 400Q150 350 300 500T600 400V800H0Z" fill="white" />
      </svg>

      <div className="relative z-10 text-center max-w-sm">
        <CactusLogo className="w-16 h-16 text-[var(--cactus-mint)] mx-auto mb-6" />
        <h2 className="text-3xl font-bold text-white mb-4">Cactus</h2>
        <p className="text-lg text-[var(--cactus-mint)] leading-relaxed">
          Grow your money, one step at a time
        </p>
      </div>
    </div>
  );
}

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
      <div className="min-h-screen flex">
        <BrandPanel />
        <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-6 sm:p-12">
          <div className="w-full max-w-md animate-fade-in text-center">
            <div className="flex items-center gap-2 justify-center mb-6">
              <CactusLogo className="w-8 h-8 text-[var(--cactus-green)]" />
              <span className="text-2xl font-bold text-[var(--cactus-green)]">Cactus</span>
            </div>
            <p className="text-gray-600 mb-4">Invalid reset link.</p>
            <Link to="/forgot-password" className="text-[var(--cactus-green)] hover:text-[var(--cactus-forest)] font-medium">
              Request a new reset link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel — hidden on mobile */}
      <BrandPanel />

      {/* Right form panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-white p-6 sm:p-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-6">
              <CactusLogo className="w-8 h-8 text-[var(--cactus-green)]" />
              <span className="text-2xl font-bold text-[var(--cactus-green)]">Cactus</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Set your new password</h1>
            <p className="text-gray-500">Choose a strong password to keep your account secure.</p>
          </div>

          {success ? (
            <div className="text-center">
              <div className="p-3 bg-[var(--cactus-mint)] border border-green-200 rounded-lg text-green-700 text-sm mb-6">
                Password reset successfully!
              </div>
              <Link to="/login" className="text-[var(--cactus-green)] hover:text-[var(--cactus-forest)] font-medium">
                Sign in with your new password
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--cactus-green)] focus:border-transparent transition-shadow pr-12"
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  At least 8 characters with uppercase, lowercase, and a digit
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--cactus-green)] focus:border-transparent transition-shadow pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[var(--cactus-green)] hover:bg-[var(--cactus-forest)] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
