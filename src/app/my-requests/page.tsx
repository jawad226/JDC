'use client';

import { useState } from 'react';
import { CalendarRange, Send, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { useStore, LeaveType } from '@/lib/store';
import { format } from 'date-fns';

export default function LeavePage() {
  const { currentUser, leaves, applyLeave } = useStore();
  
  const [leaveType, setLeaveType] = useState<LeaveType>('Sick');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const myLeaves = leaves
    .filter(l => l.userId === currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!startDate || !endDate) {
      alert('Please fill in both start and end dates.');
      return;
    }
    
    // Quick validation
    if (new Date(startDate) > new Date(endDate)) {
      alert('End date cannot be before start date.');
      return;
    }

    applyLeave({
      userId: currentUser.id,
      type: leaveType,
      startDate,
      endDate,
      reason
    });

    alert('Leave request submitted successfully.');
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  return (
    <div className="max-w-4xl flex flex-col md:flex-row gap-8">
      {/* Leave Application Form */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
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
      </div>

      {/* Leave Summary Panel */}
      <div className="w-full md:w-80 space-y-6 flex-shrink-0">
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
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col max-h-[400px]">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Recent Requests</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {myLeaves.length === 0 ? (
              <div className="text-sm text-slate-500 flex items-center justify-center h-24 border-2 border-dashed border-slate-100 rounded-xl">
                No recent requests
              </div>
            ) : (
              myLeaves.map(leave => (
                <div key={leave.id} className="border border-slate-100 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-700">{leave.type}</span>
                    {leave.status === 'Pending' && <span className="flex items-center text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3 mr-1" /> Pending</span>}
                    {leave.status === 'Approved' && <span className="flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</span>}
                    {leave.status === 'Rejected' && <span className="flex items-center text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>}
                  </div>
                  <div className="text-xs text-slate-500">
                    {format(new Date(leave.startDate), 'MMM d, yyyy')} - {format(new Date(leave.endDate), 'MMM d, yyyy')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
