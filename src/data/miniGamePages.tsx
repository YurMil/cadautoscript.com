import React, {Suspense, lazy, type ReactNode} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

const EcoSortGame = lazy(() => import('@site/src/components/EcoSortGame'));
const SmashBottlesGame = lazy(() => import('@site/src/components/SmashBottlesGame'));

const LazyEcoSortGame = (): ReactNode => (
  <BrowserOnly fallback={<div className="utility-loading" aria-busy="true" />}>
    {() => (
      <Suspense fallback={<div className="utility-loading" aria-busy="true" />}>
        <EcoSortGame />
      </Suspense>
    )}
  </BrowserOnly>
);

const LazySmashBottlesGame = (): ReactNode => (
  <BrowserOnly fallback={<div className="utility-loading" aria-busy="true" />}>
    {() => (
      <Suspense fallback={<div className="utility-loading" aria-busy="true" />}>
        <SmashBottlesGame />
      </Suspense>
    )}
  </BrowserOnly>
);

export type MiniGameSlug =
  | 'engineering-blueprint-ncr'
  | 'flanges-memory-matrix'
  | 'pressure-vessel-tycoon'
  | 'smash-bottles'
  | 'eco-sort-game';

export type MiniGamePageConfig = {
  slug: MiniGameSlug;
  title: string;
  subtitle: string;
  description: string;
  about: ReactNode;
  tags: string[];
  note?: ReactNode;
  features?: string[];
  scriptType?: 'module' | 'defer';
  reactionSlug?: string;
  stage?: ReactNode;
};

export const miniGamePageConfigs: Record<MiniGameSlug, MiniGamePageConfig> = {
  'engineering-blueprint-ncr': {
    slug: 'engineering-blueprint-ncr',
    title: 'Engineering Blueprint NCR',
    subtitle: 'Mini game - CAD Minesweeper: NCR Avoidance Protocol',
    description:
      'DWG NO: MS-2024-ENG · REV: 0.1 — Clear the drafting grid without triggering NCRs in this blueprint-themed Minesweeper.',
    about: (
      <>
        <strong>Operational Directive:</strong> Execute a design review of the schematic. Clear all sectors of the
        millimeter drafting grid without tripping a Non-Conformance Report.
        <br />
        <br />
        <strong>Technical Specs:</strong> High-contrast blueprint UI with ISO-style type; hazards are critical design
        flaws (NCRs); use HOLD markers (flags) based on proximity counts; pass only with 100% clearance and zero NCRs.
        <br />
        <br />
        <strong>Warning:</strong> Touching a hidden defect triggers immediate rejection and a Critical Failure Report.
      </>
    ),
    tags: ['Mini game', 'Blueprints', 'QA'],
    note: 'Runs locally in your browser. No sign-in or uploads required.',
    features: [
      'Blueprint grid with NCR hazards',
      'HOLD markers (flags) and proximity counts',
      'Instant fail on defect contact',
    ],
    scriptType: 'defer',
  },
  'flanges-memory-matrix': {
    slug: 'flanges-memory-matrix',
    title: 'Flanges Memory Matrix',
    subtitle: 'Mini game - Pressure Vessel: Safety Release',
    description:
      'Memorize highlighted flange tiles and repeat the sequence as the grid scales up. Mistakes cost lives.',
    about: (
      <>
        A fast memory drill wrapped in a safety/pressure-vessel theme: watch the highlighted tiles, then reproduce the
        pattern. Each level increases the grid and complexity.
      </>
    ),
    tags: ['Mini game', 'Memory', 'Flanges'],
    note: 'Runs locally in your browser. No sign-in required.',
    features: ['Pattern memory rounds', 'Scaling grid difficulty', 'Lives-based fail state'],
    scriptType: 'defer',
  },
  'pressure-vessel-tycoon': {
    slug: 'pressure-vessel-tycoon',
    title: 'Pressure Vessel Tycoon',
    subtitle: 'Mini game - Factory builder for pressure-vessel production',
    description:
      'Lay out conveyors, cutters, welders, and export bays to automate a pressure-vessel line. Avoid jams/decay, upgrade to Mk IV, and use blueprints for fast expansion.',
    about: (
      <>
        Build a compact factory that turns raw steel and parts into finished pressure vessels. Balance two feeder lines
        (plates and flanges), route them with conveyors, and chain Cutter → Assembler → Welder → Painter → Export.
        Machines can overheat if outputs clog or decay if starved, so keep throughput healthy and cash flowing.
      </>
    ),
    tags: ['Mini game', 'Factory sim', 'Automation'],
    note: 'Runs in-browser with Phaser + React. No sign-in required.',
    features: [
      'Dual-line logistics: steel plates plus flange parts',
      'Overheat/decay hazards if buffers clog or starve',
      'Upgrades (Mk I–IV) and blueprint copy/paste',
    ],
    scriptType: 'module',
    reactionSlug: 'mini-pressure-vessel-tycoon',
  },
  'smash-bottles': {
    slug: 'smash-bottles',
    title: 'Railroad Bottle Smash',
    subtitle: 'Mini game - physics sandbox for glass smashing',
    description:
      'Throw stones along a rail line and shatter glass bottles with Three.js + cannon-es physics in a seasonal environment.',
    about: (
      <>
        A physics sandbox built with Three.js and cannon-es: target glass bottles perched along the rail line and shatter
        them with thrown stones while the scene swaps seasons on each reset.
        <br />
        <br />
        <strong>Controls:</strong> Move the mouse to aim, left-click to throw. Right-drag to orbit, middle-wheel to zoom.
      </>
    ),
    tags: ['Mini game', 'Physics', 'Destruction'],
    note: 'Runs in-browser with Three.js + cannon-es. No sign-in required.',
    features: ['Click-to-throw stone launcher', 'Seasonal world variations', 'Glass shatter physics'],
    stage: <LazySmashBottlesGame />,
  },
  'eco-sort-game': {
    slug: 'eco-sort-game',
    title: 'Eco Sort: Atmospheric',
    subtitle: 'Mini game - first-person recycling drill',
    description:
      'Sort flying trash into the correct bins with a first-person throw mechanic under changing weather.',
    about: (
      <>
        Aim and toss items into the matching bins. Weather shifts between clear, rain, and snow, while the
        physics-driven throws stay fast and responsive.
        <br />
        <br />
        <strong>Controls:</strong> WASD to move, drag to look, left click to throw.
      </>
    ),
    tags: ['Mini game', 'Recycling', 'First-person'],
    note: 'Runs in-browser with Three.js + Rapier (WASM). No sign-in required.',
    features: ['Drag-look movement', 'Dynamic weather effects', 'Trajectory preview and scoring'],
    stage: <LazyEcoSortGame />,
  },
};
