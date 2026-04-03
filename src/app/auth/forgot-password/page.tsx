import { Suspense } from 'react';
import ForgotPasswordView from '@/views/auth/forgot-password';

export const metadata = {
  title: 'Forgot password',
  description: 'Reset your password',
};

function AuthFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 absolute inset-0 z-50">
      <div className="text-slate-400 text-sm font-medium">Loading…</div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <ForgotPasswordView />
    </Suspense>
  );
}
