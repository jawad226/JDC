'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  UserCog,
  Users,
  Plus,
  X,
  ChevronDown,
  Menu,
} from 'lucide-react';
import { useStore, useShallow } from '@/lib/store';
import { cn } from '@/lib/utils';
import { AttendanceLogPagination } from '@/components/attendance/attendanceLogUi';

const SITE_ALL = 'All';

function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return '?';
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export default function TeamAssignTLPage() {
  const {
    users,
    teams,
    sites,
    addSite,
    configureTeamAssignment,
    setTeamLeaderForTeam,
    removeUserFromTeamRoster,
    shiftUserToTeam,
    addEmployeesToTeam,
    currentUser,
  } = useStore(
    useShallow((s) => ({
      users: s.users,
      teams: s.teams,
      sites: s.sites,
      addSite: s.addSite,
      configureTeamAssignment: s.configureTeamAssignment,
      setTeamLeaderForTeam: s.setTeamLeaderForTeam,
      removeUserFromTeamRoster: s.removeUserFromTeamRoster,
      shiftUserToTeam: s.shiftUserToTeam,
      addEmployeesToTeam: s.addEmployeesToTeam,
      currentUser: s.currentUser,
    }))
  );

  const [siteFilter, setSiteFilter] = useState(SITE_ALL);
  const [selectedLeaderId, setSelectedLeaderId] = useState('');
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [modalOpen, setModalOpen] = useState(false);
  const [leaderId, setLeaderId] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(() => new Set());
  const [modalTeamName, setModalTeamName] = useState('');
  const [siteName, setSiteName] = useState('');
  const [newSiteDraft, setNewSiteDraft] = useState('');

  const [addToTeamIds, setAddToTeamIds] = useState<Set<string>>(() => new Set());

  const teamLeadersWithoutTeam = useMemo(
    () => users.filter((u) => u.role === 'Team Leader' && !u.team),
    [users]
  );

  const teamLeaderOptions = useMemo(() => {
    return users.filter((u) => {
      if (u.role !== 'Team Leader' || !u.team) return false;
      if (siteFilter !== SITE_ALL && u.workSite !== siteFilter) return false;
      return true;
    });
  }, [users, siteFilter]);

  useEffect(() => {
    if (!selectedLeaderId) return;
    const ok = teamLeaderOptions.some((u) => u.id === selectedLeaderId);
    if (!ok) setSelectedLeaderId('');
  }, [teamLeaderOptions, selectedLeaderId]);

  const selectedLeader = useMemo(
    () => users.find((u) => u.id === selectedLeaderId),
    [users, selectedLeaderId]
  );
  const selectedTeam = selectedLeader?.team ?? '';

  const teamLeadersForTeamChange = useMemo(() => {
    if (!selectedTeam) return [];
    return users.filter(
      (u) => u.role === 'Team Leader' && (!u.team || u.team === selectedTeam)
    );
  }, [users, selectedTeam]);

  const employeesWithoutTeam = useMemo(
    () => users.filter((u) => u.role === 'Employee' && !u.team),
    [users]
  );

  const rosterMembers = useMemo(() => {
    if (!selectedTeam) return [];
    return users.filter((u) => u.team === selectedTeam && u.role === 'Employee');
  }, [users, selectedTeam]);

  const tableRows = useMemo(() => {
    const rows: { id: string; name: string; email: string; team: string; site: string; role: string }[] = [];
    if (selectedLeader) {
      rows.push({
        id: `tl-${selectedLeader.id}`,
        name: selectedLeader.name,
        email: selectedLeader.email,
        team: selectedTeam,
        site: selectedLeader.workSite || '—',
        role: 'Team Leader',
      });
    }
    for (const m of rosterMembers) {
      rows.push({
        id: m.id,
        name: m.name,
        email: m.email,
        team: selectedTeam,
        site: m.workSite || selectedLeader?.workSite || '—',
        role: 'Employee',
      });
    }
    return rows;
  }, [selectedLeader, selectedTeam, rosterMembers]);

  const totalPages = Math.max(1, Math.ceil(tableRows.length / rowsPerPage) || 1);
  const pageSafe = Math.min(page, totalPages);
  const pagedRows = useMemo(() => {
    const start = (pageSafe - 1) * rowsPerPage;
    return tableRows.slice(start, start + rowsPerPage);
  }, [tableRows, pageSafe, rowsPerPage]);

  useEffect(() => {
    setPage(1);
  }, [selectedLeaderId, siteFilter]);

  const otherTeams = useMemo(
    () => teams.filter((t) => t !== selectedTeam),
    [teams, selectedTeam]
  );

  const setMsg = (r: { ok: true } | { ok: false; error: string }, okText: string) => {
    if (r.ok) setMessage({ type: 'ok', text: okText });
    else setMessage({ type: 'err', text: r.error });
  };

  const openAssignModal = () => {
    setMessage(null);
    setLeaderId('');
    setSelectedEmployees(new Set());
    setModalTeamName(selectedTeam || '');
    setSiteName(siteFilter !== SITE_ALL ? siteFilter : '');
    setNewSiteDraft('');
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const tn = modalTeamName.trim();
    const result = configureTeamAssignment({
      teamName: tn,
      leaderUserId: leaderId,
      employeeIds: [...selectedEmployees],
      siteName,
    });
    if (result.ok) {
      setMessage({ type: 'ok', text: 'Team roster saved successfully.' });
      const newLeader = useStore.getState().users.find((u) => u.id === leaderId);
      if (newLeader) setSelectedLeaderId(newLeader.id);
      setSiteFilter(newLeader?.workSite || SITE_ALL);
      closeModal();
      setSelectedEmployees(new Set());
    } else {
      setMessage({ type: 'err', text: result.error });
    }
  };

  const handleAddSite = () => {
    const t = newSiteDraft.trim();
    if (!t) return;
    addSite(t);
    setSiteName(t);
    setNewSiteDraft('');
    setMessage({ type: 'ok', text: `Site “${t}” added and selected.` });
  };

  const toggleEmployee = (id: string) => {
    setSelectedEmployees((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAddToTeam = (id: string) => {
    setAddToTeamIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddEmployeesToTeam = () => {
    if (!selectedTeam) return;
    setMessage(null);
    const r = addEmployeesToTeam(selectedTeam, [...addToTeamIds]);
    setMsg(r, 'Employee(s) added to this team.');
    if (r.ok) setAddToTeamIds(new Set());
  };

  if (!currentUser || (currentUser.role !== 'Admin' && currentUser.role !== 'HR')) {
    return null;
  }

  return (
    <div className="min-h-full bg-slate-50/80">
      <div className="mx-auto max-w-[1200px] px-4 pb-12 pt-6 sm:px-6">
        {/* Title row — Timesheet-style */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Menu className="h-7 w-7 shrink-0 text-slate-600 lg:hidden" aria-hidden />
          <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">Team Assignment</h1>
        </div>

        {/* Filter bar + primary action */}
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-1 flex-wrap items-end gap-3">
            <label className="flex min-w-[160px] flex-1 flex-col gap-1.5 text-xs font-semibold text-slate-600">
              Site name
              <div className="relative">
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={siteFilter}
                  onChange={(e) => {
                    setSiteFilter(e.target.value);
                    setMessage(null);
                  }}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-9 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value={SITE_ALL}>All sites</option>
                  {sites.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </label>
            <label className="flex min-w-[200px] flex-1 flex-col gap-1.5 text-xs font-semibold text-slate-600">
              Team Leader name
              <div className="relative">
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <select
                  value={selectedLeaderId}
                  onChange={(e) => {
                    setSelectedLeaderId(e.target.value);
                    setMessage(null);
                    setAddToTeamIds(new Set());
                  }}
                  className="w-full appearance-none rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-3 pr-9 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select team leader…</option>
                  {teamLeaderOptions.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                      {u.team ? ` · ${u.team}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </div>
          <button
            type="button"
            onClick={openAssignModal}
            title="Create new team"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
            aria-label="Create new team"
          >
            <Plus className="h-6 w-6" strokeWidth={2.5} />
          </button>
        </div>

        {/* Summary when leader selected */}
        {selectedLeader && selectedTeam ? (
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 font-medium text-slate-800 shadow-sm ring-1 ring-slate-200/80">
              <UserCog className="h-4 w-4 text-blue-600" />
              Team: <strong className="text-slate-900">{selectedTeam}</strong>
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-500">
              <Building2 className="h-4 w-4" />
              {selectedLeader.workSite || '—'}
            </span>
          </div>
        ) : null}

        {/* Table — blue header like reference */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide">Sr#</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide">Email</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide">Team</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide">Site</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wide">Role</th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!selectedLeaderId ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-slate-500">
                      <Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                      Select a <strong>site</strong> (optional) and <strong>team leader</strong> to load their team.
                    </td>
                  </tr>
                ) : pagedRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                      No members found for this team.
                    </td>
                  </tr>
                ) : (
                  pagedRows.map((row, i) => {
                    const globalIndex = (pageSafe - 1) * rowsPerPage + i + 1;
                    const isTl = row.role === 'Team Leader';
                    const memberId = isTl ? selectedLeader!.id : row.id;
                    return (
                      <tr
                        key={row.id}
                        className={cn('border-b border-slate-100', globalIndex % 2 === 0 ? 'bg-slate-50/80' : 'bg-white')}
                      >
                        <td className="px-4 py-3 text-slate-600">{globalIndex}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-200/80 text-xs font-bold text-slate-700">
                              {initials(row.name)}
                            </span>
                            <span className="font-medium text-slate-900">{row.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{row.email}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{row.team}</td>
                        <td className="px-4 py-3 text-slate-600">{row.site}</td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                              isTl ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'
                            )}
                          >
                            {row.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {isTl ? (
                            <div className="flex flex-wrap justify-end gap-1">
                              <select
                                className="max-w-[140px] rounded border border-slate-200 bg-white px-1.5 py-1 text-[11px]"
                                value={selectedLeader!.id}
                                onChange={(e) => {
                                  const r = setTeamLeaderForTeam(selectedTeam, e.target.value);
                                  setMsg(r, 'Team leader updated.');
                                }}
                              >
                                {teamLeadersForTeamChange.map((u) => (
                                  <option key={u.id} value={u.id}>
                                    {u.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!confirm('Remove team leader from this team?')) return;
                                  const r = removeUserFromTeamRoster(memberId);
                                  setMsg(r, 'Removed.');
                                  setSelectedLeaderId('');
                                }}
                                className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-800"
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap justify-end gap-1">
                              <select
                                className="max-w-[120px] rounded border border-slate-200 bg-white px-1 py-1 text-[11px]"
                                defaultValue=""
                                onChange={(e) => {
                                  const to = e.target.value;
                                  if (!to) return;
                                  const r = shiftUserToTeam(memberId, to);
                                  setMsg(r, 'Moved.');
                                  e.target.value = '';
                                }}
                              >
                                <option value="">Shift…</option>
                                {otherTeams.map((t) => (
                                  <option key={t} value={t}>
                                    {t}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!confirm(`Remove ${row.name}?`)) return;
                                  const r = removeUserFromTeamRoster(memberId);
                                  setMsg(r, 'Removed.');
                                }}
                                className="rounded border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700"
                              >
                                Remove
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {selectedLeaderId && tableRows.length > 0 ? (
            <AttendanceLogPagination
              pageSafe={pageSafe}
              totalPages={totalPages}
              filteredLen={tableRows.length}
              rowsPerPage={rowsPerPage}
              setRowsPerPage={setRowsPerPage}
              setPage={setPage}
            />
          ) : null}
        </div>

        {/* Quick add — under table */}
        {selectedTeam && selectedLeader ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900">Add employees to “{selectedTeam}”</h3>
            <p className="mt-1 text-xs text-slate-500">Unassigned employees only; site follows the team leader.</p>
            <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/50 p-2">
              {employeesWithoutTeam.length === 0 ? (
                <span className="text-xs text-slate-500">No unassigned employees.</span>
              ) : (
                employeesWithoutTeam.map((u) => (
                  <label
                    key={u.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md border border-white bg-white px-2 py-1.5 text-xs shadow-sm"
                  >
                    <input
                      type="checkbox"
                      checked={addToTeamIds.has(u.id)}
                      onChange={() => toggleAddToTeam(u.id)}
                      className="rounded border-slate-300 text-blue-600"
                    />
                    {u.name}
                  </label>
                ))
              )}
            </div>
            <button
              type="button"
              disabled={addToTeamIds.size < 1}
              onClick={handleAddEmployeesToTeam}
              className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              Add selected
            </button>
          </div>
        ) : null}

        {message && (
          <div
            role="status"
            className={cn(
              'mt-6 rounded-xl border px-4 py-3 text-sm',
              message.type === 'ok'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                : 'border-rose-200 bg-rose-50 text-rose-900'
            )}
          >
            <div className="flex gap-3">
              {message.type === 'ok' ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
              )}
              <span>{message.text}</span>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/60 p-4 backdrop-blur-[2px] sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-roster-title"
        >
          <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">New team</p>
                <h2 id="modal-roster-title" className="text-lg font-bold text-slate-900">
                  Create team roster
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-5 px-6 py-6">
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Team name</span>
                <input
                  required
                  list="modal-team-options"
                  value={modalTeamName}
                  onChange={(e) => setModalTeamName(e.target.value)}
                  placeholder="e.g. Product Squad"
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
                />
                <datalist id="modal-team-options">
                  {teams.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Team leader</span>
                <p className="mt-1 text-xs text-slate-600">Only leaders not already on a team.</p>
                <select
                  required
                  value={leaderId}
                  onChange={(e) => setLeaderId(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="">Select…</option>
                  {teamLeadersWithoutTeam.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} · {u.email}
                    </option>
                  ))}
                </select>
                {teamLeadersWithoutTeam.length === 0 && (
                  <p className="mt-2 text-xs text-amber-800">No free team leaders.</p>
                )}
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Employees (min. 2)</span>
                <p className="mt-1 text-xs text-slate-600">Unassigned only.</p>
                <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                  {employeesWithoutTeam.length === 0 ? (
                    <p className="p-3 text-center text-xs text-slate-500">None available.</p>
                  ) : (
                    employeesWithoutTeam.map((u) => (
                      <label
                        key={u.id}
                        className="flex cursor-pointer items-center gap-3 border-b border-slate-100 px-3 py-2 last:border-0 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEmployees.has(u.id)}
                          onChange={() => toggleEmployee(u.id)}
                          className="rounded border-slate-300 text-blue-600"
                        />
                        <span className="text-sm">{u.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Site</span>
                <select
                  required
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm"
                >
                  <option value="">Select…</option>
                  {sites.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <div className="mt-2 flex gap-2">
                  <input
                    value={newSiteDraft}
                    onChange={(e) => setNewSiteDraft(e.target.value)}
                    placeholder="New site"
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  />
                  <button type="button" onClick={handleAddSite} className="rounded-lg bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-900">
                    Add
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={teamLeadersWithoutTeam.length === 0 || !leaderId || selectedEmployees.size < 2}
                className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Create team
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
