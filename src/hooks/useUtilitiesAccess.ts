import {useEffect, useState} from 'react';
import {supabase} from '@site/src/lib/supabaseClient';
import {logger} from '../lib/logger';
import {
  DEFAULT_UTILITIES_PUBLIC_ACCESS,
  UTILITIES_PUBLIC_ACCESS_KEY,
  parseBooleanSetting,
} from '@site/src/utils/siteSettings';

type UtilitiesAccessState = {
  utilitiesPublicAccess: boolean;
  settingsChecked: boolean;
};

/**
 * The setting changes rarely (an admin toggle), but every utility page used to
 * query it again on client-side navigation. One answer per page load is
 * enough; a failed load is not cached, so the next page retries.
 */
let cached: Promise<boolean | null> | null = null;

function loadUtilitiesAccess(): Promise<boolean | null> {
  if (!cached) {
    const attempt = (async () => {
      const {data, error} = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', UTILITIES_PUBLIC_ACCESS_KEY)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return parseBooleanSetting(data?.value);
    })();
    cached = attempt;
    attempt.catch(() => {
      if (cached === attempt) cached = null;
    });
  }
  return cached;
}

/** Called after an admin changes the setting, so this tab picks the new value up. */
export function invalidateUtilitiesAccess(): void {
  cached = null;
}

export function useUtilitiesAccess(): UtilitiesAccessState {
  const [utilitiesPublicAccess, setUtilitiesPublicAccess] = useState(DEFAULT_UTILITIES_PUBLIC_ACCESS);
  const [settingsChecked, setSettingsChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    loadUtilitiesAccess()
      .then((parsed) => {
        if (parsed !== null && isMounted) {
          setUtilitiesPublicAccess(parsed);
        }
      })
      .catch((err: unknown) => {
        const message = err instanceof Error ? err.message : 'Unable to load utilities access setting.';
        logger.error('[Settings] Unable to load utilities access setting', message);
      })
      .finally(() => {
        if (isMounted) {
          setSettingsChecked(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return {utilitiesPublicAccess, settingsChecked};
}
