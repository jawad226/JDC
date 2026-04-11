import type { Leavetatus } from '@/lib/store';

export type ReviewStatusFilter = Leavetatus | 'All';

export const REVIEW_STATUS_OPTIONS: { value: ReviewStatusFilter; label: string }[] = [
  { value: 'Pending', label: 'Pending' },
  { value: 'All', label: 'All' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
];
