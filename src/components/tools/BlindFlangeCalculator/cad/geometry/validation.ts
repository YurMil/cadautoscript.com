import type {BlindFlangeCadGeometry} from '../types/cad-types';

const EPSILON = 1e-6;

export const validateBlindFlangeCadGeometry = (geometry: BlindFlangeCadGeometry): string[] => {
  const errors: string[] = [];

  if (!Number.isFinite(geometry.outerDiameter) || geometry.outerDiameter <= 0) {
    errors.push('Outer diameter must be greater than 0.');
  }

  if (!Number.isFinite(geometry.thickness) || geometry.thickness <= 0) {
    errors.push('Thickness must be greater than 0.');
  }

  if (!Number.isFinite(geometry.boltCircleDiameter) || geometry.boltCircleDiameter <= 0) {
    errors.push('Bolt circle diameter must be greater than 0.');
  }

  if (!Number.isFinite(geometry.boltHoleCount) || geometry.boltHoleCount < 1) {
    errors.push('Bolt hole count must be at least 1.');
  }

  if (!Number.isInteger(geometry.boltHoleCount)) {
    errors.push('Bolt hole count must be a whole number.');
  }

  if (!Number.isFinite(geometry.boltHoleDiameter) || geometry.boltHoleDiameter <= 0) {
    errors.push('Bolt hole diameter must be greater than 0.');
  }

  if (geometry.boltCircleDiameter >= geometry.outerDiameter) {
    errors.push('Bolt circle diameter must stay inside the flange outer diameter.');
  }

  if (geometry.boltHoleDiameter >= geometry.boltCircleDiameter) {
    errors.push('Bolt hole diameter must be smaller than the bolt circle diameter.');
  }

  const outerRadius = geometry.outerDiameter / 2;
  const boltCircleRadius = geometry.boltCircleDiameter / 2;
  const holeRadius = geometry.boltHoleDiameter / 2;

  if (boltCircleRadius + holeRadius >= outerRadius - EPSILON) {
    errors.push('Bolt holes break through the flange outer edge.');
  }

  if (geometry.boltHoleCount > 1) {
    const chord = 2 * boltCircleRadius * Math.sin(Math.PI / geometry.boltHoleCount);
    if (chord <= geometry.boltHoleDiameter + EPSILON) {
      errors.push('Bolt holes overlap each other on the selected bolt circle.');
    }
  }

  return errors;
};

export const assertValidBlindFlangeCadGeometry = (geometry: BlindFlangeCadGeometry) => {
  const errors = validateBlindFlangeCadGeometry(geometry);
  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }
};
