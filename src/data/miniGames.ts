import React from 'react';
import EngineeringBlueprintThumb from '@site/src/components/MiniGameThumbnails/EngineeringBlueprintThumb';
import FlangesMemoryThumb from '@site/src/components/MiniGameThumbnails/FlangesMemoryThumb';
import PressureVesselThumb from '@site/src/components/MiniGameThumbnails/PressureVesselThumb';
import RailroadSmashThumb from '@site/src/components/MiniGameThumbnails/RailroadSmashThumb';
import EcoSortThumb from '@site/src/components/MiniGameThumbnails/EcoSortThumb';

export type MiniGameDescriptor = {
  id: string;
  name: string;
  description: string;
  tech: string;
  tags: string[];
  href: string;
  thumbnail?: string;
  Component?: React.ComponentType<{className?: string}>;
};

export const miniGames: MiniGameDescriptor[] = [
  {
    id: 'engineering-blueprint-ncr',
    name: 'Engineering Blueprint NCR',
    description:
      'Clear a blueprint grid without triggering NCRs-millimeter-grid Minesweeper with CAD QA stakes.',
    tech: 'HTML5',
    tags: ['QA', 'Blueprints', 'Mini game'],
    href: '/mini-games/engineering-blueprint-ncr/',
    thumbnail: '/img/minigames/engineering-blueprint-ncr.svg',
    Component: EngineeringBlueprintThumb,
  },
  {
    id: 'flanges-memory-matrix',
    name: 'Flanges Memory Matrix',
    description: 'Safety-themed memory grid: remember the highlighted flange tiles, then reproduce the pattern under pressure.',
    tech: 'Phaser',
    tags: ['Memory', 'Flanges', 'Mini game'],
    href: '/mini-games/flanges-memory-matrix/',
    thumbnail: '/img/minigames/flanges-memory-matrix.svg',
    Component: FlangesMemoryThumb,
  },
  {
    id: 'pressure-vessel-tycoon',
    name: 'Pressure Vessel Tycoon',
    description: 'Factorio-inspired factory builder: craft pressure vessels with conveyors, cutters, welders, and upgrades.',
    tech: 'Phaser + React',
    tags: ['Factory sim', 'Automation', 'Mini game'],
    href: '/mini-games/pressure-vessel-tycoon/',
    thumbnail: '/img/minigames/pressure-vessel-tycoon.svg',
    Component: PressureVesselThumb,
  },
  {
    id: 'smash-bottles',
    name: 'Railroad Bottle Smash',
    description:
      'Physics sandbox: hurl stones down a rail line and shatter glass bottles across changing seasons.',
    tech: 'Three.js + cannon-es',
    tags: ['Mini game', 'Physics', 'Destruction'],
    href: '/mini-games/smash-bottles/',
    thumbnail: '/img/minigames/railroad-bottle-smash.svg',
    Component: RailroadSmashThumb,
  },
  {
    id: 'eco-sort-game',
    name: 'Eco Sort: Atmospheric',
    description: 'First-person sorting game: throw items into the correct recycling bins across shifting weather.',
    tech: 'Three.js + Rapier (WASM)',
    tags: ['Mini game', 'Recycling', 'First-person'],
    href: '/mini-games/eco-sort-game/',
    thumbnail: '/img/minigames/eco-sort-atmospheric.svg',
    Component: EcoSortThumb,
  },
];
