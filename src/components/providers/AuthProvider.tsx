'use client';

import { useStore } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, setCurrentUser } = useStore();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Rehydrate session: cookie present but zustand user empty (e.g. cleared storage)
  useEffect(() => {
    if (!mounted) return;
    const roleCookie = Cookies.get('auth-role');
    const idCookie = Cookies.get('auth-user-id');
    if (roleCookie && idCookie && !currentUser) {
      const u = useStore.getState().users.find((x) => x.id === idCookie);
      if (u && u.role === roleCookie) {
        setCurrentUser(u);
        return;
      }
      Cookies.remove('auth-role');
      Cookies.remove('auth-user-id');
      router.push('/auth/login');
    }
  }, [mounted, currentUser, setCurrentUser, router]);

  useEffect(() => {
    if (!mounted) return;
    const roleCookie = Cookies.get('auth-role');

    // If no cookie but user in state (e.g., cookie expired), clear state and go to login
    if (currentUser && !roleCookie) {
      setCurrentUser(null);
      router.push('/auth/login');
    }
  }, [currentUser, pathname, router, mounted, setCurrentUser]);

  // Prevent hydration mismatch by not rendering anything until mounted
  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}
