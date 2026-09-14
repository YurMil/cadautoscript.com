import {useEffect, useMemo, useState} from 'react';
import type {UtilityDescriptor} from '@site/src/data/utilities';
import {useAuthStatus} from '@site/src/hooks/useAuthStatus';
import {useUserSettings} from '@site/src/contexts/UserSettingsContext';
import {logger} from '@site/src/lib/logger';
import {
  listUtilityUsage,
  listGlobalUtilityPopularity,
  type UtilityUsageStat,
} from '@site/src/shared/utility-usage';

function getUsageTimestamp(value: string | null | undefined): number {
  if (!value) return 0;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

/**
 * Orders a catalog list for the current visitor: signed-in users with smart
 * sorting see their own most-used tools first, anonymous visitors see the
 * global popularity ranking, and everyone else gets the curated order of the
 * list as passed in.
 */
export function useOrderedUtilities(list: UtilityDescriptor[]): UtilityDescriptor[] {
  const {user, isAuthenticated, authChecked} = useAuthStatus();
  const {settings} = useUserSettings();

  const [usageStats, setUsageStats] = useState<UtilityUsageStat[]>([]);
  const [globalOrder, setGlobalOrder] = useState<string[]>([]);

  // Default curated order, precomputed once per list so sort comparators can
  // resolve a utility's base position in O(1) instead of O(n) via indexOf.
  const defaultIndexById = useMemo(() => new Map(list.map((u, index) => [u.id, index])), [list]);

  const usageByUtilityId = useMemo(() => {
    return new Map(usageStats.map((stat) => [stat.utilityId, stat]));
  }, [usageStats]);

  const globalRankByUtilityId = useMemo(() => {
    return new Map(globalOrder.map((id, index) => [id, index]));
  }, [globalOrder]);

  const ordered = useMemo(() => {
    const defaultOrder = (a: UtilityDescriptor, b: UtilityDescriptor) =>
      (defaultIndexById.get(a.id) ?? Number.MAX_SAFE_INTEGER) -
      (defaultIndexById.get(b.id) ?? Number.MAX_SAFE_INTEGER);

    // Logged-in users with smart sorting on: personal order by their own usage.
    if (isAuthenticated && settings.smart_sorting && usageStats.length > 0) {
      return [...list].sort((a, b) => {
        const aUsage = usageByUtilityId.get(a.id);
        const bUsage = usageByUtilityId.get(b.id);
        const countDiff = (bUsage?.launchCount ?? 0) - (aUsage?.launchCount ?? 0);

        if (countDiff !== 0) {
          return countDiff;
        }

        const timeDiff =
          getUsageTimestamp(bUsage?.lastOpenedAt) - getUsageTimestamp(aUsage?.lastOpenedAt);

        if (timeDiff !== 0) {
          return timeDiff;
        }

        return defaultOrder(a, b);
      });
    }

    // Anonymous visitors: fall back to the global popularity ranking when loaded.
    if (!isAuthenticated && globalOrder.length > 0) {
      return [...list].sort((a, b) => {
        const aRank = globalRankByUtilityId.get(a.id) ?? Number.MAX_SAFE_INTEGER;
        const bRank = globalRankByUtilityId.get(b.id) ?? Number.MAX_SAFE_INTEGER;

        if (aRank !== bRank) {
          return aRank - bRank;
        }

        return defaultOrder(a, b);
      });
    }

    return list;
  }, [
    list,
    defaultIndexById,
    isAuthenticated,
    usageByUtilityId,
    usageStats.length,
    settings.smart_sorting,
    globalOrder,
    globalRankByUtilityId,
  ]);

  useEffect(() => {
    if (!authChecked || !isAuthenticated) {
      setUsageStats([]);
      return;
    }

    let isMounted = true;

    const loadUsage = async () => {
      try {
        const stats = await listUtilityUsage();
        if (isMounted) {
          setUsageStats(stats);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load utility usage.';
        logger.warn('[UtilityUsage] Unable to load utility ranking', message);
        if (isMounted) {
          setUsageStats([]);
        }
      }
    };

    void loadUsage();

    return () => {
      isMounted = false;
    };
  }, [authChecked, isAuthenticated, user?.id]);

  useEffect(() => {
    // Global popularity is only used as the anonymous fallback order.
    if (!authChecked || isAuthenticated) {
      return;
    }

    let isMounted = true;

    const loadGlobalRanking = async () => {
      try {
        const order = await listGlobalUtilityPopularity();
        if (isMounted) {
          setGlobalOrder(order);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to load global utility ranking.';
        logger.warn('[UtilityUsage] Unable to load global ranking', message);
      }
    };

    void loadGlobalRanking();

    return () => {
      isMounted = false;
    };
  }, [authChecked, isAuthenticated]);

  return ordered;
}
