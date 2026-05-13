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
