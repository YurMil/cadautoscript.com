import React from 'react';
import clsx from 'clsx';
import {useColorMode} from '@docusaurus/theme-common';
import {useUserSettings} from '@site/src/contexts/UserSettingsContext';
import styles from './styles.module.css';

type Props = {
  mobile?: boolean;
  className?: string;
};

export default function ThemeToggleNavbarItem({mobile, className}: Props): React.JSX.Element {
  const {colorMode, setColorMode} = useColorMode();
  const {updateSettings} = useUserSettings();
  const isDark = colorMode !== 'light';
  const nextMode = isDark ? 'light' : 'dark';

  const handleToggle = () => {
    setColorMode(nextMode);
    updateSettings({ default_theme: nextMode }).catch(console.error);
  };

  if (mobile) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className={clsx(styles.mobileToggle, className)}
        aria-label={`Switch to ${nextMode} theme`}
      >
        <span className={styles.mobileIcon} aria-hidden="true">
          {isDark ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="4.75" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M12 2.75V5.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M12 18.75V21.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M21.25 12H18.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M5.25 12H2.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M18.54 5.46L16.77 7.23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M7.23 16.77L5.46 18.54" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M18.54 18.54L16.77 16.77" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M7.23 7.23L5.46 5.46" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 14.5A7.5 7.5 0 0 1 9.5 4 8.75 8.75 0 1 0 20 14.5Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        <span className={styles.mobileLabel}>Theme</span>
        <span className={styles.mobileValue}>{isDark ? 'Dark' : 'Light'}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={clsx('navbar__item', 'navbar-theme-toggle-control', styles.desktopToggle, className)}
      aria-label={`Switch to ${nextMode} theme`}
      title={`Switch to ${nextMode} theme`}
    >
      {isDark ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="4.75" stroke="currentColor" strokeWidth="1.8"/>
          <path d="M12 2.75V5.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M12 18.75V21.25" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M21.25 12H18.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M5.25 12H2.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M18.54 5.46L16.77 7.23" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M7.23 16.77L5.46 18.54" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M18.54 18.54L16.77 16.77" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          <path d="M7.23 7.23L5.46 5.46" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M20 14.5A7.5 7.5 0 0 1 9.5 4 8.75 8.75 0 1 0 20 14.5Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
