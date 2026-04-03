import { Suspense } from 'react';
import ResetPasswordView from '@/views/auth/reset-password';

export const metadata = {
  title: 'Reset password',
  description: 'Set a new password',
};

function AuthFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 absolute inset-0 z-50">
      <div className="text-slate-400 text-sm font-medium">Loading…</div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <ResetPasswordView />
    </Suspense>
  );
}
