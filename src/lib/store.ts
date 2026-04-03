import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'Admin' | 'HR' | 'Team Leader' | 'Employee' | 'Pending User';

/** Department options for registration (client-side demo). */
export type Department = 'Web Design' | 'MERN Stack' | 'Web Development' | 'SEO';

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  avatar?: string;
  team?: string;
  status?: 'Available' | 'Unavailable' | 'Sick';
  phone?: string;
  department?: Department;
  /** Demo-only stored credential; do not render in admin lists. */
  password?: string;
}

export interface PasswordResetToken {
  id: string;
  email: string;
  token: string;
  expiresAt: string;
}

export interface TimesheetEntry {
  id: string;
  userId: string;
  clockIn: string;
  clockOut?: string;
  breaks: BreakEntry[];
  totalHours?: number;
  lateMark?: boolean;
  overtime?: number;
}

export interface BreakEntry {
  id: string;
  startTime: string;
  endTime?: string;
}

export type TaskPriority = 'Low' | 'Medium' | 'High';

export type TaskWorkflowStatus = 'Pending' | 'In Progress' | 'Submitted' | 'Approved';
export type TaskHistoryAction = 'Created' | 'Start Work' | 'Submit' | 'Approve' | 'Reject';

export interface TaskHistoryEntry {
  id: string;
  at: string;
  actorId: string;
  actorRole: Role;
  fromStatus: TaskWorkflowStatus | null;
  toStatus: TaskWorkflowStatus;
  action: TaskHistoryAction;
  feedback?: string;
}

export interface TaskComment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  status: TaskWorkflowStatus;
  priority: TaskPriority;
  deadline: string;
  comments: TaskComment[];
  history?: TaskHistoryEntry[];
}

export type LeaveType = 'Sick' | 'Casual' | 'Paid';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id: string;
  userId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  createdAt: string;
}

export type ManualTimeStatus = 'Pending' | 'Approved' | 'Rejected';

export interface ManualTimeRequest {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  clockInTime: string; // HH:mm
  clockOutTime: string; // HH:mm
  breakInTime?: string; // HH:mm
  breakOutTime?: string; // HH:mm
  reason?: string;
  status: ManualTimeStatus;
  createdAt: string;
  reviewedAt?: string;
  reviewedById?: string;
  feedback?: string;
}

export interface DayAvailability {
  day: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

export interface UserAvailability {
  userId: string;
  days: DayAvailability[];
}

interface AppState {
  currentUser: User | null;
  users: User[];
  timesheets: TimesheetEntry[];
  tasks: Task[];
  leaves: LeaveRequest[];
  manualTimeRequests: ManualTimeRequest[];
  setCurrentUser: (user: User | null) => void;
  clockIn: () => void;
  clockOut: () => void;
  startBreak: () => void;
  endBreak: () => void;
  // HR manual attendance record creation (creates a finalized entry with clockOut + breaks).
  addManualTimesheetEntry: (input: {
    userId: string;
    date: string; // YYYY-MM-DD
    clockInTime: string; // HH:mm
    clockOutTime: string; // HH:mm
    breakInTime?: string; // HH:mm
    breakOutTime?: string; // HH:mm
  }) => void;
  // Admin actions
  addUser: (user: User) => void;
  // Tasks
  createTask: (input: {
    title: string;
    description: string;
    assignedTo: string;
    priority: TaskPriority;
    deadline: string;
  }) => void;
  startTaskWork: (taskId: string) => void;
  submitTask: (taskId: string) => void;
  approveTask: (taskId: string) => void;
  rejectTask: (taskId: string, feedback: string) => void;
  addTaskComment: (taskId: string, comment: string) => void;
  // Leaves
  applyLeave: (leave: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>) => void;
  updateLeaveStatus: (leaveId: string, status: LeaveStatus) => void;

  // Manual Time Requests
  applyManualTimeRequest: (input: Omit<
    ManualTimeRequest,
    'id' | 'userId' | 'status' | 'createdAt' | 'reviewedAt' | 'reviewedById' | 'feedback'
  >) => void;
  approveManualTimeRequest: (requestId: string) => void;
  rejectManualTimeRequest: (requestId: string, feedback: string) => void;
  // Availability
  availability: UserAvailability[];
  updateAvailability: (userId: string, activeDays: DayAvailability[]) => void;
  // User Management
  removeUser: (userId: string) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  // Team Management
  teams: string[];
  addTeam: (name: string) => void;
  removeTeam: (name: string) => void;
  // Approval
  approveUser: (userId: string, role: Role, team: string) => void;
  // Registration & auth (demo: passwords stored in persisted state)
  registerUser: (input: {
    name: string;
    email: string;
    password: string;
    phone: string;
    department: Department;
  }) => { ok: true; user: User } | { ok: false; error: string };
  loginWithCredentials: (email: string, password: string) =>
    | { ok: true; user: User }
    | { ok: false; error: string };
  requestPasswordReset: (email: string) =>
    | { ok: true; token: string; expiresAt: string }
    | { ok: false; error: string };
  resetPasswordWithToken: (token: string, newPassword: string) =>
    | { ok: true }
    | { ok: false; error: string };
  passwordResetTokens: PasswordResetToken[];
}

const mockUsers: User[] = [
  { id: '1', name: 'Rameez Hasan', role: 'Employee', email: 'rameez@example.com', team: 'Development', status: 'Available', password: 'password123' },
  { id: '2', name: 'Admin User', role: 'Admin', email: 'admin@example.com', team: 'Management', status: 'Available', password: 'admin123' },
  { id: '3', name: 'HR Manager', role: 'HR', email: 'hr@example.com', team: 'HR', status: 'Available', password: 'hr123' },
  { id: '4', name: 'Sarah Khan', role: 'Team Leader', email: 'sarah@example.com', team: 'Development', status: 'Available', password: 'lead123' },
  { id: '5', name: 'Ali Ahmed', role: 'Employee', email: 'ali@example.com', team: 'Design', status: 'Available', password: 'ali123' },
  { id: '6', name: 'New Applicant', role: 'Pending User', email: 'pending@example.com', team: undefined, status: undefined, password: 'pending123' },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: mockUsers[0],
      users: mockUsers,
      timesheets: [],
      teams: ['Development', 'Design', 'HR', 'Support', 'Management'],
      tasks: [
        {
          id: 't1',
          title: 'Design Login Page',
          description: 'Create the UI for the main login page',
          assignedTo: '1',
          assignedBy: '3',
          status: 'Pending',
          priority: 'High',
          deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
          comments: [],
          history: [
            {
              id: Math.random().toString(36).substring(7),
              at: new Date().toISOString(),
              actorId: '3',
              actorRole: 'HR',
              fromStatus: null,
              toStatus: 'Pending',
              action: 'Created',
            },
          ],
        },
        {
          id: 't2',
          title: 'Review System Specs',
          description: 'Technical review of the new digital care architecture',
          assignedTo: '1',
          assignedBy: '3',
          status: 'Submitted',
          priority: 'Medium',
          deadline: new Date(Date.now() + 86400000 * 4).toISOString(),
          comments: [],
          history: [
            {
              id: Math.random().toString(36).substring(7),
              at: new Date().toISOString(),
              actorId: '3',
              actorRole: 'HR',
              fromStatus: null,
              toStatus: 'Pending',
              action: 'Created',
            },
            {
              id: Math.random().toString(36).substring(7),
              at: new Date(Date.now() + 1000 * 60 * 5).toISOString(),
              actorId: '1',
              actorRole: 'Employee',
              fromStatus: 'Pending',
              toStatus: 'In Progress',
              action: 'Start Work',
            },
            {
              id: Math.random().toString(36).substring(7),
              at: new Date(Date.now() + 1000 * 60 * 20).toISOString(),
              actorId: '1',
              actorRole: 'Employee',
              fromStatus: 'In Progress',
              toStatus: 'Submitted',
              action: 'Submit',
            },
          ],
        },
        {
          id: 't3',
          title: 'Update Documentation',
          description: 'Document the new RBAC implementation',
          assignedTo: '1',
          assignedBy: '2',
          status: 'Approved',
          priority: 'Low',
          deadline: new Date(Date.now() - 86400000).toISOString(),
          comments: [],
          history: [
            {
              id: Math.random().toString(36).substring(7),
              at: new Date().toISOString(),
              actorId: '2',
              actorRole: 'Admin',
              fromStatus: null,
              toStatus: 'Pending',
              action: 'Created',
            },
            {
              id: Math.random().toString(36).substring(7),
              at: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
              actorId: '1',
              actorRole: 'Employee',
              fromStatus: 'Pending',
              toStatus: 'In Progress',
              action: 'Start Work',
            },
            {
              id: Math.random().toString(36).substring(7),
              at: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
              actorId: '1',
              actorRole: 'Employee',
              fromStatus: 'In Progress',
              toStatus: 'Submitted',
              action: 'Submit',
            },
            {
              id: Math.random().toString(36).substring(7),
              at: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
              actorId: '3',
              actorRole: 'HR',
              fromStatus: 'Submitted',
              toStatus: 'Approved',
              action: 'Approve',
            },
          ],
        }
      ],
      leaves: [],
      manualTimeRequests: [],
      passwordResetTokens: [] as PasswordResetToken[],
      availability: [],
      setCurrentUser: (user) => set({ currentUser: user }),
      
      clockIn: () => {
        const { currentUser, timesheets } = get();
        if (!currentUser) return;
        
        const now = new Date();
        const clockInTime = now.toISOString();
        
        // Late Mark rule: after 9:00 AM
        // We will consider it late if hours > 9 or (hours == 9 and minutes > 0)
        const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 0);
        
        const newEntry: TimesheetEntry = {
          id: Math.random().toString(36).substring(7),
          userId: currentUser.id,
          clockIn: clockInTime,
          breaks: [],
          lateMark: isLate,
        };
        
        set({ timesheets: [...timesheets, newEntry] });
      },
      
      clockOut: () => {
        const { currentUser, timesheets } = get();
        if (!currentUser) return;
        
        const updatedTimesheets = timesheets.map(t => {
          if (t.userId === currentUser.id && !t.clockOut) {
            const clockOutTime = new Date();
            const clockInTime = new Date(t.clockIn);
            let totalHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
            
            // Deduct breaks
            t.breaks.forEach(b => {
              if (b.endTime) {
                totalHours -= (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / (1000 * 60 * 60);
              }
            });

            // Overtime rule: if totalHours > 8, calculate overtime
            let overtime = 0;
            if (totalHours > 8) {
              overtime = totalHours - 8;
            }

            return { ...t, clockOut: clockOutTime.toISOString(), totalHours, overtime };
          }
          return t;
        });
        
        set({ timesheets: updatedTimesheets });
      },
      
      startBreak: () => {
        const { currentUser, timesheets } = get();
        if (!currentUser) return;
        
        const updatedTimesheets = timesheets.map(t => {
          if (t.userId === currentUser.id && !t.clockOut) {
            const newBreak: BreakEntry = {
              id: Math.random().toString(36).substring(7),
              startTime: new Date().toISOString()
            };
            return { ...t, breaks: [...t.breaks, newBreak] };
          }
          return t;
        });
        
        set({ timesheets: updatedTimesheets });
      },
      
      endBreak: () => {
        const { currentUser, timesheets } = get();
        if (!currentUser) return;
        
        const updatedTimesheets = timesheets.map(t => {
          if (t.userId === currentUser.id && !t.clockOut && t.breaks.length > 0) {
            const activeBreak = t.breaks[t.breaks.length - 1];
            if (!activeBreak.endTime) {
              const updatedBreaks = [...t.breaks];
              updatedBreaks[updatedBreaks.length - 1] = {
                ...activeBreak,
                endTime: new Date().toISOString()
              };
              return { ...t, breaks: updatedBreaks };
            }
          }
          return t;
        });
        
        set({ timesheets: updatedTimesheets });
      },

      addManualTimesheetEntry: (input) => {
        const { currentUser, timesheets, users } = get();
        if (!currentUser || currentUser.role !== 'HR') return;

        const { userId, date, clockInTime, clockOutTime, breakInTime, breakOutTime } = input;
        const targetUser = users.find(u => u.id === userId);
        if (!targetUser || targetUser.role === 'Pending User') return;

        // Basic validation
        if (!date || !clockInTime || !clockOutTime) return;

        const buildIso = (d: string, t: string) => new Date(`${d}T${t}:00`).toISOString();
        const inIso = buildIso(date, clockInTime);
        const outIso = buildIso(date, clockOutTime);

        const inMs = new Date(inIso).getTime();
        const outMs = new Date(outIso).getTime();
        if (!Number.isFinite(inMs) || !Number.isFinite(outMs) || outMs <= inMs) return;

        // Late mark rule: after 9:00 AM
        const inDate = new Date(inIso);
        const lateMark = inDate.getHours() > 9 || (inDate.getHours() === 9 && inDate.getMinutes() > 0);

        // Optional single break interval
        const breaks: BreakEntry[] = [];
        let breakDurationHours = 0;
        if (breakInTime && breakOutTime) {
          const bInIso = buildIso(date, breakInTime);
          const bOutIso = buildIso(date, breakOutTime);
          const bInMs = new Date(bInIso).getTime();
          const bOutMs = new Date(bOutIso).getTime();
          if (Number.isFinite(bInMs) && Number.isFinite(bOutMs) && bOutMs > bInMs) {
            breakDurationHours = (bOutMs - bInMs) / (1000 * 60 * 60);
            breaks.push({
              id: Math.random().toString(36).substring(7),
              startTime: bInIso,
              endTime: bOutIso,
            });
          }
        } else if ((breakInTime && !breakOutTime) || (!breakInTime && breakOutTime)) {
          // Ignore incomplete break; form should enforce both, but keep it safe.
        }

        let totalHours = (outMs - inMs) / (1000 * 60 * 60) - breakDurationHours;
        totalHours = Math.max(0, totalHours);
        const overtime = totalHours > 8 ? totalHours - 8 : 0;

        const targetDate = new Date(`${date}T00:00:00`);
        const sameYMD = (iso: string) => {
          const d = new Date(iso);
          return d.getFullYear() === targetDate.getFullYear() && d.getMonth() === targetDate.getMonth() && d.getDate() === targetDate.getDate();
        };

        // Replace existing finalized entries for that user + date.
        const nextTimesheets = timesheets.filter(t => {
          if (t.userId !== userId) return true;
          if (!sameYMD(t.clockIn)) return true;
          return !t.clockOut; // keep active entries; replace only finalized ones
        });

        const newEntry: TimesheetEntry = {
          id: Math.random().toString(36).substring(7),
          userId,
          clockIn: inIso,
          clockOut: outIso,
          breaks,
          totalHours,
          lateMark,
          overtime,
        };

        set({ timesheets: [...nextTimesheets, newEntry] });
      },

      applyManualTimeRequest: (input) => {
        const { currentUser } = get();
        if (!currentUser) return;
        // Admin should not apply manual time; HR/Employee can submit and Admin will review.
        if (currentUser.role === 'Admin' || currentUser.role === 'Pending User') return;

        const { date, clockInTime, clockOutTime, breakInTime, breakOutTime, reason } = input;
        if (!date || !clockInTime || !clockOutTime) return;

        // If break is provided, both break in/out must exist.
        if ((!!breakInTime && !breakOutTime) || (!breakInTime && !!breakOutTime)) return;

        const buildIso = (d: string, t: string) => new Date(`${d}T${t}:00`).toISOString();
        const inIso = buildIso(date, clockInTime);
        const outIso = buildIso(date, clockOutTime);
        const inMs = new Date(inIso).getTime();
        const outMs = new Date(outIso).getTime();
        if (!Number.isFinite(inMs) || !Number.isFinite(outMs) || outMs <= inMs) return;

        if (breakInTime && breakOutTime) {
          const bInIso = buildIso(date, breakInTime);
          const bOutIso = buildIso(date, breakOutTime);
          const bInMs = new Date(bInIso).getTime();
          const bOutMs = new Date(bOutIso).getTime();
          if (!Number.isFinite(bInMs) || !Number.isFinite(bOutMs) || bOutMs <= bInMs) return;
        }

        const nowIso = new Date().toISOString();
        const newReq: ManualTimeRequest = {
          id: Math.random().toString(36).substring(7),
          userId: currentUser.id,
          date,
          clockInTime,
          clockOutTime,
          breakInTime: breakInTime || undefined,
          breakOutTime: breakOutTime || undefined,
          reason: reason || undefined,
          status: 'Pending',
          createdAt: nowIso,
        };

        set((state) => ({ manualTimeRequests: [...state.manualTimeRequests, newReq] }));
      },

      approveManualTimeRequest: (requestId) => {
        const { currentUser, manualTimeRequests, timesheets } = get();
        if (!currentUser) return;
        const canReview = currentUser.role === 'Admin' || currentUser.role === 'HR';
        if (!canReview) return;

        const req = manualTimeRequests.find(r => r.id === requestId);
        if (!req || req.status !== 'Pending') return;

        const buildIso = (d: string, t: string) => new Date(`${d}T${t}:00`).toISOString();
        const inIso = buildIso(req.date, req.clockInTime);
        const outIso = buildIso(req.date, req.clockOutTime);

        const inMs = new Date(inIso).getTime();
        const outMs = new Date(outIso).getTime();
        if (!Number.isFinite(inMs) || !Number.isFinite(outMs) || outMs <= inMs) return;

        const inDate = new Date(inIso);
        const lateMark = inDate.getHours() > 9 || (inDate.getHours() === 9 && inDate.getMinutes() > 0);

        const breaks: BreakEntry[] = [];
        let breakDurationHours = 0;
        if (req.breakInTime && req.breakOutTime) {
          const bInIso = buildIso(req.date, req.breakInTime);
          const bOutIso = buildIso(req.date, req.breakOutTime);
          const bInMs = new Date(bInIso).getTime();
          const bOutMs = new Date(bOutIso).getTime();
          if (Number.isFinite(bInMs) && Number.isFinite(bOutMs) && bOutMs > bInMs) {
            breakDurationHours = (bOutMs - bInMs) / (1000 * 60 * 60);
            breaks.push({
              id: Math.random().toString(36).substring(7),
              startTime: bInIso,
              endTime: bOutIso,
            });
          }
        }

        let totalHours = (outMs - inMs) / (1000 * 60 * 60) - breakDurationHours;
        totalHours = Math.max(0, totalHours);
        const overtime = totalHours > 8 ? totalHours - 8 : 0;

        const targetDate = new Date(`${req.date}T00:00:00`);
        const sameYMD = (iso: string) => {
          const d = new Date(iso);
          return d.getFullYear() === targetDate.getFullYear() && d.getMonth() === targetDate.getMonth() && d.getDate() === targetDate.getDate();
        };

        // Replace existing finalized entries for that user + date.
        const nextTimesheets = timesheets.filter(t => {
          if (t.userId !== req.userId) return true;
          if (!sameYMD(t.clockIn)) return true;
          return !t.clockOut; // keep active entries; replace only finalized ones
        });

        const newEntry: TimesheetEntry = {
          id: Math.random().toString(36).substring(7),
          userId: req.userId,
          clockIn: inIso,
          clockOut: outIso,
          breaks,
          totalHours,
          lateMark,
          overtime,
        };

        const nowIso = new Date().toISOString();
        set({
          timesheets: [...nextTimesheets, newEntry],
          manualTimeRequests: manualTimeRequests.map(r =>
            r.id === requestId
              ? {
                  ...r,
                  status: 'Approved',
                  reviewedAt: nowIso,
                  reviewedById: currentUser.id,
                  feedback: undefined,
                }
              : r
          ),
        });
      },

      rejectManualTimeRequest: (requestId, feedback) => {
        const { currentUser, manualTimeRequests } = get();
        if (!currentUser) return;
        const canReview = currentUser.role === 'Admin' || currentUser.role === 'HR';
        if (!canReview) return;

        const req = manualTimeRequests.find(r => r.id === requestId);
        if (!req || req.status !== 'Pending') return;

        const trimmed = feedback.trim();
        if (!trimmed) return;

        const nowIso = new Date().toISOString();
        set({
          manualTimeRequests: manualTimeRequests.map(r =>
            r.id === requestId
              ? {
                  ...r,
                  status: 'Rejected',
                  feedback: trimmed,
                  reviewedAt: nowIso,
                  reviewedById: currentUser.id,
                }
              : r
          ),
        });
      },

      addUser: (user) => set((state) => ({ users: [...state.users, user] })),

      createTask: (input) => {
        const { currentUser, users } = get();
        if (!currentUser) return;
        const { title, description, assignedTo, priority, deadline } = input;

        const allowedCreator =
          currentUser.role === 'Admin' || currentUser.role === 'HR' || currentUser.role === 'Team Leader';
        if (!allowedCreator) return;

        const assignedUser = users.find(u => u.id === assignedTo);
        if (!assignedUser || assignedUser.role === 'Pending User') return;

        // Team Leader can only assign within their team
        if (currentUser.role === 'Team Leader' && assignedUser.team !== currentUser.team) return;

        const nowIso = new Date().toISOString();
        const newTask: Task = {
          id: Math.random().toString(36).substring(7),
          title,
          description,
          assignedTo,
          assignedBy: currentUser.id,
          status: 'Pending',
          priority,
          deadline,
          comments: [],
          history: [
            {
              id: Math.random().toString(36).substring(7),
              at: nowIso,
              actorId: currentUser.id,
              actorRole: currentUser.role,
              fromStatus: null,
              toStatus: 'Pending',
              action: 'Created',
            },
          ],
        };

        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },

      startTaskWork: (taskId) => {
        const { currentUser, tasks } = get();
        if (!currentUser || currentUser.role !== 'Employee') return;

        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        if (task.assignedTo !== currentUser.id) return;
        if (task.status !== 'Pending') return;

        set((state) => ({
          tasks: state.tasks.map(t => {
            if (t.id !== taskId) return t;
            const nowIso = new Date().toISOString();
            const entry: TaskHistoryEntry = {
              id: Math.random().toString(36).substring(7),
              at: nowIso,
              actorId: currentUser.id,
              actorRole: currentUser.role,
              fromStatus: 'Pending',
              toStatus: 'In Progress',
              action: 'Start Work',
            };
            return { ...t, status: 'In Progress', history: [...(t.history || []), entry] };
          }),
        }));
      },

      submitTask: (taskId) => {
        const { currentUser, tasks } = get();
        if (!currentUser || currentUser.role !== 'Employee') return;

        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        if (task.assignedTo !== currentUser.id) return;
        if (task.status !== 'In Progress') return;

        set((state) => ({
          tasks: state.tasks.map(t => {
            if (t.id !== taskId) return t;
            const nowIso = new Date().toISOString();
            const entry: TaskHistoryEntry = {
              id: Math.random().toString(36).substring(7),
              at: nowIso,
              actorId: currentUser.id,
              actorRole: currentUser.role,
              fromStatus: 'In Progress',
              toStatus: 'Submitted',
              action: 'Submit',
            };
            return { ...t, status: 'Submitted', history: [...(t.history || []), entry] };
          }),
        }));
      },

      approveTask: (taskId) => {
        const { currentUser, tasks, users } = get();
        if (!currentUser || (currentUser.role !== 'HR' && currentUser.role !== 'Team Leader')) return;

        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        if (task.status !== 'Submitted') return;

        // Team Leader can only approve tasks from their team
        if (currentUser.role === 'Team Leader') {
          const assignedUser = users.find(u => u.id === task.assignedTo);
          if (!assignedUser || assignedUser.team !== currentUser.team) return;
        }

        set((state) => ({
          tasks: state.tasks.map(t => {
            if (t.id !== taskId) return t;
            const nowIso = new Date().toISOString();
            const entry: TaskHistoryEntry = {
              id: Math.random().toString(36).substring(7),
              at: nowIso,
              actorId: currentUser.id,
              actorRole: currentUser.role,
              fromStatus: 'Submitted',
              toStatus: 'Approved',
              action: 'Approve',
            };
            return { ...t, status: 'Approved', history: [...(t.history || []), entry] };
          }),
        }));
      },

      rejectTask: (taskId, feedback) => {
        const { currentUser, tasks, users } = get();
        if (!currentUser || (currentUser.role !== 'HR' && currentUser.role !== 'Team Leader')) return;

        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        if (task.status !== 'Submitted') return;

        // Team Leader can only reject tasks from their team
        if (currentUser.role === 'Team Leader') {
          const assignedUser = users.find(u => u.id === task.assignedTo);
          if (!assignedUser || assignedUser.team !== currentUser.team) return;
        }

        const trimmed = feedback.trim();
        if (!trimmed) return;

        set((state) => ({
          tasks: state.tasks.map(t => {
            if (t.id !== taskId) return t;
            const nowIso = new Date().toISOString();
            const entry: TaskHistoryEntry = {
              id: Math.random().toString(36).substring(7),
              at: nowIso,
              actorId: currentUser.id,
              actorRole: currentUser.role,
              fromStatus: 'Submitted',
              toStatus: 'In Progress',
              action: 'Reject',
              feedback: trimmed,
            };
            return { ...t, status: 'In Progress', history: [...(t.history || []), entry] };
          }),
        }));
      },
      
      addTaskComment: (taskId, commentText) => {
        const { currentUser } = get();
        if (!currentUser) return;
        
        set((state) => ({
          tasks: state.tasks.map(t => {
            if (t.id === taskId) {
              return {
                ...t,
                comments: [...t.comments, {
                  id: Math.random().toString(36).substring(7),
                  userId: currentUser.id,
                  text: commentText,
                  createdAt: new Date().toISOString()
                }]
              };
            }
            return t;
          })
        }));
      },
      
      applyLeave: (leaveData) => {
        const { currentUser } = get();
        if (!currentUser) return;
        // Anyone except Pending User can apply leave.
        if (currentUser.role === 'Pending User') return;

        set((state) => ({
          leaves: [
            ...state.leaves,
            {
              ...leaveData,
              id: Math.random().toString(36).substring(7),
              status: 'Pending',
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      updateLeaveStatus: (leaveId, status) => {
        const { currentUser } = get();
        const canReview = currentUser?.role === 'Admin' || currentUser?.role === 'HR';
        if (!canReview) return;

        set((state) => ({
          leaves: state.leaves.map(l => (l.id === leaveId ? { ...l, status } : l)),
        }));
      },

      updateAvailability: (userId, days) => set((state) => {
        const existing = state.availability.find(a => a.userId === userId);
        if (existing) {
          return {
            availability: state.availability.map(a => a.userId === userId ? { ...a, days } : a)
          };
        }
        return {
          availability: [...state.availability, { userId, days }]
        };
      }),

      removeUser: (userId) => set((state) => ({
        users: state.users.filter(u => u.id !== userId)
      })),

      updateUser: (userId, updates) => set((state) => ({
        users: state.users.map(u => u.id === userId ? { ...u, ...updates } : u)
      })),

      addTeam: (name) => set((state) => ({
        teams: state.teams.includes(name) ? state.teams : [...state.teams, name]
      })),

      removeTeam: (name) => set((state) => ({
        teams: state.teams.filter(t => t !== name)
      })),

      approveUser: (userId, role, team) => set((state) => ({
        users: state.users.map(u =>
          u.id === userId ? { ...u, role, team, status: 'Available' as const } : u
        )
      })),

      registerUser: (input) => {
        const { name, email, password, phone, department } = input;
        const trimmedEmail = email.trim().toLowerCase();
        if (!name.trim() || !trimmedEmail || !password || !phone.trim()) {
          return { ok: false, error: 'Please fill in all required fields.' };
        }
        if (password.length < 6) {
          return { ok: false, error: 'Password must be at least 6 characters.' };
        }
        const { users } = get();
        if (users.some(u => u.email.toLowerCase() === trimmedEmail)) {
          return { ok: false, error: 'An account with this email already exists.' };
        }
        const newUser: User = {
          id: Math.random().toString(36).substring(7),
          name: name.trim(),
          email: trimmedEmail,
          role: 'Pending User',
          team: department,
          status: undefined,
          phone: phone.trim(),
          department,
          password,
        };
        set((state) => ({ users: [...state.users, newUser] }));
        return { ok: true, user: newUser };
      },

      loginWithCredentials: (email, password) => {
        const trimmedEmail = email.trim().toLowerCase();
        const { users } = get();
        const user = users.find(u => u.email.toLowerCase() === trimmedEmail);
        if (!user || !user.password) {
          return { ok: false, error: 'Invalid email or password.' };
        }
        if (user.password !== password) {
          return { ok: false, error: 'Invalid email or password.' };
        }
        return { ok: true, user };
      },

      requestPasswordReset: (email) => {
        const trimmedEmail = email.trim().toLowerCase();
        const { users, passwordResetTokens } = get();
        const user = users.find(u => u.email.toLowerCase() === trimmedEmail);
        if (!user) {
          return { ok: false, error: 'No account found with this email.' };
        }
        const token = `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
        const entry: PasswordResetToken = {
          id: Math.random().toString(36).substring(7),
          email: trimmedEmail,
          token,
          expiresAt,
        };
        const next = passwordResetTokens.filter(t => t.email !== trimmedEmail);
        set({ passwordResetTokens: [...next, entry] });
        return { ok: true, token, expiresAt };
      },

      resetPasswordWithToken: (token, newPassword) => {
        if (!token || newPassword.length < 6) {
          return { ok: false, error: 'Password must be at least 6 characters.' };
        }
        const { passwordResetTokens, users } = get();
        const rec = passwordResetTokens.find(t => t.token === token);
        if (!rec) {
          return { ok: false, error: 'Invalid or expired reset link.' };
        }
        if (new Date(rec.expiresAt).getTime() < Date.now()) {
          set({ passwordResetTokens: passwordResetTokens.filter(t => t.token !== token) });
          return { ok: false, error: 'This reset link has expired. Request a new one.' };
        }
        const email = rec.email.toLowerCase();
        set({
          users: users.map(u =>
            u.email.toLowerCase() === email ? { ...u, password: newPassword } : u
          ),
          passwordResetTokens: passwordResetTokens.filter(t => t.token !== token),
        });
        return { ok: true };
      },
    }),
    {
      name: 'gdc-storage',
      version: 5,
      migrate: (persistedState: any) => {
        if (!persistedState) return persistedState;

        const demoPasswords: Record<string, string> = {
          'rameez@example.com': 'password123',
          'admin@example.com': 'admin123',
          'hr@example.com': 'hr123',
          'sarah@example.com': 'lead123',
          'ali@example.com': 'ali123',
          'pending@example.com': 'pending123',
        };

        // Ensure new slices exist.
        const nextState = {
          ...persistedState,
          manualTimeRequests: Array.isArray(persistedState.manualTimeRequests) ? persistedState.manualTimeRequests : [],
          passwordResetTokens: Array.isArray(persistedState.passwordResetTokens) ? persistedState.passwordResetTokens : [],
          users: Array.isArray(persistedState.users)
            ? (persistedState.users as any[]).map((u) => {
                const fixedStatus = u?.status === 'Holiday' ? { ...u, status: 'Unavailable' as const } : u;
                const em = String(fixedStatus?.email || '').toLowerCase();
                if (!fixedStatus?.password && em && demoPasswords[em]) {
                  return { ...fixedStatus, password: demoPasswords[em] };
                }
                return fixedStatus;
              }) as User[]
            : persistedState.users,
        };

        // Migration for new task workflow model.
        if (!nextState.tasks) return nextState;

        const users: User[] = nextState.users || mockUsers;
        const roleById = new Map<string, Role>(users.map(u => [u.id, u.role]));

        const migratedTasks = (nextState.tasks as any[]).map((t) => {
          const status: TaskWorkflowStatus =
            t.status === 'Completed' ? 'Approved' : t.status;

          const history: TaskHistoryEntry[] | undefined = Array.isArray(t.history)
            ? t.history
            : [
                {
                  id: Math.random().toString(36).substring(7),
                  at: new Date().toISOString(),
                  actorId: t.assignedBy || 'unknown',
                  actorRole: roleById.get(t.assignedBy) || 'Admin',
                  fromStatus: null,
                  toStatus: status,
                  action: 'Created',
                },
              ];

          return {
            ...t,
            status,
            history,
          };
        });

        return {
          ...nextState,
          tasks: migratedTasks,
        };
      },
    }
  )
);
