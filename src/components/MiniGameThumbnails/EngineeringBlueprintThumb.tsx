import React from 'react';
import styles from './Thumbnails.module.css';

const Cursor = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
    <path fill="white" d="M3 3l7 18 3-7 7-3-18-8z" />
  </svg>
);

export default function EngineeringBlueprintThumb({ className }: { className?: string }) {
  return (
    <div className={`${styles.wrapper} ${styles.engWrapper} ${className || ''}`}>
      <div className={styles.engHeader}>
        <div className={styles.engStat}><label>NCR Limit</label><span>010</span></div>
        <div className={styles.engReset}>
          <svg viewBox="0 0 24 24" fill="#fff" width="14" height="14"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zM4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12z"/></svg>
        </div>
        <div className={styles.engStat}><label>Time Log</label><span style={{color: '#fff'}}>012</span></div>
      </div>
      
      <div className={styles.engBoard}>
        <div className={styles.engGrid}>
          {Array.from({ length: 36 }).map((_, i) => {
            const isNCR = i === 16;
            const isNum1 = i === 9;
            const isNum2 = i === 15;

            let numClass = '';
            let ncrClass = '';
            if (isNum1) numClass = styles.engCellNum1;
            if (isNum2) numClass = styles.engCellNum2;
            if (isNCR) { 
              ncrClass = styles.engCellNCRShow;
            }

            return (
              <div key={i} className={styles.engCell}>
                {isNum1 && <div className={`${styles.engCellNum} ${numClass}`}>1</div>}
                {isNum2 && <div className={`${styles.engCellNum} ${numClass}`}>2</div>}
                {isNCR && <div className={`${styles.engCellNCR} ${ncrClass}`}>NCR</div>}
              </div>
            );
          })}
        </div>
      </div>
      <Cursor className={styles.engCursor} />

      <div className={styles.engDialog}>
        <div style={{border: '1cqi solid #d32f2f', color: '#d32f2f', fontWeight: 'bold', fontSize: '9cqi', padding: '2cqi'}}>
          REJECTED<br/><span style={{fontSize: '5.5cqi'}}>NCR FOUND</span>
        </div>
      </div>
    </div>
  );
}
