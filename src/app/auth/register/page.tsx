import { Suspense } from 'react';
import RegisterView from '@/views/auth/register';

export const metadata = {
  title: 'Register',
  description: 'Create your account',
};

function AuthFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 absolute inset-0 z-50">
      <div className="text-slate-400 text-sm font-medium">Loading…</div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <RegisterView />
    </Suspense>
  );
}
