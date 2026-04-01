import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = 'Admin' | 'HR' | 'Employee';

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  avatar?: string;
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

export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';

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
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string;
  comments: TaskComment[];
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

interface AppState {
  currentUser: User | null;
  users: User[];
  timesheets: TimesheetEntry[];
  tasks: Task[];
  leaves: LeaveRequest[];
  setCurrentUser: (user: User | null) => void;
  clockIn: () => void;
  clockOut: () => void;
  startBreak: () => void;
  endBreak: () => void;
  // Admin actions
  addUser: (user: User) => void;
  // Tasks
  addTask: (task: Task) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  addTaskComment: (taskId: string, comment: string) => void;
  // Leaves
  applyLeave: (leave: Omit<LeaveRequest, 'id' | 'status' | 'createdAt'>) => void;
  updateLeaveStatus: (leaveId: string, status: LeaveStatus) => void;
}

const mockUsers: User[] = [
  { id: '1', name: 'Rameez Hasan', role: 'Employee', email: 'rameez@example.com' },
  { id: '2', name: 'Admin User', role: 'Admin', email: 'admin@example.com' },
  { id: '3', name: 'HR Manager', role: 'HR', email: 'hr@example.com' },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: mockUsers[0],
      users: mockUsers,
      timesheets: [],
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
          comments: []
        }
      ],
      leaves: [],
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

      addUser: (user) => set((state) => ({ users: [...state.users, user] })),
      
      addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),
      
      updateTaskStatus: (taskId, status) => set((state) => ({
        tasks: state.tasks.map(t => t.id === taskId ? { ...t, status } : t)
      })),
      
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
      
      applyLeave: (leaveData) => set((state) => ({
        leaves: [...state.leaves, {
          ...leaveData,
          id: Math.random().toString(36).substring(7),
          status: 'Pending',
          createdAt: new Date().toISOString()
        }]
      })),
      
      updateLeaveStatus: (leaveId, status) => set((state) => ({
        leaves: state.leaves.map(l => l.id === leaveId ? { ...l, status } : l)
      }))
    }),
    {
      name: 'gdc-storage',
    }
  )
);
