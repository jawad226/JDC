import type { RequestStatusFilter } from './types';

export function LeaveectionTitle(filter: RequestStatusFilter): string {
  switch (filter) {
    case 'All':
      return 'All Requests';
    case 'Pending':
      return 'Pending Requests';
    case 'Approved':
      return 'Approved Requests';
    case 'Rejected':
      return 'Rejected Requests';
  }
}

export function manualSectionTitle(filter: RequestStatusFilter): string {
  switch (filter) {
    case 'All':
      return 'All Requests';
    case 'Pending':
      return 'Pending Requests';
    case 'Approved':
      return 'Approved Requests';
    case 'Rejected':
      return 'Rejected Requests';
  }
}

export function leaveEmptyMessage(filter: RequestStatusFilter, totalLeave: number): string {
  if (totalLeave === 0) {
    return 'You have not submitted any leave requests yet.';
  }
  switch (filter) {
    case 'All':
      return 'No leave requests match this view.';
    case 'Pending':
      return 'No pending leave requests.';
    case 'Approved':
      return 'No approved leave requests.';
    case 'Rejected':
      return 'No rejected leave requests.';
  }
}

export function manualEmptyMessage(filter: RequestStatusFilter, totalManual: number): string {
  if (totalManual === 0) {
    return 'You have not submitted any manual time requests yet.';
  }
  switch (filter) {
    case 'All':
      return 'No manual time requests match this view.';
    case 'Pending':
      return 'No pending manual time requests.';
    case 'Approved':
      return 'No approved manual time requests.';
    case 'Rejected':
      return 'No rejected manual time requests.';
  }
}
