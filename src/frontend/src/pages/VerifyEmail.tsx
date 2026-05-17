import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, Check } from 'lucide-react';
import { apiClient } from '../api/client';
import { CactusLogo } from '../components/brand/CactusLogo';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    token ? 'loading' : 'error'
  );

  useEffect(() => {
    if (!token) return;

    apiClient
      .post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-cream font-sans-brand px-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="bg-brand-surface rounded-3xl border border-brand-border p-8 text-center shadow-[0_32px_72px_-32px_rgba(31,111,74,0.20)]">
          <div className="flex justify-center mb-7">
            <CactusLogo />
          </div>

          <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
            Email verification
          </p>

          {status === 'loading' && (
            <>
              <h1 className="font-display font-medium text-[1.5rem] leading-[1.1] tracking-[-0.018em] text-brand-text mb-3">
                Verifying…
              </h1>
              <p className="text-[14px] text-brand-text-muted">Hold tight for a moment.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <h1 className="font-display font-medium text-[1.5rem] leading-[1.1] tracking-[-0.018em] text-brand-text mb-3">
                You're verified.
              </h1>
              <div className="bg-brand-sage-soft border-l-[3px] border-brand-sage rounded-r-xl pl-4 pr-3 py-3 text-[14px] text-brand-text flex items-center gap-2 mb-6 text-left">
                <Check className="w-4 h-4 shrink-0 text-brand-sage" />
                <span>Your email has been verified successfully.</span>
              </div>
              <Link
                to="/"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold text-[13px] text-white bg-brand-sage shadow-[0_8px_24px_-6px_rgba(31,111,74,0.45)] hover:shadow-[0_12px_32px_-6px_rgba(31,111,74,0.55)] hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface transition-all"
              >
                Go to dashboard
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <h1 className="font-display font-medium text-[1.5rem] leading-[1.1] tracking-[-0.018em] text-brand-text mb-3">
                That link didn't work.
              </h1>
              <div className="bg-brand-terracotta-soft border-l-[3px] border-brand-terracotta rounded-r-xl pl-4 pr-3 py-3 text-[14px] text-brand-accent-ink flex items-center gap-2 mb-6 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 text-brand-terracotta" />
                <span>Invalid or expired verification link.</span>
              </div>
              <Link
                to="/settings"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold text-[13px] text-white bg-brand-sage shadow-[0_8px_24px_-6px_rgba(31,111,74,0.45)] hover:shadow-[0_12px_32px_-6px_rgba(31,111,74,0.55)] hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface transition-all"
              >
                Resend from settings
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
