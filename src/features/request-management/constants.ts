import type { LeaveStatus } from '@/lib/store';

export type ReviewStatusFilter = LeaveStatus | 'All';

export const REVIEW_STATUS_OPTIONS: { value: ReviewStatusFilter; label: string }[] = [
  { value: 'Pending', label: 'Pending' },
  { value: 'All', label: 'All' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
];
