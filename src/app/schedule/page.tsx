'use client';

import { Calendar, CheckCircle2, Clock, Plus, X, Check, XCircle, Send, Play } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useStore } from '@/lib/store';
import type { Task, TaskHistoryEntry, TaskPriority, TaskWorkflowStatus } from '@/lib/store';
import { format } from 'date-fns';

export default function TasksPage() {
  const {
    tasks: allTasks,
    currentUser,
    users,
    availability,
    createTask,
    startTaskWork,
    submitTask,
    approveTask,
    rejectTask,
  } = useStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [rejectFeedback, setRejectFeedback] = useState('');

  // ─── PERMISSION LOGIC ──────────────────────────────────────────
  // Tasks can be created by Admin/HR/Team Leader.
  // Workflow actions are enforced in store methods as well.
  const canCreateTask =
    currentUser?.role === 'Admin' || currentUser?.role === 'HR' || currentUser?.role === 'Team Leader';

  // ─── TASK FILTERING ────────────────────────────────────────────
  // Admin: see all tasks
  // HR: see all tasks (they manage across the org)
  // Team Leader: see only their team's tasks
  // Employee: see only their own assigned tasks
  const tasks = (() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin' || currentUser.role === 'HR') return allTasks;
    if (currentUser.role === 'Team Leader') {
      const teamMembers = users.filter(u => u.team === currentUser.team);
      return allTasks.filter(t => teamMembers.some(m => m.id === t.assignedTo));
    }
    // Employee
    return allTasks.filter(t => t.assignedTo === currentUser.id);
  })();

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return allTasks.find(t => t.id === selectedTaskId) || null;
  }, [allTasks, selectedTaskId]);

  useEffect(() => {
    setRejectFeedback('');
  }, [selectedTaskId]);

  // ─── ASSIGNABLE USERS ─────────────────────────────────────────
  // Admin/HR can assign to anyone, Team Leader only to their team
  const assignableUsers = (() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin' || currentUser.role === 'HR') {
      return users.filter(u => u.role !== 'Pending User');
    }
    if (currentUser.role === 'Team Leader') {
      return users.filter(u => u.team === currentUser.team && u.role !== 'Pending User');
    }
    return [];
  })();

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [deadline, setDeadline] = useState('');

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    createTask({
      title,
      description,
      assignedTo,
      priority,
      deadline,
    });
    setIsCreateModalOpen(false);
    setTitle('');
    setDescription('');
    setAssignedTo('');
    setPriority('Medium');
    setDeadline('');
  };

  const workflowStatuses: TaskWorkflowStatus[] = ['Pending', 'In Progress', 'Submitted', 'Approved'];

  const statusBadge = (status: string) => {
    if (status === 'Pending') return 'bg-amber-50 text-amber-700 border-amber-100';
    if (status === 'In Progress') return 'bg-blue-50 text-blue-700 border-blue-100';
    if (status === 'Submitted') return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    if (status === 'Approved') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    // History-only label
    if (status === 'Rejected') return 'bg-rose-50 text-rose-700 border-rose-100';
    return 'bg-slate-50 text-slate-700 border-slate-100';
  };

  const historyForSelected = useMemo(() => {
    const history = selectedTask?.history || [];
    return [...history].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [selectedTask]);

  const latestRejection = useMemo(() => {
    const history = historyForSelected;
    return [...history].reverse().find(h => h.action === 'Reject' && h.feedback);
  }, [historyForSelected]);

  const reviewerCanActOnTask = (task: Task | null) => {
    if (!task || !currentUser) return false;
    if (task.status !== 'Submitted') return false;
    if (currentUser.role !== 'HR' && currentUser.role !== 'Team Leader') return false;
    if (currentUser.role === 'Team Leader') {
      const assignedUser = users.find(u => u.id === task.assignedTo);
      return !!assignedUser && assignedUser.team === currentUser.team;
    }
    return true;
  };

  const outsideAvailabilityHint = useMemo(() => {
    if (!selectedTask || !currentUser) return false;
    if (currentUser.role !== 'Employee') return false;
    if (selectedTask.assignedTo !== currentUser.id) return false;

    // Status override is highest priority.
    if (currentUser.status && currentUser.status !== 'Available') return true;

    const dayName = format(new Date(selectedTask.deadline), 'EEEE');
    const userAvail = availability.find(a => a.userId === currentUser.id);
    const dayAvail = userAvail?.days.find(d => d.day === dayName);
    return !dayAvail || !dayAvail.enabled;
  }, [selectedTask, currentUser, availability]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-light text-slate-800 tracking-tight flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-blue-500" />
            Task Management
          </h1>
          <p className="text-slate-500 mt-2">
            {currentUser?.role === 'Employee'
              ? 'Work through tasks and submit for HR/Team Leader approval.'
              : currentUser?.role === 'Team Leader'
                ? `Review and approve submissions for the ${currentUser?.team} team.`
                : currentUser?.role === 'HR'
                  ? 'Review and approve submissions across the organization.'
                  : 'Monitor task progress and create new tasks.'}
          </p>
        </div>
        {canCreateTask && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="group flex items-center bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
            Create New Task
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {workflowStatuses.map(status => (
          <div key={status} className="bg-slate-100/50 rounded-2xl p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-700">{status}</h2>
              <span className="text-xs font-bold text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-100">
                {tasks.filter(t => t.status === status).length}
              </span>
            </div>
            <div className="space-y-4">
              {tasks.filter(t => t.status === status).map(task => (
                <div
                  key={task.id}
                  className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => setSelectedTaskId(task.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{task.title}</h3>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-lg border ${statusBadge(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mb-4 line-clamp-2">{task.description}</p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                      task.priority === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                      task.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      {task.priority}
                    </span>
                    <span className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5 mr-1" />
                      {format(new Date(task.deadline), 'MMM d')}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 ring-1 ring-slate-200">
                      {users.find(u => u.id === task.assignedTo)?.name.charAt(0) || '?'}
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {users.find(u => u.id === task.assignedTo)?.name || 'Unassigned'}
                    </span>
                    <span className="ml-auto text-[10px] text-blue-500 font-bold uppercase tracking-widest">
                      View
                    </span>
                  </div>
                </div>
              ))}
              {tasks.filter(t => t.status === status).length === 0 && (
                <div className="text-center py-6 text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl">
                  No tasks
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Task Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-500" />
                New Task
              </h2>
              <button onClick={() => setIsCreateModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-100">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-8 space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Task Title</label>
                <input
                  type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-2xl border-slate-100 bg-slate-50 border p-3.5 text-slate-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                  placeholder="e.g. Update Documentation" required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Assign To</label>
                <select
                  value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
                  className="w-full rounded-2xl border-slate-100 bg-slate-50 border p-3.5 text-slate-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                  required
                >
                  <option value="">Select Employee</option>
                  {assignableUsers.map(user => (
                    <option key={user.id} value={user.id}>{user.name} ({user.role}{user.team ? ` • ${user.team}` : ''})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="w-full rounded-2xl border-slate-100 bg-slate-50 border p-3.5 text-slate-700 focus:ring-2 focus:ring-blue-100 outline-none">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Deadline</label>
                  <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full rounded-2xl border-slate-100 bg-slate-50 border p-3.5 text-slate-700 focus:ring-2 focus:ring-blue-100 outline-none" required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-2xl border-slate-100 bg-slate-50 border p-3.5 text-slate-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all" placeholder="What needs to be done?" required />
              </div>

              <button type="submit" className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-[0.98] mt-4 flex items-center justify-center gap-2">
                <Check className="w-5 h-5" />
                Create Task
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <ClipboardIcon />
                  Task Details
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Assigned to {users.find(u => u.id === selectedTask.assignedTo)?.name || 'Unassigned'}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedTaskId(null);
                }}
                className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-100"
                title="Close"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">{selectedTask.title}</h3>
                    <p className="text-slate-600 mt-2 whitespace-pre-wrap">{selectedTask.description}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`text-[11px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${statusBadge(
                        selectedTask.status
                      )}`}
                    >
                      {selectedTask.status}
                    </span>
                    {outsideAvailabilityHint && (
                      <span className="text-[10px] font-bold px-3 py-1 rounded-full border bg-rose-50 text-rose-700 border-rose-100 uppercase tracking-widest">
                        Outside availability
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Due {format(new Date(selectedTask.deadline), 'MMM d')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] bg-slate-50 border border-slate-100 text-slate-600 font-bold uppercase tracking-widest px-3 py-1 rounded-lg">
                    Priority: {selectedTask.priority}
                  </span>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-5 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <h4 className="text-sm font-bold text-slate-800">Workflow Actions</h4>
                  <div className="flex flex-wrap gap-2">
                    {currentUser?.role === 'Employee' &&
                      selectedTask.assignedTo === currentUser.id &&
                      selectedTask.status === 'Pending' && (
                        <button
                          onClick={() => {
                            startTaskWork(selectedTask.id);
                            alert('Task started. Status updated to In Progress.');
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Start Work
                        </button>
                      )}

                    {currentUser?.role === 'Employee' &&
                      selectedTask.assignedTo === currentUser.id &&
                      selectedTask.status === 'In Progress' && (
                        <button
                          onClick={() => {
                            submitTask(selectedTask.id);
                            alert('Task submitted. Waiting for approval.');
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Submit
                        </button>
                      )}

                    {reviewerCanActOnTask(selectedTask) && (
                      <>
                        <button
                          onClick={() => {
                            approveTask(selectedTask.id);
                            alert('Approved. Task marked as Approved.');
                            setSelectedTaskId(null);
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center gap-2"
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </button>

                        <button
                          onClick={() => {
                            const trimmed = rejectFeedback.trim();
                            if (!trimmed) {
                              alert('Feedback is required to reject.');
                              const el = document.getElementById('rejectFeedback');
                              if (el) el.focus();
                              return;
                            }
                            rejectTask(selectedTask.id, trimmed);
                            alert('Rejected. Task returned to In Progress.');
                            setSelectedTaskId(null);
                          }}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-700 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 border border-rose-100 flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {reviewerCanActOnTask(selectedTask) && (
                  <div className="space-y-3">
                    <label htmlFor="rejectFeedback" className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                      Rejection Feedback (required)
                    </label>
                    <textarea
                      id="rejectFeedback"
                      value={rejectFeedback}
                      onChange={(e) => setRejectFeedback(e.target.value)}
                      rows={4}
                      className="w-full rounded-2xl border border-slate-100 bg-white p-3.5 text-slate-700 focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
                      placeholder="Provide specific feedback for rework..."
                    />
                  </div>
                )}

                {latestRejection && (
                  <div className="bg-white border border-slate-100 rounded-[1.25rem] p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-bold text-slate-800">Latest Rejection Feedback</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                          {format(new Date(latestRejection.at), 'MMM d, HH:mm')}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${statusBadge('Rejected')}`}>
                        Rejected
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mt-3 whitespace-pre-wrap">{latestRejection.feedback}</p>
                  </div>
                )}
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800">Task History</h4>
                {historyForSelected.length === 0 ? (
                  <p className="text-sm text-slate-500">No history available.</p>
                ) : (
                  <div className="space-y-3">
                    {historyForSelected.map((entry: TaskHistoryEntry) => {
                      const label = entry.action === 'Reject' ? 'Rejected' : entry.toStatus;
                      const badgeTone = statusBadge(label);
                      const actorName = users.find(u => u.id === entry.actorId)?.name || 'Unknown';
                      return (
                        <div key={entry.id} className="flex items-start justify-between gap-4 p-4 rounded-[1.25rem] border border-slate-100 bg-white">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${badgeTone}`}>
                                {label}
                              </span>
                              <span className="text-xs font-bold text-slate-700">{entry.action}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                              {actorName} • {format(new Date(entry.at), 'MMM d, HH:mm')}
                            </p>
                            {entry.feedback && (
                              <p className="text-sm text-slate-700 whitespace-pre-wrap mt-2">
                                Feedback: {entry.feedback}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            {entry.fromStatus && (
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                {entry.fromStatus} → {entry.toStatus}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClipboardIcon() {
  return (
    <svg
      className="w-5 h-5 text-blue-500"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M8 3H9.5C9.78 3 10 3.22 10 3.5V4H14V3.5C14 3.22 14.22 3 14.5 3H16C16.55 3 17 3.45 17 4V5H18C19.1 5 20 5.9 20 7V19C20 20.1 19.1 21 18 21H6C4.9 21 4 20.1 4 19V7C4 5.9 4.9 5 6 5H7V4C7 3.45 7.45 3 8 3Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M8 9H16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8 13H14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
