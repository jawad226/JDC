'use client';

import { Bell, Search, Menu } from 'lucide-react';
import { useStore } from '@/lib/store';
import { useState } from 'react';
import { MobileSidebarDrawer } from '@/components/layout/MobileSidebarDrawer';

export function Topbar() {
  const { currentUser } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <MobileSidebarDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <header className="h-20 bg-white border-b flex items-center justify-between px-4 sm:px-8 shadow-sm">
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-xl hover:bg-slate-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-slate-700" />
        </button>
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-slate-50/50"
            placeholder="Search"
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-6 ml-4">
        <button className="relative p-2 rounded-full hover:bg-slate-100 transition-colors">
          <Bell className="h-5 w-5 text-slate-600" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        
        <div className="flex items-center space-x-3 cursor-pointer p-1.5 rounded-full hover:bg-slate-50 transition-colors">
          <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold focus:outline-none overflow-hidden">
            <img src={currentUser?.avatar || "https://ui-avatars.com/api/?name=" + (currentUser?.name || 'User') + "&background=random"} alt="Avatar" className="w-full h-full object-cover" />
          </div>
          <span className="text-sm font-semibold text-slate-700 hidden sm:block">
            {currentUser?.name || 'Rameez Hasan'}
          </span>
        </div>
      </div>
    </header>
    </>
  );
}
