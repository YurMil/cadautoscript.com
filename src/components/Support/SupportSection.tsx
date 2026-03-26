import React from 'react';
import {SUPPORT_TEXT} from '@site/src/constants/support';
import SupportButton from './SupportButton';
import styles from './SupportSection.module.css';

export default function SupportSection(): React.JSX.Element {
  return (
    <section className={styles.section}>
      <div className={styles.content}>
        <p className={styles.eyebrow}>Support</p>
        <h2>Support the Project</h2>
        <p className={styles.description}>{SUPPORT_TEXT.description}</p>
      </div>
      <div className={styles.actions}>
        <SupportButton />
      </div>
    </section>
  );
}
