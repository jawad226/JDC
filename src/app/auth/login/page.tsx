import { Suspense } from 'react';
import SignInView from '@/views/auth/login';

export const metadata = {
  title: 'Login',
  description: 'Login to your account',
};

function AuthFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 absolute inset-0 z-50">
      <div className="text-slate-400 text-sm font-medium">Loading…</div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthFallback />}>
      <SignInView />
    </Suspense>
  );
}
