import React, { useMemo } from 'react';
import styles from './AnimatedLogo.module.css';

interface AnimatedLogoProps extends React.SVGProps<SVGSVGElement> {
  // x, y, width, height are already in SVGProps
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ className, ...props }) => {
  // ── Path generation logic ──
  const paths = useMemo(() => {
    const gearPath = (cx: number, cy: number, teeth: number, outerR: number, innerR: number) => {
      const step = (Math.PI * 2) / teeth;
      const arc = step * 0.19;
      const mid = (outerR + innerR) / 2;
      let d = '';
      for (let i = 0; i < teeth; i++) {
        const a = i * step;
        const v1 = [cx + innerR * Math.cos(a - arc * 1.65), cy + innerR * Math.sin(a - arc * 1.65)];
        const cp1 = [cx + mid * Math.cos(a - arc * 1.1), cy + mid * Math.sin(a - arc * 1.1)];
        const t1 = [cx + outerR * Math.cos(a - arc * 0.42), cy + outerR * Math.sin(a - arc * 0.42)];
        const t2 = [cx + outerR * Math.cos(a + arc * 0.42), cy + outerR * Math.sin(a + arc * 0.42)];
        const cp2 = [cx + mid * Math.cos(a + arc * 1.1), cy + mid * Math.sin(a + arc * 1.1)];
        const v2 = [cx + innerR * Math.cos(a + arc * 1.65), cy + innerR * Math.sin(a + arc * 1.65)];
        const f = (p: number[]) => p[0].toFixed(2) + ',' + p[1].toFixed(2);
        if (i === 0) d += `M${f(v1)}`;
        else d += `L${f(v1)}`;
        d += ` Q${f(cp1)} ${f(t1)} L${f(t2)} Q${f(cp2)} ${f(v2)}`;
      }
      return d + 'Z';
    };

    const gearHighlightPath = (cx: number, cy: number, teeth: number, outerR: number) => {
      const step = (Math.PI * 2) / teeth;
      const arc = step * 0.19;
      let d = '';
      for (let i = 0; i < teeth; i++) {
        const a = i * step;
        const t1 = [cx + outerR * Math.cos(a - arc * 0.42), cy + outerR * Math.sin(a - arc * 0.42)];
        const t2 = [cx + outerR * Math.cos(a + arc * 0.42), cy + outerR * Math.sin(a + arc * 0.42)];
        d += `M${t1[0].toFixed(2)},${t1[1].toFixed(2)} L${t2[0].toFixed(2)},${t2[1].toFixed(2)}`;
      }
      return d;
    };

    const frameGear = (cx: number, cy: number, teeth: number, outerR: number, innerR: number, holeR: number) => {
      let d = gearPath(cx, cy, teeth, outerR, innerR);
      d +=
        ` M${(cx + holeR).toFixed(2)},${cy}` +
        ` A${holeR},${holeR} 0 0 0 ${(cx - holeR).toFixed(2)},${cy}` +
        ` A${holeR},${holeR} 0 0 0 ${(cx + holeR).toFixed(2)},${cy}Z`;
      return d;
    };

    return {
      fgp: frameGear(300, 308, 22, 232, 202, 194),
      g1t: gearPath(340, 288, 16, 80, 64),
      g1h: gearHighlightPath(340, 288, 16, 80),
      g2t: gearPath(248, 372, 11, 50, 40),
      g2h: gearHighlightPath(248, 372, 11, 50),
      g3t: gearPath(398, 372, 8, 36, 28),
      g3h: gearHighlightPath(398, 372, 8, 36),
      g4t: gearPath(365, 432, 7, 28, 22),
      g4h: gearHighlightPath(365, 432, 7, 28),
    };
  }, []);

  return (
    <svg
      id="logo"
      viewBox="0 0 600 680"
      xmlns="http://www.w3.org/2000/svg"
      className={`${styles.logo} ${className || ''}`}
      {...props}
    >
      <defs>
        <linearGradient id="silverText" x1="0" y1="148" x2="0" y2="418" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#f4f8ff" />
          <stop offset="16%" stopColor="#c8d4ea" />
          <stop offset="40%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="#607090" />
          <stop offset="82%" stopColor="#d4ddf2" />
          <stop offset="100%" stopColor="#98a8c0" />
        </linearGradient>

        <linearGradient id="silverRing" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ecf2ff" />
          <stop offset="20%" stopColor="#ffffff" />
          <stop offset="48%" stopColor="#8090b0" />
          <stop offset="72%" stopColor="#dce8ff" />
          <stop offset="100%" stopColor="#a8bacе" />
        </linearGradient>

        <linearGradient id="blueV" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#58a0f0" />
          <stop offset="30%" stopColor="#1e62cc" />
          <stop offset="68%" stopColor="#0d287a" />
          <stop offset="100%" stopColor="#060d3a" />
        </linearGradient>

        <linearGradient id="blueH" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#060d3a" />
          <stop offset="22%" stopColor="#1e62cc" />
          <stop offset="50%" stopColor="#4e9aee" />
          <stop offset="78%" stopColor="#1e62cc" />
          <stop offset="100%" stopColor="#060d3a" />
        </linearGradient>

        <linearGradient id="blueArm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4e9aee" />
          <stop offset="45%" stopColor="#1e62cc" />
          <stop offset="100%" stopColor="#060d3a" />
        </linearGradient>

        <radialGradient id="circleBG" cx="38%" cy="32%" r="68%">
          <stop offset="0%" stopColor="#204a8a" />
          <stop offset="42%" stopColor="#0c2258" />
          <stop offset="100%" stopColor="#060e28" />
        </radialGradient>

        <linearGradient id="frameGrad" x1="0.1" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#2870d0" />
          <stop offset="38%" stopColor="#0e2a80" />
          <stop offset="100%" stopColor="#07103a" />
        </linearGradient>

        <radialGradient id="gf1" cx="30%" cy="25%" r="75%">
          <stop offset="0%" stopColor="#3278c8" />
          <stop offset="60%" stopColor="#122060" />
          <stop offset="100%" stopColor="#091540" />
        </radialGradient>
        <radialGradient id="gf2" cx="30%" cy="25%" r="75%">
          <stop offset="0%" stopColor="#2868b8" />
          <stop offset="60%" stopColor="#0f1c58" />
          <stop offset="100%" stopColor="#081238" />
        </radialGradient>
        <radialGradient id="gf3" cx="30%" cy="25%" r="75%">
          <stop offset="0%" stopColor="#2060b0" />
          <stop offset="60%" stopColor="#0e1a52" />
          <stop offset="100%" stopColor="#070f30" />
        </radialGradient>

        <linearGradient id="scanGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#60b8ff" stopOpacity="0" />
          <stop offset="75%" stopColor="#60b8ff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#60b8ff" stopOpacity="0.04" />
        </linearGradient>

        <radialGradient id="vig" cx="50%" cy="50%" r="50%">
          <stop offset="58%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#04081a" stopOpacity="0.72" />
        </radialGradient>

        <filter id="glow" x="-25%" y="-25%" width="150%" height="150%">
          <feGaussianBlur stdDeviation="5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="glow2" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="9" result="b" />
          <feFlood floodColor="#1a60d8" floodOpacity="0.55" result="c" />
          <feComposite in="c" in2="b" operator="in" result="s" />
          <feMerge>
            <feMergeNode in="s" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="textFX" x="-8%" y="-15%" width="116%" height="145%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000020" floodOpacity="0.95" />
          <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#0040c8" floodOpacity="0.4" />
        </filter>
        <filter id="armFX" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feFlood floodColor="#1e60cc" floodOpacity="0.5" result="c" />
          <feComposite in="c" in2="b" operator="in" result="s" />
          <feMerge>
            <feMergeNode in="s" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="drop" x="-12%" y="-8%" width="124%" height="124%">
          <feDropShadow dx="0" dy="14" stdDeviation="26" floodColor="#000820" floodOpacity="0.7" />
        </filter>

        <clipPath id="cc">
          <circle cx="300" cy="308" r="185" />
        </clipPath>

        <path id="barc" d="M 150,550 Q 300,592 450,550" />
      </defs>

      <g filter="url(#drop)">
        {/* BOTTOM ANCHOR */}
        <path
          d="M 300,642 L 252,600 L 215,556 L 262,568 L 300,582 L 338,568 L 385,556 L 348,600 Z"
          fill="url(#blueV)"
          stroke="#2a6acc"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M 300,660 L 268,622 L 300,633 L 332,622 Z" fill="#0c2270" stroke="#1e5ab8" strokeWidth="1.2" />
        <path
          d="M 300,628 L 268,602 L 278,598 L 300,616 L 322,598 L 332,602 Z"
          fill="none"
          stroke="#3a80e0"
          strokeWidth="1"
          opacity="0.55"
        />
        <line x1="262" y1="568" x2="252" y2="600" stroke="#4888d8" strokeWidth="0.8" opacity="0.5" />
        <line x1="338" y1="568" x2="348" y2="600" stroke="#4888d8" strokeWidth="0.8" opacity="0.5" />

        {/* Left ribbon */}
        <path
          d="M 126,532 L 162,516 L 246,545 L 246,560 L 162,537 L 122,550 Z"
          fill="url(#blueH)"
          stroke="#1e60c0"
          strokeWidth="1.4"
        />
        <path d="M 144,523 L 240,548 L 240,550 L 144,525 Z" fill="rgba(88,158,248,0.18)" />
        {/* Right ribbon */}
        <path
          d="M 474,532 L 438,516 L 354,545 L 354,560 L 438,537 L 478,550 Z"
          fill="url(#blueH)"
          stroke="#1e60c0"
          strokeWidth="1.4"
        />
        <path d="M 456,523 L 360,548 L 360,550 L 456,525 Z" fill="rgba(88,158,248,0.18)" />

        {/* Banner bg */}
        <path d="M 146,540 Q 300,582 454,540 Q 300,561 146,540 Z" fill="#091c58" stroke="#1e56aa" strokeWidth="0.9" />
        <text
          fontFamily="'Arial Black',Arial,sans-serif"
          fontSize="18"
          fontWeight="900"
          letterSpacing="4"
          fill="#c0d8ff"
        >
          <textPath href="#barc" startOffset="50%" textAnchor="middle">
            CADAUTOSCRIPT.COM
          </textPath>
        </text>

        {/* CROSS ARMS */}
        <polygon
          points="228,194 258,158 284,180 268,212"
          fill="url(#blueArm)"
          stroke="#3070d0"
          strokeWidth="1.8"
          filter="url(#armFX)"
        />
        <polygon points="239,178 258,158 277,172" fill="rgba(88,158,248,0.3)" />
        <line x1="245" y1="186" x2="270" y2="165" stroke="#60a8f8" strokeWidth="0.7" opacity="0.55" />

        <polygon
          points="372,194 342,158 316,180 332,212"
          fill="url(#blueArm)"
          stroke="#3070d0"
          strokeWidth="1.8"
          filter="url(#armFX)"
        />
        <polygon points="361,178 342,158 323,172" fill="rgba(88,158,248,0.3)" />
        <line x1="355" y1="186" x2="330" y2="165" stroke="#60a8f8" strokeWidth="0.7" opacity="0.55" />

        <polygon
          points="490,282 518,290 558,308 518,326 490,332 510,308"
          fill="url(#blueH)"
          stroke="#3070d0"
          strokeWidth="1.8"
          filter="url(#armFX)"
        />
        <polygon points="502,292 530,308 502,324" fill="rgba(88,158,248,0.28)" />
        <line x1="498" y1="308" x2="550" y2="308" stroke="#60a8f8" strokeWidth="0.7" opacity="0.5" />

        <polygon
          points="110,282 82,290 42,308 82,326 110,332 90,308"
          fill="url(#blueH)"
          stroke="#3070d0"
          strokeWidth="1.8"
          filter="url(#armFX)"
        />
        <polygon points="98,292 70,308 98,324" fill="rgba(88,158,248,0.28)" />
        <line x1="102" y1="308" x2="50" y2="308" stroke="#60a8f8" strokeWidth="0.7" opacity="0.5" />

        {/* OUTER FRAME GEAR */}
        <g className={styles.gearFrame}>
          <path fill="url(#frameGrad)" fillRule="evenodd" stroke="#1648a8" strokeWidth="2.2" d={paths.fgp} />
          <circle cx="300" cy="308" r="202" fill="none" stroke="#1648a8" strokeWidth="0.7" opacity="0.45" />
          <circle cx="300" cy="308" r="207" fill="none" stroke="#2058b8" strokeWidth="0.4" opacity="0.3" />
        </g>
        <circle cx="300" cy="308" r="230" fill="none" stroke="#0c2060" strokeWidth="0.8" opacity="0.35" />

        <circle cx="300" cy="308" r="185" fill="url(#circleBG)" />
      </g>

      {/* MAIN CIRCLE INTERIOR (Animated elements) */}
      <g clipPath="url(#cc)">

          {/* Blueprint grid */}
          <g stroke="#1a3c7a" strokeWidth="0.38" opacity="0.45">
            <line x1="115" y1="248" x2="485" y2="248" />
            <line x1="115" y1="278" x2="485" y2="278" />
            <line x1="115" y1="308" x2="485" y2="308" />
            <line x1="115" y1="338" x2="485" y2="338" />
            <line x1="115" y1="368" x2="485" y2="368" />
            <line x1="115" y1="398" x2="485" y2="398" />
            <line x1="115" y1="428" x2="485" y2="428" />
            <line x1="235" y1="123" x2="235" y2="493" />
            <line x1="265" y1="123" x2="265" y2="493" />
            <line x1="295" y1="123" x2="295" y2="493" />
            <line x1="325" y1="123" x2="325" y2="493" />
            <line x1="355" y1="123" x2="355" y2="493" />
            <line x1="385" y1="123" x2="385" y2="493" />
            <line x1="415" y1="123" x2="415" y2="493" />
          </g>

          {/* Blueprint reference frame */}
          <rect x="168" y="186" width="192" height="148" fill="none" stroke="#1e52a0" strokeWidth="0.95" opacity="0.38" />
          <rect x="178" y="196" width="172" height="128" fill="none" stroke="#1e52a0" strokeWidth="0.4" opacity="0.22" />
          <line
            x1="163"
            y1="186"
            x2="163"
            y2="334"
            stroke="#1e52a0"
            strokeWidth="0.5"
            strokeDasharray="5 4"
            opacity="0.28"
          />
          <line
            x1="168"
            y1="181"
            x2="360"
            y2="181"
            stroke="#1e52a0"
            strokeWidth="0.5"
            strokeDasharray="5 4"
            opacity="0.28"
          />

          {/* Animated circuit traces */}
          <path className={styles.ct} d="M 148,255 H 198 V 235 H 238 V 215 H 258" stroke="#3888ea" style={{ animationDelay: '0s' }} />
          <path className={styles.ct} d="M 452,278 H 404 V 258 H 370 V 238 H 352" stroke="#2878da" style={{ animationDelay: '0.8s' }} />
          <path className={styles.ct} d="M 152,368 H 210 V 395 H 250 V 418 H 268" stroke="#40a0f8" style={{ animationDelay: '1.6s' }} />
          <path className={styles.ct} d="M 448,360 H 392 V 388 H 360 V 406 H 340" stroke="#3080e2" style={{ animationDelay: '2.4s' }} />
          <path className={styles.ct} d="M 300,123 V 168 H 266 V 196 H 246 V 210" stroke="#3888ea" style={{ animationDelay: '3.2s' }} />
          <path className={styles.ct} d="M 300,493 V 448 H 336 V 428 H 358 V 412" stroke="#2878da" style={{ animationDelay: '0.4s' }} />
          <path className={styles.ct} d="M 178,308 H 215 V 285 H 238" stroke="#40a0f8" style={{ animationDelay: '1.2s' }} />
          <path className={styles.ct} d="M 422,308 H 385 V 285 H 362" stroke="#3080e2" style={{ animationDelay: '2.0s' }} />
          <path className={styles.ct} d="M 178,368 H 215 V 385 H 235" stroke="#3888ea" style={{ animationDelay: '2.8s' }} />
          <path className={styles.ct} d="M 368,195 H 385 V 215 H 408 V 238" stroke="#2878da" style={{ animationDelay: '3.6s' }} />

          {/* Circuit nodes */}
          <circle className={styles.cdot} cx="198" cy="235" r="2.5" fill="#5ab0ff" style={{ animationDelay: '0s' }} />
          <circle className={styles.cdot} cx="238" cy="235" r="2.5" fill="#5ab0ff" style={{ animationDelay: '0.5s' }} />
          <circle className={styles.cdot} cx="238" cy="215" r="2.5" fill="#5ab0ff" style={{ animationDelay: '1.0s' }} />
          <circle className={styles.cdot} cx="404" cy="258" r="2.5" fill="#5ab0ff" style={{ animationDelay: '0.25s' }} />
          <circle className={styles.cdot} cx="370" cy="238" r="2.5" fill="#5ab0ff" style={{ animationDelay: '1.3s' }} />
          <circle className={styles.cdot} cx="210" cy="395" r="2.5" fill="#5ab0ff" style={{ animationDelay: '0.7s' }} />
          <circle className={styles.cdot} cx="250" cy="418" r="2.5" fill="#5ab0ff" style={{ animationDelay: '1.1s' }} />
          <circle className={styles.cdot} cx="392" cy="388" r="2.5" fill="#5ab0ff" style={{ animationDelay: '1.6s' }} />
          <circle className={styles.cdot} cx="358" cy="406" r="2.5" fill="#5ab0ff" style={{ animationDelay: '0.35s' }} />
          <circle className={styles.cdot} cx="246" cy="210" r="2.5" fill="#5ab0ff" style={{ animationDelay: '0.95s' }} />
          <circle className={styles.cdot} cx="336" cy="428" r="2.5" fill="#5ab0ff" style={{ animationDelay: '0.6s' }} />
          <circle className={styles.cdot} cx="215" cy="285" r="2.5" fill="#5ab0ff" style={{ animationDelay: '2.2s' }} />
          <circle className={styles.cdot} cx="385" cy="285" r="2.5" fill="#5ab0ff" style={{ animationDelay: '2.7s' }} />
          <circle className={styles.cdot} cx="385" cy="215" r="2.5" fill="#5ab0ff" style={{ animationDelay: '3.1s' }} />
          <circle className={styles.cdot} cx="408" cy="238" r="2.5" fill="#5ab0ff" style={{ animationDelay: '1.85s' }} />

          {/* GEAR 1 */}
          <g className={styles.gear1}>
            <path fill="url(#gf1)" fillOpacity="0.88" stroke="#4888da" strokeWidth="1.9" d={paths.g1t} />
            <path fill="none" stroke="rgba(110,170,250,0.35)" strokeWidth="0.8" d={paths.g1h} />
            <circle cx="340" cy="288" r="52" fill="none" stroke="#2060a8" strokeWidth="0.9" opacity="0.5" />
            <circle cx="340" cy="288" r="28" fill="none" stroke="#2868b8" strokeWidth="1.4" opacity="0.65" />
            <circle cx="340" cy="288" r="18" fill="#0c1848" />
            <circle cx="340" cy="288" r="18" fill="none" stroke="#1d50a0" strokeWidth="1.5" />
            <circle cx="340" cy="288" r="7" fill="#060e30" />
            <circle cx="340" cy="288" r="7" fill="none" stroke="#1840880" strokeWidth="1" />
            <g stroke="#1e58a8" strokeWidth="2" strokeLinecap="round">
              <line x1="340" y1="270" x2="340" y2="256" />
              <line x1="340" y1="306" x2="340" y2="320" />
              <line x1="322" y1="288" x2="308" y2="288" />
              <line x1="358" y1="288" x2="372" y2="288" />
              <line x1="327" y1="275" x2="317" y2="265" />
              <line x1="353" y1="301" x2="363" y2="311" />
              <line x1="353" y1="275" x2="363" y2="265" />
              <line x1="327" y1="301" x2="317" y2="311" />
            </g>
            <circle cx="340" cy="260" r="4" fill="#060e30" stroke="#1848a0" strokeWidth="1" />
            <circle cx="366" cy="274" r="4" fill="#060e30" stroke="#1848a0" strokeWidth="1" />
            <circle cx="366" cy="302" r="4" fill="#060e30" stroke="#1848a0" strokeWidth="1" />
            <circle cx="340" cy="316" r="4" fill="#060e30" stroke="#1848a0" strokeWidth="1" />
            <circle cx="314" cy="302" r="4" fill="#060e30" stroke="#1848a0" strokeWidth="1" />
            <circle cx="314" cy="274" r="4" fill="#060e30" stroke="#1848a0" strokeWidth="1" />
            <circle cx="340" cy="260" r="1.4" fill="#3060a8" />
            <circle cx="366" cy="274" r="1.4" fill="#3060a8" />
            <circle cx="366" cy="302" r="1.4" fill="#3060a8" />
            <circle cx="340" cy="316" r="1.4" fill="#3060a8" />
            <circle cx="314" cy="302" r="1.4" fill="#3060a8" />
            <circle cx="314" cy="274" r="1.4" fill="#3060a8" />
          </g>

          {/* GEAR 2 */}
          <g className={styles.gear2}>
            <path fill="url(#gf2)" fillOpacity="0.88" stroke="#4080d2" strokeWidth="1.5" d={paths.g2t} />
            <path fill="none" stroke="rgba(100,160,240,0.32)" strokeWidth="0.7" d={paths.g2h} />
            <circle cx="248" cy="372" r="32" fill="none" stroke="#1c58a0" strokeWidth="0.8" opacity="0.5" />
            <circle cx="248" cy="372" r="18" fill="none" stroke="#2060a8" strokeWidth="1.2" opacity="0.6" />
            <circle cx="248" cy="372" r="12" fill="#0a1440" />
            <circle cx="248" cy="372" r="12" fill="none" stroke="#183890" strokeWidth="1.3" />
            <circle cx="248" cy="372" r="5" fill="#060e28" />
            <g stroke="#1858a0" strokeWidth="1.6" strokeLinecap="round">
              <line x1="248" y1="360" x2="248" y2="350" />
              <line x1="248" y1="384" x2="248" y2="394" />
              <line x1="236" y1="372" x2="226" y2="372" />
              <line x1="260" y1="372" x2="270" y2="372" />
              <line x1="238" y1="362" x2="231" y2="355" />
              <line x1="258" y1="382" x2="265" y2="389" />
            </g>
            <circle cx="248" cy="354" r="3" fill="#060e28" stroke="#183890" strokeWidth="0.9" />
            <circle cx="265" cy="363" r="3" fill="#060e28" stroke="#183890" strokeWidth="0.9" />
            <circle cx="265" cy="381" r="3" fill="#060e28" stroke="#183890" strokeWidth="0.9" />
            <circle cx="248" cy="390" r="3" fill="#060e28" stroke="#183890" strokeWidth="0.9" />
            <circle cx="231" cy="381" r="3" fill="#060e28" stroke="#183890" strokeWidth="0.9" />
            <circle cx="231" cy="363" r="3" fill="#060e28" stroke="#183890" strokeWidth="0.9" />
            <circle cx="248" cy="354" r="1.2" fill="#2858a0" />
            <circle cx="265" cy="363" r="1.2" fill="#2858a0" />
            <circle cx="265" cy="381" r="1.2" fill="#2858a0" />
            <circle cx="248" cy="390" r="1.2" fill="#2858a0" />
            <circle cx="231" cy="381" r="1.2" fill="#2858a0" />
            <circle cx="231" cy="363" r="1.2" fill="#2858a0" />
          </g>

          {/* GEAR 3 */}
          <g className={styles.gear3}>
            <path fill="url(#gf3)" fillOpacity="0.88" stroke="#3878c8" strokeWidth="1.3" d={paths.g3t} />
            <path fill="none" stroke="rgba(90,150,228,0.3)" strokeWidth="0.6" d={paths.g3h} />
            <circle cx="398" cy="372" r="22" fill="none" stroke="#1a5098" strokeWidth="0.8" opacity="0.5" />
            <circle cx="398" cy="372" r="13" fill="none" stroke="#1d5098" strokeWidth="1.1" opacity="0.6" />
            <circle cx="398" cy="372" r="8" fill="#0a1440" />
            <circle cx="398" cy="372" r="8" fill="none" stroke="#183890" strokeWidth="1.1" />
            <circle cx="398" cy="372" r="3.5" fill="#060e28" />
            <g stroke="#1858a0" strokeWidth="1.4" strokeLinecap="round">
              <line x1="398" y1="364" x2="398" y2="356" />
              <line x1="398" y1="380" x2="398" y2="388" />
              <line x1="390" y1="372" x2="382" y2="372" />
              <line x1="406" y1="372" x2="414" y2="372" />
            </g>
            <circle cx="398" cy="356" r="2.5" fill="#060e28" stroke="#183890" strokeWidth="0.8" />
            <circle cx="414" cy="372" r="2.5" fill="#060e28" stroke="#183890" strokeWidth="0.8" />
            <circle cx="398" cy="388" r="2.5" fill="#060e28" stroke="#183890" strokeWidth="0.8" />
            <circle cx="382" cy="372" r="2.5" fill="#060e28" stroke="#183890" strokeWidth="0.8" />
          </g>

          {/* GEAR 4 */}
          <g className={styles.gear4}>
            <path fill="url(#gf1)" fillOpacity="0.88" stroke="#3470c0" strokeWidth="1.1" d={paths.g4t} />
            <path fill="none" stroke="rgba(80,140,218,0.28)" strokeWidth="0.55" d={paths.g4h} />
            <circle cx="365" cy="432" r="15" fill="none" stroke="#183880" strokeWidth="0.7" opacity="0.5" />
            <circle cx="365" cy="432" r="9"  fill="none" stroke="#183880" strokeWidth="1" opacity="0.55" />
            <circle cx="365" cy="432" r="5.5" fill="#090f38" />
            <circle cx="365" cy="432" r="5.5" fill="none" stroke="#142878" strokeWidth="1" />
            <circle cx="365" cy="432" r="2.5" fill="#060c28" />
            <g stroke="#142878" strokeWidth="1.2" strokeLinecap="round">
              <line x1="365" y1="426" x2="365" y2="420" />
              <line x1="365" y1="438" x2="365" y2="444" />
              <line x1="359" y1="432" x2="353" y2="432" />
              <line x1="371" y1="432" x2="377" y2="432" />
            </g>
            <circle cx="365" cy="421" r="1.8" fill="#060c28" stroke="#142878" strokeWidth="0.7" />
            <circle cx="376" cy="432" r="1.8" fill="#060c28" stroke="#142878" strokeWidth="0.7" />
            <circle cx="365" cy="443" r="1.8" fill="#060c28" stroke="#142878" strokeWidth="0.7" />
            <circle cx="354" cy="432" r="1.8" fill="#060c28" stroke="#142878" strokeWidth="0.7" />
          </g>

          {/* Scan sweep */}
          <g className={styles.scan} style={{ transformOrigin: '300px 308px' }}>
            <path d="M 300,308 L 484,196 A 185,185 0 0 1 484,420 Z" fill="url(#scanGrad)" opacity="0.35" />
          </g>

          {/* Vignette */}
          <circle cx="300" cy="308" r="185" fill="url(#vig)" />
        </g>

        {/* METALLIC RING */}
        <circle cx="300" cy="308" r="198" fill="none" stroke="#0a1a50" strokeWidth="5.5" opacity="0.6" />
        <circle cx="300" cy="308" r="192" fill="none" stroke="url(#silverRing)" strokeWidth="15" />
        <circle cx="300" cy="308" r="184.8" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
        <circle cx="300" cy="308" r="199" fill="none" stroke="rgba(0,0,60,0.45)" strokeWidth="1.5" />
        <path
          d="M 186,224 A 186,186 0 0 1 414,224"
          fill="none"
          stroke="rgba(255,255,255,0.38)"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <circle cx="300" cy="119" r="5" fill="#d0daf2" stroke="#8898b8" strokeWidth="1.2" />
        <circle cx="300" cy="497" r="5" fill="#d0daf2" stroke="#8898b8" strokeWidth="1.2" />
        <circle cx="111" cy="308" r="5" fill="#d0daf2" stroke="#8898b8" strokeWidth="1.2" />
        <circle cx="489" cy="308" r="5" fill="#d0daf2" stroke="#8898b8" strokeWidth="1.2" />
        <circle cx="169" cy="177" r="3.5" fill="#c8d4ea" stroke="#8090a8" strokeWidth="1" />
        <circle cx="431" cy="177" r="3.5" fill="#c8d4ea" stroke="#8090a8" strokeWidth="1" />
        <circle cx="169" cy="439" r="3.5" fill="#c8d4ea" stroke="#8090a8" strokeWidth="1" />
        <circle cx="431" cy="439" r="3.5" fill="#c8d4ea" stroke="#8090a8" strokeWidth="1" />

        {/* TEXT */}
        <text
          x="300"
          y="272"
          textAnchor="middle"
          fontFamily="'Arial Black','Impact',sans-serif"
          fontSize="98"
          fontWeight="900"
          letterSpacing="-4"
          fill="url(#silverText)"
          filter="url(#textFX)"
        >
          CAD
        </text>

        <line x1="196" y1="298" x2="404" y2="298" stroke="rgba(155,188,240,0.25)" strokeWidth="0.8" />

        <text
          x="300"
          y="394"
          textAnchor="middle"
          fontFamily="'Arial Black','Impact',sans-serif"
          fontSize="110"
          fontWeight="900"
          letterSpacing="-5"
          fill="url(#silverText)"
          filter="url(#textFX)"
        >
          AS
        </text>
    </svg>
  );
};

export default AnimatedLogo;
