import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { AlertCircle, Check, ShieldCheck } from 'lucide-react';

const inputClass =
  'w-full border-2 border-cactus-overlay focus:border-cactus-sage rounded-xl px-4 py-3 font-cactus text-cactus-charcoal outline-none transition-colors';
const labelClass = 'font-cactus font-semibold text-sm text-cactus-charcoal block mb-1.5';
const submitButtonClass =
  'w-full px-6 py-4 rounded-2xl font-cactus font-bold text-base text-white transition-all bg-cactus-sage shadow-[0_4px_16px_rgba(119,221,119,0.25)] hover:brightness-95 active:brightness-90 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none disabled:cursor-not-allowed';

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
    <div className="bg-cactus-sandstone min-h-screen font-cactus p-6 animate-fade-in">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-cactus-charcoal font-cactus font-bold text-2xl mb-6">Settings</h1>

        {/* Email Verification Banner */}
        {user && user.isEmailVerified === false && (
          <div className="bg-cactus-goals-bg border border-cactus-overlay rounded-xl p-4 flex items-center gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-cactus-prickly shrink-0" />
            <div className="flex-1">
              <p className="font-cactus text-sm text-cactus-charcoal">
                Your email is not verified.
              </p>
            </div>
            <ResendVerificationButton />
          </div>
        )}

        {user && user.isEmailVerified === true && (
          <div className="bg-cactus-sage-light border border-cactus-overlay rounded-xl p-4 flex items-center gap-3 mb-6">
            <ShieldCheck className="w-5 h-5 text-cactus-sage shrink-0" />
            <p className="font-cactus text-sm text-cactus-charcoal">Email verified</p>
          </div>
        )}

        {/* Profile Section */}
        <div className="bg-white border border-cactus-overlay rounded-2xl p-6 mb-6">
          <h2 className="text-cactus-charcoal font-cactus font-bold text-lg mb-4">Profile</h2>

          {profileError && (
            <div className="bg-cactus-goals-bg border border-cactus-overlay text-cactus-charcoal rounded-xl p-3 font-cactus text-sm mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-cactus-prickly shrink-0" />
              <span>{profileError}</span>
            </div>
          )}

          {profileSuccess && (
            <div className="bg-cactus-sage-light border border-cactus-overlay text-cactus-charcoal rounded-xl p-3 font-cactus text-sm mb-4 flex items-center gap-2">
              <Check className="w-4 h-4 text-cactus-sage shrink-0" />
              <span>Profile updated successfully</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className={`${inputClass} bg-cactus-overlay/20 text-cactus-charcoal/60 cursor-not-allowed`}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>First Name</label>
                <input
                  type="text"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  className={inputClass}
                  placeholder="First name"
                />
              </div>
              <div>
                <label className={labelClass}>Last Name</label>
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
              {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Password Section */}
        <div className="bg-white border border-cactus-overlay rounded-2xl p-6 mb-6">
          <h2 className="text-cactus-charcoal font-cactus font-bold text-lg mb-4">
            Change Password
          </h2>

          {passwordError && (
            <div className="bg-cactus-goals-bg border border-cactus-overlay text-cactus-charcoal rounded-xl p-3 font-cactus text-sm mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-cactus-prickly shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          {passwordSuccess && (
            <div className="bg-cactus-sage-light border border-cactus-overlay text-cactus-charcoal rounded-xl p-3 font-cactus text-sm mb-4 flex items-center gap-2">
              <Check className="w-4 h-4 text-cactus-sage shrink-0" />
              <span>Password changed successfully</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>Current Password</label>
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
              <label className={labelClass}>New Password</label>
              <input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className={inputClass}
                required
                minLength={8}
              />
              <p className="font-cactus text-xs text-cactus-charcoal/60 mt-1">
                At least 8 characters with uppercase, lowercase, and a digit
              </p>
            </div>
            <div>
              <label className={labelClass}>Confirm New Password</label>
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
              {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
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
    return <span className="font-cactus text-sm text-cactus-sage font-semibold">Sent!</span>;
  }

  if (failed) {
    return (
      <span className="font-cactus text-sm text-cactus-prickly font-semibold">Failed to send</span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => resendMutation.mutate()}
      disabled={resendMutation.isPending}
      className="bg-white border border-cactus-overlay text-cactus-charcoal hover:bg-cactus-sage-light/40 disabled:opacity-50 px-4 py-2 rounded-xl font-cactus font-semibold text-sm transition-colors"
    >
      {resendMutation.isPending ? 'Sending...' : 'Resend'}
    </button>
  );
}
