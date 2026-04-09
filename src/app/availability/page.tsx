'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, AlertCircle, UserCheck, Clock, Activity, Filter } from 'lucide-react';
import { useStore } from '@/lib/store';
import type { Role } from '@/lib/store';

export default function AvailabilityPage() {
  const { currentUser } = useStore();

  if (currentUser?.role === 'Admin') {
    return <AdminAvailabilityBoard />;
  }

  return <EmployeeAvailabilityView />;
}

const BOARD_ROLES: Role[] = ['Employee', 'HR', 'Team Leader'];
type BoardRoleFilter = 'all' | Role;
type BoardStatusFilter = 'all' | 'Available' | 'Unavailable' | 'Sick';

function AdminAvailabilityBoard() {
  const { users, timesheets } = useStore();
  const [roleFilter, setRoleFilter] = useState<BoardRoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<BoardStatusFilter>('all');

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (u.role === 'Pending User') return false;
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      const st = u.status || 'Not Set';
      if (statusFilter !== 'all') {
        if (st !== statusFilter) return false;
      }
      return true;
    });
  }, [users, roleFilter, statusFilter]);

  const getStatusAccent = (status?: string) => {
    switch (status) {
      case 'Available':
        return {
          dot: 'bg-emerald-500',
          ring: 'ring-emerald-500/25',
          border: 'border-emerald-200',
          cardBg: 'bg-gradient-to-br from-white to-emerald-50/40',
          stripe: 'bg-emerald-500',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200/80',
          iconWrap: 'bg-emerald-100 text-emerald-600',
        };
      case 'Unavailable':
        return {
          dot: 'bg-amber-400',
          ring: 'ring-amber-400/30',
          border: 'border-amber-200',
          cardBg: 'bg-gradient-to-br from-white to-amber-50/50',
          stripe: 'bg-amber-400',
          badge: 'bg-amber-100 text-amber-900 border-amber-200/80',
          iconWrap: 'bg-amber-100 text-amber-700',
        };
      case 'Sick':
        return {
          dot: 'bg-rose-500',
          ring: 'ring-rose-500/25',
          border: 'border-rose-200',
          cardBg: 'bg-gradient-to-br from-white to-rose-50/40',
          stripe: 'bg-rose-500',
          badge: 'bg-rose-100 text-rose-800 border-rose-200/80',
          iconWrap: 'bg-rose-100 text-rose-600',
        };
      default:
        return {
          dot: 'bg-slate-300',
          ring: 'ring-slate-300/25',
          border: 'border-slate-200',
          cardBg: 'bg-white',
          stripe: 'bg-slate-300',
          badge: 'bg-slate-100 text-slate-700 border-slate-200',
          iconWrap: 'bg-slate-100 text-slate-500',
        };
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'Available': return UserCheck;
      case 'Sick': return AlertCircle;
      default: return Clock;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-b border-slate-200/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Team Status Board</h1>
          <p className="text-slate-500 mt-1 text-sm max-w-xl">Availability and work activity across roles.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-slate-500">
          <Filter className="w-4 h-4 shrink-0" aria-hidden />
          <span className="text-xs font-bold uppercase tracking-widest">Filters</span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Role</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setRoleFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                roleFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {BOARD_ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                  roleFilter === r
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r === 'Team Leader' ? 'TL' : r}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Status</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {(['Available', 'Unavailable', 'Sick'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors border ${
                  statusFilter === s
                    ? s === 'Available'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                      : s === 'Unavailable'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                        : 'bg-rose-600 text-white border-rose-600 shadow-md'
                    : s === 'Available'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                      : s === 'Unavailable'
                        ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                        : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <p className="text-center text-slate-500 py-12 text-sm">No people match these filters.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => {
            const isClockedIn = timesheets.some((t) => t.userId === user.id && !t.clockOut);
            const Icon = getStatusIcon(user.status);
            const accent = getStatusAccent(user.status);

            return (
              <div
                key={user.id}
                className={`relative rounded-2xl p-6 border shadow-sm hover:shadow-lg transition-all overflow-hidden ${accent.cardBg} ${accent.border}`}
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${accent.stripe}`} aria-hidden />
                <div className="flex items-start gap-4 pl-1">
                  <div className="relative shrink-0">
                    <div
                      className={`h-14 w-14 rounded-2xl flex items-center justify-center font-bold text-lg border-2 border-white shadow-sm ${accent.iconWrap}`}
                    >
                      {user.name.charAt(0)}
                    </div>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-[3px] border-white ring-2 ${accent.dot} ${accent.ring}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-900 text-base leading-snug truncate">{user.name}</h3>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mt-0.5">
                      {user.team}
                      <span className="text-slate-300 mx-1.5">·</span>
                      {user.role === 'Team Leader' ? 'TL' : user.role}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-2.5 pl-1">
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-white/70 backdrop-blur-sm px-3.5 py-3 border border-slate-100/80">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 shrink-0 text-slate-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">Status</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border shrink-0 ${accent.badge}`}>
                      {user.status || 'Not Set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-xl bg-white/70 backdrop-blur-sm px-3.5 py-3 border border-slate-100/80">
                    <div className="flex items-center gap-2.5">
                      <Activity className="w-4 h-4 shrink-0 text-slate-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Activity</span>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg border ${
                        isClockedIn
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200/80'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {isClockedIn ? 'Working' : 'Away'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmployeeAvailabilityView() {
  const { currentUser, updateUser, timesheets } = useStore();
  const [status, setStatus] = useState(currentUser?.status || 'Available');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (!currentUser) return;
    setStatus(currentUser.status || 'Available');
  }, [currentUser]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const activeEntry = useMemo(() => {
    if (!currentUser) return null;
    return timesheets.find(t => t.userId === currentUser.id && !t.clockOut) || null;
  }, [currentUser, timesheets]);

  const activeBreak = useMemo(() => {
    if (!activeEntry?.breaks?.length) return null;
    const last = activeEntry.breaks[activeEntry.breaks.length - 1];
    return last && !last.endTime ? last : null;
  }, [activeEntry]);

  const attendanceDays = useMemo(() => {
    if (!currentUser) return [];
    const days: { date: Date; entry?: any }[] = [];
    const sameYMD = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    for (let i = 0; i < 14; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const entry = timesheets
        .filter(t => t.userId === currentUser.id)
        .find(t => sameYMD(new Date(t.clockIn), d));

      days.push({ date: d, entry });
    }
    return days;
  }, [currentUser, timesheets, now]);

  const fmtTime = (iso?: string) => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return '—';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const computeRunningHours = (entry: any) => {
    if (!entry?.clockIn) return null;
    const clockInMs = new Date(entry.clockIn).getTime();
    const effectiveNowMs = activeBreak ? new Date(activeBreak.startTime).getTime() : now.getTime();
    if (!Number.isFinite(clockInMs) || !Number.isFinite(effectiveNowMs)) return null;

    const completedBreakMs = (entry.breaks || [])
      .filter((b: any) => !!b?.startTime && !!b?.endTime)
      .reduce((acc: number, b: any) => {
        return acc + (new Date(b.endTime).getTime() - new Date(b.startTime).getTime());
      }, 0);

    const diffMs = Math.max(0, effectiveNowMs - clockInMs - completedBreakMs);
    return diffMs / 3600000;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="space-y-8">
        <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border border-slate-100 shadow-sm relative overflow-hidden">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 mb-5 sm:mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Status
          </h2>

          {activeEntry && (
            <div className="mb-5 sm:mb-6 bg-slate-50 border border-slate-100 rounded-[1.5rem] p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800">Shift is running</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  {activeBreak ? 'On break (paused)' : 'Working'} • Checked in at {fmtTime(activeEntry.clockIn)}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                activeBreak ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
              } self-start sm:self-auto`}>
                {activeBreak ? 'ON BREAK' : 'ACTIVE'}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            {(['Available', 'Unavailable', 'Sick'] as const).map(s => (
              <button
                key={s}
                onClick={() => {
                  setStatus(s);
                  if (currentUser) updateUser(currentUser.id, { status: s as any });
                }}
                className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border transition-all ${
                  status === s
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100'
                    : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <span className="text-sm font-bold uppercase tracking-widest">{s}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-50/50 p-6 sm:p-8 rounded-[2.5rem] border border-blue-100 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-blue-500 mt-0.5" />
          <p className="text-sm text-blue-700/80 leading-relaxed font-medium">
            Keep your status updated so colleagues know when you're reachable. Attendance is tracked from your check-in/out and breaks.
          </p>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-blue-500" />
              Attendance Log
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Live • Last 14 days
            </span>
          </div>

          <div className="space-y-3">
            {attendanceDays.map(({ date, entry }) => {
              const isToday =
                date.getFullYear() === now.getFullYear() &&
                date.getMonth() === now.getMonth() &&
                date.getDate() === now.getDate();

              const isActiveToday = isToday && !!activeEntry;
              const statusLabel = entry
                ? entry.clockOut
                  ? 'Present'
                  : isActiveToday && activeBreak
                    ? 'On Break'
                    : 'Active'
                : 'Absent';

              const badge =
                statusLabel === 'Present'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : statusLabel === 'On Break'
                    ? 'bg-amber-50 text-amber-700 border-amber-100'
                    : statusLabel === 'Active'
                      ? 'bg-amber-50 text-amber-700 border-amber-100'
                      : 'bg-slate-50 text-slate-400 border-slate-100';

              const breaksCount = entry?.breaks?.length || 0;
              const totalHours =
                isActiveToday && activeEntry
                  ? (computeRunningHours(activeEntry)?.toFixed(2) ?? '—')
                  : typeof entry?.totalHours === 'number'
                    ? entry.totalHours.toFixed(2)
                    : '—';

              return (
                <div
                  key={date.toISOString()}
                  className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4 rounded-2xl border border-slate-100 hover:bg-slate-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-20 shrink-0">
                      <div className="text-sm font-bold text-slate-800">{date.toLocaleDateString([], { month: 'short', day: '2-digit' })}</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {date.toLocaleDateString([], { weekday: 'short' })}
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${badge}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-white rounded-xl border border-slate-100 px-3 py-2">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">In</div>
                      <div className="font-bold text-slate-800">{fmtTime(entry?.clockIn)}</div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-100 px-3 py-2">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Out</div>
                      <div className="font-bold text-slate-800">{fmtTime(entry?.clockOut)}</div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-100 px-3 py-2">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Breaks</div>
                      <div className="font-bold text-slate-800">{breaksCount}</div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-100 px-3 py-2">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Hours</div>
                      <div className="font-bold text-slate-800">{totalHours}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
