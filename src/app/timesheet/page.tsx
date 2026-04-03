'use client';

import Link from 'next/link';
import { GlobalAttendanceLog } from '@/components/attendance/GlobalAttendanceLog';
import { ManualTimesheetLog } from '@/components/attendance/ManualTimesheetLog';
import { useStore } from '@/lib/store';
import { format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { Clock, TrendingUp, AlertCircle, Calendar, ArrowRight, UserCheck, Users, Check, Plus } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export default function TimesheetPage() {
  const { currentUser } = useStore();

  // Admin: Company-wide attendance report (no timer)
  if (currentUser?.role === 'Admin') return <AdminTimesheetView />;
  // Team Leader: Team attendance report + personal history
  if (currentUser?.role === 'Team Leader') return <TeamLeaderTimesheetView />;
  // HR: use Request Management to approve/reject manual time requests
  if (currentUser?.role === 'HR') return <HRTimesheetView />;
  // Employee: personal attendance history
  return <EmployeeTimesheetView />;
}

function HRTimesheetView() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-10 shadow-2xl">
        <div className="absolute right-0 top-0 h-96 w-96 translate-x-1/4 -translate-y-1/2 rounded-full bg-blue-500 opacity-10 blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-4xl font-light leading-tight tracking-tight text-white">
            HR <br />
            <span className="font-bold text-blue-400">Manual Timesheet</span>
          </h1>
          <p className="mt-4 max-w-md text-slate-400">
            Approve pending requests in{' '}
            <Link href="/request-management" className="font-bold text-blue-300 hover:underline">
              Request Management
            </Link>
            ; approved entries appear below.
          </p>
        </div>
      </div>

      <ManualTimesheetLog />

      <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800">Pending approvals</h2>
        <p className="mt-2 text-slate-500">
          Open{' '}
          <Link href="/request-management" className="font-bold text-blue-600 hover:underline">
            Request Management
          </Link>{' '}
          and use the Manual Time Requests tab to approve or reject.
        </p>
      </div>
    </div>
  );
}

// ─── ADMIN: COMPANY-WIDE ATTENDANCE REPORT ─────────────────────
function AdminTimesheetView() {
  const { timesheets, users } = useStore();
  const sortedTimesheets = [...timesheets].sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="bg-slate-900 rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl" />
        <div className="relative z-10">
          <h1 className="text-5xl font-light text-white tracking-tight leading-tight">
            Company <br />
            <span className="font-bold text-blue-400">Time Records</span>
          </h1>
          <p className="text-slate-400 mt-4 max-w-md">Oversee company-wide attendance, track billable hours, and monitor employee punctuality trends.</p>
        </div>
      </div>

      <GlobalAttendanceLog />
    </div>
  );
}

// ─── TEAM LEADER: TEAM-SCOPED ATTENDANCE + PERSONAL ────────────
function TeamLeaderTimesheetView() {
  const { timesheets, currentUser, users } = useStore();

  const teamMembers = users.filter(u => u.team === currentUser?.team && u.role !== 'Pending User');
  const teamTimesheets = timesheets
    .filter(t => teamMembers.some(m => m.id === t.userId))
    .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());

  const userTimesheets = timesheets
    .filter(t => t.userId === currentUser?.id)
    .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-light text-slate-800 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            Team Attendance
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Monitor your team's working hours and attendance records.</p>
        </div>
      </div>

      {/* Personal stats */}
      <PersonalStats userId={currentUser?.id} timesheets={timesheets} />

      {/* Team Attendance */}
      <TimesheetTable timesheets={teamTimesheets} users={teamMembers} title={`${currentUser?.team} Team Log`} />
    </div>
  );
}

// ─── HR / EMPLOYEE: PERSONAL ATTENDANCE ────────────────────────
function EmployeeTimesheetView() {
  const { timesheets, currentUser } = useStore();

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    // Update running totals for active (not yet clocked-out) entries.
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const userTimesheets = timesheets
    .filter(t => t.userId === currentUser?.id)
    .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());

  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  const weeklyTimesheets = userTimesheets.filter(t =>
    isWithinInterval(new Date(t.clockIn), { start: weekStart, end: weekEnd })
  );

  const getActiveBreak = (entry: any) => {
    if (!entry?.breaks?.length) return null;
    const last = entry.breaks[entry.breaks.length - 1];
    if (!last) return null;
    return last.endTime ? null : last;
  };

  const computedHoursForEntry = (entry: any) => {
    // Stored `totalHours` exists only after clock-out.
    if (typeof entry.totalHours === 'number' && entry.clockOut) return entry.totalHours;
    if (!entry.clockOut) {
      const activeBreak = getActiveBreak(entry);
      // If currently on break, "running" time stops at break start.
      const effectiveNowMs = activeBreak ? new Date(activeBreak.startTime).getTime() : now.getTime();
      const clockInMs = new Date(entry.clockIn).getTime();

      let hours = (effectiveNowMs - clockInMs) / (1000 * 60 * 60);
      hours = Math.max(0, hours);

      // Deduct completed breaks only.
      const breaks = Array.isArray(entry.breaks) ? entry.breaks : [];
      for (const b of breaks) {
        if (b?.startTime && b?.endTime) {
          hours -= (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / (1000 * 60 * 60);
        }
      }

      return Math.max(0, hours);
    }
    return 0;
  };

  const computedOvertimeForEntry = (entry: any) => {
    if (typeof entry.overtime === 'number' && entry.clockOut) return entry.overtime;
    const hours = computedHoursForEntry(entry);
    return Math.max(0, hours - 8);
  };

  const totals = useMemo(() => {
    const totalWeeklyHours = weeklyTimesheets.reduce((acc, t) => acc + computedHoursForEntry(t), 0);
    const totalWeeklyOvertime = weeklyTimesheets.reduce((acc, t) => acc + computedOvertimeForEntry(t), 0);
    const totalLateMarks = weeklyTimesheets.filter(t => t.lateMark).length;
    return { totalWeeklyHours, totalWeeklyOvertime, totalLateMarks };
  }, [now, weeklyTimesheets]);

  const totalWeeklyHours = totals.totalWeeklyHours;
  const totalWeeklyOvertime = totals.totalWeeklyOvertime;
  const totalLateMarks = totals.totalLateMarks;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-light text-slate-800 tracking-tight flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-500" />
            My Attendance
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Analyze your work rhythms and track your performance history.</p>
        </div>
        <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
          <div className="bg-blue-50 text-blue-600 p-2 rounded-xl"><Calendar className="w-5 h-5" /></div>
          <div className="pr-4">
            <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest">Current Week</span>
            <span className="text-sm font-bold text-slate-700">{format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-4">Total Weekly Hours</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-slate-800 tracking-tighter">{totalWeeklyHours.toFixed(1)}</span>
              <span className="text-slate-400 font-medium tracking-tight">hours</span>
            </div>
          </div>
          <TrendingUp className="absolute -bottom-4 -right-4 w-24 h-24 text-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-4">Weekly Overtime</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-indigo-600 tracking-tighter">{totalWeeklyOvertime.toFixed(1)}</span>
              <span className="text-slate-400 font-medium tracking-tight">hours</span>
            </div>
          </div>
          <ArrowRight className="absolute -bottom-4 -right-4 w-24 h-24 text-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity rotate-[-45deg]" />
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-4">Late Marks</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold tracking-tighter ${totalLateMarks > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{totalLateMarks}</span>
              <span className="text-slate-400 font-medium tracking-tight">instances</span>
            </div>
          </div>
          <AlertCircle className="absolute -bottom-4 -right-4 w-24 h-24 text-rose-50 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Personal Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-50 px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-500" />
            Recent Clock History
          </h2>
          <Link
            href="/my-requests?tab=manual"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Request manual time
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100/50">
                <th className="text-[10px] uppercase font-bold text-slate-400 tracking-widest py-5 px-8">Date</th>
                <th className="text-[10px] uppercase font-bold text-slate-400 tracking-widest py-5 px-8 text-center">Timing (In/Out)</th>
                <th className="text-[10px] uppercase font-bold text-slate-400 tracking-widest py-5 px-8 text-center">Summary</th>
                <th className="text-[10px] uppercase font-bold text-slate-400 tracking-widest py-5 px-8 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {userTimesheets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <Clock className="w-12 h-12 text-slate-100" />
                      <p className="text-slate-400 font-medium">No attendance records found yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                userTimesheets.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-6 px-8">
                      <div className="flex flex-col">
                        <span className="text-slate-900 font-bold tracking-tight">{format(new Date(entry.clockIn), 'eeee')}</span>
                        <span className="text-slate-400 text-xs font-medium">{format(new Date(entry.clockIn), 'MMM d, yyyy')}</span>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      <div className="flex items-center justify-center gap-4">
                        <div className="text-center">
                          <span className="block text-[10px] uppercase font-bold text-slate-300 mb-1">In</span>
                          <span className="text-slate-600 font-bold text-sm bg-slate-50 px-3 py-1 rounded-lg">{format(new Date(entry.clockIn), 'HH:mm')}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-200 mt-4" />
                        <div className="text-center">
                          <span className="block text-[10px] uppercase font-bold text-slate-300 mb-1">Out</span>
                          <span className={`font-bold text-sm bg-slate-50 px-3 py-1 rounded-lg ${entry.clockOut ? 'text-slate-600' : 'text-slate-300'}`}>
                            {entry.clockOut ? format(new Date(entry.clockOut), 'HH:mm') : '--:--'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-slate-800 tracking-tighter">
                            {computedHoursForEntry(entry).toFixed(2)}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">hours</span>
                        </div>
                        {entry.lateMark && (
                          <span className="mt-1 flex items-center text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100 animate-pulse">LATE MARK</span>
                        )}
                        {computedOvertimeForEntry(entry) > 0 && (
                          <span className="mt-2 inline-flex items-center text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                            OT {computedOvertimeForEntry(entry).toFixed(2)}h
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-6 px-8 text-right">
                      {!entry.clockOut ? (
                        (() => {
                          const activeBreak = getActiveBreak(entry);
                          if (activeBreak) {
                            return (
                              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 shadow-sm animate-pulse">
                                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />ON BREAK
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm animate-pulse">
                              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />ACTIVE
                            </span>
                          );
                        })()
                      ) : (
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-slate-50 text-slate-400 border border-slate-100">COMPLETED</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function HRManualTimesheetView() {
  const { users, currentUser, timesheets, addManualTimesheetEntry } = useStore();

  const today = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }, []);

  const employees = users.filter(u => u.role !== 'Pending User');
  const [employeeId, setEmployeeId] = useState(employees[0]?.id || '');
  const [date, setDate] = useState(today);
  const [clockInTime, setClockInTime] = useState('09:00');
  const [clockOutTime, setClockOutTime] = useState('18:00');
  const [breakInTime, setBreakInTime] = useState('');
  const [breakOutTime, setBreakOutTime] = useState('');

  const selectedEmployeeTimesheets = useMemo(() => {
    if (!employeeId) return [];
    return [...timesheets]
      .filter(t => t.userId === employeeId)
      .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime())
      .slice(0, 10);
  }, [timesheets, employeeId]);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!currentUser || currentUser.role !== 'HR') return;
    if (!employeeId) return;
    if (!date || !clockInTime || !clockOutTime) return;

    if ((breakInTime && !breakOutTime) || (!breakInTime && breakOutTime)) {
      alert('If you add Break In, you must also provide Break Out (and vice-versa).');
      return;
    }

    addManualTimesheetEntry({
      userId: employeeId,
      date,
      clockInTime,
      clockOutTime,
      breakInTime: breakInTime || undefined,
      breakOutTime: breakOutTime || undefined,
    });

    alert('Manual attendance recorded for the selected employee.');
    setBreakInTime('');
    setBreakOutTime('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-light text-slate-800 tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-500" />
            HR Manual Time Request
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Record employee attendance (date, in/out, breaks) manually.</p>
        </div>

        <div className="text-right">
          <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Logged in as</p>
          <p className="text-sm font-bold text-slate-700">{currentUser?.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Manual Entry Form
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Employee</label>
              <select
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                className="w-full rounded-2xl border-slate-100 bg-slate-50 border p-3.5 text-slate-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                required
              >
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.role}{emp.team ? ` • ${emp.team}` : ''})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-2xl border-slate-100 bg-slate-50 border p-3.5 text-slate-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Clock-in Time</label>
                <input
                  type="time"
                  value={clockInTime}
                  onChange={(e) => setClockInTime(e.target.value)}
                  className="w-full rounded-2xl border-slate-100 bg-slate-50 border p-3.5 text-slate-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Clock-out Time</label>
                <input
                  type="time"
                  value={clockOutTime}
                  onChange={(e) => setClockOutTime(e.target.value)}
                  className="w-full rounded-2xl border-slate-100 bg-slate-50 border p-3.5 text-slate-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Break (Optional) In</label>
                <input
                  type="time"
                  value={breakInTime}
                  onChange={(e) => setBreakInTime(e.target.value)}
                  className="w-full rounded-2xl border-slate-100 bg-slate-50 border p-3.5 text-slate-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Break (Optional) Out</label>
              <input
                type="time"
                value={breakOutTime}
                onChange={(e) => setBreakOutTime(e.target.value)}
                className="w-full rounded-2xl border-slate-100 bg-slate-50 border p-3.5 text-slate-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Save Manual Attendance
            </button>
          </form>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-blue-500" />
            Recent Entries
          </h2>
          <TimesheetTable timesheets={selectedEmployeeTimesheets as any[]} users={users} title="Last 10 Records" />
        </div>
      </div>
    </div>
  );
}

// ─── SHARED: PERSONAL STATS WIDGET ─────────────────────────────
function PersonalStats({ userId, timesheets }: { userId?: string; timesheets: any[] }) {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  const weeklyTimesheets = timesheets
    .filter(t => t.userId === userId)
    .filter(t => isWithinInterval(new Date(t.clockIn), { start: weekStart, end: weekEnd }));

  const totalHours = weeklyTimesheets.reduce((acc: number, t: any) => acc + (t.totalHours || 0), 0);
  const lateMarks = weeklyTimesheets.filter((t: any) => t.lateMark).length;

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">My Weekly Hours</p>
        <p className="text-3xl font-black text-slate-900 tracking-tight">{totalHours.toFixed(1)} <span className="text-sm font-bold text-slate-400">hrs</span></p>
      </div>
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Late Marks</p>
        <p className={`text-3xl font-black tracking-tight ${lateMarks > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{lateMarks}</p>
      </div>
    </div>
  );
}

// ─── SHARED: TIMESHEET TABLE ───────────────────────────────────
function TimesheetTable({ timesheets, users, title }: { timesheets: any[]; users: any[]; title: string }) {
  return (
    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Clock className="w-6 h-6 text-blue-500" />
          {title}
        </h2>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
          {timesheets.length} Records
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100/50">
              <th className="text-[10px] uppercase font-bold text-slate-400 tracking-widest py-6 px-8">Employee</th>
              <th className="text-[10px] uppercase font-bold text-slate-400 tracking-widest py-6 px-8">Date</th>
              <th className="text-[10px] uppercase font-bold text-slate-400 tracking-widest py-6 px-8 text-center">In / Out</th>
              <th className="text-[10px] uppercase font-bold text-slate-400 tracking-widest py-6 px-8 text-center">Total Hours</th>
              <th className="text-[10px] uppercase font-bold text-slate-400 tracking-widest py-6 px-8 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {timesheets.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-20">
                  <div className="flex flex-col items-center gap-3">
                    <Clock className="w-12 h-12 text-slate-100" />
                    <p className="text-slate-400 font-medium">No attendance records found</p>
                  </div>
                </td>
              </tr>
            ) : (
              timesheets.map((entry) => {
                const user = users.find((u: any) => u.id === entry.userId);
                return (
                  <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 text-xs">{user?.name?.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user?.team}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-8 text-sm text-slate-600 font-medium">{format(new Date(entry.clockIn), 'MMM d, yyyy')}</td>
                    <td className="py-6 px-8">
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-xs font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">{format(new Date(entry.clockIn), 'HH:mm')}</span>
                        <ArrowRight className="w-3 h-3 text-slate-300" />
                        <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${entry.clockOut ? 'bg-slate-50 border-slate-100 text-slate-700' : 'bg-white border-dashed border-slate-200 text-slate-300'}`}>
                          {entry.clockOut ? format(new Date(entry.clockOut), 'HH:mm') : '--:--'}
                        </span>
                      </div>
                    </td>
                    <td className="py-6 px-8 text-center">
                      <span className="text-sm font-black text-slate-800 tracking-tighter">{entry.totalHours ? entry.totalHours.toFixed(2) : '0.00'}</span>
                      <span className="text-[10px] font-bold text-slate-400 ml-1">HRS</span>
                    </td>
                    <td className="py-6 px-8 text-right">
                      {entry.lateMark && <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-50 text-rose-500 border border-rose-100 mr-2">LATE</span>}
                      {entry.clockOut ? (
                        <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-400">DONE</span>
                      ) : (
                        <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 animate-pulse">ACTIVE</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
