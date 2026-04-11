import React from 'react';
import styles from './Thumbnails.module.css';

export default function RailroadSmashThumb({ className }: { className?: string }) {
  return (
    <div className={`${styles.wrapper} ${styles.rlrWrapper} ${className || ''}`}>
      <div className={styles.rlrTitle}>Smash Bottles</div>

      <div className={styles.rlrRails}>
        <div className={styles.rlrTies} />
        <div className={styles.rlrRail} />
        <div className={styles.rlrRail} />
      </div>

      <div className={styles.rlrGlass} />
      
      <div className={styles.rlrDebris}>
        {Array.from({length: 8}).map((_, i) => (
          <div key={i} className={styles.rlrDb} style={{
            '--x': (Math.random() - 0.5) * 200,
            '--y': (Math.random() - 1) * 150
          } as React.CSSProperties} />
        ))}
      </div>

      <div className={styles.rlrRock} />
    </div>
  );
}
