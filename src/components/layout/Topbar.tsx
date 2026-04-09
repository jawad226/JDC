'use client';

import { Bell, Search, Menu, User as UserIcon } from 'lucide-react';
import { useStore, type User } from '@/lib/store';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MobileSidebarDrawer } from '@/components/layout/MobileSidebarDrawer';

function getInitials(text: string): string {
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Label in the header pill (e.g. HR → “HR Manager”). */
function headerPillLabel(user: User): string {
  switch (user.role) {
    case 'HR':
      return 'HR Manager';
    case 'Admin':
      return 'Admin User';
    case 'Team Leader':
      return 'Team Leader';
    case 'Employee':
      return user.name;
    case 'Pending User':
      return user.name || 'Pending';
    default:
      return user.name;
  }
}

export function Topbar() {
  const currentUser = useStore((s) => s.currentUser);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuWrapRef.current && !menuWrapRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  const pillLabel = currentUser ? headerPillLabel(currentUser) : 'User';
  const avatarSrc = currentUser?.avatar;

  return (
    <>
      <MobileSidebarDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm sm:px-8">
        <div className="flex max-w-xl flex-1 items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-xl p-2 transition-colors hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5 text-slate-700" />
          </button>
          <div className="relative w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-lg border border-slate-200 bg-slate-50/50 py-2 pl-10 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Search"
            />
          </div>
        </div>

        <div className="ml-4 flex shrink-0 items-center gap-3 sm:gap-4">
          <button
            type="button"
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-100 bg-white shadow-sm transition-colors hover:bg-slate-50"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-slate-700" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border border-white bg-red-500" />
          </button>

          {/* w-fit + shrink-0: menu width matches pill; dropdown stays under pill (not under bell). */}
          <div className="relative w-fit shrink-0" ref={menuWrapRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex max-w-[260px] items-center gap-3 rounded-2xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-4 shadow-sm transition-colors hover:bg-slate-50"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label="Account menu"
            >
              <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sky-500 ring-2 ring-white">
                {avatarSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element -- user-uploaded or data URL
                  <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-white">{getInitials(pillLabel)}</span>
                )}
              </span>
              <span className="hidden min-w-0 max-w-[180px] truncate text-left text-sm font-semibold text-slate-900 sm:block">
                {pillLabel}
              </span>
            </button>

            {menuOpen ? (
              <div
                className="absolute left-0 top-full z-50 mt-2 w-max min-w-full rounded-2xl border border-slate-200 bg-white py-1 shadow-lg"
                role="menu"
              >
                <Link
                  href="/profile"
                  role="menuitem"
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
                  onClick={() => setMenuOpen(false)}
                >
                  <UserIcon className="h-5 w-5 shrink-0 text-slate-600" strokeWidth={1.75} />
                  View Profile
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </header>
    </>
  );
}
