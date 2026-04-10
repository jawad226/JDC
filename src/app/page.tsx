'use client';

import { useStore, useShallow, type Task } from '@/lib/store';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Play, Square, AlertCircle, Clock, CheckCircle2, Calendar, TrendingUp, UserCheck, Timer, Users, Activity, Target, BarChart3, Shield, Coffee } from 'lucide-react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, subDays, isWithinInterval } from 'date-fns';
import { useEffect, useState, useMemo } from 'react';

// ─── ROUTER ────────────────────────────────────────────────────────
export default function Dashboard() {
  const currentUser = useStore((s) => s.currentUser);

  if (currentUser?.role === 'Admin') return <AdminDashboard />;
  if (currentUser?.role === 'HR') return <HRDashboard />;
  if (currentUser?.role === 'Team Leader') return <TeamLeaderDashboard />;
  return <UserDashboard />;
}

// ─── SHARED COMPONENTS ─────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, bg }: { icon: LucideIcon; label: string; value: number | string; color: string; bg: string }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm group hover:shadow-md transition-all">
      <div className={`${bg} ${color} w-10 h-10 rounded-xl flex items-center justify-center mb-4`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-black text-slate-900 tracking-tight">{value}</p>
    </div>
  );
}

function TimerWidget() {
  const { currentUser, timesheets, clockIn, clockOut, startBreak, endBreak } = useStore(
    useShallow((s) => ({
      currentUser: s.currentUser,
      timesheets: s.timesheets,
      clockIn: s.clockIn,
      clockOut: s.clockOut,
      startBreak: s.startBreak,
      endBreak: s.endBreak,
    }))
  );
  const activeTimesheet = timesheets.find(t => t.userId === currentUser?.id && !t.clockOut);
  const isClockedIn = !!activeTimesheet;
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const activeBreak = (() => {
    if (!activeTimesheet?.breaks?.length) return null;
    const last = activeTimesheet.breaks[activeTimesheet.breaks.length - 1];
    if (!last) return null;
    return last.endTime ? null : last;
  })();

  // Calculate elapsed time (pause during active break)
  const elapsed = useMemo(() => {
    if (!activeTimesheet) return null;

    const clockInMs = new Date(activeTimesheet.clockIn).getTime();
    const effectiveNowMs = activeBreak ? new Date(activeBreak.startTime).getTime() : now.getTime();

    const completedBreakMs = (activeTimesheet.breaks || [])
      .filter((b) => !!b?.startTime && !!b?.endTime)
      .reduce((acc, b) => {
        if (!b.startTime || !b.endTime) return acc;
        return acc + (new Date(b.endTime).getTime() - new Date(b.startTime).getTime());
      }, 0);

    const diffMs = Math.max(0, effectiveNowMs - clockInMs - completedBreakMs);
    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }, [activeTimesheet, now, activeBreak]);

  const isPaused = !!activeBreak;
  const hasAnyBreak = (activeTimesheet?.breaks?.length || 0) > 0;
  const lineColorClass = !isClockedIn
    ? 'bg-blue-600'
    : activeBreak
      ? 'bg-rose-600'
      : hasAnyBreak
        ? 'bg-blue-600'
        : 'bg-amber-500';

  const siteLabel = currentUser?.workSite ?? currentUser?.team ?? '—';
  const roleLabel = currentUser?.department ?? currentUser?.role ?? '—';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">
          Hello, <span className="font-black">{currentUser?.name.split(' ')[0]}</span>
        </h1>
        <p className="mt-1 text-xs text-slate-400 font-bold uppercase tracking-widest">
          {format(now, 'eee MMMM d yyyy')} • {format(now, 'HH:mm')}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 p-6 md:p-7">
          <div className="flex items-start gap-4">
            <div className={`w-1.5 self-stretch rounded-full ${lineColorClass}`} />
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-widest text-blue-600">Regular</p>

              <div className="mt-4 grid gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-500">
                    <Target className="h-4 w-4" />
                  </span>
                  {siteLabel}
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 text-slate-500">
                    <UserCheck className="h-4 w-4" />
                  </span>
                  {roleLabel}
                </div>
              </div>

              {elapsed && (
                <div
                  className={`mt-5 inline-flex items-center gap-3 rounded-2xl border px-4 py-2 ${
                    isPaused ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'
                  }`}
                >
                  <span
                    className={`text-[10px] font-black uppercase tracking-widest ${
                      isPaused ? 'text-amber-700' : 'text-emerald-700'
                    }`}
                  >
                    {isPaused ? 'On Break (Paused)' : 'Working'}
                  </span>
                  <span
                    className={`text-sm font-mono font-black ${isPaused ? 'text-amber-800' : 'text-emerald-800'}`}
                  >
                    {elapsed}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-center md:justify-end">
            {!isClockedIn ? (
              <button
                onClick={clockIn}
                className="group relative flex h-24 w-24 md:h-28 md:w-28 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-500 active:scale-95 focus:outline-none ring-8 ring-blue-600/10"
                title="Clock in"
              >
                <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 blur-2xl transition-opacity group-hover:opacity-40" />
                <div className="relative z-10 flex flex-col items-center">
                  <Play className="h-8 w-8 ml-0.5 drop-shadow" fill="currentColor" />
                  <span className="mt-1 text-[10px] font-black uppercase tracking-widest">Clock In</span>
                </div>
              </button>
            ) : (
              <div className="flex flex-row gap-4">
                {activeBreak ? (
                  <button
                    onClick={endBreak}
                    className="group relative flex h-24 w-24 md:h-28 md:w-28 items-center justify-center rounded-full bg-rose-600 text-white shadow-lg shadow-rose-100 transition-all hover:bg-rose-500 active:scale-95 focus:outline-none ring-8 ring-rose-500/10"
                    title="Break out"
                  >
                    <div className="absolute inset-0 rounded-full bg-rose-400 opacity-20 blur-2xl transition-opacity group-hover:opacity-40" />
                    <div className="relative z-10 flex flex-col items-center">
                      <Coffee className="h-7 w-7 drop-shadow" fill="currentColor" />
                      <span className="mt-1 text-[10px] font-black uppercase tracking-widest">Break Out</span>
                    </div>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={startBreak}
                      className="group relative flex h-24 w-24 md:h-28 md:w-28 items-center justify-center rounded-full bg-amber-500 text-white shadow-lg shadow-amber-100 transition-all hover:bg-amber-400 active:scale-95 focus:outline-none ring-8 ring-amber-500/10"
                      title="Break in"
                    >
                      <div className="absolute inset-0 rounded-full bg-amber-400 opacity-20 blur-2xl transition-opacity group-hover:opacity-40" />
                      <div className="relative z-10 flex flex-col items-center">
                        <Coffee className="h-7 w-7 drop-shadow" fill="currentColor" />
                        <span className="mt-1 text-[10px] font-black uppercase tracking-widest">Break In</span>
                      </div>
                    </button>

                    <button
                      onClick={clockOut}
                      className="group relative flex h-24 w-24 md:h-28 md:w-28 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-500 active:scale-95 focus:outline-none ring-8 ring-blue-600/10"
                      title="Clock out"
                    >
                      <div className="absolute inset-0 rounded-full bg-blue-400 opacity-20 blur-2xl transition-opacity group-hover:opacity-40" />
                      <div className="relative z-10 flex flex-col items-center">
                        <Square className="h-7 w-7 drop-shadow" fill="currentColor" />
                        <span className="mt-1 text-[10px] font-black uppercase tracking-widest">Clock Out</span>
                      </div>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WeeklyChart() {
  const { currentUser, timesheets } = useStore(
    useShallow((s) => ({ currentUser: s.currentUser, timesheets: s.timesheets }))
  );
  const now = new Date();
  const [range, setRange] = useState<'7d' | '30d' | '90d'>('7d');

  const rangeStart = useMemo(() => {
    if (range === '90d') return subDays(now, 89);
    if (range === '30d') return subDays(now, 29);
    return startOfWeek(now, { weekStartsOn: 1 });
  }, [now, range]);

  const rangeEnd = useMemo(() => {
    if (range === '7d') return endOfWeek(now, { weekStartsOn: 1 });
    return now;
  }, [now, range]);

  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  const stats = days.map(day => {
    const dayEntries = timesheets.filter(
      t => t.userId === currentUser?.id && isSameDay(new Date(t.clockIn), day)
    );
    const hours = dayEntries.reduce((acc, t) => acc + (t.totalHours || 0), 0);
    const isLate = dayEntries.some(t => !!t.lateMark);
    return { day, label: range === '7d' ? format(day, 'EEE') : format(day, 'd MMM'), hours, isLate };
  });

  const totalHours = useMemo(() => {
    return timesheets
      .filter(t => t.userId === currentUser?.id)
      .filter(t => isWithinInterval(new Date(t.clockIn), { start: rangeStart, end: rangeEnd }))
      .reduce((acc, t) => acc + (t.totalHours || 0), 0);
  }, [timesheets, currentUser, rangeStart, rangeEnd]);

  return (
    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Performance
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            Total: {totalHours.toFixed(1)} hours ({range === '7d' ? 'Weekly' : range === '30d' ? '30 Days' : '90 Days'})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center rounded-2xl border border-slate-100 bg-slate-50 p-1">
            <button
              type="button"
              onClick={() => setRange('7d')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${
                range === '7d' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Weekly
            </button>
            <button
              type="button"
              onClick={() => setRange('30d')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${
                range === '30d' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              30 Days
            </button>
            <button
              type="button"
              onClick={() => setRange('90d')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${
                range === '90d' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              90 Days
            </button>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-end h-48 px-4">
        {stats.map((stat, i) => (
          <div key={i} className="flex flex-col items-center gap-3 h-full justify-end group cursor-help">
            <div
              className={`relative flex flex-col justify-end h-full ${range === '7d' ? 'w-10 sm:w-12' : 'w-2.5 sm:w-3'}`}
            >
              <div
                className={`w-full rounded-t-xl transition-all duration-500 shadow-sm ${stat.isLate ? 'bg-gradient-to-t from-rose-500 to-rose-400' : 'bg-gradient-to-t from-blue-600 to-blue-400'}`}
                style={{ height: `${Math.min((stat.hours / 8) * 100, 100)}%`, minHeight: stat.hours > 0 ? '10%' : '0' }}
              >
                {stat.hours > 0 && (
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                    {stat.hours.toFixed(1)}h
                  </div>
                )}
              </div>
            </div>
            {range === '7d' ? (
              <span
                className={`text-[10px] font-bold uppercase tracking-widest ${isSameDay(stat.day, now) ? 'text-blue-600' : 'text-slate-400'}`}
              >
                {stat.label}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskList({ tasks }: { tasks: Task[] }) {
  const statusBadgeClass = (status: string) => {
    if (status === 'Pending') return 'bg-amber-50 text-amber-700 border-amber-100';
    if (status === 'In Progress') return 'bg-blue-50 text-blue-700 border-blue-100';
    if (status === 'Submitted') return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    if (status === 'Review') return 'bg-violet-50 text-violet-700 border-violet-100';
    if (status === 'Approved') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    return 'bg-slate-50 text-slate-700 border-slate-100';
  };

  return (
    <div className="space-y-4">
      {tasks.length === 0 ? (
        <div className="bg-slate-50 border-2 border-dashed border-slate-100 rounded-3xl p-12 text-center">
          <p className="text-slate-400 font-medium">All caught up! No active tasks.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map(task => (
            <Link
              key={task.id}
              href={`/schedule?taskId=${encodeURIComponent(task.id)}`}
              className="block bg-white rounded-3xl shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all group border-l-4 border-l-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-slate-800 text-base leading-tight group-hover:text-blue-600 transition-colors">{task.title}</h3>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider ${
                  task.priority === 'High' ? 'bg-rose-50 text-rose-600' :
                  task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' :
                  'bg-emerald-50 text-emerald-600'
                }`}>{task.priority}</span>
              </div>
              <div className="flex items-center justify-between mt-auto">
                <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                  <Clock size={14} className="mr-1" />
                  Due {format(new Date(task.deadline), 'MMM d')}
                </div>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${statusBadgeClass(task.status)}`}>
                  {task.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 1. ADMIN DASHBOARD ────────────────────────────────────────────
function AdminDashboard() {
  const { users, timesheets, tasks, leaves } = useStore(
    useShallow((s) => ({
      users: s.users,
      timesheets: s.timesheets,
      tasks: s.tasks,
      leaves: s.leaves,
    }))
  );
  const now = new Date();

  const activeEmployees = timesheets.filter(t => !t.clockOut).length;
  const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
  const overdueTasks = tasks.filter(t => t.status !== 'Approved' && new Date(t.deadline) < now).length;
  const pendingUsers = users.filter(u => u.role === 'Pending User').length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        <StatCard icon={Users} label="Workforce" value={users.filter(u => u.role !== 'Pending User').length} color="text-blue-500" bg="bg-blue-50" />
        <StatCard icon={Activity} label="Active Now" value={activeEmployees} color="text-emerald-500" bg="bg-emerald-50" />
        <StatCard icon={Calendar} label="Pending Leaves" value={pendingLeaves} color="text-amber-500" bg="bg-amber-50" />
        <StatCard icon={AlertCircle} label="Overdue Tasks" value={overdueTasks} color="text-rose-500" bg="bg-rose-50" />
        <StatCard icon={Shield} label="Pending Approval" value={pendingUsers} color="text-purple-500" bg="bg-purple-50" />
      </div>

      {/* Live employee status */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          Real-time Employee Status
        </h2>
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {users.filter(u => u.role !== 'Pending User').map(user => {
            const isActive = timesheets.some(t => t.userId === user.id && !t.clockOut);
            return (
              <div key={user.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500">{user.name.charAt(0)}</div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{user.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.role} • {user.team}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    user.status === 'Available' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                    user.status === 'Sick' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                    'bg-slate-50 text-slate-400 border-slate-100'
                  }`}>{user.status || 'N/A'}</span>
                  {isActive ? (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full border border-emerald-100 animate-pulse">WORKING</span>
                  ) : (
                    <span className="px-3 py-1 bg-slate-50 text-slate-300 text-[10px] font-bold rounded-full border border-slate-100">OFFLINE</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── 2. HR DASHBOARD ───────────────────────────────────────────────
function HRDashboard() {
  const { currentUser, users, timesheets, tasks, leaves } = useStore(
    useShallow((s) => ({
      currentUser: s.currentUser,
      users: s.users,
      timesheets: s.timesheets,
      tasks: s.tasks,
      leaves: s.leaves,
    }))
  );
  const now = new Date();

  const myTeam = currentUser?.team;
  const teamMembers = users.filter(u => u.team === myTeam && u.role !== 'Pending User');
  const teamTasks = tasks.filter(t => teamMembers.some(m => m.id === t.assignedTo));
  const completedTasks = teamTasks.filter(t => t.status === 'Approved').length;
  const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <TimerWidget />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <StatCard icon={Users} label="Team Members" value={teamMembers.length} color="text-blue-500" bg="bg-blue-50" />
        <StatCard icon={Target} label="Team Tasks" value={teamTasks.length} color="text-indigo-500" bg="bg-indigo-50" />
        <StatCard icon={CheckCircle2} label="Completed" value={completedTasks} color="text-emerald-500" bg="bg-emerald-50" />
        <StatCard icon={Calendar} label="Pending Leaves" value={pendingLeaves} color="text-amber-500" bg="bg-amber-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <WeeklyChart />

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-indigo-500" />
              Team Task Progress
            </h2>
            <TaskList tasks={teamTasks.filter(t => t.status !== 'Approved')} />
          </div>
        </div>

        {/* Team Status */}
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm h-fit">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            {myTeam} Team
          </h2>
          <div className="space-y-4">
            {teamMembers.map(member => {
              const isActive = timesheets.some(t => t.userId === member.id && !t.clockOut);
              return (
                <div key={member.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-sm">{member.name.charAt(0)}</div>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{member.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{member.role}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    member.status === 'Available' ? 'text-emerald-600 bg-emerald-50' :
                    member.status === 'Sick' ? 'text-rose-600 bg-rose-50' :
                    'text-slate-400 bg-slate-50'
                  }`}>{member.status || 'N/A'}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 3. TEAM LEADER DASHBOARD ──────────────────────────────────────
function TeamLeaderDashboard() {
  const { currentUser, users, timesheets, tasks } = useStore(
    useShallow((s) => ({
      currentUser: s.currentUser,
      users: s.users,
      timesheets: s.timesheets,
      tasks: s.tasks,
    }))
  );
  const now = new Date();

  const myTeam = currentUser?.team;
  const teamMembers = users.filter(u => u.team === myTeam && u.role !== 'Pending User');
  const teamTasks = tasks.filter(t => teamMembers.some(m => m.id === t.assignedTo));
  const completedTasks = teamTasks.filter(t => t.status === 'Approved').length;
  const inProgressTasks = teamTasks.filter(t => t.status === 'In Progress').length;
  const overdueTasks = teamTasks.filter(t => t.status !== 'Approved' && new Date(t.deadline) < now).length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <TimerWidget />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <StatCard icon={Users} label="Team Size" value={teamMembers.length} color="text-blue-500" bg="bg-blue-50" />
        <StatCard icon={BarChart3} label="In Progress" value={inProgressTasks} color="text-indigo-500" bg="bg-indigo-50" />
        <StatCard icon={CheckCircle2} label="Completed" value={completedTasks} color="text-emerald-500" bg="bg-emerald-50" />
        <StatCard icon={AlertCircle} label="Overdue" value={overdueTasks} color="text-rose-500" bg="bg-rose-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <WeeklyChart />

        <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-500" />
                Team Assignments
              </h2>
              <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-indigo-100">
                {teamTasks.length} Total
              </div>
            </div>
            <TaskList tasks={teamTasks.filter(t => t.status !== 'Approved')} />
          </div>
        </div>

        {/* Team Performance */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Member Performance
            </h2>
            <div className="space-y-5">
              {teamMembers.map(member => {
                const memberTasks = tasks.filter(t => t.assignedTo === member.id);
                const done = memberTasks.filter(t => t.status === 'Approved').length;
                const total = memberTasks.length;
                const pct = total > 0 ? (done / total) * 100 : 0;
                const isActive = timesheets.some(t => t.userId === member.id && !t.clockOut);

                return (
                  <div key={member.id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">{member.name.charAt(0)}</div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{member.name}</span>
                      </div>
                      <span className="text-[10px] font-black text-slate-400">{done}/{total}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500" style={{ width: `${Math.max(pct, 4)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-blue-100">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">Team Status</h3>
              <p className="text-blue-100 text-xs leading-relaxed mb-4 font-medium">
                {teamMembers.filter(m => timesheets.some(t => t.userId === m.id && !t.clockOut)).length} of {teamMembers.length} members currently working.
              </p>
              <div className="flex gap-2">
                {teamMembers.map(m => {
                  const isActive = timesheets.some(t => t.userId === m.id && !t.clockOut);
                  return (
                    <div key={m.id} title={m.name} className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold border-2 ${isActive ? 'bg-white/20 border-white/40 text-white' : 'bg-white/5 border-white/10 text-white/30'}`}>
                      {m.name.charAt(0)}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 4. USER (EMPLOYEE) DASHBOARD ──────────────────────────────────
function UserDashboard() {
  const { currentUser, timesheets, tasks, leaves } = useStore(
    useShallow((s) => ({
      currentUser: s.currentUser,
      timesheets: s.timesheets,
      tasks: s.tasks,
      leaves: s.leaves,
    }))
  );
  const [now, setNow] = useState(new Date());

  const userTasks = tasks.filter(t => t.assignedTo === currentUser?.id && t.status !== 'Approved');

  const recentActivity = useMemo(() => {
    const activities = [
      ...timesheets.filter(t => t.userId === currentUser?.id).map(t => ({
        type: 'Clock', title: t.clockOut ? 'Clocked Out' : 'Clocked In', time: t.clockOut || t.clockIn, icon: Clock, color: t.clockOut ? 'text-slate-400' : 'text-emerald-500'
      })),
      ...leaves.filter(l => l.userId === currentUser?.id).map(l => ({
        type: 'Leave', title: `Leave Request: ${l.type}`, time: l.createdAt, icon: Calendar, color: 'text-blue-500'
      })),
      ...tasks.filter(t => t.assignedTo === currentUser?.id && t.status === 'Approved').map(t => ({
        type: 'Task', title: `Approved Task: ${t.title}`, time: now.toISOString(), icon: CheckCircle2, color: 'text-indigo-500'
      }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 3);
    return activities;
  }, [timesheets, leaves, tasks, currentUser, now]);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <TimerWidget />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <WeeklyChart />

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-500" />
                My Active Tasks
              </h2>
            </div>
            <TaskList tasks={userTasks} />
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-8 flex items-center gap-2">
              <Timer className="w-5 h-5 text-emerald-500" />
              Recent Activity
            </h2>
            <div className="space-y-8">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex gap-4 relative">
                  {i !== recentActivity.length - 1 && (
                    <div className="absolute left-6 top-10 bottom-[-20px] w-0.5 bg-slate-50" />
                  )}
                  <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center flex-shrink-0 border border-slate-100 shadow-sm ${activity.color}`}>
                    <activity.icon className="w-5 h-5" />
                  </div>
                  <div className="pt-1">
                    <p className="text-sm font-bold text-slate-800 leading-tight mb-1">{activity.title}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                      {format(new Date(activity.time), 'MMM d • HH:mm')}
                    </p>
                  </div>
                </div>
              ))}
              {recentActivity.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-10 font-medium">No recent activity detected.</p>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-blue-100">
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-2">Need a break?</h3>
              <p className="text-blue-100 text-xs leading-relaxed mb-6 font-medium">
                Remember to take regular breaks to stay productive and healthy. Your wellness is our priority.
              </p>
              <button className="w-full py-3.5 bg-white text-blue-600 rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-blue-900/20 active:scale-95 transition-all">
                Request Leave
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
