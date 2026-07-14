import type {RefObject} from 'react';
import Link from '@docusaurus/Link';
import {utilities} from '@site/src/data/utilities';
import {useI18n} from '@site/src/contexts/I18nContext';
import AnimatedLogo from '@site/src/components/AnimatedLogo/AnimatedLogo';
import styles from '@site/src/pages/index.module.css';

const heroStats = [
  {label: 'Live utilities', value: utilities.length.toString()},
  {label: 'Runtime', value: 'Chromium + WASM'},
  {label: 'Formats', value: 'DXF / SVG / CSV / PDF / JSON'},
];

type HeroSectionProps = {
  sectionRef: RefObject<HTMLElement | null>;
  paused: boolean;
  heroReady: boolean;
  heroCollapsed: boolean;
  onToggleHero: () => void;
};

export default function HeroSection({sectionRef, paused, heroReady, heroCollapsed, onToggleHero}: HeroSectionProps) {
  const {t} = useI18n();

  return (
    <section
      ref={sectionRef}
      data-paused={paused ? 'true' : undefined}
      className={`${styles.hero} ${heroReady && heroCollapsed ? styles.heroCollapsed : ''}`}
    >
      <svg className={styles.heroBgSvg} viewBox="0 0 900 320" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="hgm" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0L0 0 0 20" fill="none" stroke="var(--sv-grid-minor)" strokeWidth="0.6"/>
          </pattern>
          <pattern id="hgM" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#hgm)"/>
            <path d="M100 0L0 0 0 100" fill="none" stroke="var(--sv-grid-major)" strokeWidth="1.1"/>
          </pattern>
          <radialGradient id="hcenter" cx="60%" cy="50%" r="55%">
            <stop offset="0%" stopColor="transparent"/>
            <stop offset="100%" stopColor="var(--bg)" stopOpacity="0.55"/>
          </radialGradient>
          <marker id="hac" markerWidth="7" markerHeight="7" refX="5.5" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L7,2.5z" fill="var(--sv-accent)"/>
          </marker>
          <marker id="haor" markerWidth="7" markerHeight="7" refX="1.5" refY="2.5" orient="auto">
            <path d="M7,0 L7,5 L0,2.5z" fill="var(--sv-orange)"/>
          </marker>
          <marker id="hao" markerWidth="7" markerHeight="7" refX="5.5" refY="2.5" orient="auto">
            <path d="M0,0 L0,5 L7,2.5z" fill="var(--sv-orange)"/>
          </marker>
          <clipPath id="hclip">
            <rect width="900" height="320"/>
          </clipPath>
        </defs>

        <rect width="900" height="320" fill="url(#hgM)"/>
        <rect width="900" height="320" fill="url(#hcenter)"/>

        <rect x="8" y="8" width="884" height="304" rx="16" fill="none" stroke="var(--sv-border)" strokeWidth="1.2"/>
        <rect x="12" y="12" width="876" height="296" rx="14" fill="none" stroke="var(--sv-border)" strokeWidth="0.5" strokeDasharray="6,6" opacity="0.5"/>

        <g stroke="var(--sv-accent)" strokeWidth="1.2" fill="none">
          <line x1="18" y1="18" x2="50" y2="18"/>
          <line x1="18" y1="18" x2="18" y2="50"/>
          <rect x="28" y="28" width="14" height="14"/>
          <line x1="35" y1="28" x2="35" y2="42"/><line x1="28" y1="35" x2="42" y2="35"/>
        </g>
        <g stroke="var(--sv-accent)" strokeWidth="1.2" fill="none">
          <line x1="882" y1="18" x2="850" y2="18"/>
          <line x1="882" y1="18" x2="882" y2="50"/>
          <rect x="858" y="28" width="14" height="14"/>
          <line x1="865" y1="28" x2="865" y2="42"/><line x1="858" y1="35" x2="872" y2="35"/>
        </g>
        <g stroke="var(--sv-accent)" strokeWidth="1.2" fill="none">
          <line x1="18" y1="302" x2="50" y2="302"/>
          <line x1="18" y1="302" x2="18" y2="270"/>
          <rect x="28" y="278" width="14" height="14"/>
          <line x1="35" y1="278" x2="35" y2="292"/><line x1="28" y1="285" x2="42" y2="285"/>
        </g>
        <g stroke="var(--sv-accent)" strokeWidth="1.2" fill="none">
          <line x1="882" y1="302" x2="850" y2="302"/>
          <line x1="882" y1="302" x2="882" y2="270"/>
          <rect x="858" y="278" width="14" height="14"/>
          <line x1="865" y1="278" x2="865" y2="292"/><line x1="858" y1="285" x2="872" y2="285"/>
        </g>

        <g className={styles.leftGearPos}>
          <g className={styles.gearCw}>
            <g fill="var(--sv-gear)" stroke="var(--sv-gear-stroke)" strokeWidth="1.2">
              <rect x="-9" y="-92" width="18" height="28" rx="3"/>
              <rect x="-9" y="-92" width="18" height="28" rx="3" transform="rotate(30)"/>
              <rect x="-9" y="-92" width="18" height="28" rx="3" transform="rotate(60)"/>
              <rect x="-9" y="-92" width="18" height="28" rx="3" transform="rotate(90)"/>
              <rect x="-9" y="-92" width="18" height="28" rx="3" transform="rotate(120)"/>
              <rect x="-9" y="-92" width="18" height="28" rx="3" transform="rotate(150)"/>
              <rect x="-9" y="-92" width="18" height="28" rx="3" transform="rotate(180)"/>
              <rect x="-9" y="-92" width="18" height="28" rx="3" transform="rotate(210)"/>
              <rect x="-9" y="-92" width="18" height="28" rx="3" transform="rotate(240)"/>
              <rect x="-9" y="-92" width="18" height="28" rx="3" transform="rotate(270)"/>
              <rect x="-9" y="-92" width="18" height="28" rx="3" transform="rotate(300)"/>
              <rect x="-9" y="-92" width="18" height="28" rx="3" transform="rotate(330)"/>
            </g>
            <circle r="80" fill="var(--sv-gear)" stroke="var(--sv-gear-stroke)" strokeWidth="1.5"/>
            <circle r="64" fill="none" stroke="var(--sv-grid-major)" strokeWidth="6"/>
            <circle r="58" fill="none" stroke="var(--sv-gear-stroke)" strokeWidth="0.8"/>
            <g stroke="var(--sv-gear-stroke)" strokeWidth="2">
              <line x1="0" y1="-57" x2="0" y2="-26"/><line x1="0" y1="-57" x2="0" y2="-26" transform="rotate(60)"/>
              <line x1="0" y1="-57" x2="0" y2="-26" transform="rotate(120)"/><line x1="0" y1="-57" x2="0" y2="-26" transform="rotate(180)"/>
              <line x1="0" y1="-57" x2="0" y2="-26" transform="rotate(240)"/><line x1="0" y1="-57" x2="0" y2="-26" transform="rotate(300)"/>
            </g>
            <circle r="26" fill="var(--sv-gear)" stroke="var(--sv-hub)" strokeWidth="1.8"/>
            <circle r="10" fill="none" stroke="var(--sv-hub)" strokeWidth="1.5"/>
          </g>
          <line x1="-110" y1="0" x2="110" y2="0" stroke="var(--sv-accent)" strokeWidth="0.5" opacity="0.4"/>
          <line x1="0" y1="-110" x2="0" y2="110" stroke="var(--sv-accent)" strokeWidth="0.5" opacity="0.4"/>
        </g>

        <g className={styles.rightGearPos}>
          <g className={styles.gearCcw}>
            <g fill="var(--sv-gear)" stroke="var(--sv-gear-stroke)" strokeWidth="1">
              <rect x="-5.5" y="-56" width="11" height="17" rx="2"/>
              <rect x="-5.5" y="-56" width="11" height="17" rx="2" transform="rotate(30)"/>
              <rect x="-5.5" y="-56" width="11" height="17" rx="2" transform="rotate(60)"/>
              <rect x="-5.5" y="-56" width="11" height="17" rx="2" transform="rotate(90)"/>
              <rect x="-5.5" y="-56" width="11" height="17" rx="2" transform="rotate(120)"/>
              <rect x="-5.5" y="-56" width="11" height="17" rx="2" transform="rotate(150)"/>
              <rect x="-5.5" y="-56" width="11" height="17" rx="2" transform="rotate(180)"/>
              <rect x="-5.5" y="-56" width="11" height="17" rx="2" transform="rotate(210)"/>
              <rect x="-5.5" y="-56" width="11" height="17" rx="2" transform="rotate(240)"/>
              <rect x="-5.5" y="-56" width="11" height="17" rx="2" transform="rotate(270)"/>
              <rect x="-5.5" y="-56" width="11" height="17" rx="2" transform="rotate(300)"/>
              <rect x="-5.5" y="-56" width="11" height="17" rx="2" transform="rotate(330)"/>
            </g>
            <circle r="48" fill="var(--sv-gear)" stroke="var(--sv-gear-stroke)" strokeWidth="1.2"/>
            <circle r="38" fill="none" stroke="var(--sv-grid-major)" strokeWidth="4"/>
            <g stroke="var(--sv-gear-stroke)" strokeWidth="1.5">
              <line x1="0" y1="-37" x2="0" y2="-17"/><line x1="0" y1="-37" x2="0" y2="-17" transform="rotate(60)"/>
              <line x1="0" y1="-37" x2="0" y2="-17" transform="rotate(120)"/><line x1="0" y1="-37" x2="0" y2="-17" transform="rotate(180)"/>
              <line x1="0" y1="-37" x2="0" y2="-17" transform="rotate(240)"/><line x1="0" y1="-37" x2="0" y2="-17" transform="rotate(300)"/>
            </g>
            <circle r="17" fill="var(--sv-gear)" stroke="var(--sv-hub)" strokeWidth="1.5"/>
            <circle r="6" fill="none" stroke="var(--sv-hub)" strokeWidth="1.2"/>
          </g>
        </g>

        <g stroke="var(--sv-grid-major)" strokeWidth="0.8" fontFamily="'Share Tech Mono',monospace" fontSize="7.5" fill="var(--sv-text)">
          <line x1="100" y1="8" x2="100" y2="16"/><text x="100" y="7" textAnchor="middle">100</text>
          <line x1="200" y1="8" x2="200" y2="14"/>
          <line x1="300" y1="8" x2="300" y2="16"/><text x="300" y="7" textAnchor="middle">300</text>
          <line x1="400" y1="8" x2="400" y2="14"/>
          <line x1="500" y1="8" x2="500" y2="16"/><text x="500" y="7" textAnchor="middle">500</text>
          <line x1="600" y1="8" x2="600" y2="14"/>
          <line x1="700" y1="8" x2="700" y2="16"/><text x="700" y="7" textAnchor="middle">700</text>
          <line x1="800" y1="8" x2="800" y2="14"/>
        </g>
        <g stroke="var(--sv-grid-major)" strokeWidth="0.8" fontFamily="'Share Tech Mono',monospace" fontSize="7.5" fill="var(--sv-text)">
          <line x1="8" y1="100" x2="16" y2="100"/><text x="6" y="103" textAnchor="end">100</text>
          <line x1="8" y1="200" x2="16" y2="200"/><text x="6" y="203" textAnchor="end">200</text>
          <line x1="8" y1="300" x2="14" y2="300"/>
        </g>

        <g stroke="var(--sv-dim)" strokeWidth="0.9" fill="none" opacity="0.75">
          <path d="M8 140 L30 140 L30 180 L60 180"/>
          <path d="M8 200 L25 200 L25 240 L55 240"/>
          <circle cx="30" cy="140" r="2.5" fill="var(--sv-hub)" stroke="none"/>
          <circle cx="30" cy="180" r="2.5" fill="var(--sv-hub)" stroke="none"/>
          <circle cx="25" cy="200" r="2.5" fill="var(--sv-hub)" stroke="none"/>
        </g>
        <g stroke="var(--sv-dim)" strokeWidth="0.9" fill="none" opacity="0.75">
          <path d="M892 160 L870 160 L870 200 L840 200"/>
          <path d="M892 230 L875 230 L875 260 L848 260"/>
          <circle cx="870" cy="160" r="2.5" fill="var(--sv-hub)" stroke="none"/>
          <circle cx="870" cy="200" r="2.5" fill="var(--sv-hub)" stroke="none"/>
          <circle cx="875" cy="230" r="2.5" fill="var(--sv-hub)" stroke="none"/>
        </g>

        <g transform="translate(450,160)" clipPath="url(#hclip)">
          <circle className={styles.pring} cx="0" cy="0" r="8" fill="none" stroke="var(--sv-accent)" strokeWidth="1"/>
          <circle className={styles.pring2} cx="0" cy="0" r="8" fill="none" stroke="var(--sv-accent)" strokeWidth="0.7"/>
          <circle r="6" fill="none" stroke="var(--sv-accent)" strokeWidth="1.2" opacity="0.7"/>
          <line x1="-14" y1="0" x2="-8" y2="0" stroke="var(--sv-accent)" strokeWidth="1.5"/>
          <line x1="8" y1="0" x2="14" y2="0" stroke="var(--sv-accent)" strokeWidth="1.5"/>
          <line x1="0" y1="-14" x2="0" y2="-8" stroke="var(--sv-accent)" strokeWidth="1.5"/>
          <line x1="0" y1="8" x2="0" y2="14" stroke="var(--sv-accent)" strokeWidth="1.5"/>
          <circle r="2" fill="var(--sv-accent)"/>
        </g>

        <line x1="30" y1="160" x2="420" y2="160" className={styles.march} stroke="var(--sv-accent)" strokeWidth="0.8" opacity="0.3" strokeDasharray="12,10"/>
        <line x1="480" y1="160" x2="870" y2="160" className={styles.march} stroke="var(--sv-accent)" strokeWidth="0.8" opacity="0.3" strokeDasharray="12,10"/>

        <g fontFamily="'Share Tech Mono',monospace" fill="var(--sv-accent)" fontSize="9">
          <line x1="240" y1="240" x2="270" y2="268" stroke="var(--sv-accent)" strokeWidth="0.8"/>
          <line x1="270" y1="268" x2="340" y2="268" stroke="var(--sv-accent)" strokeWidth="1.1"/>
          <circle cx="240" cy="240" r="2" fill="var(--sv-accent)"/>
          <rect x="342" y="259" width="88" height="22" rx="2" fill="var(--bg)" opacity="0.75"/>
          <text x="346" y="270">ENGINE:</text>
          <text x="346" y="279" fill="var(--sv-dim)">WebAssembly</text>
        </g>

        <g fontFamily="'Share Tech Mono',monospace" fill="var(--sv-accent)" fontSize="9">
          <line x1="680" y1="270" x2="720" y2="295" stroke="var(--sv-accent)" strokeWidth="0.8"/>
          <line x1="720" y1="295" x2="765" y2="295" stroke="var(--sv-accent)" strokeWidth="1.1"/>
          <circle cx="680" cy="270" r="2" fill="var(--sv-accent)"/>
          <circle className={styles.blink} cx="770" cy="295" r="3.5" fill="var(--sv-hub)" stroke="none"/>
          <text x="776" y="299" fill="var(--sv-accent)">ONLINE</text>
        </g>

        <g className={styles.logoPos}>
          <AnimatedLogo width="180" height="180" opacity="0.9" />
        </g>

        <g transform="translate(840,270)" fontFamily="'Share Tech Mono',monospace">
          <line x1="0" y1="0" x2="30" y2="0" stroke="var(--sv-orange)" strokeWidth="1.5" markerEnd="url(#hao)"/>
          <text x="34" y="4" fontSize="9" fill="var(--sv-orange)">X</text>
          <line x1="0" y1="0" x2="0" y2="-28" stroke="var(--sv-accent)" strokeWidth="1.5" markerEnd="url(#hac)"/>
          <text x="3" y="-30" fontSize="9" fill="var(--sv-accent)">Y</text>
          <circle cx="0" cy="0" r="3" fill="var(--text)" opacity="0.7"/>
        </g>

        <g opacity="0.9">
          <rect x="700" y="293" width="188" height="22" rx="2" fill="var(--bg)" stroke="var(--sv-dim)" strokeWidth="0.8" opacity="0.85"/>
          <line x1="778" y1="293" x2="778" y2="315" stroke="var(--sv-dim)" strokeWidth="0.6"/>
          <text x="739" y="307" textAnchor="middle" fontFamily="'Share Tech Mono',monospace" fontSize="8" fill="var(--sv-text)">CADAUTOSCRIPT.COM</text>
          <text x="810" y="304" textAnchor="middle" fontFamily="'Share Tech Mono',monospace" fontSize="7" fill="var(--sv-text)">REV C</text>
          <text x="810" y="313" textAnchor="middle" fontFamily="'Share Tech Mono',monospace" fontSize="7" fill="var(--sv-text)">2026-04-21</text>
        </g>

        <g clipPath="url(#hclip)" opacity="0.4">
          <rect className={styles.scanline} x="0" y="0" width="900" height="60" fill="rgba(0,200,220,0.08)" />
        </g>
      </svg>

      <button
        type="button"
        className={styles.heroToggle}
        onClick={onToggleHero}
        aria-label={heroCollapsed ? 'Expand hero' : 'Collapse hero'}
        title={heroCollapsed ? 'Show details' : 'Hide details'}
      >
        <span className={styles.heroToggleIcon}>{heroCollapsed ? '▼' : '▲'}</span>
      </button>

      {heroCollapsed ? (
        <div className={styles.heroCompact}>
          <h1 className={styles.heroCompactTitle}>CAD AutoScript</h1>
          <div className={styles.heroCompactStats}>
            <span>{utilities.length} utilities</span>
            <span>·</span>
            <span>WASM</span>
            <span>·</span>
            <span>DXF / SVG / CSV / PDF</span>
          </div>
        </div>
      ) : (
        <>
          <div>
            <p className={styles.eyebrow}>{t('home.heroEyebrow')}</p>
            <h1>{t('home.heroTitleNew')}</h1>
            <p>{t('home.heroDescription')}</p>
            <div className={styles.heroActions}>
              <Link className="button button--primary" href="/docs/utilities/overview/">
                {t('home.viewAllDocs')}
              </Link>
              <Link className="button button--secondary" href="/blog/">
                {t('home.releaseNotes')}
              </Link>
            </div>
          </div>
          <div className={styles.heroStats}>
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
