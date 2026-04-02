 'use client';
 
 import Link from 'next/link';
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
   X,
 } from 'lucide-react';
 
 const navItems = [
   { name: 'Dashboard', href: '/', icon: LayoutDashboard },
   { name: 'Schedule', href: '/schedule', icon: Calendar },
   { name: 'Timesheet', href: '/timesheet', icon: Clock },
   { name: 'Availability', href: '/availability', icon: CalendarClock },
   { name: 'My Requests', href: '/my-requests', icon: ClipboardList },
   { name: 'Request Management', href: '/request-management', icon: UsersRound },
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
   const { currentUser, setCurrentUser } = useStore();
 
   const filtered = navItems.filter((item) => {
     if (item.name === 'Admin Control' && currentUser?.role !== 'Admin') return false;
     if (item.name === 'My Requests' && currentUser?.role === 'Admin') return false;
     if (item.name === 'Request Management' && currentUser?.role === 'Employee') return false;
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
         className={`absolute left-0 top-0 h-full w-[84%] max-w-[320px] bg-white border-r shadow-2xl transition-transform duration-300 ${
           open ? 'translate-x-0' : '-translate-x-full'
         }`}
         role="dialog"
         aria-modal="true"
       >
         <div className="h-20 px-5 flex items-center justify-between border-b">
           <div className="flex items-center gap-3">
             <img
               src="/brand/logo.png"
               alt="Global Digital Care"
               className="h-10 w-auto object-contain"
               draggable={false}
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
                     router.push('/login');
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

