'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Loader2, Lock, LogIn, Mail } from 'lucide-react';
import { useStore } from '@/lib/store';
import AuthShell from '@/views/auth/AuthShell';
import { AuthAlerts } from '@/views/auth/AuthAlerts';
import { AUTH_INPUT_CLASS } from '@/views/auth/authConstants';
import { commitSession } from '@/views/auth/authSession';

export default function SignInView() {
  const router = useRouter();
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const loginWithCredentials = useStore((s) => s.loginWithCredentials);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = loginWithCredentials(email, password);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setCurrentUser(res.user);
      commitSession(res.user);
      router.push('/');
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Sign in">
      <AuthAlerts error={error} success={success} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={AUTH_INPUT_CLASS}
              placeholder="you@company.com"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type={showPw ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${AUTH_INPUT_CLASS} pr-11`}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="flex justify-end">
          <Link href="/auth/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            Forgot password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 disabled:opacity-60 transition-all"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <LogIn className="h-5 w-5" />}
          Sign in
        </button>
        <p className="text-center text-sm text-slate-500">
          No account?{' '}
          <Link href="/auth/register" className="font-bold text-blue-600 hover:underline">
            Register
          </Link>
        </p>
        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          Demo: e.g. <span className="font-mono">admin@example.com</span> / <span className="font-mono">admin123</span>
        </p>
      </form>
    </AuthShell>
  );
}
