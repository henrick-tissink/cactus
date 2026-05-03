import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/authStore';
import { User, Save, Lock, AlertCircle, Check, Mail, ShieldCheck } from 'lucide-react';

export function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
      });
    }
  }, [user]);
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
    <div className="p-8 max-w-2xl mx-auto animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      {/* Email Verification Banner */}
      {user && user.isEmailVerified === false && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
          <Mail className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-700">Your email is not verified.</p>
          </div>
          <ResendVerificationButton />
        </div>
      )}

      {user && user.isEmailVerified === true && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700">Email verified</p>
        </div>
      )}

      {/* Profile Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-green-100 rounded-lg">
            <User className="w-5 h-5 text-green-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
        </div>

        {profileError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{profileError}</span>
          </div>
        )}

        {profileSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">Profile updated successfully</span>
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input
                type="text"
                value={profileForm.firstName}
                onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="First name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={profileForm.lastName}
                onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Last name"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={updateProfileMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
          </button>
        </form>
      </div>

      {/* Password Section */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-100 rounded-lg">
            <Lock className="w-5 h-5 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Change Password</h2>
        </div>

        {passwordError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{passwordError}</span>
          </div>
        )}

        {passwordSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">Password changed successfully</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              minLength={8}
            />
            <p className="text-xs text-gray-500 mt-1">
              At least 8 characters with uppercase, lowercase, and a digit
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            disabled={changePasswordMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50"
          >
            <Lock className="w-4 h-4" />
            {changePasswordMutation.isPending ? 'Changing...' : 'Change Password'}
          </button>
        </form>
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
    onSuccess: () => { setSent(true); setFailed(false); },
    onError: () => setFailed(true),
  });

  if (sent) {
    return <span className="text-sm text-green-600">Sent!</span>;
  }

  if (failed) {
    return <span className="text-sm text-red-600">Failed to send</span>;
  }

  return (
    <button
      onClick={() => resendMutation.mutate()}
      disabled={resendMutation.isPending}
      className="text-sm text-amber-700 font-medium hover:text-amber-800 disabled:opacity-50"
    >
      {resendMutation.isPending ? 'Sending...' : 'Resend'}
    </button>
  );
}
