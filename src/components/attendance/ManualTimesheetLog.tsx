'use client';

import { useMemo, useState, Fragment } from 'react';
import { useStore } from '@/lib/store';
import type { ManualTimeRequest, User } from '@/lib/store';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import {
  ApprovedStatusPill,
  AttendanceLogPagination,
  BulkActionBar,
  StandardFilterBar,
  AttendanceLogToolbar,
} from '@/components/attendance/attendanceLogUi';
import { formatHoursMinutes } from '@/components/attendance/attendanceLogUi';
import {
  Calendar,
  Building2,
  User as UserIcon,
  Shield,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileWarning,
  Download,
  Send,
  Trash2,
} from 'lucide-react';

type ManualGroupRow = {
  id: string;
  userId: string;
  weekStart: Date;
  weekEnd: Date;
  requests: ManualTimeRequest[];
  totalHours: number;
  user?: User;
};

function hoursForManualRequest(r: ManualTimeRequest): number {
  const parse = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
  };
  let mins = parse(r.clockOutTime) - parse(r.clockInTime);
  if (r.breakInTime && r.breakOutTime) {
    mins -= parse(r.breakOutTime) - parse(r.breakInTime);
  }
  return Math.max(0, mins) / 60;
}

function buildManualGroups(requests: ManualTimeRequest[], users: User[]): ManualGroupRow[] {
  const approved = requests.filter((r) => r.status === 'Approved');
  const map = new Map<string, ManualTimeRequest[]>();

  for (const r of approved) {
    const d = new Date(r.date + 'T12:00:00');
    const ws = startOfWeek(d, { weekStartsOn: 1 });
    const key = `${r.userId}__${format(ws, 'yyyy-MM-dd')}`;
    const arr = map.get(key) || [];
    arr.push(r);
    map.set(key, arr);
  }

  const groups: ManualGroupRow[] = [];
  map.forEach((reqs, key) => {
    const [userId] = key.split('__');
    const ws = startOfWeek(new Date(reqs[0].date + 'T12:00:00'), { weekStartsOn: 1 });
    const we = endOfWeek(ws, { weekStartsOn: 1 });
    const total = reqs.reduce((acc, r) => acc + hoursForManualRequest(r), 0);
    const user = users.find((u) => u.id === userId);
    groups.push({
      id: key,
      userId,
      weekStart: ws,
      weekEnd: we,
      requests: reqs.sort((a, b) => a.date.localeCompare(b.date)),
      totalHours: total,
      user,
    });
  });

  return groups.sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime());
}

export function ManualTimesheetLog() {
  const { manualTimeRequests, users } = useStore();

  const allGroups = useMemo(() => buildManualGroups(manualTimeRequests, users), [manualTimeRequests, users]);

  const sites = useMemo(() => {
    const s = new Set<string>();
    users.forEach((u) => s.add(u.team || u.department || 'General'));
    return ['All sites', ...Array.from(s).sort()];
  }, [users]);

  const providers = useMemo(() => {
    const s = new Set<string>();
    users.forEach((u) => s.add(u.name));
    return ['All providers', ...Array.from(s).sort()];
  }, [users]);

  const [siteFilter, setSiteFilter] = useState('All sites');
  const [providerFilter, setProviderFilter] = useState('All providers');
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');

  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const resetPage = () => setPage(1);

  const filtered = useMemo(() => {
    return allGroups.filter((g) => {
      const site = g.user?.team || g.user?.department || 'General';
      if (siteFilter !== 'All sites' && site !== siteFilter) return false;
      if (providerFilter !== 'All providers' && g.user?.name !== providerFilter) return false;
      if (rangeStart) {
        const rs = new Date(rangeStart);
        if (g.weekEnd < rs) return false;
      }
      if (rangeEnd) {
        const re = new Date(rangeEnd);
        re.setHours(23, 59, 59, 999);
        if (g.weekStart > re) return false;
      }
      return true;
    });
  }, [allGroups, siteFilter, providerFilter, rangeStart, rangeEnd]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const pageSafe = Math.min(page, totalPages);
  const paginated = filtered.slice((pageSafe - 1) * rowsPerPage, pageSafe * rowsPerPage);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map((p) => p.id)));
  };

  const toggleExpand = (id: string) => {
    setExpandedId((e) => (e === id ? null : id));
  };

  return (
    <div className="space-y-4">
      <AttendanceLogToolbar
        title="Manual Timesheet"
        filters={
          <StandardFilterBar
            sites={sites}
            providers={providers}
            siteFilter={siteFilter}
            setSiteFilter={setSiteFilter}
            providerFilter={providerFilter}
            setProviderFilter={setProviderFilter}
            rangeStart={rangeStart}
            setRangeStart={setRangeStart}
            rangeEnd={rangeEnd}
            setRangeEnd={setRangeEnd}
            onFilterChange={resetPage}
          />
        }
        actions={<BulkActionBar selectedSize={selected.size} />}
      />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-blue-600 text-white">
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={paginated.length > 0 && selected.size === paginated.length}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-white/30"
                  />
                </th>
                <th className="px-3 py-3 font-semibold">Sr#</th>
                <th className="px-3 py-3 font-semibold">Provider</th>
                <th className="px-3 py-3 font-semibold">Site</th>
                <th className="px-3 py-3 font-semibold">Period</th>
                <th className="px-3 py-3 font-semibold">Hours</th>
                <th className="px-3 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                    No approved manual timesheet periods match your filters.
                  </td>
                </tr>
              ) : (
                paginated.map((g, idx) => {
                  const sr = (pageSafe - 1) * rowsPerPage + idx + 1;
                  const site = g.user?.team || g.user?.department || '—';
                  const period = `${format(g.weekStart, 'MM/dd/yyyy')} - ${format(g.weekEnd, 'MM/dd/yyyy')}`;
                  const zebra = idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/80';

                  return (
                    <Fragment key={g.id}>
                      <tr
                        className={`${zebra} cursor-pointer border-b border-slate-100 transition-colors hover:bg-blue-50/40`}
                        onClick={() => toggleExpand(g.id)}
                      >
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selected.has(g.id)}
                            onChange={() => toggleSelect(g.id)}
                            className="h-4 w-4 rounded border-slate-300"
                          />
                        </td>
                        <td className="px-3 py-3 font-medium text-slate-700">{sr}</td>
                        <td className="px-3 py-3 font-medium text-slate-900">{g.user?.name ?? 'Unknown'}</td>
                        <td className="px-3 py-3 text-slate-700">{site}</td>
                        <td className="px-3 py-3 text-slate-600">{period}</td>
                        <td className="px-3 py-3 font-semibold tabular-nums text-slate-900">
                          {formatHoursMinutes(g.totalHours)}
                        </td>
                        <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                          <ApprovedStatusPill />
                        </td>
                      </tr>
                      {expandedId === g.id && (
                        <tr className={zebra}>
                          <td colSpan={7} className="border-b border-slate-200 p-0">
                            <ManualDetailPanel group={g} onClose={() => setExpandedId(null)} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <AttendanceLogPagination
          pageSafe={pageSafe}
          totalPages={totalPages}
          filteredLen={filtered.length}
          rowsPerPage={rowsPerPage}
          setRowsPerPage={setRowsPerPage}
          setPage={setPage}
        />
      </div>
    </div>
  );
}

function ManualDetailPanel({ group, onClose }: { group: ManualGroupRow; onClose: () => void }) {
  const site = group.user?.team || group.user?.department || '—';
  const periodLabel = `${format(group.weekStart, 'MMM d')} - ${format(group.weekEnd, 'MMM d, yyyy')}`;
  const badgeId = group.userId.slice(0, 4).toUpperCase();

  return (
    <div className="bg-slate-50/90 p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Manual Timesheet</h3>
          <p className="text-xs text-slate-500">Approved entries — click row again to collapse</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Close
        </button>
      </div>

      <div className="mb-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-50 p-4 shadow-inner">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/80 pb-3">
          <div className="flex items-center gap-2 text-slate-800">
            <Calendar className="h-5 w-5 text-blue-600" />
            <span className="font-semibold">{periodLabel}</span>
          </div>
          <span className="text-lg font-bold text-blue-600">{formatHoursMinutes(group.totalHours)}</span>
        </div>
        <div className="mt-3 space-y-2 text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 shrink-0 text-slate-500" />
            <span>{site}</span>
          </div>
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 shrink-0 text-slate-500" />
            <span>{group.user?.name ?? 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 shrink-0 text-slate-500" />
            <span className="font-mono text-xs">{badgeId}</span>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="text-slate-500">Status:</span>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">APPROVED</span>
          </div>
        </div>
      </div>

      <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
          <div className="flex items-center gap-2 text-slate-600">
            <ZoomIn className="h-4 w-4" />
            <span className="text-xs">0%</span>
            <ZoomIn className="h-4 w-4" />
          </div>
          <div className="flex items-center gap-1 text-slate-600">
            <ChevronsLeft className="h-4 w-4" />
            <ChevronLeft className="h-4 w-4" />
            <span className="px-2 text-xs">1 / 0</span>
            <ChevronRight className="h-4 w-4" />
            <ChevronsRight className="h-4 w-4" />
          </div>
        </div>
        <div className="flex min-h-[180px] items-center justify-center bg-slate-50/50 px-4 py-12 text-center text-sm text-slate-500">
          <div>
            <FileWarning className="mx-auto mb-2 h-10 w-10 text-slate-300" />
            PDF unavailable or failed to load. Please retry…
          </div>
        </div>
      </div>

      <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="px-3 py-2">Sr#</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">In / Out</th>
              <th className="px-3 py-2">Hours</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {group.requests.map((r, i) => (
              <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/80'}>
                <td className="border-b border-slate-100 px-3 py-2">{i + 1}</td>
                <td className="border-b border-slate-100 px-3 py-2">{format(new Date(r.date + 'T12:00:00'), 'MM/dd/yyyy')}</td>
                <td className="border-b border-slate-100 px-3 py-2">
                  {r.clockInTime} → {r.clockOutTime}
                </td>
                <td className="border-b border-slate-100 px-3 py-2 font-medium tabular-nums">
                  {hoursForManualRequest(r).toFixed(2)}
                </td>
                <td className="border-b border-slate-100 px-3 py-2">
                  <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                    Approved
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-600"
        >
          <Send className="h-4 w-4" />
          Send to Client
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
        >
          <Trash2 className="h-4 w-4" />
          Delete Timesheet
        </button>
      </div>
    </div>
  );
}
