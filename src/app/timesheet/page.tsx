'use client';

import Link from 'next/link';
import { GlobalAttendanceLog } from '@/components/attendance/GlobalAttendanceLog';
import { ManualTimesheetLog } from '@/components/attendance/ManualTimesheetLog';
import { useStore, useShallow } from '@/lib/store';
import { employeeDisplayId } from '@/lib/attendanceSite';
import { format, subDays, startOfDay, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import {
  Clock,
  TrendingUp,
  AlertCircle,
  Calendar,
  ArrowRight,
  UserCheck,
  Users,
  Check,
  Plus,
  Timer,
  Hash,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export default function TimesheetPage() {
  const currentUser = useStore((s) => s.currentUser);

  // Admin: Company-wide attendance report (no timer)
  if (currentUser?.role === 'Admin') return <AdminTimesheetView />;
  // Team Leader: personal attendance only (team log is on /team-data)
  if (currentUser?.role === 'Team Leader') return <EmployeeTimesheetView />;
  // HR: use Request Management to approve/reject manual time requests
  if (currentUser?.role === 'HR') return <HRTimesheetView />;
  // Employee: personal attendance history
  return <EmployeeTimesheetView />;
}

function HRTimesheetView() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-12">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-10 shadow-2xl">
        <div className="absolute right-0 top-0 h-96 w-96 translate-x-1/4 -translate-y-1/2 rounded-full bg-blue-500 opacity-10 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 shadow-inner ring-1 ring-white/10"
            aria-hidden
          >
            <Clock className="h-8 w-8 text-blue-400" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Human resources</p>
            <h1 className="mt-2 text-2xl font-semibold leading-[1.15] tracking-tight text-white sm:text-3xl">
              Attendance &amp; timesheet
              <span className="mt-1 block text-lg font-medium text-blue-400 sm:mt-0 sm:ml-1 sm:inline sm:text-2xl">
                management system
              </span>
            </h1>
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-800">Company attendance (clock in / out)</h2>
        <p className="text-sm text-slate-600">
          Filter by provider or role (Employees, HR, Team Leader).
        </p>
        <GlobalAttendanceLog />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-800">Manual timesheet (approved)</h2>
        <p className="text-sm text-slate-600">
          Click a row to open the week and daily detail modal.
        </p>
        <ManualTimesheetLog />
      </section>

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

// ─── ADMIN: COMPANY-WIDE ATTENDANCE + MANUAL TIMESHEET ─────────
function AdminTimesheetView() {
  return (
    <div className="mx-auto max-w-6xl space-y-10 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Company Time Records</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
          Filter clock attendance by site and role. Approved manual time appears below; click a row for details. Approve or
          reject pending manual requests in{' '}
          <Link href="/request-management" className="font-semibold text-blue-600 hover:underline">
            Request Management
          </Link>
          .
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-800">Company attendance (clock in / out)</h2>
        <p className="text-sm text-slate-600">
          Company-wide log with Excel / PDF export.
        </p>
        <GlobalAttendanceLog />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-800">Manual timesheet (approved)</h2>
        <p className="text-sm text-slate-600">
          Same filters as HR; click a row for week details.
        </p>
        <ManualTimesheetLog />
      </section>

      <div className="rounded-[2rem] border border-slate-100 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800">Pending manual time approvals</h2>
        <p className="mt-2 text-slate-500">
          <Link href="/request-management" className="font-bold text-blue-600 hover:underline">
            Request Management
          </Link>{' '}
          → Manual Time Requests tab.
        </p>
      </div>
    </div>
  );
}

// ─── HR / EMPLOYEE / TEAM LEADER: PERSONAL ATTENDANCE ────────────
function EmployeeTimesheetView() {
  const { timesheets, currentUser } = useStore(
    useShallow((s) => ({ timesheets: s.timesheets, currentUser: s.currentUser }))
  );

  const [now, setNow] = useState(() => new Date());
  /** Rolling window for stats + table (employees / personal attendance). */
  const [attendanceDays, setAttendanceDays] = useState<7 | 30>(7);

  useEffect(() => {
    // Update running totals for active (not yet clocked-out) entries.
    const interval = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  const userTimesheets = timesheets
    .filter(t => t.userId === currentUser?.id)
    .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());

  const { rangeStart, rangeTimesheets } = useMemo(() => {
    const start = startOfDay(subDays(now, attendanceDays - 1));
    const startMs = start.getTime();
    const endMs = now.getTime();
    const list = userTimesheets.filter((t) => {
      const ms = new Date(t.clockIn).getTime();
      return ms >= startMs && ms <= endMs;
    });
    return { rangeStart: start, rangeTimesheets: list };
  }, [userTimesheets, now, attendanceDays]);

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
    const totalHours = rangeTimesheets.reduce((acc, t) => acc + computedHoursForEntry(t), 0);
    const totalOvertime = rangeTimesheets.reduce((acc, t) => acc + computedOvertimeForEntry(t), 0);
    const totalLateMarks = rangeTimesheets.filter((t) => t.lateMark).length;
    return { totalHours, totalOvertime, totalLateMarks };
  }, [now, rangeTimesheets, attendanceDays]);

  const totalHoursInRange = totals.totalHours;
  const totalOvertimeInRange = totals.totalOvertime;
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
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <div className="flex rounded-xl border border-slate-200 bg-slate-50/80 p-1 shadow-inner">
            <button
              type="button"
              onClick={() => setAttendanceDays(7)}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                attendanceDays === 7 ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              7 days
            </button>
            <button
              type="button"
              onClick={() => setAttendanceDays(30)}
              className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
                attendanceDays === 30 ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              30 days
            </button>
          </div>
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
            <div className="bg-blue-50 text-blue-600 p-2 rounded-xl"><Calendar className="w-5 h-5" /></div>
            <div className="pr-4">
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                Last {attendanceDays} days
              </span>
              <span className="text-sm font-bold text-slate-700">
                {format(rangeStart, 'MMM d')} – {format(now, 'MMM d, yyyy')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-4">
              Total hours ({attendanceDays}d)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-slate-800 tracking-tighter">{totalHoursInRange.toFixed(1)}</span>
              <span className="text-slate-400 font-medium tracking-tight">hours</span>
            </div>
          </div>
          <TrendingUp className="absolute -bottom-4 -right-4 w-24 h-24 text-blue-50 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-4">
              Overtime ({attendanceDays}d)
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-indigo-600 tracking-tighter">{totalOvertimeInRange.toFixed(1)}</span>
              <span className="text-slate-400 font-medium tracking-tight">hours</span>
            </div>
          </div>
          <ArrowRight className="absolute -bottom-4 -right-4 w-24 h-24 text-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity rotate-[-45deg]" />
        </div>

        <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest block mb-4">
              Late marks ({attendanceDays}d)
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-4xl font-bold tracking-tighter ${totalLateMarks > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{totalLateMarks}</span>
              <span className="text-slate-400 font-medium tracking-tight">instances</span>
            </div>
          </div>
          <AlertCircle className="absolute -bottom-4 -right-4 w-24 h-24 text-rose-50 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Clock history — polished table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_8px_30px_-12px_rgba(15,23,42,0.12)]">
        <div className="relative border-b border-slate-100 bg-gradient-to-br from-slate-50 via-white to-blue-50/40 px-5 py-5 sm:px-8 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
                <Timer className="h-6 w-6" strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">Clock history</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Entries from the last <span className="font-semibold text-slate-700">{attendanceDays} days</span>
                  <span className="mx-2 text-slate-300">·</span>
                  {rangeTimesheets.length} record{rangeTimesheets.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <Link
              href="/my-requests?tab=manual"
              className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 hover:shadow-lg sm:self-center"
            >
              <Plus className="h-4 w-4" />
              Request manual time
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider sm:px-8">
                  Date
                </th>
                <th className="px-5 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider sm:px-8">
                  Check in / out
                </th>
                <th className="px-5 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider sm:px-8">
                  Hours · flags
                </th>
                <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider sm:px-8">
                  Unique ID
                </th>
              </tr>
            </thead>
            <tbody>
              {rangeTimesheets.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center sm:px-8 sm:py-20">
                    <div className="mx-auto flex max-w-sm flex-col items-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-8 py-10">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
                        <Clock className="h-7 w-7 text-slate-300" />
                      </div>
                      <p className="text-base font-semibold text-slate-700">No shifts in this window</p>
                      <p className="mt-1 text-sm text-slate-500">
                        No attendance logged in the last {attendanceDays} days. Clock in from the dashboard or add a manual
                        entry.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rangeTimesheets.map((entry, idx) => {
                  const openShift = !entry.clockOut;
                  return (
                    <tr
                      key={entry.id}
                      className={`border-b border-slate-100 transition-colors hover:bg-blue-50/40 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'
                      }`}
                    >
                      <td className="align-top px-5 py-5 sm:px-8">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-100 text-center ring-1 ring-slate-200/80">
                            <span className="text-[10px] font-bold uppercase leading-none text-slate-400">
                              {format(new Date(entry.clockIn), 'MMM')}
                            </span>
                            <span className="text-lg font-black leading-tight text-slate-800">
                              {format(new Date(entry.clockIn), 'd')}
                            </span>
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{format(new Date(entry.clockIn), 'EEEE')}</p>
                            <p className="text-xs text-slate-500">{format(new Date(entry.clockIn), 'yyyy')}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-5 sm:px-8">
                        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
                          <div className="inline-flex flex-col items-center rounded-xl border border-emerald-200/80 bg-emerald-50/90 px-4 py-2 ring-1 ring-emerald-100/50">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600">In</span>
                            <span className="font-mono text-base font-bold tabular-nums text-emerald-900">
                              {format(new Date(entry.clockIn), 'HH:mm')}
                            </span>
                          </div>
                          <div className="hidden h-px w-6 bg-slate-200 sm:block" aria-hidden />
                          <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 sm:hidden" aria-hidden />
                          <div
                            className={`inline-flex flex-col items-center rounded-xl border px-4 py-2 ring-1 ${
                              openShift
                                ? 'border-amber-200/90 bg-amber-50/90 ring-amber-100/80'
                                : 'border-slate-200/90 bg-white ring-slate-100'
                            }`}
                          >
                            <span
                              className={`text-[9px] font-bold uppercase tracking-widest ${
                                openShift ? 'text-amber-700' : 'text-slate-500'
                              }`}
                            >
                              {openShift ? 'Open' : 'Out'}
                            </span>
                            <span
                              className={`font-mono text-base font-bold tabular-nums ${
                                entry.clockOut ? 'text-slate-900' : 'text-amber-800'
                              }`}
                            >
                              {entry.clockOut ? format(new Date(entry.clockOut), 'HH:mm') : '—'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-5 sm:px-8">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                              {computedHoursForEntry(entry).toFixed(2)}
                            </span>
                            <span className="text-xs font-semibold text-slate-400">hrs</span>
                          </div>
                          <div className="flex flex-wrap justify-center gap-1.5">
                            {entry.lateMark ? (
                              <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-700">
                                Late
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[10px] font-semibold text-slate-500">
                                On time
                              </span>
                            )}
                            {computedOvertimeForEntry(entry) > 0 ? (
                              <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[10px] font-bold text-indigo-700">
                                OT {computedOvertimeForEntry(entry).toFixed(1)}h
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-5 text-right align-middle sm:px-8">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-mono text-xs font-medium text-slate-700">
                          <Hash className="h-3.5 w-3.5 text-slate-400" />
                          {currentUser ? employeeDisplayId(currentUser) : '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function HRManualTimesheetView() {
  const { users, currentUser, timesheets, addManualTimesheetEntry } = useStore(
    useShallow((s) => ({
      users: s.users,
      currentUser: s.currentUser,
      timesheets: s.timesheets,
      addManualTimesheetEntry: s.addManualTimesheetEntry,
    }))
  );

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
export function PersonalStats({ userId, timesheets }: { userId?: string; timesheets: any[] }) {
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
export function TimesheetTable({ timesheets, users, title }: { timesheets: any[]; users: any[]; title: string }) {
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
              <th className="text-[10px] uppercase font-bold text-slate-400 tracking-widest py-6 px-8 text-right">ID</th>
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
                    <td className="py-6 px-8 text-right font-mono text-xs text-slate-700">
                      {employeeDisplayId(user, entry.userId)}
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
