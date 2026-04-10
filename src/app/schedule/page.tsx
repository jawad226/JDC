'use client';

import {
  Building2,
  Briefcase,
  Calendar,
  CheckCircle2,
  Check,
  ClipboardList,
  Plus,
  X,
  Send,
  Play,
  Eye,
  Trash2,
  Pencil,
  ListTodo,
  UserRound,
  CalendarDays,
  AlignLeft,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore, useShallow } from '@/lib/store';
import type { Task, TaskHistoryEntry, TaskPriority, TaskWorkflowStatus } from '@/lib/store';
import { format } from 'date-fns';

type StatusFilter = 'All' | TaskWorkflowStatus;

export default function TasksPage() {
  const searchParams = useSearchParams();
  const {
    tasks: allTasks,
    currentUser,
    users,
    availability,
    createTask,
    startTaskWork,
    submitTask,
    moveTaskToReview,
    approveTask,
    deletePendingTask,
    updatePendingTask,
  } = useStore(
    useShallow((s) => ({
      tasks: s.tasks,
      currentUser: s.currentUser,
      users: s.users,
      availability: s.availability,
      createTask: s.createTask,
      startTaskWork: s.startTaskWork,
      submitTask: s.submitTask,
      moveTaskToReview: s.moveTaskToReview,
      approveTask: s.approveTask,
      deletePendingTask: s.deletePendingTask,
      updatePendingTask: s.updatePendingTask,
    }))
  );
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editTaskId, setEditTaskId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Pending');

  useEffect(() => {
    const id = searchParams.get('taskId');
    if (!id) return;
    if (!allTasks.some(t => t.id === id)) return;
    setSelectedTaskId(id);
  }, [searchParams, allTasks]);

  const canCreateTask =
    currentUser?.role === 'Admin' || currentUser?.role === 'HR' || currentUser?.role === 'Team Leader';

  const tasks = (() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Admin' || currentUser.role === 'HR') return allTasks;
    if (currentUser.role === 'Team Leader') {
      const teamMembers = users.filter(u => u.team === currentUser.team);
      return allTasks.filter(t => teamMembers.some(m => m.id === t.assignedTo));
    }
    return allTasks.filter(t => t.assignedTo === currentUser.id);
  })();

  const filteredTasks = useMemo(() => {
    const list = statusFilter === 'All' ? tasks : tasks.filter(t => t.status === statusFilter);
    return [...list].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [tasks, statusFilter]);

  const selectedTask = useMemo(() => {
    if (!selectedTaskId) return null;
    return allTasks.find(t => t.id === selectedTaskId) || null;
  }, [allTasks, selectedTaskId]);

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

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [deadline, setDeadline] = useState('');

  const canManagePendingTask = (task: Task) => {
    if (!currentUser || task.status !== 'Pending') return false;
    if (currentUser.role !== 'Admin' && currentUser.role !== 'HR' && currentUser.role !== 'Team Leader') {
      return false;
    }
    if (currentUser.role === 'Team Leader') {
      const assignee = users.find(u => u.id === task.assignedTo);
      if (!assignee || assignee.team !== currentUser.team) return false;
    }
    return true;
  };

  const resetTaskForm = () => {
    setTitle('');
    setDescription('');
    setAssignedTo('');
    setPriority('Medium');
    setDeadline('');
  };

  const closeTaskFormModal = () => {
    setIsCreateModalOpen(false);
    setEditTaskId(null);
    resetTaskForm();
  };

  const openEditTask = (task: Task) => {
    if (!canManagePendingTask(task)) return;
    setIsCreateModalOpen(false);
    setEditTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description);
    setAssignedTo(task.assignedTo);
    setPriority(task.priority);
    setDeadline(format(new Date(task.deadline), 'yyyy-MM-dd'));
  };

  const handleTaskFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (editTaskId) {
      updatePendingTask(editTaskId, {
        title,
        description,
        assignedTo,
        priority,
        deadline,
      });
      setEditTaskId(null);
    } else {
      createTask({
        title,
        description,
        assignedTo,
        priority,
        deadline,
      });
      setIsCreateModalOpen(false);
    }
    resetTaskForm();
  };

  const filterOptions: { value: StatusFilter; label: string }[] = [
    { value: 'Pending', label: 'Pending' },
    { value: 'All', label: 'All statuses' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Submitted', label: 'Submitted' },
    { value: 'Review', label: 'Review' },
    { value: 'Approved', label: 'Approved' },
  ];

  const statusBadge = (status: string) => {
    if (status === 'Pending') return 'bg-amber-50 text-amber-700 border-amber-100';
    if (status === 'In Progress') return 'bg-blue-50 text-blue-700 border-blue-100';
    if (status === 'Submitted') return 'bg-indigo-50 text-indigo-700 border-indigo-100';
    if (status === 'Review') return 'bg-violet-50 text-violet-700 border-violet-100';
    if (status === 'Approved') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (status === 'Rejected') return 'bg-rose-50 text-rose-700 border-rose-100';
    return 'bg-slate-50 text-slate-700 border-slate-100';
  };

  const historyForSelected = useMemo(() => {
    const history = selectedTask?.history || [];
    return [...history].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  }, [selectedTask]);

  const reviewerCanActOnTask = (task: Task | null) => {
    if (!task || !currentUser) return false;
    if (task.status !== 'Submitted' && task.status !== 'Review') return false;
    if (currentUser.role !== 'HR' && currentUser.role !== 'Team Leader') return false;
    if (currentUser.role === 'Team Leader') {
      const assignedUser = users.find(u => u.id === task.assignedTo);
      return !!assignedUser && assignedUser.team === currentUser.team;
    }
    return true;
  };

  const reviewerCanMoveToReview = (task: Task | null) => {
    if (!task || !currentUser) return false;
    if (task.status !== 'Submitted') return false;
    if (currentUser.role !== 'HR' && currentUser.role !== 'Team Leader') return false;
    if (currentUser.role === 'Team Leader') {
      const assignedUser = users.find(u => u.id === task.assignedTo);
      return !!assignedUser && assignedUser.team === currentUser.team;
    }
    return true;
  };

  const showWorkflowPanel = useMemo(() => {
    if (!selectedTask || !currentUser) return false;
    if (
      currentUser.role === 'Employee' &&
      selectedTask.assignedTo === currentUser.id &&
      (selectedTask.status === 'Pending' ||
        selectedTask.status === 'In Progress' ||
        selectedTask.status === 'Review')
    ) {
      return true;
    }
    if (reviewerCanMoveToReview(selectedTask)) return true;
    if (reviewerCanActOnTask(selectedTask)) return true;
    return false;
  }, [selectedTask, currentUser, users]);

  const outsideAvailabilityHint = useMemo(() => {
    if (!selectedTask || !currentUser) return false;
    if (currentUser.role !== 'Employee') return false;
    if (selectedTask.assignedTo !== currentUser.id) return false;

    if (currentUser.status && currentUser.status !== 'Available') return true;

    const dayName = format(new Date(selectedTask.deadline), 'EEEE');
    const userAvail = availability.find(a => a.userId === currentUser.id);
    const dayAvail = userAvail?.days.find(d => d.day === dayName);
    return !dayAvail || !dayAvail.enabled;
  }, [selectedTask, currentUser, availability]);

  const taskRefLabel = (id: string) =>
    `(TASK-${id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8).toUpperCase()})`;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
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

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <label htmlFor="task-status-filter" className="text-sm font-semibold text-slate-600">
            Status
          </label>
          <select
            id="task-status-filter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            className="min-w-[11rem] rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
          >
            {filterOptions.map(o => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {canCreateTask && (
          <button
            type="button"
            onClick={() => {
              setEditTaskId(null);
              resetTaskForm();
              setIsCreateModalOpen(true);
            }}
            className="inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        )}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 text-center text-slate-500">
          No tasks match this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTasks.map(task => {
            const assignee = users.find(u => u.id === task.assignedTo);
            const dl = new Date(task.deadline);
            const deptOrTeam = assignee?.department ?? assignee?.team ?? '—';
            return (
              <div key={task.id} className="relative">
              <button
                type="button"
                onClick={() => setSelectedTaskId(task.id)}
                className="group w-full text-left"
              >
                <div className="flex h-full w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-md shadow-slate-200/60 transition hover:shadow-lg">
                  <div className="flex w-[4.5rem] shrink-0 flex-col items-center justify-center bg-slate-100/90 px-2 py-4">
                    <span className="text-2xl font-semibold leading-none text-sky-600">
                      {format(dl, 'd')}
                    </span>
                    <span className="mt-1 text-xs font-semibold uppercase tracking-wide text-sky-600">
                      {format(dl, 'MMM')}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1 space-y-2 p-4">
                    <p className="min-w-0 font-bold leading-snug text-slate-900 group-hover:text-blue-600">
                      {task.title}
                    </p>
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusBadge(
                        task.status
                      )}`}
                    >
                      {task.status}
                    </span>
                    <p className="text-xs font-medium text-slate-500">{taskRefLabel(task.id)}</p>
                    <p className="flex items-center gap-2 text-xs text-slate-600">
                      <Building2 className="h-4 w-4 shrink-0 text-orange-500" aria-hidden />
                      <span className="truncate">{deptOrTeam}</span>
                    </p>
                    <p className="flex items-center gap-2 text-xs text-slate-600">
                      <Briefcase className="h-4 w-4 shrink-0 text-orange-500" aria-hidden />
                      <span className="truncate">{assignee?.role ?? 'Assignee'}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" aria-hidden />
                      Due {format(dl, 'EEE, MMM d')}
                    </p>
                  </div>
                </div>
              </button>
              {canManagePendingTask(task) && (
                <div className="absolute right-3 top-3 z-10 flex gap-1">
                  <button
                    type="button"
                    aria-label="Edit pending task"
                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-600"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      openEditTask(task);
                    }}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete pending task"
                    className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 shadow-sm transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (typeof window !== 'undefined' && !window.confirm('Delete this pending task?')) return;
                      deletePendingTask(task.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Task Modal */}
      {(isCreateModalOpen || editTaskId) && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-[3px] sm:items-center sm:p-4"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeTaskFormModal();
          }}
        >
          <div
            className="flex max-h-[min(92dvh,640px)] w-full max-w-lg flex-col overflow-hidden rounded-t-[1.75rem] border border-slate-200/90 bg-white shadow-[0_25px_50px_-12px_rgba(15,23,42,0.35)] sm:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-form-modal-title"
          >
            <div className="relative shrink-0 border-b border-slate-800/10 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 px-5 py-5 sm:px-6 sm:py-6">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_100%_0%,rgba(59,130,246,0.15),transparent)]" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white shadow-inner ring-1 ring-white/20">
                    {editTaskId ? (
                      <Pencil className="h-5 w-5" strokeWidth={2} aria-hidden />
                    ) : (
                      <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0">
                    <h2 id="task-form-modal-title" className="text-lg font-bold tracking-tight text-white sm:text-xl">
                      {editTaskId ? 'Edit task' : 'New task'}
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-300">
                      {editTaskId ? 'Update details before work starts.' : 'Define scope, assign owner, and set a due date.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeTaskFormModal}
                  className="shrink-0 rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <form
              onSubmit={handleTaskFormSubmit}
              className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain bg-gradient-to-b from-slate-50/80 to-white"
            >
              <div className="space-y-5 px-5 py-6 sm:px-6">
                <div>
                  <label
                    htmlFor="task-title-input"
                    className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500"
                  >
                    <ListTodo className="h-3.5 w-3.5 text-blue-500" aria-hidden />
                    Task title
                  </label>
                  <input
                    id="task-title-input"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
                    placeholder="e.g. Update documentation"
                    required
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label
                    htmlFor="task-assignee-select"
                    className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500"
                  >
                    <UserRound className="h-3.5 w-3.5 text-blue-500" aria-hidden />
                    Assign to
                  </label>
                  <div className="relative">
                    <select
                      id="task-assignee-select"
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-10 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
                      required
                    >
                      <option value="">Select team member</option>
                      {assignableUsers.map((user) => {
                        const dept = user.department ?? user.team ?? '—';
                        return (
                          <option key={user.id} value={user.id} title={`${user.role} · ${dept}`}>
                            {user.name} — {user.role} · {dept}
                          </option>
                        );
                      })}
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    Only eligible people for your role are listed (team scope for leaders).
                  </p>
                </div>

                <div>
                  <span className="mb-2 block text-[11px] font-bold uppercase tracking-widest text-slate-500">Priority</span>
                  <div className="grid grid-cols-3 gap-2 rounded-xl border border-slate-200 bg-slate-100/80 p-1">
                    {(['Low', 'Medium', 'High'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPriority(p)}
                        className={`rounded-lg py-2.5 text-xs font-bold transition ${
                          priority === p
                            ? 'bg-white text-blue-700 shadow-sm ring-1 ring-slate-200/80'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="task-deadline-input"
                    className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500"
                  >
                    <CalendarDays className="h-3.5 w-3.5 text-blue-500" aria-hidden />
                    Deadline
                  </label>
                  <div className="relative">
                    <input
                      id="task-deadline-input"
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-4 pr-4 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15 [color-scheme:light]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="task-description-input"
                    className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-slate-500"
                  >
                    <AlignLeft className="h-3.5 w-3.5 text-blue-500" aria-hidden />
                    Description
                  </label>
                  <textarea
                    id="task-description-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="min-h-[7rem] w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
                    placeholder="What needs to be done? Add acceptance criteria or links."
                    required
                  />
                </div>
              </div>

              <div className="mt-auto border-t border-slate-100 bg-white/90 px-5 py-4 sm:px-6">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition hover:from-blue-700 hover:to-indigo-700 active:scale-[0.99]"
                >
                  <Check className="h-5 w-5 shrink-0" strokeWidth={2.5} aria-hidden />
                  {editTaskId ? 'Save changes' : 'Create task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details Modal */}
      {selectedTask && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 md:p-6 min-h-0 overflow-y-auto overscroll-contain bg-slate-900/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="task-detail-title"
        >
          <div className="my-auto flex min-h-0 w-full max-w-2xl max-h-[min(92dvh,56rem)] flex-col overflow-hidden rounded-t-[1.75rem] border border-slate-200/80 bg-white shadow-2xl sm:rounded-[2rem] sm:border-0">
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 bg-slate-50/50 px-4 py-4 sm:px-6 sm:py-5 md:px-8">
              <div className="min-w-0 flex-1">
                <h2 id="task-detail-title" className="text-lg font-bold text-slate-800 sm:text-xl flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 shrink-0 text-blue-500" />
                  Task Details
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Assigned to {users.find(u => u.id === selectedTask.assignedTo)?.name || 'Unassigned'}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                {canManagePendingTask(selectedTask) && (
                  <button
                    type="button"
                    onClick={() => {
                      openEditTask(selectedTask);
                      setSelectedTaskId(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-sky-700 transition hover:bg-sky-50"
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                    Edit
                  </button>
                )}
                {canManagePendingTask(selectedTask) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined' && !window.confirm('Delete this pending task?')) return;
                      deletePendingTask(selectedTask.id);
                      setSelectedTaskId(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                    Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTaskId(null);
                  }}
                  className="shrink-0 rounded-full border border-transparent p-2 transition-colors hover:border-slate-100 hover:bg-white"
                  title="Close"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
              <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xl font-bold leading-snug text-slate-900 sm:text-2xl">{selectedTask.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-slate-600 sm:text-base whitespace-pre-wrap break-words">
                      {selectedTask.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
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
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0" />
                      Due {format(new Date(selectedTask.deadline), 'MMM d')}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <span className="text-[10px] bg-slate-50 border border-slate-100 text-slate-600 font-bold uppercase tracking-widest px-3 py-1 rounded-lg">
                    Priority: {selectedTask.priority}
                  </span>
                  <span className="text-xs text-slate-500 break-all">{taskRefLabel(selectedTask.id)}</span>
                </div>
              </div>

              {showWorkflowPanel && (
              <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-4 sm:p-5 space-y-4">
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
                      (selectedTask.status === 'In Progress' || selectedTask.status === 'Review') && (
                        <button
                          onClick={() => {
                            submitTask(selectedTask.id);
                            alert(
                              selectedTask.status === 'Review'
                                ? 'Resubmitted. Waiting for approval.'
                                : 'Task submitted. Waiting for approval.'
                            );
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Submit
                        </button>
                      )}

                    {reviewerCanMoveToReview(selectedTask) && (
                      <button
                        onClick={() => {
                          moveTaskToReview(selectedTask.id);
                          alert('Task moved to Review.');
                        }}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        Send to Review
                      </button>
                    )}

                    {reviewerCanActOnTask(selectedTask) && (
                      <button
                        type="button"
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
                    )}
                  </div>
                </div>
              </div>
              )}
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
        </div>
      )}
    </div>
  );
}
