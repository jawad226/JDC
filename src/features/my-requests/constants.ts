import type { RequestStatusFilter } from './types';

/** Shared labels; tab (Leave vs Manual) already provides context. */
export const STATUS_FILTER_OPTIONS: { value: RequestStatusFilter; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Approved', label: 'Approved' },
  { value: 'Rejected', label: 'Rejected' },
];

export const PRIMARY_ACTION_BTN_CLASS =
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700';

export const FIELD_CLASS =
  'w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700 outline-none focus:ring-2 focus:ring-blue-100';

export const FIELD_CLASS_NEUTRAL =
  'w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-slate-700 outline-none focus:ring-2 focus:ring-blue-100';
