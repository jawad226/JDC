import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatAttachment, ChatMessage, ChatThread } from '@/lib/messaging';
import {
  chatThreadTitle,
  canDm,
  dmKeyFor,
  canSendInThread,
  isThreadVisibleToViewer,
  canAddToHrGroup,
  canAddToTlGroup,
  canAddToOfficialGroup,
  createDefaultChatThreads,
  resolveMessageRecipients,
  migrateChatThreadsForReadReceipts,
} from '@/lib/messaging';
import { emitChatSocketEvent } from '@/lib/chat-socket';

const initialChatThreads = createDefaultChatThreads();

/** Use with `useStore(useShallow(...))` when selecting multiple fields so unrelated store updates don’t re-render the component. */
export { useShallow } from 'zustand/react/shallow';

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
  status?: 'Available' | 'Unavailable' | 'Leave';
  phone?: string;
  department?: Department;
  /** National ID (demo). */
  cnic?: string;
  /** Full address (demo). */
  address?: string;
  /** HR / employee unique code shown as “Unique ID” (falls back to `id` in UI if unset). */
  employeeCode?: string;
  /** Office / site label (set when HR/Admin assigns a team). */
  workSite?: string;
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

export type TaskWorkflowStatus =
  | 'Pending'
  | 'In Progress'
  | 'Submitted'
  | 'Review'
  | 'Approved';
export type TaskHistoryAction =
  | 'Created'
  | 'Updated'
  | 'Forward to Team Leader'
  | 'Start Work'
  | 'Submit'
  | 'Send to Review'
  | 'Approve'
  | 'Reject';

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

export interface TaskAttachment {
  fileName: string;
  fileSize: number;
  dataUrl: string;
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
  /** Required on create (max 5MB); optional on older / seeded tasks */
  attachment?: TaskAttachment;
}

export type LeaveType = 'Leave' | 'Casual' | 'Paid';
export type Leavetatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id: string;
  userId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: Leavetatus;
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

/** True when the task was created by a Team Leader (scoped to that TL; hidden from Admin/HR lists and their review). */
export function isTeamLeaderCreatedTask(task: Task, users: User[]): boolean {
  const creator = users.find((u) => u.id === task.assignedBy);
  return creator?.role === 'Team Leader';
}

/** Admin + HR: Pending = HR hold or TL not started; Working = TL started (In Progress). Others see raw `task.status`. */
export function getManagementTaskDisplayStatus(task: Task, users: User[], viewerRole: Role): string {
  if (viewerRole !== 'Admin' && viewerRole !== 'HR') return task.status;
  if (task.status === 'Submitted' || task.status === 'Review' || task.status === 'Approved') return task.status;
  if (task.status === 'In Progress') return 'Working';
  if (task.status === 'Pending') return 'Pending';
  return task.status;
}

interface AppState {
  currentUser: User | null;
  users: User[];
  timesheets: TimesheetEntry[];
  tasks: Task[];
  Leave: LeaveRequest[];
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
    description?: string;
    assignedTo: string;
    deadline: string;
    attachment: TaskAttachment;
  }) => void;
  /** HR only: assign project from Admin to a Team Leader (senior). */
  forwardTaskToTeamLeader: (taskId: string, teamLeaderId: string) => void;
  startTaskWork: (taskId: string) => void;
  submitTask: (taskId: string) => void;
  /** HR/TL: move a submitted task into the Review step before final approval. */
  moveTaskToReview: (taskId: string) => void;
  approveTask: (taskId: string) => void;
  /** Admin / HR / Team Leader: remove a task only while it is still Pending. */
  deletePendingTask: (taskId: string) => void;
  /** Admin / HR / Team Leader: edit fields only while task is still Pending. */
  updatePendingTask: (
    taskId: string,
    input: {
      title: string;
      description: string;
      assignedTo: string;
      priority: TaskPriority;
      deadline: string;
    }
  ) => void;
  addTaskComment: (taskId: string, comment: string) => void;
  // Leave
  applyLeave: (leave: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>) => void;
  updateLeavetatus: (leaveId: string, status: Leavetatus) => void;

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
  /** Known site / office names for assignments. */
  sites: string[];
  addSite: (name: string) => void;
  /**
   * Admin / HR: assign one TL + 2+ employees to a team name and site.
   * Creates the team name in the list if new. Clears previous TL for that team name.
   */
  configureTeamAssignment: (input: {
    teamName: string;
    leaderUserId: string;
    employeeIds: string[];
    siteName: string;
  }) => { ok: true } | { ok: false; error: string };
  /** Admin/HR: set or clear who leads a team (site kept from current team if any). */
  setTeamLeaderForTeam: (teamName: string, leaderUserId: string | null) => { ok: true } | { ok: false; error: string };
  /** Admin/HR: remove user from their current team (clears team + site). */
  removeUserFromTeamRoster: (userId: string) => { ok: true } | { ok: false; error: string };
  /** Admin/HR: move user to another team (site follows target team). */
  shiftUserToTeam: (userId: string, targetTeamName: string) => { ok: true } | { ok: false; error: string };
  /** Admin/HR: add employees to an existing team (inherits site from current TL). */
  addEmployeesToTeam: (teamName: string, employeeIds: string[]) => { ok: true } | { ok: false; error: string };
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
  /** In-app messaging (DMs + groups); rules in `@/lib/messaging`. */
  chatThreads: ChatThread[];
  sendChatMessage: (
    chatId: string,
    input: {
      body: string;
      attachment?: ChatAttachment | null;
      replyToId?: string | null;
    }
  ) => { ok: true } | { ok: false; error?: string };
  editChatMessage: (
    chatId: string,
    messageId: string,
    newBody: string
  ) => { ok: true } | { ok: false; error?: string };
  deleteChatMessage: (chatId: string, messageId: string) => { ok: true } | { ok: false; error?: string };
  forwardChatMessage: (
    targetChatId: string,
    source: { sourceChatId: string; messageId: string }
  ) => { ok: true } | { ok: false; error?: string };
  openOrCreateDm: (otherUserId: string) => { ok: true; chatId: string } | { ok: false; error?: string };
  createGroupChat: (input: {
    name: string;
    memberIds: string[];
    scope: 'official' | 'hr_group' | 'tl_group';
  }) => { ok: true; chatId: string } | { ok: false; error?: string };
  addMembersToGroup: (chatId: string, userIds: string[]) => { ok: true } | { ok: false; error?: string };
  /** Mark all messages in a chat as read for the current user (read receipts). */
  markChatRead: (chatId: string) => void;
  /** Simulate another user sending a message (frontend “socket” demo). */
  receiveIncomingChatMessage: (
    chatId: string,
    fromUserId: string,
    input: { body: string; attachment?: ChatAttachment | null }
  ) => { ok: true } | { ok: false; error?: string };
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Rameez Hasan',
    role: 'Employee',
    email: 'rameez@example.com',
    team: 'Development',
    department: 'MERN Stack',
    status: 'Available',
    phone: '+92 300 1234567',
    cnic: '35202-1234567-1',
    address: 'House 12, Street 4, DHA Phase 5, Lahore',
    employeeCode: 'GDC-EMP-001',
    password: 'password123',
  },
  {
    id: '2',
    name: 'Admin User',
    role: 'Admin',
    email: 'admin@example.com',
    team: 'Management',
    department: 'Web Development',
    status: 'Available',
    phone: '+92 300 0000001',
    cnic: '35202-0000000-2',
    address: 'Head Office, Karachi',
    employeeCode: 'GDC-ADM-001',
    password: 'admin123',
  },
  {
    id: '3',
    name: 'HR Manager',
    role: 'HR',
    email: 'hr@example.com',
    team: 'HR',
    department: 'Web Development',
    status: 'Available',
    phone: '+92 300 0000002',
    cnic: '35202-0000000-3',
    address: 'HR Block, Lahore',
    employeeCode: 'GDC-HR-001',
    password: 'hr123',
  },
  {
    id: '4',
    name: 'Sarah Khan',
    role: 'Team Leader',
    email: 'sarah@example.com',
    team: 'Development',
    department: 'MERN Stack',
    status: 'Available',
    phone: '+92 300 0000003',
    cnic: '35202-0000000-4',
    address: 'Model Town, Lahore',
    employeeCode: 'GDC-TL-001',
    password: 'lead123',
  },
  {
    id: '5',
    name: 'Ali Ahmed',
    role: 'Employee',
    email: 'ali@example.com',
    team: 'Design',
    department: 'Web Design',
    status: 'Available',
    phone: '+92 300 0000004',
    cnic: '35202-0000000-5',
    address: 'Gulberg III, Lahore',
    employeeCode: 'GDC-EMP-002',
    password: 'ali123',
  },
  {
    id: '6',
    name: 'New Applicant',
    role: 'Pending User',
    email: 'pending@example.com',
    team: undefined,
    status: undefined,
    phone: '+92 300 0000005',
    password: 'pending123',
  },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: mockUsers[0],
      users: mockUsers,
      timesheets: [],
      teams: ['Development', 'Design', 'HR', 'Support', 'Management'],
      sites: ['Karachi HQ', 'Lahore Office', 'Islamabad', 'Remote'],
      tasks: [
        {
          id: 't1',
          title: 'Design Login Page',
          description: 'Create the UI for the main login page — Admin assigned to HR; HR will forward to a Team Lead.',
          assignedTo: '3',
          assignedBy: '2',
          status: 'Pending',
          priority: 'High',
          deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
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
          ],
        },
        {
          id: 't2',
          title: 'Review System Specs',
          description: 'Technical review of the new digital care architecture',
          assignedTo: '4',
          assignedBy: '2',
          status: 'Review',
          priority: 'Medium',
          deadline: new Date(Date.now() + 86400000 * 4).toISOString(),
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
              at: new Date(Date.now() + 1000 * 60 * 2).toISOString(),
              actorId: '3',
              actorRole: 'HR',
              fromStatus: 'Pending',
              toStatus: 'Pending',
              action: 'Forward to Team Leader',
            },
            {
              id: Math.random().toString(36).substring(7),
              at: new Date(Date.now() + 1000 * 60 * 5).toISOString(),
              actorId: '4',
              actorRole: 'Team Leader',
              fromStatus: 'Pending',
              toStatus: 'In Progress',
              action: 'Start Work',
            },
            {
              id: Math.random().toString(36).substring(7),
              at: new Date(Date.now() + 1000 * 60 * 20).toISOString(),
              actorId: '4',
              actorRole: 'Team Leader',
              fromStatus: 'In Progress',
              toStatus: 'Submitted',
              action: 'Submit',
            },
            {
              id: Math.random().toString(36).substring(7),
              at: new Date(Date.now() + 1000 * 60 * 25).toISOString(),
              actorId: '3',
              actorRole: 'HR',
              fromStatus: 'Submitted',
              toStatus: 'Review',
              action: 'Send to Review',
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
      Leave: [],
      manualTimeRequests: [],
      chatThreads: initialChatThreads,
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
        const { title, description, assignedTo, deadline, attachment } = input;

        const maxBytes = 5 * 1024 * 1024;
        if (!attachment?.dataUrl || attachment.fileSize > maxBytes || attachment.fileSize <= 0) return;

        const assignedUser = users.find(u => u.id === assignedTo);
        if (!assignedUser || assignedUser.role === 'Pending User') return;

        // Admin → HR only. Team Leader → own team’s Employees only.
        if (currentUser.role === 'Admin') {
          if (assignedUser.role !== 'HR') return;
        } else if (currentUser.role === 'Team Leader') {
          if (assignedUser.role !== 'Employee') return;
          if (!assignedUser.team || assignedUser.team !== currentUser.team) return;
        } else {
          return;
        }

        const nowIso = new Date().toISOString();
        const desc = (description ?? '').trim();
        const newTask: Task = {
          id: Math.random().toString(36).substring(7),
          title: title.trim(),
          description: desc,
          assignedTo,
          assignedBy: currentUser.id,
          status: 'Pending',
          priority: 'Medium',
          deadline,
          attachment: {
            fileName: attachment.fileName,
            fileSize: attachment.fileSize,
            dataUrl: attachment.dataUrl,
          },
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

      forwardTaskToTeamLeader: (taskId, teamLeaderId) => {
        const { currentUser, tasks, users } = get();
        if (!currentUser || currentUser.role !== 'HR') return;

        const task = tasks.find(t => t.id === taskId);
        if (!task || task.status !== 'Pending') return;
        if (task.assignedTo !== currentUser.id) return;

        const assigneeNow = users.find(u => u.id === task.assignedTo);
        if (!assigneeNow || assigneeNow.role !== 'HR') return;

        const tl = users.find(u => u.id === teamLeaderId);
        if (!tl || tl.role !== 'Team Leader') return;

        const nowIso = new Date().toISOString();
        const entry: TaskHistoryEntry = {
          id: Math.random().toString(36).substring(7),
          at: nowIso,
          actorId: currentUser.id,
          actorRole: 'HR',
          fromStatus: 'Pending',
          toStatus: 'Pending',
          action: 'Forward to Team Leader',
        };

        set((state) => ({
          tasks: state.tasks.map(t =>
            t.id === taskId
              ? { ...t, assignedTo: teamLeaderId, history: [...(t.history || []), entry] }
              : t
          ),
        }));
      },

      deletePendingTask: (taskId) => {
        const { currentUser, tasks, users } = get();
        if (!currentUser) return;

        const task = tasks.find(t => t.id === taskId);
        if (!task || task.status !== 'Pending') return;

        const assignedUser = users.find(u => u.id === task.assignedTo);

        if (currentUser.role === 'Admin') {
          if (isTeamLeaderCreatedTask(task, users)) return;
        } else if (currentUser.role === 'HR') {
          if (!assignedUser || assignedUser.role !== 'HR' || task.assignedTo !== currentUser.id) return;
        } else if (currentUser.role === 'Team Leader') {
          if (task.assignedBy !== currentUser.id) return;
          if (!assignedUser || assignedUser.role !== 'Employee' || assignedUser.team !== currentUser.team) return;
        } else {
          return;
        }

        set((state) => ({ tasks: state.tasks.filter(t => t.id !== taskId) }));
      },

      updatePendingTask: (taskId, input) => {
        const { currentUser, tasks, users } = get();
        if (!currentUser) return;

        const task = tasks.find(t => t.id === taskId);
        if (!task || task.status !== 'Pending') return;

        const { title, description, assignedTo, priority, deadline } = input;
        const assignedUser = users.find(u => u.id === assignedTo);
        if (!assignedUser || assignedUser.role === 'Pending User') return;

        if (currentUser.role === 'HR') {
          const cur = users.find(u => u.id === task.assignedTo);
          if (!cur || cur.role !== 'HR' || task.assignedTo !== currentUser.id) return;
          if (assignedUser.role !== 'HR' || assignedTo !== currentUser.id) return;
        } else if (currentUser.role === 'Admin') {
          if (isTeamLeaderCreatedTask(task, users)) return;
          if (assignedUser.role !== 'HR' && assignedUser.role !== 'Team Leader') return;
        } else if (currentUser.role === 'Team Leader') {
          if (task.assignedBy !== currentUser.id) return;
          if (assignedUser.role !== 'Employee' || assignedUser.team !== currentUser.team) return;
        } else {
          return;
        }

        const titleTrim = title.trim();
        const descriptionTrim = description.trim();
        if (!titleTrim || !deadline) return;

        const nowIso = new Date().toISOString();
        const entry: TaskHistoryEntry = {
          id: Math.random().toString(36).substring(7),
          at: nowIso,
          actorId: currentUser.id,
          actorRole: currentUser.role,
          fromStatus: 'Pending',
          toStatus: 'Pending',
          action: 'Updated',
        };

        set((state) => ({
          tasks: state.tasks.map(t =>
            t.id === taskId
              ? {
                  ...t,
                  title: titleTrim,
                  description: descriptionTrim,
                  assignedTo,
                  priority,
                  deadline,
                  history: [...(t.history || []), entry],
                }
              : t
          ),
        }));
      },

      startTaskWork: (taskId) => {
        const { currentUser, tasks } = get();
        if (!currentUser) return;
        if (currentUser.role !== 'Employee' && currentUser.role !== 'Team Leader') return;

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
        if (!currentUser) return;
        if (currentUser.role !== 'Employee' && currentUser.role !== 'Team Leader') return;

        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        if (task.assignedTo !== currentUser.id) return;
        if (task.status !== 'In Progress' && task.status !== 'Review') return;

        const fromStatus = task.status;

        set((state) => ({
          tasks: state.tasks.map(t => {
            if (t.id !== taskId) return t;
            const nowIso = new Date().toISOString();
            const entry: TaskHistoryEntry = {
              id: Math.random().toString(36).substring(7),
              at: nowIso,
              actorId: currentUser.id,
              actorRole: currentUser.role,
              fromStatus,
              toStatus: 'Submitted',
              action: 'Submit',
            };
            return { ...t, status: 'Submitted', history: [...(t.history || []), entry] };
          }),
        }));
      },

      moveTaskToReview: (taskId) => {
        const { currentUser, tasks, users } = get();
        const task = tasks.find(t => t.id === taskId);
        if (!task || task.status !== 'Submitted') return;

        const tlCreated = isTeamLeaderCreatedTask(task, users);
        if (tlCreated) {
          if (!currentUser || currentUser.role !== 'Team Leader' || currentUser.id !== task.assignedBy) return;
        } else {
          if (
            !currentUser ||
            (currentUser.role !== 'Admin' &&
              currentUser.role !== 'HR' &&
              currentUser.role !== 'Team Leader')
          )
            return;
          if (currentUser.role === 'Team Leader') {
            const assignedUser = users.find(u => u.id === task.assignedTo);
            if (!assignedUser || assignedUser.team !== currentUser.team) return;
          }
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
              toStatus: 'Review',
              action: 'Send to Review',
            };
            return { ...t, status: 'Review', history: [...(t.history || []), entry] };
          }),
        }));
      },

      approveTask: (taskId) => {
        const { currentUser, tasks, users } = get();
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        if (task.status !== 'Submitted' && task.status !== 'Review') return;

        const tlCreated = isTeamLeaderCreatedTask(task, users);
        if (tlCreated) {
          if (!currentUser || currentUser.role !== 'Team Leader' || currentUser.id !== task.assignedBy) return;
        } else {
          if (
            !currentUser ||
            (currentUser.role !== 'Admin' &&
              currentUser.role !== 'HR' &&
              currentUser.role !== 'Team Leader')
          )
            return;
          if (currentUser.role === 'Team Leader') {
            const assignedUser = users.find(u => u.id === task.assignedTo);
            if (!assignedUser || assignedUser.team !== currentUser.team) return;
          }
        }

        const fromStatus = task.status;

        set((state) => ({
          tasks: state.tasks.map(t => {
            if (t.id !== taskId) return t;
            const nowIso = new Date().toISOString();
            const entry: TaskHistoryEntry = {
              id: Math.random().toString(36).substring(7),
              at: nowIso,
              actorId: currentUser.id,
              actorRole: currentUser.role,
              fromStatus,
              toStatus: 'Approved',
              action: 'Approve',
            };
            return { ...t, status: 'Approved', history: [...(t.history || []), entry] };
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
          Leave: [
            ...state.Leave,
            {
              ...leaveData,
              id: Math.random().toString(36).substring(7),
              status: 'Pending',
              createdAt: new Date().toISOString(),
            },
          ],
        }));
      },

      updateLeavetatus: (leaveId, status) => {
        const { currentUser } = get();
        const canReview = currentUser?.role === 'Admin' || currentUser?.role === 'HR';
        if (!canReview) return;

        set((state) => ({
          Leave: state.Leave.map(l => (l.id === leaveId ? { ...l, status } : l)),
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

      updateUser: (userId, updates) =>
        set((state) => {
          const users = state.users.map((u) => (u.id === userId ? { ...u, ...updates } : u));
          const currentUser =
            state.currentUser?.id === userId ? { ...state.currentUser, ...updates } : state.currentUser;
          return { users, currentUser };
        }),

      addTeam: (name) => set((state) => ({
        teams: state.teams.includes(name) ? state.teams : [...state.teams, name]
      })),

      removeTeam: (name) => set((state) => ({
        teams: state.teams.filter(t => t !== name)
      })),

      addSite: (name) =>
        set((state) => {
          const trimmed = name.trim();
          if (!trimmed || state.sites.includes(trimmed)) return state;
          return { sites: [...state.sites, trimmed] };
        }),

      configureTeamAssignment: ({ teamName, leaderUserId, employeeIds, siteName }) => {
        const actor = get().currentUser;
        if (!actor || (actor.role !== 'Admin' && actor.role !== 'HR')) {
          return { ok: false, error: 'Only Admin or HR can assign teams.' };
        }

        const trimmedTeam = teamName.trim();
        if (!trimmedTeam) return { ok: false, error: 'Enter a team name.' };

        const trimmedSite = siteName.trim();
        if (!trimmedSite) return { ok: false, error: 'Enter a department name.' };

        const uniqueEmployees = [...new Set(employeeIds)];
        if (uniqueEmployees.length < 2) {
          return { ok: false, error: 'Select at least two different employees.' };
        }
        if (uniqueEmployees.includes(leaderUserId)) {
          return { ok: false, error: 'Team leader cannot be selected as an employee.' };
        }

        const { users } = get();
        const leader = users.find((u) => u.id === leaderUserId);
        if (!leader || leader.role !== 'Team Leader') {
          return { ok: false, error: 'Choose a user with the Team Leader role.' };
        }
        if (leader.team && leader.team !== trimmedTeam) {
          return {
            ok: false,
            error: `${leader.name} is already a leader on another team. Remove them from that team first, or pick a leader without a team.`,
          };
        }

        for (const id of uniqueEmployees) {
          const u = users.find((x) => x.id === id);
          if (!u || u.role !== 'Employee') {
            return { ok: false, error: 'Employees only: pick users with the Employee role.' };
          }
          if (u.team) {
            return { ok: false, error: `${u.name} is already assigned to a team. Remove them from that team first.` };
          }
        }

        set((state) => {
          let next = state.users.map((u) => {
            if (u.role === 'Team Leader' && u.team === trimmedTeam) {
              return { ...u, team: undefined, workSite: undefined };
            }
            return u;
          });

          next = next.map((u) => {
            if (u.id === leaderUserId) {
              return { ...u, team: trimmedTeam, role: 'Team Leader' as Role, workSite: trimmedSite };
            }
            if (uniqueEmployees.includes(u.id)) {
              return { ...u, team: trimmedTeam, role: 'Employee' as Role, workSite: trimmedSite };
            }
            return u;
          });

          const teams = state.teams.includes(trimmedTeam)
            ? state.teams
            : [...state.teams, trimmedTeam];

          let currentUser = state.currentUser;
          if (currentUser) {
            const refreshed = next.find((x) => x.id === currentUser!.id);
            if (refreshed) currentUser = refreshed;
          }

          return { users: next, teams, currentUser };
        });

        return { ok: true };
      },

      setTeamLeaderForTeam: (teamName, leaderUserId) => {
        const actor = get().currentUser;
        if (!actor || (actor.role !== 'Admin' && actor.role !== 'HR')) {
          return { ok: false, error: 'Only Admin or HR can change team leads.' };
        }
        const trimmed = teamName.trim();
        if (!trimmed) return { ok: false, error: 'Team name required.' };

        const { users } = get();
        const siteForTeam = (list: User[]) => {
          const onTeam = list.filter((u) => u.team === trimmed);
          const tl = onTeam.find((u) => u.role === 'Team Leader');
          if (tl?.workSite) return tl.workSite;
          return onTeam.find((u) => u.workSite)?.workSite;
        };

        if (leaderUserId) {
          const leader = users.find((u) => u.id === leaderUserId);
          if (!leader || leader.role !== 'Team Leader') {
            return { ok: false, error: 'Pick a user with the Team Leader role.' };
          }
        }

        set((state) => {
          let next = state.users.map((u) => {
            if (u.role === 'Team Leader' && u.team === trimmed) {
              return { ...u, team: undefined, workSite: undefined };
            }
            return u;
          });

          const site = siteForTeam(next) ?? '';

          if (leaderUserId) {
            next = next.map((u) =>
              u.id === leaderUserId
                ? { ...u, team: trimmed, role: 'Team Leader' as Role, workSite: site || u.workSite }
                : u
            );
          }

          const teams = state.teams.includes(trimmed) ? state.teams : [...state.teams, trimmed];

          let currentUser = state.currentUser;
          if (currentUser) {
            const refreshed = next.find((x) => x.id === currentUser!.id);
            if (refreshed) currentUser = refreshed;
          }

          return { users: next, teams, currentUser };
        });

        return { ok: true };
      },

      removeUserFromTeamRoster: (userId) => {
        const actor = get().currentUser;
        if (!actor || (actor.role !== 'Admin' && actor.role !== 'HR')) {
          return { ok: false, error: 'Not allowed.' };
        }
        const u = get().users.find((x) => x.id === userId);
        if (!u) return { ok: false, error: 'User not found.' };
        if (!u.team) return { ok: false, error: 'User is not on a team.' };

        set((state) => {
          const users = state.users.map((x) =>
            x.id === userId ? { ...x, team: undefined, workSite: undefined } : x
          );
          let currentUser = state.currentUser;
          if (currentUser?.id === userId) {
            currentUser = users.find((x) => x.id === userId) ?? null;
          } else if (currentUser) {
            const refreshed = users.find((x) => x.id === currentUser!.id);
            if (refreshed) currentUser = refreshed;
          }
          return { users, currentUser };
        });
        return { ok: true };
      },

      shiftUserToTeam: (userId, targetTeamName) => {
        const actor = get().currentUser;
        if (!actor || (actor.role !== 'Admin' && actor.role !== 'HR')) {
          return { ok: false, error: 'Not allowed.' };
        }
        const trimmed = targetTeamName.trim();
        if (!trimmed) return { ok: false, error: 'Pick a target team.' };

        const { users } = get();
        const user = users.find((u) => u.id === userId);
        if (!user?.team) return { ok: false, error: 'User has no team to move from.' };
        if (user.role === 'Team Leader') {
          return { ok: false, error: 'Change or remove the team leader from the team panel instead of shifting.' };
        }
        if (user.team === trimmed) return { ok: false, error: 'Already on that team.' };

        const onTarget = users.filter((u) => u.team === trimmed);
        const site =
          onTarget.find((u) => u.role === 'Team Leader' && u.workSite)?.workSite ||
          onTarget.find((u) => u.workSite)?.workSite;
        if (!site) {
          return { ok: false, error: 'Target team has no site yet. Assign a team leader there first.' };
        }

        set((state) => {
          const next = state.users.map((u) =>
            u.id === userId ? { ...u, team: trimmed, workSite: site } : u
          );
          const teams = state.teams.includes(trimmed) ? state.teams : [...state.teams, trimmed];
          let currentUser = state.currentUser;
          if (currentUser) {
            const refreshed = next.find((x) => x.id === currentUser!.id);
            if (refreshed) currentUser = refreshed;
          }
          return { users: next, teams, currentUser };
        });
        return { ok: true };
      },

      addEmployeesToTeam: (teamName, employeeIds) => {
        const actor = get().currentUser;
        if (!actor || (actor.role !== 'Admin' && actor.role !== 'HR')) {
          return { ok: false, error: 'Not allowed.' };
        }
        const trimmed = teamName.trim();
        if (!trimmed) return { ok: false, error: 'Team name required.' };

        const unique = [...new Set(employeeIds)];
        if (unique.length < 1) return { ok: false, error: 'Select at least one employee.' };

        const { users } = get();
        const onTeam = users.filter((u) => u.team === trimmed);
        const site =
          onTeam.find((u) => u.role === 'Team Leader' && u.workSite)?.workSite ||
          onTeam.find((u) => u.workSite)?.workSite;
        if (!site) {
          return { ok: false, error: 'Assign a team leader (with site) to this team first.' };
        }

        for (const id of unique) {
          const u = users.find((x) => x.id === id);
          if (!u || u.role !== 'Employee') {
            return { ok: false, error: 'Only employees can be added with this action.' };
          }
          if (u.team) {
            return { ok: false, error: `${u.name} is already on a team. Remove them from that team first.` };
          }
        }

        set((state) => {
          const next = state.users.map((u) =>
            unique.includes(u.id) ? { ...u, team: trimmed, role: 'Employee' as Role, workSite: site } : u
          );
          const teams = state.teams.includes(trimmed) ? state.teams : [...state.teams, trimmed];
          let currentUser = state.currentUser;
          if (currentUser) {
            const refreshed = next.find((x) => x.id === currentUser!.id);
            if (refreshed) currentUser = refreshed;
          }
          return { users: next, teams, currentUser };
        });
        return { ok: true };
      },

      approveUser: (userId, role, team) => set((state) => ({
        users: state.users.map(u =>
          u.id === userId ? { ...u, role, team, status: 'Available' as const } : u
        )
      })),

      sendChatMessage: (chatId, input) => {
        const { currentUser, users, chatThreads } = get();
        if (!currentUser) return { ok: false, error: 'Not signed in' };
        const text = input.body.trim();
        const attachment = input.attachment ?? null;
        const replyToId = input.replyToId ?? undefined;
        if (!text && !attachment) return { ok: false, error: 'Message is empty' };
        const thread = chatThreads.find((t) => t.id === chatId);
        if (!thread) return { ok: false, error: 'Chat not found' };
        if (!isThreadVisibleToViewer(thread, currentUser, users)) {
          return { ok: false, error: 'No access' };
        }
        if (!canSendInThread(thread, currentUser, users)) {
          return { ok: false, error: 'Read-only for your role' };
        }
        if (replyToId && !thread.messages.some((m) => m.id === replyToId)) {
          return { ok: false, error: 'Reply target not found' };
        }
        const rc = resolveMessageRecipients(thread, currentUser.id);
        const msg: ChatMessage = {
          id: `m-${Math.random().toString(36).slice(2, 12)}`,
          chatId,
          senderId: currentUser.id,
          authorId: currentUser.id,
          body: text,
          createdAt: new Date().toISOString(),
          readByUserIds: [],
          receiverId: rc.receiverId,
          groupId: rc.groupId,
          ...(attachment ? { attachment } : {}),
          ...(replyToId ? { replyToId } : {}),
        };
        set({
          chatThreads: chatThreads.map((t) =>
            t.id === chatId ? { ...t, messages: [...t.messages, msg] } : t
          ),
        });
        emitChatSocketEvent({ type: 'message:new', chatId, message: msg, source: 'send' });
        return { ok: true };
      },

      editChatMessage: (chatId, messageId, newBody) => {
        const { currentUser, chatThreads } = get();
        if (!currentUser) return { ok: false, error: 'Not signed in' };
        const text = newBody.trim();
        const thread = chatThreads.find((t) => t.id === chatId);
        if (!thread) return { ok: false, error: 'Chat not found' };
        const msg = thread.messages.find((m) => m.id === messageId);
        if (!msg) return { ok: false, error: 'Message not found' };
        if (msg.authorId !== currentUser.id) return { ok: false, error: 'You can only edit your own messages' };
        if (msg.deleted) return { ok: false, error: 'Message was deleted' };
        if (!text && !msg.attachment) return { ok: false, error: 'Message cannot be empty' };
        set({
          chatThreads: chatThreads.map((t) => {
            if (t.id !== chatId) return t;
            return {
              ...t,
              messages: t.messages.map((m) =>
                m.id === messageId
                  ? { ...m, body: text, editedAt: new Date().toISOString() }
                  : m
              ),
            };
          }),
        });
        return { ok: true };
      },

      deleteChatMessage: (chatId, messageId) => {
        const { currentUser, chatThreads } = get();
        if (!currentUser) return { ok: false, error: 'Not signed in' };
        const thread = chatThreads.find((t) => t.id === chatId);
        if (!thread) return { ok: false, error: 'Chat not found' };
        const msg = thread.messages.find((m) => m.id === messageId);
        if (!msg) return { ok: false, error: 'Message not found' };
        if (msg.authorId !== currentUser.id) return { ok: false, error: 'You can only delete your own messages' };
        if (msg.deleted) return { ok: false, error: 'Already deleted' };
        set({
          chatThreads: chatThreads.map((t) => {
            if (t.id !== chatId) return t;
            return {
              ...t,
              messages: t.messages.map((m) =>
                m.id === messageId
                  ? { ...m, deleted: true, body: '', attachment: undefined }
                  : m
              ),
            };
          }),
        });
        return { ok: true };
      },

      forwardChatMessage: (targetChatId, source) => {
        const { currentUser, users, chatThreads } = get();
        if (!currentUser) return { ok: false, error: 'Not signed in' };
        const { sourceChatId, messageId } = source;
        if (targetChatId === sourceChatId) {
          return { ok: false, error: 'Choose a different chat' };
        }
        const sourceThread = chatThreads.find((t) => t.id === sourceChatId);
        const targetThread = chatThreads.find((t) => t.id === targetChatId);
        if (!sourceThread || !targetThread) return { ok: false, error: 'Chat not found' };
        if (!isThreadVisibleToViewer(sourceThread, currentUser, users)) {
          return { ok: false, error: 'No access' };
        }
        if (!isThreadVisibleToViewer(targetThread, currentUser, users)) {
          return { ok: false, error: 'No access' };
        }
        const srcMsg = sourceThread.messages.find((m) => m.id === messageId);
        if (!srcMsg || srcMsg.deleted) return { ok: false, error: 'Message not found' };
        const text = srcMsg.body.trim();
        const att = srcMsg.attachment;
        if (!text && !att) return { ok: false, error: 'Nothing to forward' };
        if (!canSendInThread(targetThread, currentUser, users)) {
          return { ok: false, error: 'Read-only for your role' };
        }

        const getName = (id: string) => users.find((u) => u.id === id)?.name ?? 'Unknown';
        const sourceChatTitle = chatThreadTitle(sourceThread, currentUser.id, getName);
        const originalAuthorId = srcMsg.forwardedFrom?.originalAuthorId ?? srcMsg.authorId;
        const originalAuthorName = getName(originalAuthorId);
        const newAtt = att ? { ...att } : undefined;
        const trc = resolveMessageRecipients(targetThread, currentUser.id);

        const msg: ChatMessage = {
          id: `m-${Math.random().toString(36).slice(2, 12)}`,
          chatId: targetChatId,
          senderId: currentUser.id,
          authorId: currentUser.id,
          body: text,
          createdAt: new Date().toISOString(),
          readByUserIds: [],
          receiverId: trc.receiverId,
          groupId: trc.groupId,
          ...(newAtt ? { attachment: newAtt } : {}),
          forwardedFrom: {
            sourceChatTitle,
            originalAuthorId,
            originalAuthorName,
          },
        };
        set({
          chatThreads: get().chatThreads.map((t) =>
            t.id === targetChatId ? { ...t, messages: [...t.messages, msg] } : t
          ),
        });
        emitChatSocketEvent({ type: 'message:new', chatId: targetChatId, message: msg, source: 'forward' });
        return { ok: true };
      },

      openOrCreateDm: (otherUserId) => {
        const { currentUser, users, chatThreads } = get();
        if (!currentUser) return { ok: false, error: 'Not signed in' };
        const other = users.find((u) => u.id === otherUserId);
        if (!other) return { ok: false, error: 'User not found' };
        if (!canDm(currentUser.role, other.role)) {
          return { ok: false, error: 'You cannot message this person' };
        }
        const key = dmKeyFor(currentUser.id, otherUserId);
        const existing = chatThreads.find(
          (t) =>
            t.kind === 'dm' &&
            t.scope === 'dm' &&
            t.memberIds.length === 2 &&
            dmKeyFor(t.memberIds[0], t.memberIds[1]) === key
        );
        if (existing) return { ok: true, chatId: existing.id };

        const sorted = [currentUser.id, otherUserId].sort();
        const thread: ChatThread = {
          id: `dm-${Math.random().toString(36).slice(2, 11)}`,
          kind: 'dm',
          scope: 'dm',
          memberIds: [sorted[0]!, sorted[1]!],
          messages: [],
        };
        set({
          chatThreads: [...chatThreads, thread],
        });
        return { ok: true, chatId: thread.id };
      },

      createGroupChat: ({ name, memberIds, scope }) => {
        const { currentUser, users, chatThreads } = get();
        if (!currentUser) return { ok: false, error: 'Not signed in' };
        const trimmed = name.trim();
        if (!trimmed) return { ok: false, error: 'Name required' };

        if (scope === 'official') {
          if (currentUser.role !== 'Admin') return { ok: false, error: 'Only Admin can create official groups' };
          const ids = [...new Set([currentUser.id, ...memberIds])];
          for (const id of ids) {
            const u = users.find((x) => x.id === id);
            if (!u || !canAddToOfficialGroup(u)) {
              return { ok: false, error: 'Invalid member' };
            }
          }
          const thread: ChatThread = {
            id: `g-off-${Math.random().toString(36).slice(2, 9)}`,
            kind: 'group',
            scope: 'official',
            name: trimmed,
            createdById: currentUser.id,
            memberIds: ids,
            messages: [],
          };
          set({
            chatThreads: [...chatThreads, thread],
          });
          return { ok: true, chatId: thread.id };
        }

        if (scope === 'hr_group') {
          if (currentUser.role !== 'HR') return { ok: false, error: 'Only HR can create HR groups' };
          const ids = [...new Set([currentUser.id, ...memberIds])];
          for (const id of ids) {
            const u = users.find((x) => x.id === id);
            if (!u || !canAddToHrGroup(u)) {
              return { ok: false, error: 'Members must be HR, Team Leader, or Employee' };
            }
          }
          const thread: ChatThread = {
            id: `g-hr-${Math.random().toString(36).slice(2, 9)}`,
            kind: 'group',
            scope: 'hr_group',
            name: trimmed,
            createdById: currentUser.id,
            memberIds: ids,
            messages: [],
          };
          set({
            chatThreads: [...chatThreads, thread],
          });
          return { ok: true, chatId: thread.id };
        }

        if (scope === 'tl_group') {
          if (currentUser.role !== 'Team Leader') {
            return { ok: false, error: 'Only Team Leaders can create TL groups' };
          }
          const ids = [...new Set([currentUser.id, ...memberIds])];
          for (const id of ids) {
            const u = users.find((x) => x.id === id);
            if (!u || !canAddToTlGroup(u)) {
              return { ok: false, error: 'Members must be HR, Team Leader, or Employee (not Admin)' };
            }
          }
          const thread: ChatThread = {
            id: `g-tl-${Math.random().toString(36).slice(2, 9)}`,
            kind: 'group',
            scope: 'tl_group',
            name: trimmed,
            createdById: currentUser.id,
            memberIds: ids,
            messages: [],
          };
          set({
            chatThreads: [...chatThreads, thread],
          });
          return { ok: true, chatId: thread.id };
        }

        return { ok: false, error: 'Invalid group type' };
      },

      addMembersToGroup: (chatId, userIds) => {
        const { currentUser, users, chatThreads } = get();
        if (!currentUser) return { ok: false, error: 'Not signed in' };
        const thread = chatThreads.find((t) => t.id === chatId);
        if (!thread || thread.kind !== 'group') return { ok: false, error: 'Not a group' };

        const unique = [...new Set(userIds)];

        if (thread.scope === 'official') {
          if (currentUser.role !== 'Admin') {
            return { ok: false, error: 'Only Admin can add members to official groups' };
          }
          for (const id of unique) {
            const u = users.find((x) => x.id === id);
            if (!u || !canAddToOfficialGroup(u)) return { ok: false, error: 'Invalid member' };
          }
        } else if (thread.scope === 'hr_group') {
          if (currentUser.role !== 'HR') {
            return { ok: false, error: 'Only HR can add members to HR groups' };
          }
          for (const id of unique) {
            const u = users.find((x) => x.id === id);
            if (!u || !canAddToHrGroup(u)) return { ok: false, error: 'Invalid member for HR group' };
          }
        } else if (thread.scope === 'tl_group') {
          if (currentUser.role !== 'Team Leader') {
            return { ok: false, error: 'Only Team Leaders can add members to TL groups' };
          }
          for (const id of unique) {
            const u = users.find((x) => x.id === id);
            if (!u || !canAddToTlGroup(u)) return { ok: false, error: 'Invalid member' };
          }
        } else {
          return { ok: false, error: 'Cannot add members to this chat' };
        }

        set((state) => ({
          chatThreads: state.chatThreads.map((t) => {
            if (t.id !== chatId) return t;
            const merged = [...new Set([...t.memberIds, ...unique])];
            return { ...t, memberIds: merged };
          }),
        }));
        return { ok: true };
      },

      markChatRead: (chatId) => {
        const uid = get().currentUser?.id;
        if (!uid) return;
        set((state) => ({
          chatThreads: state.chatThreads.map((t) => {
            if (t.id !== chatId) return t;
            return {
              ...t,
              messages: t.messages.map((m) => {
                if (m.deleted || m.authorId === uid) return m;
                const prev = m.readByUserIds ?? [];
                if (prev.includes(uid)) return m;
                return { ...m, readByUserIds: [...prev, uid] };
              }),
            };
          }),
        }));
      },

      receiveIncomingChatMessage: (chatId, fromUserId, input) => {
        const { currentUser, users, chatThreads } = get();
        if (!currentUser) return { ok: false, error: 'Not signed in' };
        const thread = chatThreads.find((t) => t.id === chatId);
        if (!thread) return { ok: false, error: 'Chat not found' };
        if (!thread.memberIds.includes(fromUserId)) return { ok: false, error: 'Sender not in chat' };
        if (!isThreadVisibleToViewer(thread, currentUser, users)) {
          return { ok: false, error: 'No access' };
        }
        const text = input.body.trim();
        const attachment = input.attachment ?? null;
        if (!text && !attachment) return { ok: false, error: 'Message is empty' };
        const rc = resolveMessageRecipients(thread, fromUserId);
        const msg: ChatMessage = {
          id: `m-${Math.random().toString(36).slice(2, 12)}`,
          chatId,
          senderId: fromUserId,
          authorId: fromUserId,
          body: text,
          createdAt: new Date().toISOString(),
          readByUserIds: [],
          receiverId: rc.receiverId,
          groupId: rc.groupId,
          ...(attachment ? { attachment } : {}),
        };
        set({
          chatThreads: chatThreads.map((t) =>
            t.id === chatId ? { ...t, messages: [...t.messages, msg] } : t
          ),
        });
        emitChatSocketEvent({ type: 'message:new', chatId, message: msg, source: 'incoming' });
        return { ok: true };
      },

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
      version: 12,
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
        const defaultSites = ['Karachi HQ', 'Lahore Office', 'Islamabad', 'Remote'];
        const migratedThreads =
          Array.isArray(persistedState.chatThreads) && persistedState.chatThreads.length > 0
            ? persistedState.chatThreads
            : createDefaultChatThreads();
        const legacyRead =
          persistedState.chatLastReadAt && typeof persistedState.chatLastReadAt === 'object'
            ? (persistedState.chatLastReadAt as Record<string, string>)
            : undefined;
        const threadsWithReceipts = migrateChatThreadsForReadReceipts(migratedThreads, legacyRead);

        const { chatLastReadAt: _discardLegacyRead, ...persistWithoutRead } = persistedState;

        const nextState = {
          ...persistWithoutRead,
          sites:
            Array.isArray(persistedState.sites) && persistedState.sites.length > 0
              ? persistedState.sites
              : defaultSites,
          manualTimeRequests: Array.isArray(persistedState.manualTimeRequests) ? persistedState.manualTimeRequests : [],
          passwordResetTokens: Array.isArray(persistedState.passwordResetTokens) ? persistedState.passwordResetTokens : [],
          chatThreads: threadsWithReceipts,
          users: Array.isArray(persistedState.users)
            ? (persistedState.users as any[]).map((u) => {
                const fixedStatus = u?.status === 'Holiday' ? { ...u, status: 'Unavailable' as const } : u;
                const em = String(fixedStatus?.email || '').toLowerCase();
                const mock = mockUsers.find((m) => m.email.toLowerCase() === em);
                const merged =
                  mock && mock.email.toLowerCase() === em
                    ? {
                        ...fixedStatus,
                        department: fixedStatus?.department ?? mock.department,
                        phone: fixedStatus?.phone ?? mock.phone,
                        cnic: fixedStatus?.cnic ?? mock.cnic,
                        address: fixedStatus?.address ?? mock.address,
                        employeeCode: fixedStatus?.employeeCode ?? mock.employeeCode,
                      }
                    : fixedStatus;
                if (!merged?.password && em && demoPasswords[em]) {
                  return { ...merged, password: demoPasswords[em] };
                }
                return merged;
              }) as User[]
            : persistedState.users,
        };

        // Migration for new task workflow model.
        if (!nextState.tasks) return nextState;

        const users: User[] = nextState.users || mockUsers;
        const roleById = new Map<string, Role>(users.map(u => [u.id, u.role]));

        const validStatuses: TaskWorkflowStatus[] = [
          'Pending',
          'In Progress',
          'Submitted',
          'Review',
          'Approved',
        ];

        const migratedTasks = (nextState.tasks as any[]).map((t) => {
          let status: TaskWorkflowStatus =
            t.status === 'Completed' ? 'Approved' : t.status;
          if (!validStatuses.includes(status)) {
            status = 'Pending';
          }

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
