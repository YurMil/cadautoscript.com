import React from 'react';
import styles from './Thumbnails.module.css';

export default function EcoSortThumb({ className }: { className?: string }) {
  return (
    <div className={`${styles.wrapper} ${styles.ecoWrapper} ${className || ''}`}>
      <div className={styles.ecoTitle}>Eco Sort Game</div>
      
      <div className={styles.ecoFloor} />
      
      <div className={styles.ecoBins}>
        <div className={styles.ecoBin} style={{background: '#4CAF50'}} />
        <div className={styles.ecoBin} style={{background: '#2196F3'}} />
        <div className={styles.ecoBin} style={{background: '#FFC107'}} />
      </div>

      <div className={styles.ecoItem} />
    </div>
  );
}
