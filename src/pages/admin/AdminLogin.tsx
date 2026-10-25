import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shield, KeyRound, Mail, AlertCircle, ArrowLeft, Lock, Sparkles, Check, ArrowRight } from 'lucide-react';

interface AdminLoginProps {
  onNavigate: (path: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onNavigate }) => {
  const { user, login } = useAuth();

  const [email, setEmail] = useState('admin@spectratv.com');
  const [password, setPassword] = useState('admin123456');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, show redirect or switch to dashboard
  if (user) {
    return (
      <div className="max-w-md mx-auto my-24 p-8 bg-neutral-900 border border-neutral-800 rounded-2xl text-center space-y-4">
        <Shield className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-white">অ্যাডমিন হিসেবে লগইন আছেন</h2>
        <p className="text-xs text-neutral-400">
          বর্তমান অ্যাকাউন্ট: <strong className="text-white">{user.email}</strong> ({user.display_name})
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('/admin/dashboard')}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg cursor-pointer shadow-md"
          >
            অ্যাডমিন ড্যাশবোর্ডে যান →
          </button>
          <button
            onClick={() => onNavigate('/')}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-lg cursor-pointer"
          >
            পাবলিক সাইট দেখুন
          </button>
        </div>
      </div>
    );
  }

  // 1-Click instant login handler
  const handleInstantLogin = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await login(email || 'admin@spectratv.com', password || 'admin123456');
      onNavigate('/admin/dashboard');
    } catch (err: any) {
      setError(err.message || 'লগইন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleInstantLogin();
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-neutral-900/95 border border-neutral-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm space-y-6">
        
        {/* Back Link */}
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>ওয়েবসাইটে ফিরে যান</span>
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-xl bg-rose-600 text-white flex items-center justify-center mx-auto shadow-md">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Staff Administration Portal
          </h1>
          <p className="text-xs text-neutral-400">
            অ্যাডমিন ড্যাশবোর্ডে প্রবেশের জন্য লগইন করুন
          </p>
        </div>

        {/* BIG INSTANT 1-CLICK BUTTON */}
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 space-y-3">
          <div className="text-xs text-neutral-300">
            <p className="font-semibold text-rose-400 mb-1">সহজে লগইন করার জন্য:</p>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              আপনাকে কিছুই টাইপ করতে হবে না। নিচের বাটনে ক্লিক করলেই সরাসরি অ্যাডমিন ড্যাশবোর্ডে প্রবেশ করবেন:
            </p>
          </div>

          <button
            type="button"
            onClick={handleInstantLogin}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-rose-950/50 transition-all cursor-pointer transform active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 text-rose-200" />
            <span>{submitting ? 'প্রবেশ করা হচ্ছে...' : '১-ক্লিকে সরাসরি ড্যাশবোর্ডে যান'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-lg bg-rose-950/60 border border-rose-800 text-xs text-rose-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">
            অথবা ম্যানুয়ালি তথ্য দিন
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Administrator Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-white text-xs font-semibold transition-colors cursor-pointer border border-neutral-700"
          >
            <KeyRound className="w-4 h-4 text-rose-500" />
            <span>{submitting ? 'লগইন হচ্ছে...' : 'Sign In to Dashboard'}</span>
          </button>
        </form>

        <div className="pt-3 border-t border-neutral-800/80 text-center">
          <p className="text-[11px] text-neutral-400">
            ডিফল্ট তথ্য: <span className="text-white font-mono">admin@spectratv.com</span> / <span className="text-rose-400 font-mono">admin123456</span>
          </p>
        </div>

      </div>
    </div>
  );
};
