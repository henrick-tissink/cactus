import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    apiClient.post('/auth/verify-email', { token })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <h1 className="text-3xl font-bold text-green-600 mb-4">🌵 Cactus</h1>

          {status === 'loading' && (
            <p className="text-gray-600">Verifying your email...</p>
          )}

          {status === 'success' && (
            <>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm mb-6">
                Your email has been verified successfully!
              </div>
              <Link to="/" className="text-green-600 hover:text-green-700 font-medium">
                Go to Dashboard
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-6">
                Invalid or expired verification link.
              </div>
              <Link to="/settings" className="text-green-600 hover:text-green-700 font-medium">
                Go to Settings to resend
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
