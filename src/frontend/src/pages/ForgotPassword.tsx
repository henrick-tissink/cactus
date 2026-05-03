import { useState } from 'react';
import { Link } from 'react-router-dom';
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

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
    } catch {
      // Always show success to avoid leaking user existence
    } finally {
      setIsLoading(false);
      setSubmitted(true);
    }
  };

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset your password</h1>
            <p className="text-gray-500">Enter your email and we'll send you a link to get back in.</p>
          </div>

          {submitted ? (
            <div className="text-center">
              <div className="p-3 bg-[var(--cactus-mint)] border border-green-200 rounded-lg text-green-700 text-sm mb-6">
                If an account with that email exists, we've sent a password reset link.
              </div>
              <Link to="/login" className="text-[var(--cactus-green)] hover:text-[var(--cactus-forest)] font-medium">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--cactus-green)] focus:border-transparent transition-shadow"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[var(--cactus-green)] hover:bg-[var(--cactus-forest)] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-gray-600">
            Remember your password?{' '}
            <Link to="/login" className="text-[var(--cactus-green)] hover:text-[var(--cactus-forest)] font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
