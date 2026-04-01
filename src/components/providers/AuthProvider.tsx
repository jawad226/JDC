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

  useEffect(() => {
    if (mounted) {
      const roleCookie = Cookies.get('auth-role');
      
      // If no cookie but user in state (e.g., cookie expired), clear state and go to login
      if (currentUser && !roleCookie) {
        setCurrentUser(null);
        router.push('/login');
      } 
      // If no user in state but cookie exists (e.g. cleared localStorage), clear cookie and go to login
      else if (!currentUser && roleCookie) {
        Cookies.remove('auth-role');
        Cookies.remove('auth-user-id');
        router.push('/login');
      }
    }
  }, [currentUser, pathname, router, mounted, setCurrentUser]);

  // Prevent hydration mismatch by not rendering anything until mounted
  if (!mounted) {
    return null;
  }

  return <>{children}</>;
}
