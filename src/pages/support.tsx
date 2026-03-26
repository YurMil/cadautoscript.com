import React from 'react';
import Layout from '@theme/Layout';
import SupportButton from '@site/src/components/Support/SupportButton';
import {SUPPORT_LINK, SUPPORT_TEXT} from '@site/src/constants/support';
import styles from './support.module.css';

export default function SupportPage(): React.JSX.Element {
  return (
    <Layout title="Support" description="Support CAD AutoScript development.">
      <main className={styles.main}>
        <section className={styles.card}>
          <p className={styles.eyebrow}>Support</p>
          <h1>Support the Project</h1>
          <p className={styles.lead}>{SUPPORT_TEXT.description}</p>
          <div className={styles.actions}>
            <SupportButton href={SUPPORT_LINK} newTab label="Donate via PayPal" />
          </div>
          <p className={styles.note}>
            This page exists so the donation flow can be checked locally while still opening the live PayPal donation page.
          </p>
        </section>
      </main>
    </Layout>
  );
}
