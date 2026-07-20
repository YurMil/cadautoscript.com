import React from 'react';
import Link from '@docusaurus/Link';
import {utilities} from '@site/src/data/utilities';
import {useI18n} from '@site/src/contexts/I18nContext';
import styles from './UtilityAccessTable.module.css';

// Every utility is open to guests (issue #112) — the table simply lists and
// launches tools; sign-in benefits are surfaced inside the utility shell.
export default function UtilityAccessTable(): React.JSX.Element {
  const {t, tu} = useI18n();

  return (
    <div className={styles.wrapper}>
      <p className={styles.notice}>{t('utility.allUtilitiesOpen')}</p>
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
          {utilities.map((utility) => {
            const {name, description} = tu(utility.id);
            return (
              <tr key={utility.id}>
                <td>{name}</td>
                <td>{description}</td>
                <td>{utility.standards}</td>
                <td className={styles.launchCell}>
                  <Link to={utility.href} data-nobrokenlinkcheck>
                    {t('utility.open')}
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
