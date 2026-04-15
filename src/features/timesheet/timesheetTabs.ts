import type { Role } from '@/lib/store';

export type TimesheetTabId = 'my' | 'overview' | 'records' | 'manual';

export const TIMESHEET_TAB = {
  my: 'my',
  overview: 'overview',
  records: 'records',
  manual: 'manual',
} as const satisfies Record<string, TimesheetTabId>;

export function timesheetTabsForRole(role: Role | undefined): { id: TimesheetTabId; label: string }[] {
  switch (role) {
    case 'Admin':
    case 'HR':
      return [
        { id: 'overview', label: 'Attendance overview' },
        { id: 'records', label: 'Clock records' },
        { id: 'manual', label: 'Manual timesheet' },
      ];
    case 'Team Leader':
      return [
        { id: 'my', label: 'My attendance' },
        { id: 'overview', label: 'Team overview' },
        { id: 'records', label: 'Team records' },
      ];
    default:
      return [{ id: 'my', label: 'My attendance' }];
  }
}

export function defaultTimesheetTab(role: Role | undefined): TimesheetTabId {
  if (role === 'Admin' || role === 'HR') return 'overview';
  return 'my';
}
