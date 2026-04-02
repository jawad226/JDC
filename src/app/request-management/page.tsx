'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { useStore, LeaveStatus } from '@/lib/store';
import { UsersRound, Check, X, Clock, CheckCircle2, XCircle, Search, CalendarDays, ArrowRight } from 'lucide-react';

type RequestTab = 'leave' | 'manual';

export default function RequestManagementPage() {
  const {
    currentUser,
    leaves,
    users,
    updateLeaveStatus,
    manualTimeRequests,
    approveManualTimeRequest,
    rejectManualTimeRequest,
  } = useStore();

  const [activeTab, setActiveTab] = useState<RequestTab>('leave');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeaveStatus | 'All'>('All');

  const [activeRejectId, setActiveRejectId] = useState<string | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState('');

  const getUsername = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Unknown User';
  };

  const filteredLeaves = leaves.filter(leave => {
    const userName = getUsername(leave.userId).toLowerCase();
    const matchesSearch = userName.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || leave.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredManual = manualTimeRequests.filter(req => {
    const userName = getUsername(req.userId).toLowerCase();
    const matchesSearch = userName.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedLeaves = [...filteredLeaves].sort((a, b) => {
    if (a.status === 'Pending' && b.status !== 'Pending') return -1;
    if (a.status !== 'Pending' && b.status === 'Pending') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const sortedManual = [...filteredManual].sort((a, b) => {
    if (a.status === 'Pending' && b.status !== 'Pending') return -1;
    if (a.status !== 'Pending' && b.status === 'Pending') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const canReviewLeave = currentUser?.role === 'Admin';
  const canReviewManual = currentUser?.role === 'Admin';

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div>
          <h1 className="text-3xl font-light text-slate-800 tracking-tight flex items-center gap-3">
            <UsersRound className="w-8 h-8 text-blue-500" />
            Request Management
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Coordinate team leaves and manual time applications.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-100 rounded-2xl p-2 flex items-center shadow-sm">
            <Search className="w-4 h-4 text-slate-400 ml-2" />
            <input
              type="text"
              placeholder="Search employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none px-3 py-1 text-sm text-slate-700 placeholder:text-slate-300 w-48"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-blue-500" />
            Employee Requests
          </h2>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl">
              {(['leave', 'manual'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setActiveRejectId(null);
                    setRejectFeedback('');
                  }}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab === 'leave' ? 'Leave Requests' : 'Manual Time Requests'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl">
              {(['All', 'Pending', 'Approved', 'Rejected'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    statusFilter === filter ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100/50">
              <th className="text-[10px] uppercase font-bold text-slate-400 tracking-widest py-5 px-8">Employee</th>
              <th className="text-[10px] uppercase font-bold text-slate-400 tracking-widest py-5 px-8">
                {activeTab === 'leave' ? 'Type & Reason' : 'Date & Time'}
              </th>
              <th className="text-[10px] uppercase font-bold text-slate-400 tracking-widest py-5 px-8 text-center">Status</th>
              <th className="text-[10px] uppercase font-bold text-slate-400 tracking-widest py-5 px-8 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100/50">
            {activeTab === 'leave' ? (
              sortedLeaves.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-20">
                    <div className="flex flex-col items-center gap-3">
                      <UsersRound className="w-12 h-12 text-slate-100" />
                      <p className="text-slate-400 font-medium">No leave requests found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedLeaves.map(leave => (
                  <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="py-6 px-8">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100">
                          {getUsername(leave.userId).charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-slate-900 font-bold tracking-tight">{getUsername(leave.userId)}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Employee</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-6 px-8">
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${
                          leave.type === 'Sick' ? 'text-rose-500' :
                          leave.type === 'Casual' ? 'text-amber-500' : 'text-blue-500'
                        }`}>
                          {leave.type}
                        </span>
                        <span className="text-sm text-slate-500 line-clamp-1 max-w-[220px]" title={leave.reason}>
                          {leave.reason || 'No reason provided'}
                        </span>
                        <div className="mt-2 flex items-center justify-center gap-3">
                          <div className="text-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                            <span className="block text-[10px] font-bold text-slate-800 tracking-tight">
                              {format(new Date(leave.startDate), 'MMM d')}
                            </span>
                          </div>
                          <ArrowRight className="w-3 h-3 text-slate-200" />
                          <div className="text-center bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                            <span className="block text-[10px] font-bold text-slate-800 tracking-tight">
                              {format(new Date(leave.endDate), 'MMM d')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-6 px-8 text-center">
                      {leave.status === 'Pending' && (
                        <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full">
                          <Clock className="w-3 h-3 mr-1" /> Pending
                        </span>
                      )}
                      {leave.status === 'Approved' && (
                        <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
                        </span>
                      )}
                      {leave.status === 'Rejected' && (
                        <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full">
                          <XCircle className="w-3 h-3 mr-1" /> Rejected
                        </span>
                      )}
                    </td>

                    <td className="py-6 px-8 text-right">
                      {leave.status === 'Pending' && canReviewLeave ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              updateLeaveStatus(leave.id, 'Approved');
                              alert('Leave approved!');
                            }}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-2.5 rounded-xl transition-all border border-emerald-100 shadow-sm active:scale-90"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              updateLeaveStatus(leave.id, 'Rejected');
                              alert('Leave rejected!');
                            }}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-2.5 rounded-xl transition-all border border-rose-100 shadow-sm active:scale-90"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                          Handled
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )
            ) : (
              <>
                {sortedManual.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-20">
                      <div className="flex flex-col items-center gap-3">
                        <UsersRound className="w-12 h-12 text-slate-100" />
                        <p className="text-slate-400 font-medium">No manual time requests found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedManual.map(req => (
                    <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="py-6 px-8">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm border border-blue-100">
                            {getUsername(req.userId).charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-slate-900 font-bold tracking-tight">{getUsername(req.userId)}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Employee</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-6 px-8">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold uppercase tracking-widest mb-1 text-slate-500">
                            Manual Time
                          </span>
                          <span className="text-sm text-slate-500 line-clamp-1 max-w-[220px]">
                            {format(new Date(req.date), 'MMM d, yyyy')} • {req.clockInTime} - {req.clockOutTime}
                            {req.breakInTime && req.breakOutTime ? ` • Break: ${req.breakInTime}-${req.breakOutTime}` : ''}
                          </span>
                          {req.reason ? <span className="text-[10px] text-slate-400 mt-2">Note: {req.reason}</span> : null}
                        </div>
                      </td>

                      <td className="py-6 px-8 text-center">
                        {req.status === 'Pending' && (
                          <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-50 border border-orange-100 px-3 py-1 rounded-full">
                            <Clock className="w-3 h-3 mr-1" /> Pending
                          </span>
                        )}
                        {req.status === 'Approved' && (
                          <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Approved
                          </span>
                        )}
                        {req.status === 'Rejected' && (
                          <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 border border-rose-100 px-3 py-1 rounded-full">
                            <XCircle className="w-3 h-3 mr-1" /> Rejected
                          </span>
                        )}
                      </td>

                      <td className="py-6 px-8 text-right">
                        {req.status === 'Pending' ? (
                          canReviewManual ? (
                            <div>
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => {
                                    approveManualTimeRequest(req.id);
                                    alert('Manual time approved!');
                                  }}
                                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 p-2.5 rounded-xl transition-all border border-emerald-100 shadow-sm active:scale-90"
                                  title="Approve"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveRejectId(req.id);
                                    setRejectFeedback('');
                                  }}
                                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-2.5 rounded-xl transition-all border border-rose-100 shadow-sm active:scale-90"
                                  title="Reject"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              {activeRejectId === req.id && (
                                <div className="mt-3 bg-slate-50 border border-slate-100 rounded-2xl p-3 text-left">
                                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">
                                    Rejection feedback (required)
                                  </div>
                                  <textarea
                                    value={rejectFeedback}
                                    onChange={(e) => setRejectFeedback(e.target.value)}
                                    rows={3}
                                    className="w-full rounded-xl border border-slate-100 bg-white p-2.5 text-slate-700 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
                                    placeholder="Provide feedback for rework..."
                                  />
                                  <div className="flex justify-end gap-2 mt-3">
                                    <button
                                      onClick={() => {
                                        const trimmed = rejectFeedback.trim();
                                        if (!trimmed) {
                                          alert('Feedback is required.');
                                          return;
                                        }
                                        rejectManualTimeRequest(req.id, trimmed);
                                        alert('Manual time rejected!');
                                        setActiveRejectId(null);
                                        setRejectFeedback('');
                                      }}
                                      className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                                    >
                                      Confirm Reject
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveRejectId(null);
                                        setRejectFeedback('');
                                      }}
                                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-100 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                              Handled
                            </span>
                          )
                        ) : (
                          <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                            Handled
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
