'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, KeyRound, Loader2, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { useStore } from '@/lib/store';
import AuthShell from '@/views/auth/AuthShell';
import { AuthAlerts } from '@/views/auth/AuthAlerts';
import { AUTH_INPUT_CLASS } from '@/views/auth/authConstants';

type Step = 'email' | 'otp';

export default function ForgotPasswordView() {
  const router = useRouter();
  const requestPasswordReset = useStore((s) => s.requestPasswordReset);
  const verifyPasswordResetOtp = useStore((s) => s.verifyPasswordResetOtp);

  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [demoOtp, setDemoOtp] = useState<string | null>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
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
      const trimmed = email.trim().toLowerCase();
      setSubmittedEmail(trimmed);
      setDemoOtp(res.demoOtp);
      setOtp('');
      setStep('otp');
      setSuccess(
        'If an account exists for this email, a verification code was generated. Enter the 6-digit code below.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = verifyPasswordResetOtp(submittedEmail, otp);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.replace(`/auth/reset-password?token=${encodeURIComponent(res.token)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = requestPasswordReset(submittedEmail);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setDemoOtp(res.demoOtp);
      setOtp('');
      setSuccess('A new code was sent. Use the updated demo code below.');
    } finally {
      setLoading(false);
    }
  };

  const goBackToEmail = () => {
    setStep('email');
    setError(null);
    setSuccess(null);
    setOtp('');
    setDemoOtp(null);
  };

  return (
    <AuthShell title={step === 'email' ? 'Forgot password' : 'Verify code'}>
      <AuthAlerts error={error} success={success} onDismiss={() => { setError(null); setSuccess(null); }} />

      {step === 'email' ? (
        <form onSubmit={handleEmailSubmit} className="space-y-4">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={AUTH_INPUT_CLASS}
                placeholder="you@company.com"
                autoComplete="email"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
            Send verification code
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <button
            type="button"
            onClick={goBackToEmail}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Use a different email
          </button>

          <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2.5 text-sm text-indigo-950">
            <p className="flex items-center gap-2 font-semibold">
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              Code sent to <span className="break-all">{submittedEmail}</span>
            </p>
            {demoOtp ? (
              <p className="mt-2 rounded-lg bg-white/80 px-2 py-1.5 font-mono text-base font-bold tracking-[0.2em] text-indigo-900 ring-1 ring-indigo-100">
                Demo code: {demoOtp}
              </p>
            ) : null}
            <p className="mt-2 text-xs leading-relaxed text-indigo-800/90">
              In production this code would arrive by email. This demo shows it here so you can continue the flow.
            </p>
          </div>

          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
                6-digit code
              </label>
              <div className="relative">
                <ShieldCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={AUTH_INPUT_CLASS}
                  placeholder="••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
              Verify code
            </button>
          </form>

          <button
            type="button"
            disabled={loading}
            onClick={handleResend}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden />
            Resend code
          </button>
        </div>
      )}
    </AuthShell>
  );
}
