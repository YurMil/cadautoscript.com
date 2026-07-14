import type {RefObject} from 'react';
import Link from '@docusaurus/Link';
import styles from '@site/src/pages/index.module.css';

type DocsSectionProps = {
  sectionRef: RefObject<HTMLElement | null>;
  paused: boolean;
};

export default function DocsSection({sectionRef, paused}: DocsSectionProps) {
  return (
    <section
      ref={sectionRef}
      data-paused={paused ? 'true' : undefined}
      className={styles.docsSection}
    >
      <svg className={styles.utilityBgSvg} width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dgm" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M20 0L0 0 0 20" fill="none" stroke="var(--sv-grid-minor)" strokeWidth="0.6"/>
          </pattern>
          <pattern id="dgM" width="100" height="100" patternUnits="userSpaceOnUse">
            <rect width="100" height="100" fill="url(#dgm)"/>
            <path d="M100 0L0 0 0 100" fill="none" stroke="var(--sv-grid-major)" strokeWidth="1.1"/>
          </pattern>
          <radialGradient id="dcenter" cx="75%" cy="50%" r="65%">
            <stop offset="0%" stopColor="transparent"/>
            <stop offset="100%" stopColor="var(--bg)" stopOpacity="0.85"/>
          </radialGradient>
        </defs>

        <rect width="100%" height="100%" fill="url(#dgM)"/>
        <rect width="100%" height="100%" fill="url(#dcenter)"/>

        <svg x="80%" y="50%" overflow="visible">
          <rect x="-40" y="-50" width="80" height="100" rx="4" fill="rgba(0,180,220,0.05)" stroke="var(--sv-border)" strokeWidth="1.5" opacity="0.6" />
          <path d="M 20 -50 L 40 -30 L 40 -50 Z" fill="var(--sv-border)" opacity="0.6" />

          <g className={styles.docLines}>
            <rect x="-25" y="-30" width="30" height="4" rx="2" fill="var(--sv-accent)" opacity="0.8" />
            <rect x="-25" y="-15" width="50" height="4" rx="2" fill="var(--sv-text)" opacity="0.5" />
            <rect x="-25" y="0" width="40" height="4" rx="2" fill="var(--sv-text)" opacity="0.5" />
            <rect x="-25" y="15" width="45" height="4" rx="2" fill="var(--sv-orange)" opacity="0.7" />
            <rect x="-25" y="30" width="20" height="4" rx="2" fill="var(--sv-text)" opacity="0.5" />
          </g>

          <path className={styles.march} d="M -150 10 L -60 10 L -40 10" fill="none" stroke="var(--sv-accent)" strokeWidth="1.2" strokeDasharray="5 5" opacity="0.6"/>
          <path className={styles.march} d="M 40 -20 L 80 -20 L 120 0" fill="none" stroke="var(--sv-orange)" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.6"/>

          <circle cx="-150" cy="10" r="3" fill="var(--sv-accent)" opacity="0.8"/>
          <circle cx="120" cy="0" r="3" fill="var(--sv-orange)" opacity="0.8"/>

          <rect className={styles.docScan} x="-40" y="-50" width="80" height="2" fill="var(--sv-accent)" opacity="0.8" />
        </svg>
      </svg>

      <div>
        <p className={styles.eyebrow}>Documentation</p>
        <h2>Embed and explain inside MDX</h2>
        <p>
          Drop calculators into MDX, capture screenshots, or write run-books. The docs and utilities ship
          together so the interface stays small and predictable.
        </p>
      </div>
      <div className={styles.docsLinks}>
        <Link className="button button--primary" href="/docs/utilities/embed-calculators/">
          Embed utilities
        </Link>
        <Link className="button button--secondary" to="/doc-parser/">
          Launch Doc Parser
        </Link>
      </div>
    </section>
  );
}
