'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarClock, AlertCircle, UserCheck, Clock, Activity } from 'lucide-react';
import { useStore } from '@/lib/store';

export default function AvailabilityPage() {
  const { currentUser } = useStore();

  if (currentUser?.role === 'Admin') {
    return <AdminAvailabilityBoard />;
  }

  return <EmployeeAvailabilityView />;
}

function AdminAvailabilityBoard() {
  const { users, timesheets } = useStore();

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'Available': return 'bg-emerald-500';
      case 'Unavailable': return 'bg-slate-400';
      case 'Sick': return 'bg-rose-500';
      default: return 'bg-slate-200';
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
      <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl" />
        <div className="relative z-10 text-center md:text-left">
          <h1 className="text-5xl font-light text-white tracking-tight leading-tight">
            Team <br />
            <span className="font-bold text-blue-400">Status Board</span>
          </h1>
          <p className="text-slate-400 mt-4 max-w-md">Monitor real-time team availability, working status, and scheduled absences across all departments.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {users.map(user => {
          const isClockedIn = timesheets.some(t => t.userId === user.id && !t.clockOut);
          const Icon = getStatusIcon(user.status);
          
          return (
            <div key={user.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-16 w-16 rounded-[1.25rem] bg-slate-50 flex items-center justify-center font-bold text-slate-400 border border-slate-100 text-xl">
                      {user.name.charAt(0)}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white ${getStatusColor(user.status)}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg leading-tight">{user.name}</h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">{user.team}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                 <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                    <div className="flex items-center gap-3">
                       <Icon className="w-4 h-4 text-blue-500" />
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Current Status</span>
                    </div>
                    <span className="text-xs font-black text-slate-800">{user.status || 'Not Set'}</span>
                 </div>
                 <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100/50">
                    <div className="flex items-center gap-3">
                       <Activity className="w-4 h-4 text-emerald-500" />
                       <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Work Activity</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isClockedIn ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isClockedIn ? 'Working' : 'Away'}
                    </span>
                 </div>
              </div>
            </div>
          );
        })}
      </div>
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
