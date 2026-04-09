'use client';

import { useStore, useShallow, Role, User } from '@/lib/store';
import { ShieldCheck, Users, Mail, UserPlus, Trash2, Edit3, X, Check, Shield } from 'lucide-react';
import { useState } from 'react';

export default function AdminDashboardPage() {
  const { users, addUser, removeUser, updateUser, teams, addTeam, removeTeam } = useStore(
    useShallow((s) => ({
      users: s.users,
      addUser: s.addUser,
      removeUser: s.removeUser,
      updateUser: s.updateUser,
      teams: s.teams,
      addTeam: s.addTeam,
      removeTeam: s.removeTeam,
    }))
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  // New User Form
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('Employee');
  const [team, setTeam] = useState(teams[0] || 'Management');
  const [newTeamName, setNewTeamName] = useState('');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: User = {
      id: Math.random().toString(36).substring(7),
      name,
      email,
      role,
      team,
      status: 'Available'
    };
    addUser(newUser);
    setIsAddModalOpen(false);
    setName('');
    setEmail('');
    setRole('Employee');
    setTeam(teams[0] || 'Management');
    alert('User added successfully!');
  };

  const handleAddTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTeamName.trim()) {
      addTeam(newTeamName.trim());
      setNewTeamName('');
    }
  };

  const handleUpdateRole = (userId: string, newRole: Role) => {
    updateUser(userId, { role: newRole });
    setEditingUser(null);
  };

  const handleDeleteUser = (userId: string, userName: string) => {
    if (confirm(`Are you sure you want to remove ${userName}?`)) {
      removeUser(userId);
    }
  };

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
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="group flex items-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite New User
          </button>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100/50">
              <th className="font-medium text-slate-500 text-sm py-4 px-6">Name</th>
              <th className="font-medium text-slate-500 text-sm py-4 px-6">Email</th>
              <th className="font-medium text-slate-500 text-sm py-4 px-6">Team</th>
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
                <td className="py-4 px-6 text-sm text-slate-600">
                  <div className="flex items-center">
                    <Mail className="w-3.5 h-3.5 mr-2 text-slate-400" />
                    {user.email}
                  </div>
                </td>
                <td className="py-4 px-6 text-sm">
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      <span className="text-slate-600 font-medium">{user.team || 'None'}</span>
                   </div>
                </td>
                <td className="py-4 px-6 text-sm">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    user.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                    user.role === 'HR' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                    user.role === 'Team Leader' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    'bg-slate-50 text-slate-700 border-slate-100'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-4 px-6 text-sm text-right">
                  <div className="flex justify-end gap-2">
                    <button 
                      onClick={() => setEditingUser(user)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit Role"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteUser(user.id, user.name)}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-500" />
                  Invite New Member
                </h2>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-100">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
             </div>
             <form onSubmit={handleAddUser} className="p-8 space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full rounded-2xl border-slate-100 bg-slate-50 border p-4 text-slate-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-2xl border-slate-100 bg-slate-50 border p-4 text-slate-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                    placeholder="name@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Team Assignment</label>
                  <select 
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    className="w-full rounded-2xl border-slate-100 bg-slate-50 border p-4 text-slate-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                  >
                    {teams.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">System Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(['Admin', 'HR', 'Team Leader', 'Employee'] as Role[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-3 rounded-xl text-[10px] font-bold border transition-all ${
                          role === r 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" />
                  Send Invite
                </button>
             </form>
           </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 text-center relative">
               <button onClick={() => setEditingUser(null)} className="absolute top-6 right-6 p-2 hover:bg-slate-50 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
               </button>
               <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8" />
               </div>
               <h2 className="text-xl font-bold text-slate-800">Edit Permissions</h2>
               <p className="text-sm text-slate-500 mt-1">Change {editingUser.name}'s role</p>
            </div>
            <div className="p-8 space-y-3">
              {(['Admin', 'HR', 'Team Leader', 'Employee'] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => handleUpdateRole(editingUser.id, r)}
                  className={`w-full py-4 rounded-2xl text-sm font-bold border transition-all flex items-center justify-between px-6 ${
                    editingUser.role === r 
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50 hover:border-slate-200'
                  }`}
                >
                  {r}
                  {editingUser.role === r && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
          {/* Team Management Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
         <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-blue-500" />
            Organizational Structure (Teams)
         </h2>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Create New Team</label>
               <form onSubmit={handleAddTeam} className="flex gap-2">
                  <input 
                    type="text" 
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    className="flex-1 rounded-xl border-slate-100 bg-slate-50 border px-4 py-3 text-sm focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                    placeholder="Team name (e.g. Sales)"
                  />
                  <button type="submit" className="bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-md hover:bg-blue-700 transition-all active:scale-95">
                     Create
                  </button>
               </form>
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest ml-1 mb-4">Existing Departments</label>
               <div className="flex flex-wrap gap-2">
                  {teams.map(t => (
                    <div key={t} className="bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-2 group">
                       {t}
                       <button onClick={() => removeTeam(t)} className="text-slate-300 hover:text-rose-500 transition-colors">
                          <X className="w-3.5 h-3.5" />
                       </button>
                    </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
      )}
    </div>
  );
}
