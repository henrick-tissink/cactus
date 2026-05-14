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
      <AuthBrandPanel />
      <div className="flex-1 bg-brand-cream p-6 md:p-12 lg:p-16 flex flex-col font-sans-brand">
        <div className="mb-8 md:hidden">
          <CactusLogo />
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-[22rem] animate-fade-in">
            <h1 className="font-display font-medium text-[2.25rem] leading-[1.1] tracking-[-0.015em] text-brand-text mb-3">
              Reset your password.
            </h1>
            <p className="font-sans-brand text-[15px] leading-relaxed text-brand-text-muted mb-9">
              Enter your email and we'll send you a link to get back in.
            </p>

            {submitted ? (
              <>
                <div className="bg-brand-sage-soft border-l-[3px] border-brand-sage rounded-r-xl pl-4 pr-3 py-3 font-sans-brand text-[14px] text-brand-text mb-6 flex items-start gap-2">
                  <Check className="w-4 h-4 text-brand-sage shrink-0 mt-0.5" />
                  <span>
                    If an account with that email exists, we've sent a password reset link.
                  </span>
                </div>
                <p className="text-center">
                  <Link
                    to="/login"
                    className="font-sans-brand text-[13px] font-semibold text-brand-sage hover:text-brand-accent-ink underline-offset-4 hover:underline transition-colors"
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

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full mt-2 px-6 py-3.5 rounded-2xl font-sans-brand font-semibold text-[15px] text-white bg-brand-sage shadow-[0_8px_24px_-6px_rgba(31,111,74,0.45)] hover:shadow-[0_12px_32px_-6px_rgba(31,111,74,0.55)] hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream disabled:bg-brand-border disabled:text-brand-text-faint disabled:shadow-none disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all"
                  >
                    {isLoading ? 'Sending…' : 'Send reset link'}
                  </button>
                </form>

                <div className="mt-10 pt-6 border-t border-brand-border text-center">
                  <p className="font-sans-brand text-[13px] text-brand-text-muted">
                    Remember your password?{' '}
                    <Link
                      to="/login"
                      className="font-semibold text-brand-sage hover:text-brand-accent-ink underline-offset-4 hover:underline transition-colors"
                    >
                      Back to sign in
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
