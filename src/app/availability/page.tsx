'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, AlertCircle, UserCheck, Clock, Activity, Filter, Calendar } from 'lucide-react';
import { useStore, useShallow } from '@/lib/store';
import type { Role } from '@/lib/store';

export default function AvailabilityPage() {
  const currentUser = useStore((s) => s.currentUser);

  if (currentUser?.role === 'Admin') {
    return <AdminAvailabilityBoard />;
  }

  return <EmployeeAvailabilityView />;
}

const BOARD_ROLES: Role[] = ['Employee', 'HR', 'Team Leader'];
type BoardRoleFilter = 'all' | Role;
type BoardStatusFilter = 'all' | 'Available' | 'Unavailable' | 'Sick';

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function fromDateInputValue(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

/** Calendar day in local time, comparable to other dates at midnight. */
function dayStartMs(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function isApprovedSickLeaveDay(
  date: Date,
  userId: string,
  leaves: { userId: string; type: string; status: string; startDate: string; endDate: string }[]
): boolean {
  const dayMs = dayStartMs(date);
  return leaves.some((l) => {
    if (l.userId !== userId || l.type !== 'Sick' || l.status !== 'Approved') return false;
    const startMs = dayStartMs(fromDateInputValue(l.startDate.slice(0, 10)));
    const endMs = dayStartMs(fromDateInputValue(l.endDate.slice(0, 10)));
    return dayMs >= startMs && dayMs <= endMs;
  });
}

/** First and last calendar day of the previous month (local), as `YYYY-MM-DD` for date inputs. */
function getLastMonthDateRange(): { start: string; end: string } {
  const now = new Date();
  const firstOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  return {
    start: toDateInputValue(firstOfPrevMonth),
    end: toDateInputValue(lastOfPrevMonth),
  };
}

function AdminAvailabilityBoard() {
  const { users, timesheets } = useStore(
    useShallow((s) => ({ users: s.users, timesheets: s.timesheets }))
  );
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
  const { currentUser, updateUser, timesheets, leaves } = useStore(
    useShallow((s) => ({
      currentUser: s.currentUser,
      updateUser: s.updateUser,
      timesheets: s.timesheets,
      leaves: s.leaves,
    }))
  );
  const [status, setStatus] = useState(currentUser?.status || 'Available');
  const [now, setNow] = useState(new Date());
  const [logRangeStart, setLogRangeStart] = useState(() => getLastMonthDateRange().start);
  const [logRangeEnd, setLogRangeEnd] = useState(() => getLastMonthDateRange().end);

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
    return timesheets.find((t) => t.userId === currentUser.id && !t.clockOut) || null;
  }, [currentUser, timesheets]);

  const activeBreak = useMemo(() => {
    if (!activeEntry?.breaks?.length) return null;
    const last = activeEntry.breaks[activeEntry.breaks.length - 1];
    return last && !last.endTime ? last : null;
  }, [activeEntry]);

  const { rangeStartDate, rangeEndDate, attendanceDays } = useMemo(() => {
    if (!currentUser) {
      return { rangeStartDate: new Date(), rangeEndDate: new Date(), attendanceDays: [] as { date: Date; entry?: any }[] };
    }
    let start = fromDateInputValue(logRangeStart);
    let end = fromDateInputValue(logRangeEnd);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    if (start > end) {
      const t = start.getTime();
      start = new Date(end);
      end = new Date(t);
    }
    const maxSpan = 90 * 86400000;
    if (end.getTime() - start.getTime() > maxSpan) {
      start = new Date(end.getTime() - maxSpan);
    }

    const sameYMD = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

    const days: { date: Date; entry?: any }[] = [];
    const cursor = new Date(end);
    while (cursor >= start) {
      const d = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate());
      const entry = timesheets
        .filter((t) => t.userId === currentUser.id)
        .find((t) => sameYMD(new Date(t.clockIn), d));
      days.push({ date: d, entry });
      cursor.setDate(cursor.getDate() - 1);
    }
    return { rangeStartDate: start, rangeEndDate: end, attendanceDays: days };
  }, [currentUser, timesheets, logRangeStart, logRangeEnd]);

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

  const logSummary = useMemo(() => {
    if (!currentUser) {
      return {
        daysListed: 0,
        absentDays: 0,
        presentDays: 0,
        sickDays: 0,
        totalHours: 0,
      };
    }
    let absentDays = 0;
    let presentDays = 0;
    let sickDays = 0;
    let totalH = 0;
    for (const { date, entry } of attendanceDays) {
      const sick = isApprovedSickLeaveDay(date, currentUser.id, leaves);
      if (sick) {
        sickDays += 1;
        if (entry) {
          const isToday =
            date.getFullYear() === now.getFullYear() &&
            date.getMonth() === now.getMonth() &&
            date.getDate() === now.getDate();
          const isActiveToday = isToday && !!activeEntry && !entry.clockOut;
          if (isActiveToday && activeEntry) {
            const h = computeRunningHours(activeEntry);
            if (typeof h === 'number') totalH += h;
          } else if (typeof entry.totalHours === 'number') {
            totalH += entry.totalHours;
          }
        }
        continue;
      }
      if (entry) {
        presentDays += 1;
        const isToday =
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth() &&
          date.getDate() === now.getDate();
        const isActiveToday = isToday && !!activeEntry && !entry.clockOut;
        if (isActiveToday && activeEntry) {
          const h = computeRunningHours(activeEntry);
          if (typeof h === 'number') totalH += h;
        } else if (typeof entry.totalHours === 'number') {
          totalH += entry.totalHours;
        }
      } else {
        absentDays += 1;
      }
    }
    return {
      daysListed: attendanceDays.length,
      absentDays,
      presentDays,
      sickDays,
      totalHours: totalH,
    };
  }, [attendanceDays, now, activeEntry, activeBreak, leaves, currentUser]);

  const applyLastMonth = () => {
    const { start, end } = getLastMonthDateRange();
    setLogRangeStart(start);
    setLogRangeEnd(end);
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-500 text-sm">Sign in to manage availability.</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8 pb-12 px-4 sm:px-6">
      <header className="border-b border-slate-200/80 pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">My availability</h1>
        <p className="text-slate-500 mt-1 text-sm">Set how reachable you are and review your attendance for any date range.</p>
      </header>

      <section className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-500 shrink-0" />
          Current status
        </h2>
        <p className="text-xs text-slate-500 mb-6">What others see before they message you.</p>

        {activeEntry && (
          <div className="mb-6 rounded-2xl border border-slate-100 bg-gradient-to-r from-slate-50 to-white p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-900">Shift in progress</p>
              <p className="text-xs text-slate-500 mt-1">
                {activeBreak ? 'On break (timer paused)' : 'Working'} · Check-in {fmtTime(activeEntry.clockIn)}
              </p>
            </div>
            <div
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border self-start sm:self-auto ${
                activeBreak ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              }`}
            >
              {activeBreak ? 'On break' : 'Active'}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['Available', 'Unavailable', 'Sick'] as const).map((s) => {
            const active =
              s === 'Available'
                ? 'ring-2 ring-emerald-500/40 border-emerald-300 bg-gradient-to-br from-emerald-50 to-white shadow-md shadow-emerald-100/50'
                : s === 'Unavailable'
                  ? 'ring-2 ring-amber-400/50 border-amber-300 bg-gradient-to-br from-amber-50 to-white shadow-md shadow-amber-100/50'
                  : 'ring-2 ring-rose-500/35 border-rose-300 bg-gradient-to-br from-rose-50 to-white shadow-md shadow-rose-100/50';
            const idle =
              s === 'Available'
                ? 'border-slate-200 bg-slate-50/80 text-slate-600 hover:bg-emerald-50/60 hover:border-emerald-200'
                : s === 'Unavailable'
                  ? 'border-slate-200 bg-slate-50/80 text-slate-600 hover:bg-amber-50/60 hover:border-amber-200'
                  : 'border-slate-200 bg-slate-50/80 text-slate-600 hover:bg-rose-50/60 hover:border-rose-200';
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setStatus(s);
                  updateUser(currentUser.id, { status: s as 'Available' | 'Unavailable' | 'Sick' });
                }}
                className={`flex flex-col items-center justify-center rounded-2xl border-2 px-4 py-5 transition-all ${
                  status === s ? `${active} text-slate-900` : idle
                }`}
              >
                <span className="text-xs font-black uppercase tracking-widest">{s}</span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-indigo-50/40 p-5 sm:p-6 flex gap-4">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-white/80 border border-blue-100 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-blue-600" />
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          Keep this updated so your team knows when you are reachable. Hours below come from check-in, check-out, and breaks.
        </p>
      </div>

      <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-indigo-500 shrink-0" />
                Attendance log
              </h2>
              <p className="text-xs text-slate-500 mt-1">Use the dates below or jump to last month — newest days appear first.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={applyLastMonth}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wide bg-indigo-50 border border-indigo-100 text-indigo-700 hover:bg-indigo-100/80"
              >
                Last month
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-4">
            <label className="flex flex-col gap-1.5 min-w-[160px]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" aria-hidden />
                From
              </span>
              <input
                type="date"
                value={logRangeStart}
                max={logRangeEnd}
                onChange={(e) => setLogRangeStart(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
            </label>
            <label className="flex flex-col gap-1.5 min-w-[160px]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" aria-hidden />
                To
              </span>
              <input
                type="date"
                value={logRangeEnd}
                min={logRangeStart}
                onChange={(e) => setLogRangeEnd(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
              />
            </label>
            <p className="text-xs text-slate-400 sm:pb-2">
              {rangeStartDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} —{' '}
              {rangeEndDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              <span className="block sm:inline sm:before:content-['·'] sm:before:mx-2">
                Max 90 days per view
              </span>
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-xl border border-yellow-300 bg-white px-4 py-3 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-widest text-yellow-800">Absent</div>
              <div className="text-xl font-bold text-yellow-950 tabular-nums">{logSummary.absentDays}</div>
              <div className="text-[9px] text-yellow-700/90 mt-1 leading-snug">No check-in</div>
            </div>
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 px-4 py-3 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Present</div>
              <div className="text-xl font-bold text-emerald-800 tabular-nums">{logSummary.presentDays}</div>
              <div className="text-[9px] text-emerald-600/90 mt-1 leading-snug">Has attendance</div>
            </div>
            <div className="rounded-xl border border-rose-200/80 bg-rose-50/40 px-4 py-3 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-widest text-rose-700">Sick</div>
              <div className="text-xl font-bold text-rose-800 tabular-nums">{logSummary.sickDays}</div>
              <div className="text-[9px] text-rose-600/90 mt-1 leading-snug">Approved sick leave</div>
            </div>
            <div className="rounded-xl border border-indigo-100 bg-white px-4 py-3 shadow-sm col-span-2 lg:col-span-1">
              <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Total hours</div>
              <div className="text-xl font-bold text-indigo-700 tabular-nums">{logSummary.totalHours.toFixed(2)}</div>
              <div className="text-[9px] text-indigo-500/90 mt-1 leading-snug">In selected range</div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-3">
          {attendanceDays.map(({ date, entry }) => {
            const isToday =
              date.getFullYear() === now.getFullYear() &&
              date.getMonth() === now.getMonth() &&
              date.getDate() === now.getDate();

            const sickDay = isApprovedSickLeaveDay(date, currentUser.id, leaves);
            const isActiveToday = isToday && !!activeEntry && !!entry && !entry.clockOut;
            const statusLabel = sickDay
              ? 'Sick'
              : entry
                ? entry.clockOut
                  ? 'Present'
                  : isActiveToday && activeBreak
                    ? 'On break'
                    : 'Active'
                : 'Absent';

            const badge =
              statusLabel === 'Sick'
                ? 'bg-rose-100 text-rose-900 border-rose-200'
                : statusLabel === 'Present'
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-200'
                  : statusLabel === 'On break' || statusLabel === 'Active'
                    ? 'bg-amber-100 text-amber-900 border-amber-200'
                    : 'bg-white text-yellow-800 border-yellow-400';

            const breaksCount = entry?.breaks?.length || 0;
            const totalHours =
              isActiveToday && activeEntry
                ? computeRunningHours(activeEntry)?.toFixed(2) ?? '—'
                : typeof entry?.totalHours === 'number'
                  ? entry.totalHours.toFixed(2)
                  : '—';

            const rowAccent =
              statusLabel === 'Sick'
                ? 'border-l-rose-500'
                : statusLabel === 'Present'
                  ? 'border-l-emerald-500'
                  : statusLabel === 'Absent'
                    ? 'border-l-yellow-500'
                    : 'border-l-amber-500';

            return (
              <div
                key={`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`}
                className={`group rounded-2xl border border-slate-100 bg-slate-50/40 hover:bg-white hover:shadow-md transition-all overflow-hidden border-l-4 ${rowAccent}`}
              >
                <div className="p-4 flex flex-col lg:flex-row lg:items-stretch gap-4">
                  <div className="flex items-center gap-4 lg:w-44 shrink-0">
                    <div className="flex h-14 w-14 flex-col items-center justify-center rounded-xl bg-white border border-slate-100 shadow-sm">
                      <span className="text-[10px] font-bold uppercase text-slate-400 leading-none">
                        {date.toLocaleDateString([], { weekday: 'short' })}
                      </span>
                      <span className="text-lg font-black text-slate-900 tabular-nums leading-tight mt-0.5">
                        {date.getDate()}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">{date.toLocaleDateString([], { month: 'short' })}</span>
                    </div>
                    <div className="min-w-0">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${badge}`}
                      >
                        {statusLabel}
                      </span>
                      {isToday && (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-indigo-600">Today</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 flex-1 min-w-0">
                    <div className="rounded-xl bg-white border border-slate-100 px-3 py-2.5">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">In</div>
                      <div className="font-bold text-slate-900 tabular-nums">{fmtTime(entry?.clockIn)}</div>
                    </div>
                    <div className="rounded-xl bg-white border border-slate-100 px-3 py-2.5">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Out</div>
                      <div className="font-bold text-slate-900 tabular-nums">{fmtTime(entry?.clockOut)}</div>
                    </div>
                    <div className="rounded-xl bg-white border border-slate-100 px-3 py-2.5">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Breaks</div>
                      <div className="font-bold text-slate-900 tabular-nums">{breaksCount}</div>
                    </div>
                    <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 px-3 py-2.5">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Hours</div>
                      <div className="font-bold text-indigo-950 tabular-nums">{totalHours}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
