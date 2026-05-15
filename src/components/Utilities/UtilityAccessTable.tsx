import React from 'react';
import Link from '@docusaurus/Link';
import {utilities} from '@site/src/data/utilities';
import {useAuthModal} from '@site/src/contexts/AuthModalContext';
import {useAuthStatus} from '@site/src/hooks/useAuthStatus';
import {useUtilitiesAccess} from '@site/src/hooks/useUtilitiesAccess';
import {useI18n} from '@site/src/contexts/I18nContext';
import styles from './UtilityAccessTable.module.css';

export default function UtilityAccessTable(): React.JSX.Element {
  const {t, tu} = useI18n();
  const {isAuthenticated, authChecked} = useAuthStatus();
  const {openLoginModal} = useAuthModal();
  const {utilitiesPublicAccess} = useUtilitiesAccess();

  const handleLaunch = (
    event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    isLocked: boolean,
  ) => {
    if (!isLocked) {
      return;
    }
    event.preventDefault();
    openLoginModal();
  };

  return (
    <div className={styles.wrapper}>
      <p className={styles.notice}>
        {utilitiesPublicAccess
          ? t('utility.allUtilitiesOpen')
          : t('utility.guestNotice')}
      </p>
      <table className="utilityTable">
        <thead>
          <tr>
            <th>{t('utility.tableColumnUtility')}</th>
            <th>{t('utility.tableColumnDescription')}</th>
            <th>{t('utility.tableColumnStandards')}</th>
            <th>{t('utility.tableColumnLaunch')}</th>
          </tr>
        </thead>
        <tbody>
          {utilities.map((utility, index) => {
            const isLocked = !utilitiesPublicAccess && authChecked && !isAuthenticated && index >= 3;
            const {name, description} = tu(utility.id);
            return (
              <tr key={utility.id}>
                <td>{name}</td>
                <td>{description}</td>
                <td>{utility.standards}</td>
                <td className={styles.launchCell}>
                  <Link
                    to={utility.href}
                    data-nobrokenlinkcheck
                    onClick={(event) => handleLaunch(event, isLocked)}
                    className={isLocked ? styles.lockedLink : undefined}
                  >
                    {isLocked ? t('utility.signInToOpen') : t('utility.open')}
                  </Link>
                  {isLocked ? <span className={styles.lockPill}>{t('utility.locked')}</span> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
