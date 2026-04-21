import { taskApiGet, taskApiPut } from '@/lib/api/task-request-handler';
import { API_PATHS } from '@/lib/api/api-base-urls';
import type { EmployeeDailyUpdate, HRDailySummary, TeamLeaderDailySummary } from '@/lib/store';

const DAILY_UPDATES_API_PATHS = API_PATHS.task.dailyUpdates;

type EmployeeUpdateRow = {
  id: string | number;
  userId: string | number;
  date: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

type TeamLeaderSummaryRow = {
  id: string | number;
  team: string;
  date: string;
  authorId: string | number;
  body: string;
  createdAt: string;
  updatedAt: string;
};

type HrSummaryRow = {
  id: string | number;
  date: string;
  authorId: string | number;
  body: string;
  createdAt: string;
  updatedAt: string;
};

type ListResponse<T> = { success: boolean; data: T[] };
type OneResponse<T> = { success: boolean; data: T };

type TlBundleResponse = {
  success: boolean;
  team_name: string | null;
  members?: Array<{
    id: string | number;
    name?: string | null;
    email?: string | null;
    role?: string | null;
  }>;
  employee_updates: EmployeeUpdateRow[];
  team_leader_summary: TeamLeaderSummaryRow | null;
};

type LeadershipResponse = {
  success: boolean;
  team_leader_summaries: TeamLeaderSummaryRow[];
  hr_summary: HrSummaryRow | null;
};

function toYmd(val: unknown): string {
  const s = String(val ?? '').trim();
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return s.slice(0, 10);
}

function mapEmployeeRow(r: EmployeeUpdateRow): EmployeeDailyUpdate {
  return {
    id: String(r.id),
    userId: String(r.userId),
    date: toYmd(r.date),
    body: r.body ?? '',
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function mapTlRow(r: TeamLeaderSummaryRow): TeamLeaderDailySummary {
  return {
    id: String(r.id),
    team: r.team ?? '',
    date: toYmd(r.date),
    authorId: String(r.authorId),
    body: r.body ?? '',
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function mapHrRow(r: HrSummaryRow): HRDailySummary {
  return {
    id: String(r.id),
    date: toYmd(r.date),
    authorId: String(r.authorId),
    body: r.body ?? '',
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export async function fetchMyEmployeeDailyUpdatesApi(): Promise<EmployeeDailyUpdate[]> {
  const res = await taskApiGet<ListResponse<EmployeeUpdateRow>>(DAILY_UPDATES_API_PATHS.employeeList);
  return (res.data || []).map(mapEmployeeRow);
}

export async function upsertMyEmployeeDailyUpdateApi(input: {
  date: string;
  body: string;
}): Promise<EmployeeDailyUpdate> {
  const res = await taskApiPut<OneResponse<EmployeeUpdateRow>>(DAILY_UPDATES_API_PATHS.employeeUpsert, {
    date: input.date,
    body: input.body,
  });
  return mapEmployeeRow(res.data);
}

export async function fetchTeamLeaderDailyBundleApi(date: string): Promise<{
  teamName: string | null;
  members: Array<{ id: string; name: string; email: string; role: string }>;
  employeeUpdates: EmployeeDailyUpdate[];
  mySummary: TeamLeaderDailySummary | null;
}> {
  const res = await taskApiGet<TlBundleResponse>(DAILY_UPDATES_API_PATHS.teamLeaderBundle, { params: { date } });
  return {
    teamName: res.team_name,
    members: (res.members || []).map((m) => ({
      id: String(m.id),
      name: m.name != null ? String(m.name) : '',
      email: m.email != null ? String(m.email) : '',
      role: m.role != null ? String(m.role) : '',
    })),
    employeeUpdates: (res.employee_updates || []).map(mapEmployeeRow),
    mySummary: res.team_leader_summary ? mapTlRow(res.team_leader_summary) : null,
  };
}

export async function upsertTeamLeaderSummaryApi(input: {
  date: string;
  body: string;
}): Promise<TeamLeaderDailySummary> {
  const res = await taskApiPut<OneResponse<TeamLeaderSummaryRow>>(DAILY_UPDATES_API_PATHS.teamLeaderUpsertSummary, {
    date: input.date,
    body: input.body,
  });
  return mapTlRow(res.data);
}

export async function fetchLeadershipOverviewApi(date: string): Promise<{
  teamLeaderSummaries: TeamLeaderDailySummary[];
  hrSummary: HRDailySummary | null;
}> {
  const res = await taskApiGet<LeadershipResponse>(DAILY_UPDATES_API_PATHS.leadershipOverview, { params: { date } });
  return {
    teamLeaderSummaries: (res.team_leader_summaries || []).map(mapTlRow),
    hrSummary: res.hr_summary ? mapHrRow(res.hr_summary) : null,
  };
}

export async function upsertHrSummaryApi(input: { date: string; body: string }): Promise<HRDailySummary> {
  const res = await taskApiPut<OneResponse<HrSummaryRow>>(DAILY_UPDATES_API_PATHS.hrUpsertSummary, {
    date: input.date,
    body: input.body,
  });
  return mapHrRow(res.data);
}

