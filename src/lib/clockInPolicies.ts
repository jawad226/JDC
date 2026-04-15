import { clockInBlockedBeforeOfficeStart } from '@/lib/attendanceRules';
import { useStore } from '@/lib/store';
import { getCurrentLatLng, haversineMiles } from '@/lib/geoDistance';

function radiusMilesForUser(): number {
  const s = useStore.getState();
  if (!s.geoFencingEnabled) return 0;
  if (s.geoFencingUseGlobalRadius) return Math.max(0, s.geoFencingGlobalRadiusMiles);
  const site = s.currentUser?.workSite?.trim();
  if (site && s.geoFencingSiteRadiusMiles[site] != null) {
    return Math.max(0, s.geoFencingSiteRadiusMiles[site]!);
  }
  return Math.max(0, s.geoFencingGlobalRadiusMiles);
}

/**
 * Clock in with admin policies: ad-hoc master switch, optional geo-fence.
 * Call from the dashboard Clock In button (async).
 */
export async function performClockInWithPolicies(): Promise<{ ok: true } | { ok: false; error: string }> {
  const state = useStore.getState();
  const { currentUser } = state;
  if (!currentUser) return { ok: false, error: 'You must be signed in to clock in.' };

  if (!state.adhocShiftsEnabled && currentUser.role !== 'Admin') {
    return { ok: false, error: 'Clock-in is turned off by your administrator.' };
  }

  if (currentUser.role !== 'Admin') {
    const beforeStart = clockInBlockedBeforeOfficeStart(new Date(), state.attendanceDayOverrides);
    if (beforeStart) return { ok: false, error: beforeStart };
  }

  const radius = radiusMilesForUser();
  if (state.geoFencingEnabled && radius > 0) {
    const lat = state.geoFencingOfficeLat;
    const lng = state.geoFencingOfficeLng;
    if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      return {
        ok: false,
        error: 'Geo-fencing is on but the office location is not set. Ask an admin to set latitude/longitude in Time control.',
      };
    }
    try {
      const pos = await getCurrentLatLng();
      const miles = haversineMiles(lat, lng, pos.lat, pos.lng);
      if (miles > radius) {
        return {
          ok: false,
          error: `You are about ${miles.toFixed(1)} mi from the office anchor — outside the allowed ${radius} mi radius.`,
        };
      }
    } catch {
      return {
        ok: false,
        error: 'Location access is required to clock in while geo-fencing is enabled.',
      };
    }
  }

  state.clockIn();
  return { ok: true };
}
