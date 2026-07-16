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

export function useUtilitiesAccess(): UtilitiesAccessState {
  const [utilitiesPublicAccess, setUtilitiesPublicAccess] = useState(DEFAULT_UTILITIES_PUBLIC_ACCESS);
  const [settingsChecked, setSettingsChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadSetting = async () => {
      try {
        const {data, error} = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', UTILITIES_PUBLIC_ACCESS_KEY)
          .maybeSingle();

        if (error) {
          logger.error('[Settings] Unable to load utilities access setting', error.message);
          return;
        }

        const parsed = parseBooleanSetting(data?.value);
        if (parsed !== null && isMounted) {
          setUtilitiesPublicAccess(parsed);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load utilities access setting.';
        logger.error('[Settings] Unable to load utilities access setting', message);
      } finally {
        if (isMounted) {
          setSettingsChecked(true);
        }
      }
    };

    void loadSetting();

    return () => {
      isMounted = false;
    };
  }, []);

  return {utilitiesPublicAccess, settingsChecked};
}
