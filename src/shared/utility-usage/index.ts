import {supabase} from '@site/src/lib/supabaseClient';

export type UtilityUsageStat = {
  utilityId: string;
  launchCount: number;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
};

type UtilityUsageRow = {
  utility_id: string;
  launch_count: number | null;
  first_opened_at: string | null;
  last_opened_at: string | null;
};

const RECENT_REPORT_WINDOW_MS = 10_000;
const recentReports = new Map<string, number>();

function normalizeUsageRow(row: UtilityUsageRow): UtilityUsageStat {
  return {
    utilityId: row.utility_id,
    launchCount: row.launch_count ?? 0,
    firstOpenedAt: row.first_opened_at,
    lastOpenedAt: row.last_opened_at,
  };
}

export async function listUtilityUsage(): Promise<UtilityUsageStat[]> {
  const {data, error} = await supabase
    .from('user_utility_usage')
    .select('utility_id, launch_count, first_opened_at, last_opened_at')
    .order('launch_count', {ascending: false})
    .order('last_opened_at', {ascending: false});

  if (error) {
    throw new Error(`listUtilityUsage: ${error.message}`);
  }

  return ((data ?? []) as UtilityUsageRow[]).map(normalizeUsageRow);
}

type UtilityPopularityRow = {
  utility_id: string;
  total_launches: number | null;
};

const POPULARITY_CACHE_KEY = 'cas:utility-popularity:v1';
const POPULARITY_TTL_MS = 12 * 60 * 60 * 1000; // 12h

function readPopularityCache(): string[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(POPULARITY_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as {ts?: number; order?: unknown};
    if (!parsed || typeof parsed.ts !== 'number' || !Array.isArray(parsed.order)) {
      return null;
    }
    if (Date.now() - parsed.ts > POPULARITY_TTL_MS) return null;
    return parsed.order.filter((id): id is string => typeof id === 'string');
  } catch {
    return null;
  }
}

function writePopularityCache(order: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      POPULARITY_CACHE_KEY,
      JSON.stringify({ts: Date.now(), order})
    );
  } catch {
    // Storage may be full or disabled (private mode) — ranking is non-essential.
  }
}

/**
 * Global popularity ranking shared across all users, used as the default order
 * for anonymous visitors. Returns utility ids ordered most-popular-first.
 *
 * Backed by the `get_utility_popularity` RPC, which only exposes aggregate
 * launch counts (no per-user data). Results are cached in localStorage with a
 * 12h TTL so a visitor hits the database at most once per window.
 */
export async function listGlobalUtilityPopularity(): Promise<string[]> {
  const cached = readPopularityCache();
  if (cached) return cached;

  const {data, error} = await supabase.rpc('get_utility_popularity');

  if (error) {
    throw new Error(`listGlobalUtilityPopularity: ${error.message}`);
  }

  const order = ((data ?? []) as UtilityPopularityRow[])
    .map((row) => row?.utility_id)
    .filter((id): id is string => typeof id === 'string' && id.length > 0);

  writePopularityCache(order);
  return order;
}

export type UtilityPopularity = {
  utilityId: string;
  totalLaunches: number;
};

/**
 * Global popularity with launch counts (no caching) — used by the admin
 * dashboard. Backed by the same aggregate-only `get_utility_popularity` RPC.
 */
export async function listUtilityPopularity(): Promise<UtilityPopularity[]> {
  const {data, error} = await supabase.rpc('get_utility_popularity');

  if (error) {
    throw new Error(`listUtilityPopularity: ${error.message}`);
  }

  return ((data ?? []) as UtilityPopularityRow[])
    .filter((row) => row && typeof row.utility_id === 'string' && row.utility_id.length > 0)
    .map((row) => ({
      utilityId: row.utility_id,
      totalLaunches: row.total_launches ?? 0,
    }));
}

export type AdminUtilityUsageRow = {
  userId: string;
  fullName: string | null;
  username: string | null;
  email: string | null;
  utilityId: string;
  launchCount: number;
  lastOpenedAt: string | null;
};

type AdminUtilityUsageRpcRow = {
  user_id: string;
  full_name: string | null;
  username: string | null;
  email: string | null;
  utility_id: string;
  launch_count: number | null;
  last_opened_at: string | null;
};

/**
 * Per-user utility usage across every account. Admin-only: the backing
 * `get_admin_utility_usage` RPC raises unless the caller is an admin.
 */
export async function listAdminUtilityUsage(): Promise<AdminUtilityUsageRow[]> {
  const {data, error} = await supabase.rpc('get_admin_utility_usage');

  if (error) {
    throw new Error(`listAdminUtilityUsage: ${error.message}`);
  }

  return ((data ?? []) as AdminUtilityUsageRpcRow[])
    .filter((row) => row && typeof row.user_id === 'string' && typeof row.utility_id === 'string')
    .map((row) => ({
      userId: row.user_id,
      fullName: row.full_name,
      username: row.username,
      email: row.email,
      utilityId: row.utility_id,
      launchCount: row.launch_count ?? 0,
      lastOpenedAt: row.last_opened_at,
    }));
}

export async function incrementUtilityUsage(utilityId: string): Promise<void> {
  const trimmedUtilityId = utilityId.trim();
  if (!trimmedUtilityId) return;

  const {error} = await supabase.rpc('increment_utility_usage', {
    p_utility_id: trimmedUtilityId,
  });

  if (error) {
    throw new Error(`incrementUtilityUsage: ${error.message}`);
  }
}

/**
 * Anonymous launch counter — aggregate only, no identity attached. The backing
 * `increment_guest_utility_usage` RPC validates the id and upserts a single
 * per-utility row (see issue #112).
 */
export async function incrementGuestUtilityUsage(utilityId: string): Promise<void> {
  const trimmedUtilityId = utilityId.trim();
  if (!trimmedUtilityId) return;

  const {error} = await supabase.rpc('increment_guest_utility_usage', {
    p_utility_id: trimmedUtilityId,
  });

  if (error) {
    throw new Error(`incrementGuestUtilityUsage: ${error.message}`);
  }
}

export function shouldReportUtilityUsage(utilityId: string, userId: string | null): boolean {
  if (!userId) return false;

  const key = `${userId}:${utilityId}`;
  const now = Date.now();
  const lastReportedAt = recentReports.get(key);

  if (lastReportedAt && now - lastReportedAt < RECENT_REPORT_WINDOW_MS) {
    return false;
  }

  recentReports.set(key, now);
  return true;
}
