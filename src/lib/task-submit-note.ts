import type { Task } from '@/lib/store';

/** Latest note from the assignee’s Submit action (stored on history as `feedback`). */
export function getLatestSubmitNote(task: Task): string | null {
  const withNote = (task.history || []).filter((e) => e.action === 'Submit' && e.feedback?.trim());
  if (!withNote.length) return null;
  withNote.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  return withNote[0]!.feedback!.trim();
}
