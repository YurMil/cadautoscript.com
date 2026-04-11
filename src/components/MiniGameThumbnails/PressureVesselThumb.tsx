import React from 'react';
import styles from './Thumbnails.module.css';

export default function PressureVesselThumb({ className }: { className?: string }) {
  return (
    <div className={`${styles.wrapper} ${styles.prvWrapper} ${className || ''}`}>
      <div className={styles.prvHeader}>
        <span className={styles.prvCash}>$ 12,450</span>
        <span style={{fontSize: '7cqi', color: '#888'}}>PVT SYSTEM</span>
      </div>

      <div className={styles.prvWelder} />

      <div className={styles.prvConveyor}>
        <div className={styles.prvBelt} />
      </div>

      <div className={styles.prvVessel} />
    </div>
  );
}
