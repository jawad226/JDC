'use client';

import { employeeDisplayId } from '@/lib/attendanceSite';
import { useStore, useShallow, Role, User } from '@/lib/store';
import {
  ShieldCheck,
  Users,
  Mail,
  UserPlus,
  Trash2,
  X,
  Check,
  Shield,
  Hash,
  Search,
  Sparkles,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const MANAGEABLE_ROLES: Role[] = ['Employee', 'Team Leader', 'HR', 'Pending User'];

type RoleFilter = 'All' | 'Employee' | 'Team Leader' | 'HR' | 'Pending User';

function roleBadgeClass(role: Role): string {
  if (role === 'HR') return 'bg-indigo-50 text-indigo-800 border-indigo-100';
  if (role === 'Team Leader') return 'bg-amber-50 text-amber-800 border-amber-100';
  if (role === 'Employee') return 'bg-slate-50 text-slate-700 border-slate-200';
  if (role === 'Pending User') return 'bg-violet-50 text-violet-800 border-violet-100';
  return 'bg-slate-50 text-slate-600 border-slate-100';
}

export default function AdminDashboardPage() {
  const { users, addUser, removeUser, updateUser, addTeam, teams } = useStore(
    useShallow((s) => ({
      users: s.users,
      addUser: s.addUser,
      removeUser: s.removeUser,
      updateUser: s.updateUser,
      addTeam: s.addTeam,
      teams: s.teams,
    }))
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('All');
  const [idSearch, setIdSearch] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('Employee');
  const [team, setTeam] = useState(teams[0] || 'Management');
  /** Required when role is Team Leader — creates the team name and assigns the leader. */
  const [newTeamNameForLeader, setNewTeamNameForLeader] = useState('');
  const [promotingToLeader, setPromotingToLeader] = useState(false);
  const [promoteTlTeamName, setPromoteTlTeamName] = useState('');

  const nonAdminUsers = useMemo(() => users.filter((u) => u.role !== 'Admin'), [users]);

  const filteredUsers = useMemo(() => {
    let list = nonAdminUsers;
    if (roleFilter !== 'All') {
      list = list.filter((u) => u.role === roleFilter);
    }
    const q = idSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((u) => {
        const uid = employeeDisplayId(u).toLowerCase();
        return uid.includes(q) || u.id.toLowerCase().includes(q) || (u.email && u.email.toLowerCase().includes(q));
      });
    }
    return list;
  }, [nonAdminUsers, roleFilter, idSearch]);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    let assignedTeam = team;
    if (role === 'Team Leader') {
      const tn = newTeamNameForLeader.trim();
      if (!tn) {
        alert('Team Leader ke liye naya team name likho.');
        return;
      }
      addTeam(tn);
      assignedTeam = tn;
    }
    const newUser: User = {
      id: Math.random().toString(36).substring(7),
      name,
      email,
      role,
      team: assignedTeam,
      status: 'Available',
    };
    addUser(newUser);
    setIsAddModalOpen(false);
    setName('');
    setEmail('');
    setRole('Employee');
    setTeam(teams[0] || 'Management');
    setNewTeamNameForLeader('');
    alert('User added successfully.');
  };

  const handleUpdateRole = (userId: string, newRole: Role) => {
    updateUser(userId, { role: newRole });
    setEditingUser(null);
    setPromotingToLeader(false);
    setPromoteTlTeamName('');
  };

  const applyPromoteToTeamLeader = () => {
    if (!editingUser) return;
    const tn = promoteTlTeamName.trim();
    if (!tn) {
      alert('Team Leader ke liye naya team name likho.');
      return;
    }
    addTeam(tn);
    updateUser(editingUser.id, { role: 'Team Leader', team: tn });
    setEditingUser(null);
    setPromotingToLeader(false);
    setPromoteTlTeamName('');
  };

  useEffect(() => {
    if (editingUser) {
      setPromotingToLeader(false);
      setPromoteTlTeamName(editingUser.team?.trim() || '');
    }
  }, [editingUser]);

  const handleDeleteUser = (userId: string, userName: string) => {
    if (confirm(`Remove ${userName} from the system?`)) {
      removeUser(userId);
    }
  };

  const filterTabs: { key: RoleFilter; label: string }[] = [
    { key: 'All', label: 'All' },
    { key: 'Employee', label: 'Employee' },
    { key: 'Team Leader', label: 'Team Leader' },
    { key: 'HR', label: 'HR' },
    { key: 'Pending User', label: 'Pending' },
  ];

  return (
    <div className="mx-auto min-h-full max-w-6xl space-y-8 pb-12">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/50 to-blue-50/30 p-8 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-light tracking-tight text-slate-800">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200/50">
                <ShieldCheck className="h-7 w-7" />
              </span>
              Admin Super Control
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600">
              Manage staff roles and teams. Other admins are not listed—you are the sole administrator.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setNewTeamNameForLeader('');
              setIsAddModalOpen(true);
            }}
            className="mt-4 inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200/40 transition hover:bg-blue-700 active:scale-[0.98] sm:mt-0"
          >
            <UserPlus className="h-4 w-4" />
            Add user
          </button>
        </div>

        <div className="mt-8 space-y-4 rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-inner backdrop-blur-sm sm:p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Filters</p>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setRoleFilter(tab.key)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                    roleFilter === tab.key
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="relative w-full max-w-md lg:w-80">
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Unique ID
              </label>
              <div className="relative">
                <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={idSearch}
                  onChange={(e) => setIdSearch(e.target.value)}
                  placeholder="Search by code or internal ID…"
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-10 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filteredUsers.length}</span> user
            {filteredUsers.length !== 1 ? 's' : ''}
            {roleFilter !== 'All' ? ` · ${roleFilter}` : ''}
          </p>
        </div>
      </div>

      <div>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-800">
          <Users className="h-5 w-5 text-slate-500" />
          User directory
        </h2>
        {filteredUsers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 py-16 text-center">
            <p className="text-sm font-medium text-slate-600">No users match these filters.</p>
            <p className="mt-1 text-xs text-slate-400">Try another role tab or clear the Unique ID search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredUsers.map((user) => {
              const uid = employeeDisplayId(user);
              return (
                <div
                  key={user.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition hover:border-blue-200/80 hover:shadow-md"
                >
                  <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 text-lg font-bold text-slate-700 ring-1 ring-slate-200/80">
                        {user.name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-900">{user.name}</p>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          <span className="truncate">{user.email}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${roleBadgeClass(user.role)}`}
                          >
                            {user.role}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-medium text-slate-600">
                            <Hash className="h-3 w-3 text-slate-400" />
                            {uid}
                          </span>
                        </div>
                        {user.team ? (
                          <p className="mt-3 text-xs text-slate-500">
                            Team: <span className="font-medium text-slate-700">{user.team}</span>
                          </p>
                        ) : (
                          <p className="mt-3 text-xs italic text-slate-400">No team assigned</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-5">
                      <button
                        type="button"
                        onClick={() => setEditingUser(user)}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white shadow-md shadow-blue-200/50 transition hover:from-blue-700 hover:to-indigo-700 min-[360px]:flex-initial"
                      >
                        <Sparkles className="h-3.5 w-3.5" />
                        Promote / role
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(user.id, user.name)}
                        className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                        title="Remove user"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-300">
          <div className="animate-in zoom-in-95 w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-2xl duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-8">
              <h2 className="flex items-center gap-2 text-xl font-bold text-slate-800">
                <UserPlus className="h-5 w-5 text-blue-500" />
                Add user
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full border border-transparent p-2 transition hover:border-slate-100 hover:bg-white"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>
            <form onSubmit={handleAddUser} className="space-y-6 p-8">
              <div>
                <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-widest text-slate-400">
                  Full name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-widest text-slate-400">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  placeholder="name@company.com"
                />
              </div>
              <div>
                <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-widest text-slate-400">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {MANAGEABLE_ROLES.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => {
                        setRole(r);
                        if (r !== 'Team Leader') setNewTeamNameForLeader('');
                      }}
                      className={`rounded-xl border py-3 text-[10px] font-bold transition ${
                        role === r
                          ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-100'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {r === 'Pending User' ? 'Pending' : r}
                    </button>
                  ))}
                </div>
              </div>
              {role === 'Team Leader' ? (
                <div>
                  <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-widest text-slate-400">
                    New team name
                  </label>
                  <input
                    type="text"
                    value={newTeamNameForLeader}
                    onChange={(e) => setNewTeamNameForLeader(e.target.value)}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                    placeholder="e.g. Alpha Squad"
                    required
                    autoComplete="off"
                  />
                  <p className="mt-2 text-xs text-slate-500">
                    Yeh naam team list mein add ho ga aur is user ko us team ka leader banaya jaye ga.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="mb-2 ml-1 block text-xs font-bold uppercase tracking-widest text-slate-400">
                    Team
                  </label>
                  <select
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-slate-700 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                  >
                    {teams.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <button
                type="submit"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-100 transition hover:bg-blue-700 active:scale-[0.98]"
              >
                <Check className="h-5 w-5" />
                Save user
              </button>
            </form>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm duration-300">
          <div className="animate-in zoom-in-95 w-full max-w-sm overflow-hidden rounded-[2rem] bg-white shadow-2xl duration-300">
            <div className="relative border-b border-slate-100 p-8 text-center">
              <button
                type="button"
                onClick={() => {
                  setEditingUser(null);
                  setPromotingToLeader(false);
                  setPromoteTlTeamName('');
                }}
                className="absolute right-6 top-6 rounded-full p-2 transition hover:bg-slate-50"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <Shield className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Promote or change role</h2>
              <p className="mt-1 text-sm text-slate-500">{editingUser.name}</p>
              <p className="mt-2 font-mono text-[10px] text-slate-400">
                ID {employeeDisplayId(editingUser)}
              </p>
            </div>
            <div className="space-y-3 p-8">
              {promotingToLeader ? (
                <div className="space-y-3">
                  <p className="text-left text-sm font-semibold text-slate-800">Team Leader — naya team naam</p>
                  <input
                    type="text"
                    value={promoteTlTeamName}
                    onChange={(e) => setPromoteTlTeamName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    placeholder="e.g. Product Beta"
                    autoComplete="off"
                  />
                  <p className="text-left text-xs text-slate-500">
                    Team list mein naam add ho ga aur user ko isi team ka leader set kiya jaye ga.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setPromotingToLeader(false)}
                      className="flex-1 rounded-2xl border border-slate-200 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={applyPromoteToTeamLeader}
                      className="flex-1 rounded-2xl bg-blue-600 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                MANAGEABLE_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      if (r === 'Team Leader') {
                        setPromotingToLeader(true);
                        setPromoteTlTeamName(editingUser.team?.trim() || '');
                      } else {
                        handleUpdateRole(editingUser.id, r);
                      }
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl border px-6 py-4 text-sm font-bold transition ${
                      editingUser.role === r
                        ? 'border-blue-200 bg-blue-50 text-blue-800'
                        : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {r === 'Pending User' ? 'Pending User' : r}
                    {editingUser.role === r ? <Check className="h-4 w-4 text-blue-600" /> : null}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
