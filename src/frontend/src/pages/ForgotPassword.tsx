import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { apiClient } from '../api/client';
import { AuthBrandPanel } from '../components/auth/AuthBrandPanel';
import { CactusLogo } from '../components/brand/CactusLogo';

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
    <div className="flex min-h-screen">
      <AuthBrandPanel
        heading="Build a Spending Plan that actually works"
        tagline="Track where every Rand goes, hit your goals, and feel calm about money."
      />
      <div className="flex-1 bg-cactus-sandstone p-6 md:p-12 flex flex-col font-cactus">
        <div className="mb-8">
          <CactusLogo />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-sm animate-fade-in">
            <h1 className="font-cactus font-bold text-2xl text-cactus-charcoal mb-2">
              Reset your password
            </h1>
            <p className="font-cactus text-sm text-cactus-charcoal/60 mb-6">
              Enter your email and we'll send you a link to get back in.
            </p>

            {submitted ? (
              <>
                <div className="bg-cactus-sage-light border border-cactus-overlay text-cactus-charcoal rounded-xl p-3 font-cactus text-sm mb-4 flex items-center gap-2">
                  <Check className="w-4 h-4 text-cactus-sage flex-shrink-0" />
                  <span>
                    If an account with that email exists, we've sent a password reset link.
                  </span>
                </div>
                <p className="text-center">
                  <Link
                    to="/login"
                    className="text-cactus-sage font-cactus font-semibold hover:underline"
                  >
                    Back to sign in
                  </Link>
                </p>
              </>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-5">
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

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full px-6 py-4 rounded-2xl font-cactus font-bold text-base text-white transition-all bg-cactus-sage shadow-[0_4px_16px_rgba(119,221,119,0.25)] hover:brightness-95 active:brightness-90 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>

                <p className="mt-4 text-center font-cactus text-sm text-cactus-charcoal/60">
                  Remember your password?{' '}
                  <Link
                    to="/login"
                    className="text-cactus-sage font-cactus font-semibold hover:underline"
                  >
                    Back to sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
