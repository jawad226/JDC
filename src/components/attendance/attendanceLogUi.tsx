'use client';

import { Fragment, type ReactNode } from 'react';

export function formatHoursMinutes(totalHours: number) {
  const h = Math.floor(totalHours);
  const m = Math.round((totalHours - h) * 60) % 60;
  return `${h}h ${m}m`;
}
import {
  Menu,
  Calendar,
  ChevronDown,
  Download,
  Send,
  Check,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

/** Matches reference: light grey pill, amber clock, "Approved", chevron */
export function ApprovedStatusPill() {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-medium text-slate-700 shadow-sm"
    >
      <Clock className="h-3.5 w-3.5 text-amber-500" />
      Approved
      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
    </button>
  );
}

type PaginationProps = {
  pageSafe: number;
  totalPages: number;
  filteredLen: number;
  rowsPerPage: number;
  setRowsPerPage: (n: number) => void;
  setPage: (p: number | ((n: number) => number)) => void;
};

export function AttendanceLogPagination({
  pageSafe,
  totalPages,
  filteredLen,
  rowsPerPage,
  setRowsPerPage,
  setPage,
}: PaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-4 border-t border-slate-100 px-4 py-3 text-sm text-slate-600">
      <label className="flex items-center gap-2">
        Rows per page:
        <select
          value={rowsPerPage}
          onChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(1);
          }}
          className="rounded border border-slate-200 px-2 py-1"
        >
          {[10, 25, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <span>
        {filteredLen === 0 ? 0 : (pageSafe - 1) * rowsPerPage + 1}-{Math.min(pageSafe * rowsPerPage, filteredLen)} of{' '}
        {filteredLen}
      </span>
      <div className="flex gap-1">
        <button
          type="button"
          disabled={pageSafe <= 1}
          onClick={() => setPage(1)}
          className="rounded p-1 hover:bg-slate-100 disabled:opacity-40"
          aria-label="First page"
        >
          <ChevronsLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          disabled={pageSafe <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="rounded p-1 hover:bg-slate-100 disabled:opacity-40"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          disabled={pageSafe >= totalPages}
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          className="rounded p-1 hover:bg-slate-100 disabled:opacity-40"
          aria-label="Next page"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <button
          type="button"
          disabled={pageSafe >= totalPages}
          onClick={() => setPage(totalPages)}
          className="rounded p-1 hover:bg-slate-100 disabled:opacity-40"
          aria-label="Last page"
        >
          <ChevronsRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export function AttendanceLogToolbar({
  title,
  filters,
  actions,
}: {
  title: string;
  filters: ReactNode;
  actions: ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Menu className="h-6 w-6 shrink-0 text-slate-600 lg:hidden" aria-hidden />
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      </div>
      {filters}
      {actions}
    </div>
  );
}

export function BulkActionBar({ selectedSize }: { selectedSize: number }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg bg-sky-100 px-4 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-200"
      >
        <Download className="h-4 w-4" />
        Download ZIP
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg bg-cyan-100 px-4 py-2 text-sm font-semibold text-cyan-900 hover:bg-cyan-200"
      >
        <Send className="h-4 w-4" />
        Send ({selectedSize})
      </button>
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-lg bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-200"
      >
        <Check className="h-4 w-4" />
        Approve ({selectedSize})
      </button>
    </div>
  );
}

export function StandardFilterBar({
  sites,
  providers,
  siteFilter,
  setSiteFilter,
  providerFilter,
  setProviderFilter,
  rangeStart,
  setRangeStart,
  rangeEnd,
  setRangeEnd,
  onFilterChange,
}: {
  sites: string[];
  providers: string[];
  siteFilter: string;
  setSiteFilter: (v: string) => void;
  providerFilter: string;
  setProviderFilter: (v: string) => void;
  rangeStart: string;
  setRangeStart: (v: string) => void;
  rangeEnd: string;
  setRangeEnd: (v: string) => void;
  onFilterChange: () => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="flex min-w-[140px] flex-1 flex-col gap-1 text-xs font-semibold text-slate-500">
        Site
        <select
          value={siteFilter}
          onChange={(e) => {
            setSiteFilter(e.target.value);
            onFilterChange();
          }}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-100"
        >
          {sites.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-[140px] flex-1 flex-col gap-1 text-xs font-semibold text-slate-500">
        Provider
        <select
          value={providerFilter}
          onChange={(e) => {
            setProviderFilter(e.target.value);
            onFilterChange();
          }}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-100"
        >
          {providers.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </label>
      <label className="flex min-w-[120px] flex-col gap-1 text-xs font-semibold text-slate-500">
        From
        <input
          type="date"
          value={rangeStart}
          onChange={(e) => {
            setRangeStart(e.target.value);
            onFilterChange();
          }}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
        />
      </label>
      <label className="flex min-w-[120px] flex-col gap-1 text-xs font-semibold text-slate-500">
        To
        <input
          type="date"
          value={rangeEnd}
          onChange={(e) => {
            setRangeEnd(e.target.value);
            onFilterChange();
          }}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-100"
        />
      </label>
    </div>
  );
}

export { Fragment, Calendar };
