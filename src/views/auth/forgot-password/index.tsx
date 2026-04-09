'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { useStore } from '@/lib/store';
import AuthShell from '@/views/auth/AuthShell';
import { AuthAlerts } from '@/views/auth/AuthAlerts';
import { AUTH_INPUT_CLASS } from '@/views/auth/authConstants';

export default function ForgotPasswordView() {
  const requestPasswordReset = useStore((s) => s.requestPasswordReset);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = requestPasswordReset(email);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const resetUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset-password?token=${encodeURIComponent(res.token)}`;
      setSuccess(`Reset link ready (demo). Copy or open: ${resetUrl}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Forgot password">
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
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Email</label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={AUTH_INPUT_CLASS}
              placeholder="you@company.com"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
          Send reset link (demo)
        </button>
      </form>
    </AuthShell>
  );
}
