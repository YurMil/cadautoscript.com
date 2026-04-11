import React from 'react';
import styles from './Thumbnails.module.css';

const Cursor = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>
    <path fill="white" d="M3 3l7 18 3-7 7-3-18-8z" />
  </svg>
);

export default function FlangesMemoryThumb({ className }: { className?: string }) {
  return (
    <div className={`${styles.wrapper} ${styles.flgWrapper} ${className || ''}`}>
      <div className={styles.flgRivets} />
      
      <div className={styles.flgHeader}>
        <h1 className={styles.flgTitle}>SAFETY RELEASE</h1>
        <h2 className={styles.flgSubtitle}>OPEN REQUIRED VALVES</h2>
        <div style={{ color: '#fff', fontSize: '7cqi', marginTop: '4cqi' }}>PRESSURE-LVL: 001</div>
      </div>

      <div className={styles.flgBoard}>
        {Array.from({ length: 9 }).map((_, i) => {
          const isT1 = i === 0;
          const isT2 = i === 2;
          const isT3 = i === 8;

          return (
            <div 
              key={i} 
              className={`
                ${styles.flgFlange} 
                ${isT1 ? styles.flgSimon1 : ''} ${isT1 ? styles.flgPlayer1 : ''}
                ${isT2 ? styles.flgSimon2 : ''} ${isT2 ? styles.flgPlayer2 : ''}
                ${isT3 ? styles.flgSimon3 : ''} ${isT3 ? styles.flgPlayer3 : ''}
              `}
            >
              {/* Bolts */}
              {Array.from({length: 8}).map((_, b) => (
                <div key={b} className={styles.flgBolt} style={{
                  top: `calc(50% + ${Math.sin(b * Math.PI / 4) * 35}% - 3px)`,
                  left: `calc(50% + ${Math.cos(b * Math.PI / 4) * 35}% - 3px)`
                }} />
              ))}
              
              <div 
                className={`
                  ${styles.flgHole} 
                  ${isT1 ? styles.flgHoleSimon : ''} ${isT1 ? styles.flgHolePlayer : ''}
                  ${isT2 ? styles.flgHoleSimon : ''} ${isT2 ? styles.flgHolePlayer : ''}
                  ${isT3 ? styles.flgHoleSimon : ''} ${isT3 ? styles.flgHolePlayer : ''}
                `} 
              />
            </div>
          );
        })}
      </div>
      <Cursor className={styles.flgCursor} />
    </div>
  );
}
