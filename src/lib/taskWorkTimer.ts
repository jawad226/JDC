import type { Task, TaskHistoryEntry } from '@/lib/store';

/** ISO time when the task last entered `In Progress` (current working stint). */
export function getCurrentInProgressStartedAtIso(task: Task): string | null {
  if (task.status !== 'In Progress') return null;
  const h = task.history;
  if (!h?.length) return null;
  const toInProgress = h.filter((e) => e.toStatus === 'In Progress');
  if (!toInProgress.length) return null;
  toInProgress.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return toInProgress[0]?.at ?? null;
}

export function formatElapsedCompact(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/** Chronological history entries from the last `days` (by `entry.at`). */
export function filterTaskHistoryLastDays(
  history: TaskHistoryEntry[] | undefined,
  days: number,
  now: Date
): TaskHistoryEntry[] {
  if (!history?.length) return [];
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  return [...history]
    .filter((e) => new Date(e.at).getTime() >= cutoff)
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}

/** Task had any history (or is still in progress) within the rolling `days` window. */
export function taskHasActivityInLastDays(task: Task, days: number, now: Date): boolean {
  if (task.status === 'In Progress') return true;
  const cutoff = now.getTime() - days * 24 * 60 * 60 * 1000;
  return (task.history || []).some((e) => new Date(e.at).getTime() >= cutoff);
}

export function getLatestHistoryAtMs(task: Task): number {
  const h = task.history;
  if (!h?.length) return 0;
  return Math.max(...h.map((e) => new Date(e.at).getTime()));
}

/**
 * Sum of all time spent in `In Progress` from history (closed stints + open stint if still In Progress, through `now`).
 */
export function getTotalWorkMsOnTask(task: Task, now: Date): number {
  const h = [...(task.history || [])].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()
  );
  let total = 0;
  let stintStart: number | null = null;

  for (const e of h) {
    if (e.toStatus === 'In Progress') {
      stintStart = new Date(e.at).getTime();
    } else if (e.fromStatus === 'In Progress' && stintStart !== null) {
      total += new Date(e.at).getTime() - stintStart;
      stintStart = null;
    }
  }

  if (stintStart !== null && task.status === 'In Progress') {
    total += now.getTime() - stintStart;
  }

  return Math.max(0, total);
}
