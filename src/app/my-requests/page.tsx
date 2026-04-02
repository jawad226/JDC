'use client';

import { useState } from 'react';
import { CalendarRange, Send, Clock, CheckCircle2, XCircle, ClipboardClock, Search, UserCheck } from 'lucide-react';
import { useStore, LeaveType, ManualTimeStatus } from '@/lib/store';
import { format } from 'date-fns';

export default function LeavePage() {
  const {
    currentUser,
    leaves,
    applyLeave,
    manualTimeRequests,
    applyManualTimeRequest,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'leave' | 'manual'>('leave');
  const [searchTerm, setSearchTerm] = useState('');

  // Leave form
  const [leaveType, setLeaveType] = useState<LeaveType>('Sick');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  // Manual time form
  const [manualDate, setManualDate] = useState('');
  const [clockInTime, setClockInTime] = useState('09:00');
  const [clockOutTime, setClockOutTime] = useState('18:00');
  const [breakInTime, setBreakInTime] = useState('');
  const [breakOutTime, setBreakOutTime] = useState('');
  const [manualReason, setManualReason] = useState('');

  const myLeaves = leaves
    .filter(l => l.userId === currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const myManualTimeRequests = manualTimeRequests
    .filter(r => r.userId === currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const filteredLeaves = !normalizedSearch
    ? myLeaves
    : myLeaves.filter(l => `${l.type} ${l.reason}`.toLowerCase().includes(normalizedSearch));

  const filteredManual = !normalizedSearch
    ? myManualTimeRequests
    : myManualTimeRequests.filter(r => `${r.date} ${r.reason || ''} ${r.feedback || ''}`.toLowerCase().includes(normalizedSearch));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!startDate || !endDate) {
      alert('Please fill in both start and end dates.');
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('End date cannot be before start date.');
      return;
    }

    applyLeave({
      userId: currentUser.id,
      type: leaveType,
      startDate,
      endDate,
      reason,
    });

    alert('Leave request submitted successfully.');
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!manualDate) {
      alert('Please select a date.');
      return;
    }

    if (breakInTime && !breakOutTime) {
      alert('If you add Break In, you must also add Break Out.');
      return;
    }
    if (!breakInTime && breakOutTime) {
      alert('If you add Break Out, you must also add Break In.');
      return;
    }

    applyManualTimeRequest({
      date: manualDate,
      clockInTime,
      clockOutTime,
      breakInTime: breakInTime || undefined,
      breakOutTime: breakOutTime || undefined,
      reason: manualReason || undefined,
    });

    alert('Manual time request submitted successfully.');
    setManualDate('');
    setBreakInTime('');
    setBreakOutTime('');
    setManualReason('');
  };

  const leaveStatusBadge = (status: 'Pending' | 'Approved' | 'Rejected') => {
    if (status === 'Pending') {
      return (
        <span className="flex items-center text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
          <Clock className="w-3 h-3 mr-1" /> Pending
        </span>
      );
    }
    if (status === 'Approved') {
      return (
        <span className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
          <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
        </span>
      );
    }
    return (
      <span className="flex items-center text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
        <XCircle className="w-3 h-3 mr-1" /> Rejected
      </span>
    );
  };

  const manualStatusBadgeClass = (status: ManualTimeStatus) => {
    if (status === 'Pending') return 'text-orange-600 bg-orange-50 border border-orange-100';
    if (status === 'Approved') return 'text-green-600 bg-green-50 border border-green-100';
    return 'text-rose-600 bg-rose-50 border border-rose-100';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <UserCheck className="w-6 h-6 text-blue-500" />
            <div>
              <h1 className="text-3xl font-light text-slate-800 tracking-tight">My Requests</h1>
              <p className="text-slate-500 mt-1 font-medium">Apply for Leave or Manual Time and track approval status.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3 flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-slate-700 w-52"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveTab('leave')}
            className={`px-5 py-2 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'leave' ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-sm' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            Leave Requests
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-5 py-2 rounded-2xl text-sm font-bold transition-all ${
              activeTab === 'manual' ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-sm' : 'bg-white text-slate-500 border border-slate-100 hover:bg-slate-50'
            }`}
          >
            Manual Time Requests
          </button>
        </div>
      </div>

      <div className="max-w-4xl flex flex-col md:flex-row gap-8">
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          {activeTab === 'leave' ? (
            <>
              <h2 className="text-2xl font-light text-slate-800 mb-6 flex items-center gap-3">
                <CalendarRange className="w-7 h-7 text-blue-500" />
                Apply for Leave
              </h2>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Leave Type</label>
                  <select
                    value={leaveType}
                    onChange={(e) => setLeaveType(e.target.value as LeaveType)}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 border p-3 text-slate-700 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  >
                    <option value="Sick">Sick</option>
                    <option value="Casual">Casual</option>
                    <option value="Paid">Paid (Annual)</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full rounded-xl border-slate-200 bg-slate-50 border p-3 text-slate-700 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full rounded-xl border-slate-200 bg-slate-50 border p-3 text-slate-700 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Reason (Optional)</label>
                  <textarea
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 border p-3 text-slate-700 focus:ring-blue-500 outline-none"
                    placeholder="Provide additional details..."
                  />
                </div>

                <button type="submit" className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-colors">
                  <Send className="w-4 h-4 mr-2" />
                  Submit Request
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-light text-slate-800 mb-6 flex items-center gap-3">
                <ClipboardClock className="w-7 h-7 text-blue-500" />
                Request Manual Time
              </h2>

              <form className="space-y-6" onSubmit={handleManualSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={manualDate}
                      onChange={(e) => setManualDate(e.target.value)}
                      className="w-full rounded-xl border-slate-200 bg-slate-50 border p-3 text-slate-700 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Clock-in</label>
                    <input
                      type="time"
                      value={clockInTime}
                      onChange={(e) => setClockInTime(e.target.value)}
                      className="w-full rounded-xl border-slate-200 bg-slate-50 border p-3 text-slate-700 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Clock-out</label>
                    <input
                      type="time"
                      value={clockOutTime}
                      onChange={(e) => setClockOutTime(e.target.value)}
                      className="w-full rounded-xl border-slate-200 bg-slate-50 border p-3 text-slate-700 focus:ring-blue-500 outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Break-in (Optional)</label>
                    <input
                      type="time"
                      value={breakInTime}
                      onChange={(e) => setBreakInTime(e.target.value)}
                      className="w-full rounded-xl border-slate-200 bg-slate-50 border p-3 text-slate-700 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Break-out (Optional)</label>
                  <input
                    type="time"
                    value={breakOutTime}
                    onChange={(e) => setBreakOutTime(e.target.value)}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 border p-3 text-slate-700 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Reason (Optional)</label>
                  <textarea
                    rows={4}
                    value={manualReason}
                    onChange={(e) => setManualReason(e.target.value)}
                    className="w-full rounded-xl border-slate-200 bg-slate-50 border p-3 text-slate-700 focus:ring-blue-500 outline-none"
                    placeholder="Add any note/justification..."
                  />
                </div>

                <button type="submit" className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-colors">
                  <Send className="w-4 h-4 mr-2" />
                  Submit Manual Time Request
                </button>
              </form>
            </>
          )}
        </div>

        <div className="w-full md:w-80 space-y-6 flex-shrink-0">
          {activeTab === 'leave' ? (
            <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
              <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wider mb-4">Leave Balances</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium text-sm">Paid (Annual)</span>
                  <span className="text-lg font-bold text-slate-800">12</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium text-sm">Sick Leave</span>
                  <span className="text-lg font-bold text-slate-800">4</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium text-sm">Casual</span>
                  <span className="text-lg font-bold text-slate-800">3</span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col max-h-[420px]">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">
              Recent Requests
            </h3>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {activeTab === 'leave' ? (
                filteredLeaves.length === 0 ? (
                  <div className="text-sm text-slate-500 flex items-center justify-center h-24 border-2 border-dashed border-slate-100 rounded-xl">
                    No recent leave requests
                  </div>
                ) : (
                  filteredLeaves.map(leave => (
                    <div key={leave.id} className="border border-slate-100 rounded-xl p-3 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-slate-700">{leave.type}</span>
                        {leaveStatusBadge(leave.status)}
                      </div>
                      <div className="text-xs text-slate-500">
                        {format(new Date(leave.startDate), 'MMM d, yyyy')} - {format(new Date(leave.endDate), 'MMM d, yyyy')}
                      </div>
                    </div>
                  ))
                )
              ) : (
                <>
                  {filteredManual.length === 0 ? (
                    <div className="text-sm text-slate-500 flex items-center justify-center h-24 border-2 border-dashed border-slate-100 rounded-xl">
                      No recent manual time requests
                    </div>
                  ) : (
                    filteredManual.map(req => (
                      <div key={req.id} className="border border-slate-100 rounded-xl p-3 flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-slate-700">
                            {format(new Date(req.date), 'MMM d, yyyy')}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${manualStatusBadgeClass(req.status)}`}>
                            {req.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {req.clockInTime} - {req.clockOutTime}
                          {req.breakInTime && req.breakOutTime ? ` • Break: ${req.breakInTime}-${req.breakOutTime}` : ''}
                        </div>
                        {req.status === 'Rejected' && req.feedback ? (
                          <div className="text-xs text-rose-700 bg-rose-50 border border-rose-100 rounded-xl p-2 whitespace-pre-wrap">
                            Feedback: {req.feedback}
                          </div>
                        ) : null}
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
