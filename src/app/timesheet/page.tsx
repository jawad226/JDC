'use client';

import { useStore } from '@/lib/store';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';

export default function TimesheetPage() {
  const { timesheets, currentUser } = useStore();
  
  // Filter for current user and sort descending
  const userTimesheets = timesheets
    .filter(t => t.userId === currentUser?.id)
    .sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-800 tracking-tight flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-500" />
            My Timesheet
          </h1>
          <p className="text-slate-500 mt-2">View your recent clock-in history and hours worked.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100/50">
              <th className="font-medium text-slate-500 text-sm py-4 px-6">Date</th>
              <th className="font-medium text-slate-500 text-sm py-4 px-6">Clock In</th>
              <th className="font-medium text-slate-500 text-sm py-4 px-6">Clock Out</th>
              <th className="font-medium text-slate-500 text-sm py-4 px-6">Breaks Taken</th>
              <th className="font-medium text-slate-500 text-sm py-4 px-6">Total Hours</th>
              <th className="font-medium text-slate-500 text-sm py-4 px-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50">
            {userTimesheets.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400">
                  No timesheet records found
                </td>
              </tr>
            ) : (
              userTimesheets.map((entry) => (
                <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 text-sm text-slate-900 font-medium">
                    {format(new Date(entry.clockIn), 'MMM dd, yyyy')}
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-600">
                    {format(new Date(entry.clockIn), 'HH:mm:ss a')}
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-600">
                    {entry.clockOut ? format(new Date(entry.clockOut), 'HH:mm:ss a') : '-'}
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-500">
                    {entry.breaks.length} break(s)
                  </td>
                  <td className="py-4 px-6 text-sm font-semibold text-slate-700">
                    {entry.totalHours ? entry.totalHours.toFixed(2) + ' hrs' : '-'}
                  </td>
                  <td className="py-4 px-6 text-sm">
                    {!entry.clockOut ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        Completed
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
