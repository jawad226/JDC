'use client';

import { ToastViewport } from '@/components/ToastViewport';
import { ACCESS_TOKEN_COOKIE } from '@/lib/api/axios.config';
import { mapProfileToStoreUser } from '@/lib/auth/map-api-user';
import { useStore, type Role } from '@/lib/store';
import { getCurrentUserProfile } from '@/services/user.service';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { clearSessionCookies } from '@/views/auth/authSession';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const currentUser = useStore((s) => s.currentUser);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const upsertUser = useStore((s) => s.upsertUser);
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
    const tokenCookie = Cookies.get(ACCESS_TOKEN_COOKIE);
    if (!roleCookie || !idCookie || currentUser) return;

    let cancelled = false;

    async function hydrate() {
      const id = idCookie as string;
      const role = roleCookie as Role;
      if (tokenCookie) {
        try {
          const profile = await getCurrentUserProfile();
          if (cancelled) return;
          const user = mapProfileToStoreUser(profile, id, role);
          setCurrentUser(user);
          upsertUser(user);
          return;
        } catch {
          /* fall through to local roster */
        }
      }

      const u = useStore.getState().users.find((x) => x.id === id);
      if (u && u.role === role) {
        setCurrentUser(u);
        return;
      }

      clearSessionCookies();
      router.push('/auth/login');
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [mounted, currentUser, setCurrentUser, upsertUser, router]);

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

  return (
    <>
      <ToastViewport />
      {children}
    </>
  );
}
