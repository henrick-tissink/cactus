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
    <div className="min-h-screen flex items-center justify-center bg-cactus-sandstone font-cactus px-6">
      <div className="w-full max-w-md animate-fade-in">
        <div className="bg-white rounded-2xl border border-cactus-overlay p-8 text-center">
          <div className="flex justify-center mb-6">
            <CactusLogo />
          </div>

          {status === 'loading' && (
            <p className="font-cactus text-cactus-charcoal/60">Verifying your email...</p>
          )}

          {status === 'success' && (
            <>
              <div className="bg-cactus-sage-light border border-cactus-overlay text-cactus-charcoal rounded-xl p-3 font-cactus text-sm mb-6 flex items-center gap-2 justify-center">
                <Check className="w-4 h-4 text-cactus-sage shrink-0" />
                <span>Your email has been verified successfully!</span>
              </div>
              <Link to="/" className="font-cactus font-semibold text-cactus-sage hover:underline">
                Go to Dashboard
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="bg-cactus-goals-bg border border-cactus-overlay text-cactus-charcoal rounded-xl p-3 font-cactus text-sm mb-6 flex items-center gap-2 justify-center">
                <AlertCircle className="w-4 h-4 text-cactus-prickly shrink-0" />
                <span>Invalid or expired verification link.</span>
              </div>
              <Link
                to="/settings"
                className="font-cactus font-semibold text-cactus-sage hover:underline"
              >
                Go to Settings to resend
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
