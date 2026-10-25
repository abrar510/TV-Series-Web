import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Film, Shield, KeyRound, Mail, User, AlertCircle, ArrowLeft, Lock } from 'lucide-react';

interface AdminLoginProps {
  onNavigate: (path: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onNavigate }) => {
  const { user, needsSetup, login, setupAdmin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [rateLimitTime, setRateLimitTime] = useState<number | null>(null);

  // If already logged in, show redirect or switch to dashboard
  if (user) {
    return (
      <div className="max-w-md mx-auto my-24 p-8 bg-neutral-900 border border-neutral-800 rounded-2xl text-center space-y-4">
        <Shield className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">Authenticated Session Active</h2>
        <p className="text-xs text-neutral-400">
          Logged in as <strong className="text-white">{user.email}</strong> ({user.display_name}).
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('/admin/dashboard')}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
          >
            Go to Admin Dashboard
          </button>
          <button
            onClick={() => onNavigate('/')}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-lg cursor-pointer"
          >
            View Live Site
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (needsSetup) {
        await setupAdmin(email, password, displayName);
      } else {
        await login(email, password);
      }
      onNavigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      if (err.message && err.message.includes('locked')) {
        setRateLimitTime(900);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-neutral-900/90 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm space-y-6">
        
        {/* Back Link */}
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Public Catalog</span>
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            {needsSetup ? 'Initial Administrator Setup' : 'Staff Administration Portal'}
          </h1>
          <p className="text-xs text-neutral-400 leading-relaxed">
            {needsSetup
              ? 'No administrator account exists yet. Create your master administrator credentials to secure the system.'
              : 'Enter your verified credentials to access the series catalog and streaming management dashboard.'}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-lg bg-rose-950/50 border border-rose-800/80 text-xs text-rose-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {needsSetup && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Display Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  required
                  placeholder="Master Admin"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Administrator Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="email"
                required
                placeholder="admin@spectratv.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Password {needsSetup && <span className="text-neutral-500 font-normal">(min 8 characters)</span>}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="password"
                required
                minLength={8}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer shadow-md mt-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>
              {submitting
                ? 'Validating Session...'
                : needsSetup
                ? 'Create Administrator Account'
                : 'Sign In to Dashboard'}
            </span>
          </button>
        </form>

        <div className="pt-4 border-t border-neutral-800/80 text-center">
          <p className="text-[11px] text-neutral-400">
            Protected with HttpOnly session cookies, bcrypt hashing, and automated brute-force rate limiting.
          </p>
        </div>

      </div>
    </div>
  );
};
