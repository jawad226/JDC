'use client';

import { useStore, User } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { LogIn } from 'lucide-react';
import Cookies from 'js-cookie';

export default function LoginPage() {
  const { users, setCurrentUser } = useStore();
  const router = useRouter();

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    Cookies.set('auth-role', user.role, { expires: 1 });
    Cookies.set('auth-user-id', user.id, { expires: 1 });
    router.push('/');
    router.refresh(); // Refresh to make middleware catch the new cookie state
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 absolute inset-0 z-50">
      <div className="bg-white p-10 rounded-2xl shadow-xl border border-slate-100 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex flex-col items-center">
            <div className="h-20 w-full flex items-center justify-center">
              <img
                src="/brand/logo.png"
                alt="Global Digital Care"
                className="h-20 w-auto max-w-[320px] object-contain"
                draggable={false}
              />
            </div>
            <span className="text-sm font-medium text-slate-400 mt-3 uppercase tracking-widest">
              Global Digital Care
            </span>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-slate-800 mb-6 text-center">Select your account</h2>
        
        <div className="space-y-4">
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => handleLogin(user)}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left group"
            >
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-semibold group-hover:bg-blue-100 group-hover:text-blue-600">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 group-hover:text-blue-700">{user.name}</p>
                  <p className="text-sm text-slate-500">{user.role}</p>
                </div>
              </div>
              <LogIn className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
