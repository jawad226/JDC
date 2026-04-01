'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import Cookies from 'js-cookie';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  ReceiptText,
  CalendarClock,
  ClipboardList,
  UsersRound,
  HelpCircle,
  LogOut,
  ShieldCheck
} from 'lucide-react';

const sidebarItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Schedule', href: '/schedule', icon: Calendar },
  { name: 'Timesheet', href: '/timesheet', icon: Clock },
  { name: 'Reimbursements', href: '/reimbursements', icon: ReceiptText },
  { name: 'Availability', href: '/availability', icon: CalendarClock },
  { name: 'My Requests', href: '/my-requests', icon: ClipboardList },
  { name: 'Request Management', href: '/request-management', icon: UsersRound },
  { name: 'Admin Control', href: '/admin', icon: ShieldCheck },
];

const bottomItems = [
  { name: 'Help', href: '/help', icon: HelpCircle },
  { name: 'Logout', href: '/logout', icon: LogOut },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setCurrentUser, currentUser } = useStore();

  const filteredSidebarItems = sidebarItems.filter(item => {
    if (item.name === 'Admin Control' && currentUser?.role !== 'Admin') return false;
    if (item.name === 'Request Management' && currentUser?.role === 'Employee') return false;
    return true;
  });

  return (
    <aside className="w-64 bg-white border-r h-screen overflow-y-auto flex flex-col pt-6 pb-6 shadow-sm">
      <div className="px-6 mb-8 flex justify-center items-center">
        {/* Assurgent Logo mock */}
        <div className="flex flex-col items-center cursor-pointer">
          <svg width="40" height="20" viewBox="0 0 100 50" className="text-blue-500 mb-1">
             <path d="M50 0 C 60 20, 80 40, 100 50 C 80 40, 60 20, 50 10 C 40 20, 20 40, 0 50 C 20 40, 40 20, 50 0 Z" fill="currentColor" />
          </svg>
          <span className="text-xl font-serif font-bold tracking-tight text-slate-800">assurgent</span>
        </div>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {filteredSidebarItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                isActive
                  ? 'bg-slate-50 text-slate-900 border-l-4 border-slate-300'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <Icon className={cn("mr-3 h-5 w-5", isActive ? 'text-slate-600' : 'text-slate-400')} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="px-4 space-y-1 mt-8">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          if (item.name === 'Logout') {
            return (
              <button
                key={item.name}
                onClick={() => {
                  Cookies.remove('auth-role');
                  Cookies.remove('auth-user-id');
                  setCurrentUser(null);
                  router.push('/login');
                  router.refresh();
                }}
                className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              >
                <Icon className="mr-3 h-5 w-5 text-slate-400" />
                {item.name}
              </button>
            );
          }
          return (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center px-4 py-3 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <Icon className="mr-3 h-5 w-5 text-slate-400" />
              {item.name}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
