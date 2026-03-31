import type {BoltHoleCenter, BlindFlangeCadGeometry} from '../types/cad-types';

export const buildBoltHolePattern = (geometry: BlindFlangeCadGeometry): BoltHoleCenter[] => {
  const radius = geometry.boltCircleDiameter / 2;

  return Array.from({length: geometry.boltHoleCount}, (_, index) => {
    const angle = (2 * Math.PI * index) / geometry.boltHoleCount;
    return {
      x: radius * Math.cos(angle),
      y: radius * Math.sin(angle),
    };
  });
};
