import React from 'react';
import styles from '@site/src/pages/admin/index.module.css';

type Props = {
  settingsLoading: boolean;
  settingsSaving: boolean;
  utilitiesPublicAccess: boolean;
  onToggle: () => void;
};

export default function SettingsTab({
  settingsLoading,
  settingsSaving,
  utilitiesPublicAccess,
  onToggle,
}: Props): React.JSX.Element {
  return (
    <section className={styles.panel}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarLeft}>
          {settingsLoading ? 'Loading settings...' : 'Utilities access'}
        </div>
        <div className={styles.toolbarRight}>
          <button
            type="button"
            className={utilitiesPublicAccess ? styles.secondaryBtn : styles.primaryBtn}
            onClick={onToggle}
            disabled={settingsLoading || settingsSaving}
          >
            {settingsSaving
              ? 'Saving...'
              : utilitiesPublicAccess
              ? 'Disable public access'
              : 'Enable public access'}
          </button>
        </div>
      </div>
      <p className={styles.muted}>
        When enabled, all utilities open without sign-in. When disabled, only the first three are free.
      </p>
      <p className={styles.subtle}>
        Status: {utilitiesPublicAccess ? 'Open to all visitors' : 'Sign-in required for most utilities'}
      </p>
    </section>
  );
}
