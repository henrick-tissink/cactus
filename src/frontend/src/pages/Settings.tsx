import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { AlertCircle, Check, ShieldCheck } from 'lucide-react';

const labelClass =
  'block font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2';
const inputClass =
  'w-full bg-brand-cream/40 border border-brand-border focus:border-brand-sage focus:bg-brand-surface focus:ring-2 focus:ring-brand-sage/15 rounded-xl px-4 py-3 text-[15px] text-brand-text placeholder:text-brand-text-faint outline-none transition-all';
const submitButtonClass =
  'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold text-[13px] text-white transition-all bg-brand-sage shadow-[0_8px_24px_-6px_rgba(31,111,74,0.45)] hover:shadow-[0_12px_32px_-6px_rgba(31,111,74,0.55)] hover:-translate-y-px active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream disabled:bg-brand-border disabled:text-brand-text-faint disabled:shadow-none disabled:cursor-not-allowed disabled:hover:translate-y-0';

export function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.put('/auth/profile', {
        firstName: profileForm.firstName || null,
        lastName: profileForm.lastName || null,
      });
      return response.data;
    },
    onSuccess: (data: { userId: string; email: string; firstName?: string; lastName?: string }) => {
      if (user) {
        setUser({ ...user, firstName: data.firstName, lastName: data.lastName });
      }
      setProfileSuccess(true);
      setProfileError(null);
      setTimeout(() => setProfileSuccess(false), 3000);
    },
    onError: () => {
      setProfileError('Failed to update profile');
      setProfileSuccess(false);
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      await apiClient.put('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
    },
    onSuccess: () => {
      setPasswordSuccess(true);
      setPasswordError(null);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordSuccess(false), 3000);
    },
    onError: () => {
      setPasswordError('Failed to change password. Check your current password.');
      setPasswordSuccess(false);
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate();
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    changePasswordMutation.mutate();
  };

  return (
    <div className="bg-brand-cream min-h-screen font-sans-brand p-6 md:p-10 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-2">
            Your account
          </p>
          <h1 className="font-display font-medium text-[2.25rem] leading-[1.05] tracking-[-0.018em] text-brand-text">
            Settings.
          </h1>
        </header>

        {/* Email Verification Banner */}
        {user && user.isEmailVerified === false && (
          <div className="bg-brand-terracotta-soft border-l-[3px] border-brand-terracotta rounded-r-xl pl-4 pr-3 py-3 flex items-center gap-3 mb-6">
            <AlertCircle className="w-4 h-4 shrink-0 text-brand-terracotta" />
            <p className="text-[14px] text-brand-accent-ink flex-1">Your email is not verified.</p>
            <ResendVerificationButton />
          </div>
        )}

        {user && user.isEmailVerified === true && (
          <div className="bg-brand-sage-soft border-l-[3px] border-brand-sage rounded-r-xl pl-4 pr-3 py-3 flex items-center gap-3 mb-6">
            <ShieldCheck className="w-4 h-4 shrink-0 text-brand-sage" />
            <p className="text-[14px] text-brand-text">Email verified</p>
          </div>
        )}

        {/* Profile Section */}
        <section className="bg-brand-surface border border-brand-border rounded-3xl p-7 mb-6 shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)]">
          <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-1">
            About you
          </p>
          <h2 className="font-display font-medium text-[1.375rem] leading-[1.1] tracking-[-0.018em] text-brand-text mb-6">
            Profile
          </h2>

          {profileError && (
            <div className="bg-brand-terracotta-soft border-l-[3px] border-brand-terracotta rounded-r-xl pl-4 pr-3 py-3 text-[14px] text-brand-accent-ink flex items-center gap-2 mb-5">
              <AlertCircle className="w-4 h-4 shrink-0 text-brand-terracotta" />
              <span>{profileError}</span>
            </div>
          )}

          {profileSuccess && (
            <div className="bg-brand-sage-soft border-l-[3px] border-brand-sage rounded-r-xl pl-4 pr-3 py-3 text-[14px] text-brand-text flex items-center gap-2 mb-5">
              <Check className="w-4 h-4 shrink-0 text-brand-sage" />
              <span>Profile updated successfully</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-5">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className={`${inputClass} bg-brand-border/30 text-brand-text-faint cursor-not-allowed`}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First name</label>
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  className={inputClass}
                  placeholder="First name"
                />
              </div>
              <div>
                <label className={labelClass}>Last name</label>
                <input
                  type="text"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  className={inputClass}
                  placeholder="Last name"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={updateProfileMutation.isPending}
              className={submitButtonClass}
            >
              {updateProfileMutation.isPending ? 'Saving…' : 'Save profile'}
            </button>
          </form>
        </section>

        {/* Password Section */}
        <section className="bg-brand-surface border border-brand-border rounded-3xl p-7 mb-6 shadow-[0_16px_40px_-20px_rgba(31,111,74,0.10)]">
          <p className="font-sans-brand text-[11px] uppercase tracking-[0.18em] font-semibold text-brand-text-muted mb-1">
            Security
          </p>
          <h2 className="font-display font-medium text-[1.375rem] leading-[1.1] tracking-[-0.018em] text-brand-text mb-6">
            Change password
          </h2>

          {passwordError && (
            <div className="bg-brand-terracotta-soft border-l-[3px] border-brand-terracotta rounded-r-xl pl-4 pr-3 py-3 text-[14px] text-brand-accent-ink flex items-center gap-2 mb-5">
              <AlertCircle className="w-4 h-4 shrink-0 text-brand-terracotta" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="bg-brand-sage-soft border-l-[3px] border-brand-sage rounded-r-xl pl-4 pr-3 py-3 text-[14px] text-brand-text flex items-center gap-2 mb-5">
              <Check className="w-4 h-4 shrink-0 text-brand-sage" />
              <span>Password changed successfully</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label className={labelClass}>Current password</label>
              <input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                }
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>New password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className={inputClass}
                required
                minLength={8}
              />
              <p className="text-[12px] text-brand-text-faint mt-1.5">
                At least 8 characters with uppercase, lowercase, and a digit.
              </p>
            </div>
            <div>
              <label className={labelClass}>Confirm new password</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                }
                className={inputClass}
                required
              />
            </div>
            <button
              type="submit"
              disabled={changePasswordMutation.isPending}
              className={submitButtonClass}
            >
              {changePasswordMutation.isPending ? 'Changing…' : 'Change password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

function ResendVerificationButton() {
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);

  const resendMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/resend-verification');
    },
    onSuccess: () => {
      setSent(true);
      setFailed(false);
    },
    onError: () => setFailed(true),
  });

  if (sent) {
    return (
      <span className="text-[13px] text-brand-sage font-semibold tracking-[-0.005em]">Sent!</span>
    );
  }

  if (failed) {
    return (
      <span className="text-[13px] text-brand-terracotta font-semibold tracking-[-0.005em]">
        Failed to send
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => resendMutation.mutate()}
      disabled={resendMutation.isPending}
      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-border bg-brand-surface text-brand-text-muted hover:bg-brand-sage-soft/60 hover:text-brand-text font-semibold text-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream disabled:opacity-50 transition-colors"
    >
      {resendMutation.isPending ? 'Sending…' : 'Resend'}
    </button>
  );
}
