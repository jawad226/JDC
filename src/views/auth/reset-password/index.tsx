'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Eye, EyeOff, KeyRound, Loader2, Lock } from 'lucide-react';
import { useStore } from '@/lib/store';
import AuthShell from '@/views/auth/AuthShell';
import { AuthAlerts } from '@/views/auth/AuthAlerts';
import { AUTH_INPUT_CLASS } from '@/views/auth/authConstants';

export default function ResetPasswordView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const resetPasswordWithToken = useStore((s) => s.resetPasswordWithToken);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [token, setToken] = useState(tokenFromUrl);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  useEffect(() => {
    setToken(tokenFromUrl);
  }, [tokenFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (password !== passwordConfirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res = resetPasswordWithToken(token, password);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSuccess('Password updated. You can sign in now.');
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Reset password">
      <AuthAlerts error={error} success={success} />
      <form onSubmit={handleSubmit} className="space-y-4">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Reset token</label>
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className={`${AUTH_INPUT_CLASS} font-mono text-xs`}
              placeholder="Paste token from email (demo)"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">New password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type={showPw ? 'text' : 'password'}
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${AUTH_INPUT_CLASS} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Confirm password</label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type={showPw2 ? 'text' : 'password'}
              required
              minLength={6}
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className={`${AUTH_INPUT_CLASS} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPw2(!showPw2)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPw2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
          Update password
        </button>
      </form>
    </AuthShell>
  );
}
