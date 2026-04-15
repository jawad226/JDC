'use client';

import { useCallback, useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Role } from '@/lib/store';
import {
  defaultTimesheetTab,
  timesheetTabsForRole,
  type TimesheetTabId,
} from '@/features/timesheet/timesheetTabs';

export function useTimesheetTab(role: Role | undefined) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabs = useMemo(() => timesheetTabsForRole(role), [role]);
  const validIds = useMemo(() => new Set<string>(tabs.map((t) => t.id)), [tabs]);
  const fallback = useMemo(() => defaultTimesheetTab(role), [role]);

  const raw = searchParams.get('tab');
  const activeTab: TimesheetTabId = raw && validIds.has(raw) ? (raw as TimesheetTabId) : fallback;

  useEffect(() => {
    if (!role) return;
    if (raw != null && validIds.has(raw)) return;
    const q = new URLSearchParams(searchParams.toString());
    q.set('tab', fallback);
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  }, [role, raw, validIds, fallback, pathname, router, searchParams]);

  const setTab = useCallback(
    (id: string) => {
      const q = new URLSearchParams(searchParams.toString());
      q.set('tab', id);
      router.push(`${pathname}?${q.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return { tabs, activeTab, setTab, validIds };
}
