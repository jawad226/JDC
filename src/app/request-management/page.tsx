'use client';

import { useStore } from '@/lib/store';
import { UsersRound, Check, X, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function RequestManagementPage() {
  const { leaves, users, updateLeaveStatus } = useStore();

  const getUsername = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Unknown User';
  };

  // Sort: Pending first, then by date descendant
  const sortedLeaves = [...leaves].sort((a, b) => {
    if (a.status === 'Pending' && b.status !== 'Pending') return -1;
    if (a.status !== 'Pending' && b.status === 'Pending') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-light text-slate-800 tracking-tight flex items-center gap-3">
          <UsersRound className="w-8 h-8 text-blue-500" />
          Request Management
        </h1>
        <p className="text-slate-500 mt-2">Approve or reject employee leave requests and monitor team activity.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center">
             Leave Requests
          </h2>
        </div>
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100/50">
              <th className="font-medium text-slate-500 text-sm py-4 px-6">Employee</th>
              <th className="font-medium text-slate-500 text-sm py-4 px-6">Type</th>
              <th className="font-medium text-slate-500 text-sm py-4 px-6">Dates</th>
              <th className="font-medium text-slate-500 text-sm py-4 px-6">Reason</th>
              <th className="font-medium text-slate-500 text-sm py-4 px-6">Status</th>
              <th className="font-medium text-slate-500 text-sm py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100/50">
            {sortedLeaves.length === 0 ? (
               <tr>
                 <td colSpan={6} className="text-center py-12 text-slate-400">No requests found.</td>
               </tr>
            ) : (
               sortedLeaves.map(leave => (
                <tr key={leave.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-slate-900">{getUsername(leave.userId)}</td>
                  <td className="py-4 px-6 text-sm text-slate-600">{leave.type}</td>
                  <td className="py-4 px-6 text-sm text-slate-600 whitespace-nowrap">
                    {format(new Date(leave.startDate), 'MMM d, yyyy')} - {format(new Date(leave.endDate), 'MMM d, yyyy')}
                  </td>
                  <td className="py-4 px-6 text-sm text-slate-500 max-w-xs truncate" title={leave.reason}>
                    {leave.reason || '-'}
                  </td>
                  <td className="py-4 px-6 text-sm">
                    {leave.status === 'Pending' && <span className="inline-flex items-center text-xs font-semibold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full"><Clock className="w-3 h-3 mr-1" /> Pending</span>}
                    {leave.status === 'Approved' && <span className="inline-flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2.5 py-1 rounded-full"><CheckCircle2 className="w-3 h-3 mr-1" /> Approved</span>}
                    {leave.status === 'Rejected' && <span className="inline-flex items-center text-xs font-semibold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-full"><XCircle className="w-3 h-3 mr-1" /> Rejected</span>}
                  </td>
                  <td className="py-4 px-6 text-sm text-right">
                    {leave.status === 'Pending' ? (
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            updateLeaveStatus(leave.id, 'Approved');
                            alert('Leave approved!');
                          }}
                          className="bg-green-50 hover:bg-green-100 text-green-700 p-2 rounded-lg transition-colors border border-green-200" title="Approve">
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            updateLeaveStatus(leave.id, 'Rejected');
                            alert('Leave rejected!');
                          }}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 p-2 rounded-lg transition-colors border border-rose-200" title="Reject">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs font-medium px-2 py-1 bg-slate-100 rounded-md">Processed</span>
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
