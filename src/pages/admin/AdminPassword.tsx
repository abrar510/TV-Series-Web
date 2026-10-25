import React, { useState } from 'react';
import { adminApi } from '../../services/api';
import { KeyRound, Check, AlertCircle, Lock } from 'lucide-react';

export const AdminPassword: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSaving(true);
    try {
      await adminApi.changePassword({ currentPassword, newPassword });
      setSuccess('Your password has been successfully updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-md space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight">Change Password</h1>
        <p className="text-xs text-neutral-400 mt-1">
          Update your administrator credentials using bcrypt cryptographic hashing.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-200 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="p-3.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-200 flex items-start gap-2.5">
          <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>{success}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-5 rounded-xl bg-neutral-900/60 border border-neutral-800 space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">
            Current Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">
            New Password (min 8 characters)
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-rose-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-md transition-colors cursor-pointer"
        >
          <KeyRound className="w-4 h-4" />
          <span>{saving ? 'Updating Password...' : 'Update Password'}</span>
        </button>
      </form>
    </div>
  );
};
