import type {GeometryResult, HeadConfig, Nozzle, NozzleSize, Tolerances} from './types';
import type {HeadStandard} from './types';

export const getMaxAllowableThickness = (
  standard: HeadStandard,
  diameterOuter: number,
): number => {
  const shellRadiusOuter = diameterOuter / 2;
  const crownRadiusOuter = standard === 'DIN28013' ? diameterOuter * 0.8 : diameterOuter;
  const knuckleRadiusOuter = standard === 'DIN28013' ? diameterOuter * 0.154 : diameterOuter * 0.1;

  return Math.min(shellRadiusOuter, crownRadiusOuter, knuckleRadiusOuter);
};

export const getTolerances = (diameterOuter: number): Tolerances => {
  let daTol = 0;
  if (diameterOuter <= 500) daTol = 2;
  else if (diameterOuter <= 1200) daTol = 3;
  else if (diameterOuter <= 2000) daTol = 4;
  else daTol = Math.ceil(diameterOuter * 0.003);

  return {
    daPlus: daTol,
    daMinus: daTol,
    hPlus: 10,
    hMinus: 0,
    ovality: Math.ceil(diameterOuter * 0.01),
    thicknessMin: 0.3,
  };
};

export const calculateGeometry = (config: HeadConfig): GeometryResult => {
  const {diameterOuter: Da, thickness: s, standard, straightFlange: h1} = config;

  let R = 0;
  let r = 0;
  let h2 = 0;
  let blankDiameterFactor = 1.0;

  if (standard === 'DIN28011') {
    R = Da;
    r = 0.1 * Da;
    h2 = 0.1935 * Da - 0.455 * s;
    blankDiameterFactor = 1.09;
  } else if (standard === 'DIN28013') {
    R = 0.8 * Da;
    r = 0.154 * Da;
    h2 = 0.255 * Da - 0.635 * s;
    blankDiameterFactor = 1.14;
  } else if (standard === 'SS895') {
    R = Da;
    r = 0.1 * Da;
    h2 = 0.1935 * Da;
    blankDiameterFactor = 1.09;
  }

  const totalHeight = h1 + h2 + s;

  const blankDiameter = blankDiameterFactor * Da + 2 * h1;
  const surfaceAreaMM2 = Math.PI * (blankDiameter / 2) ** 2;
  const volumeMM3 = surfaceAreaMM2 * s;

  const density = config.material.includes('Stainless') ? 7.9 : 7.85;
  const weight = (volumeMM3 / 1000000) * density;

  return {R, r, h2, totalHeight, weight, blankDiameter, tolerances: getTolerances(Da)};
};

export const calculateVolumeM3 = (config: HeadConfig, totalHeight: number): number => {
  const cylinderApprox = totalHeight * Math.PI * (config.diameterOuter / 2) ** 2;
  return (cylinderApprox / 1e9) * 0.7;
};

export const getMinimumStraightFlange = (
  standard: HeadStandard,
  diameterOuter: number,
  thickness: number,
): number => {
  let baseMinimum = 0;

  if (standard === 'SS895') {
    if (diameterOuter <= 700) {
      baseMinimum = 30;
    } else if (diameterOuter <= 1600) {
      baseMinimum = 40;
    } else {
      baseMinimum = 50;
    }
  } else {
    if (diameterOuter <= 500) {
      baseMinimum = 25;
    } else if (diameterOuter <= 1600) {
      baseMinimum = 40;
    } else {
      baseMinimum = 50;
    }
  }

  if (thickness > 50) {
    return Math.max(baseMinimum, thickness * 3);
  }

  return baseMinimum;
};

export const getDimensionFontSize = (diameterOuter: number): number =>
  Math.max(24, diameterOuter * 0.035);

export const createNozzle = (): Nozzle => ({
  id: Math.random().toString(36).slice(2, 11),
  size: 'DN50',
  offset: 0,
  type: 'PN16',
});

export const getNozzleDiameter = (size: NozzleSize): number => {
  const parsed = Number.parseInt(size.replace('DN', ''), 10);
  return Number.isNaN(parsed) ? 50 : parsed;
};
