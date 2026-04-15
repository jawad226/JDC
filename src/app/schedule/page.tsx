import { redirect } from 'next/navigation';

type SearchParamsInput = Record<string, string | string[] | undefined>;

/** Legacy URL: `/schedule` → `/project-manager` (query string preserved). */
export default async function ScheduleRedirectPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput | Promise<SearchParamsInput>;
}) {
  const sp = (await Promise.resolve(searchParams)) ?? {};
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) q.append(key, v);
    } else {
      q.set(key, value);
    }
  }
  const qs = q.toString();
  redirect(qs ? `/project-manager?${qs}` : '/project-manager');
}
