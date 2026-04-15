import type { User } from '@/lib/store';

/** Prefer HR code, then internal user id (and optional timesheet userId). */
export function employeeDisplayId(user: User | undefined, fallbackUserId?: string): string {
  return user?.employeeCode ?? user?.id ?? fallbackUserId ?? '—';
}

/** Fixed "Site" categories shown on Company Time Records (maps from user profile). */
export const COMPANY_SITE_OPTIONS = [
  'All sites',
  'Web Development',
  'MERN Stack',
  'Full Stack',
  'Frontend Developer',
  'Backend Developer',
] as const;

export const PROVIDER_ROLE_OPTIONS = ['All providers', 'Employees', 'HR', 'Team Leader'] as const;

/** HR attendance UI: filter by Employee or Team Leader only (plus All). */
export const HR_PROVIDER_FILTER_OPTIONS = ['All providers', 'Employees', 'Team Leader'] as const;

/**
 * True if query matches unique id, employee code, email, or name (substring, case-insensitive).
 */
export function userMatchesAttendanceSearch(user: User | undefined, fallbackUserId: string, q: string): boolean {
  const t = q.trim().toLowerCase();
  if (!t) return true;
  if (!user) return fallbackUserId.toLowerCase().includes(t);
  return (
    user.id.toLowerCase().includes(t) ||
    (user.employeeCode?.toLowerCase().includes(t) ?? false) ||
    user.email.toLowerCase().includes(t) ||
    (user.name?.toLowerCase().includes(t) ?? false)
  );
}

/** Map a user to one site bucket for filtering. */
export function siteBucketForUser(u: User | undefined): string {
  if (!u) return 'Web Development';
  const dept = u.department;
  const team = u.team ?? '';
  if (dept === 'Web Design') return 'Frontend Developer';
  if (dept === 'SEO') return 'Backend Developer';
  if (dept === 'MERN Stack') {
    if (team === 'Development') return 'Full Stack';
    return 'MERN Stack';
  }
  if (dept === 'Web Development') return 'Web Development';
  return 'Web Development';
}

export function providerLabelForRole(role: string | undefined): 'Employees' | 'HR' | 'Team Leader' | 'Other' {
  if (role === 'Employee') return 'Employees';
  if (role === 'HR') return 'HR';
  if (role === 'Team Leader') return 'Team Leader';
  return 'Other';
}
