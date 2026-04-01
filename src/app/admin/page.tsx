'use client';

import { useStore } from '@/lib/store';
import { ShieldCheck, Users } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminDashboardPage() {
  const { users } = useStore();

  return (
    <div className="max-w-6xl mx-auto space-y-8 min-h-full">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 mb-8">
        <h1 className="text-3xl font-light text-slate-800 tracking-tight flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-blue-500" />
          Admin Super Control
        </h1>
        <p className="text-slate-500 mt-2">Manage users, roles, assign teams, and control system settings.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center">
            <Users className="w-5 h-5 mr-2 text-slate-500" />
            User Management
          </h2>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm focus:ring-4 focus:ring-blue-100">
            + Invite New User
          </button>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100/50">
              <th className="font-medium text-slate-500 text-sm py-4 px-6">Name</th>
              <th className="font-medium text-slate-500 text-sm py-4 px-6">Email</th>
              <th className="font-medium text-slate-500 text-sm py-4 px-6">Role</th>
              <th className="font-medium text-slate-500 text-sm py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6 text-sm font-medium text-slate-900 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs ring-1 ring-slate-200">
                    {user.name.charAt(0)}
                  </div>
                  {user.name}
                </td>
                <td className="py-4 px-6 text-sm text-slate-600">{user.email}</td>
                <td className="py-4 px-6 text-sm">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                    user.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                    user.role === 'HR' ? 'bg-indigo-100 text-indigo-700' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-4 px-6 text-sm text-right space-x-3 w-40">
                  <button className="text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors">Edit</button>
                  <button className="text-rose-500 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors">Remove</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
