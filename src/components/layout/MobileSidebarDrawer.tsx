'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BRAND_LOGO_URL } from '@/lib/brand';
import { usePathname, useRouter } from 'next/navigation';
import Cookies from 'js-cookie';
import { useStore } from '@/lib/store';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  CalendarClock,
  ClipboardList,
  UsersRound,
  HelpCircle,
  LogOut,
  ShieldCheck,
  UserCog,
  BarChart3,
  X,
} from 'lucide-react';

const navItems = [
   { name: 'Dashboard', href: '/', icon: LayoutDashboard },
   { name: 'Team Data', href: '/team-data', icon: BarChart3 },
   { name: 'Schedule', href: '/schedule', icon: Calendar },
   { name: 'Timesheet', href: '/timesheet', icon: Clock },
   { name: 'Availability', href: '/availability', icon: CalendarClock },
   { name: 'My Requests', href: '/my-requests', icon: ClipboardList },
   { name: 'Request Management', href: '/request-management', icon: UsersRound },
   { name: 'Team assign to TL', href: '/team-tl', icon: UserCog },
   { name: 'Admin Control', href: '/admin', icon: ShieldCheck },
 ];
 
 const bottomItems = [
   { name: 'Help', href: '/help', icon: HelpCircle },
   { name: 'Logout', href: '/logout', icon: LogOut },
 ];
 
 export function MobileSidebarDrawer({
   open,
   onClose,
 }: {
   open: boolean;
   onClose: () => void;
 }) {
   const pathname = usePathname();
   const router = useRouter();
   const currentUser = useStore((s) => s.currentUser);
   const setCurrentUser = useStore((s) => s.setCurrentUser);
 
   const filtered = navItems.filter((item) => {
     if (item.name === 'Admin Control' && currentUser?.role !== 'Admin') return false;
     if (item.name === 'My Requests' && currentUser?.role === 'Admin') return false;
     if (item.name === 'Request Management' && currentUser?.role === 'Employee') return false;
     if (item.name === 'Team assign to TL' && currentUser?.role !== 'Admin' && currentUser?.role !== 'HR') return false;
     if (item.name === 'Team Data' && currentUser?.role !== 'Team Leader') return false;
     return true;
   });
 
   return (
     <div
       className={`fixed inset-0 z-[60] lg:hidden ${
         open ? 'pointer-events-auto' : 'pointer-events-none'
       }`}
       aria-hidden={!open}
     >
       <div
         className={`absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] transition-opacity ${
           open ? 'opacity-100' : 'opacity-0'
         }`}
         onClick={onClose}
       />
 
       <div
         className={`absolute left-0 top-0 h-full w-[84%] max-w-[320px] border-r border-slate-200 bg-white shadow-2xl transition-transform duration-300 ${
           open ? 'translate-x-0' : '-translate-x-full'
         }`}
         role="dialog"
         aria-modal="true"
       >
         <div className="flex h-20 items-center justify-between border-b border-slate-200 px-5">
           <div className="relative h-10 w-[140px] shrink-0">
             <Image
               src={BRAND_LOGO_URL}
               alt="Global Digital Care"
               fill
               className="object-contain object-left"
               sizes="140px"
             />
           </div>
           <button
             onClick={onClose}
             className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
             aria-label="Close menu"
           >
             <X className="h-5 w-5 text-slate-600" />
           </button>
         </div>
 
         <nav className="px-4 py-4 space-y-1">
           {filtered.map((item) => {
             const Icon = item.icon;
             const isActive = pathname === item.href;
             return (
               <Link
                 key={item.name}
                 href={item.href}
                 onClick={onClose}
                 className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                   isActive
                     ? 'bg-slate-50 text-slate-900'
                     : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                 }`}
               >
                 <Icon
                   className={`mr-3 h-5 w-5 ${
                     isActive ? 'text-slate-700' : 'text-slate-400'
                   }`}
                 />
                 {item.name}
               </Link>
             );
           })}
         </nav>
 
         <div className="mt-auto px-4 pb-6 space-y-1">
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
                     onClose();
                     router.push('/auth/login');
                     router.refresh();
                   }}
                   className="w-full flex items-center px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
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
                 onClick={onClose}
                 className="flex items-center px-4 py-3 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
               >
                 <Icon className="mr-3 h-5 w-5 text-slate-400" />
                 {item.name}
               </Link>
             );
           })}
         </div>
       </div>
     </div>
   );
 }

