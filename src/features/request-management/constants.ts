import type { Leavetatus } from '@/lib/store';

export type ReviewStatusFilter = Leavetatus | 'All';

/** Admin/HR status filter (values still match `Leave` / manual request `status`). */
export const REVIEW_STATUS_OPTIONS: { value: ReviewStatusFilter; label: string }[] = [
  { value: 'Pending', label: 'Pending' },
  { value: 'All', label: 'All' },
  { value: 'Rejected', label: 'Rejected' },
  { value: 'Approved', label: 'Approved' },
];

/** Heading under the tabs — updates with the status dropdown (no “Leave” in the leave tab title). */
export function getRequestManagementSectionTitle(
  tab: 'leave' | 'manual',
  status: ReviewStatusFilter
): string {
  if (tab === 'leave') {
    switch (status) {
      case 'Pending':
        return 'Pending Requests';
      case 'All':
        return 'All Requests';
      case 'Rejected':
        return 'Rejected Requests';
      case 'Approved':
        return 'Approved Requests';
      default:
        return 'Requests';
    }
  }
  switch (status) {
    case 'Pending':
      return 'Pending Requests';
    case 'All':
      return 'All Requests';
    case 'Rejected':
      return 'Rejected Requests';
    case 'Approved':
      return 'Approved Requests';
    default:
      return 'Manual Time Requests';
  }
}
