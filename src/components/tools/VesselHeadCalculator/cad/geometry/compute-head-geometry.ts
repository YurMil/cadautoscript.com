import type {HeadCadConfig, HeadDerivedGeometry, HeadSectionGeometry} from '../types/cad-types';

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

const getStandardGeometry = (config: HeadCadConfig) => {
  const crownFactor = config.standard === 'DIN28013' ? 0.8 : 1.0;
  const knuckleFactor = config.standard === 'DIN28013' ? 0.154 : 0.1;

  return {
    crownRadiusOuter: config.diameterOuter * crownFactor,
    knuckleRadiusOuter: config.diameterOuter * knuckleFactor,
  };
};

const normalize = (x: number, z: number) => {
  const length = Math.hypot(x, z);
  if (!Number.isFinite(length) || length <= Number.EPSILON) {
    throw new Error('Failed to normalize tangency vector for the head profile.');
  }
  return {x: x / length, z: z / length};
};

const buildSectionGeometry = (
  shellRadius: number,
  crownRadius: number,
  knuckleRadius: number,
  straightFlange: number,
): HeadSectionGeometry => {
  const xOffset = shellRadius - knuckleRadius;
  const centerDistance = crownRadius - knuckleRadius;
  const verticalOffsetSquared = centerDistance ** 2 - xOffset ** 2;

  if (verticalOffsetSquared <= 0) {
    throw new Error(
      'Derived head geometry is impossible: crown and knuckle radii do not produce a valid tangent profile.',
    );
  }

  const verticalOffset = Math.sqrt(verticalOffsetSquared);
  const crownCenter = {x: 0, z: straightFlange - verticalOffset};
  const knuckleCenter = {x: xOffset, z: straightFlange};
  const tangentDirection = normalize(knuckleCenter.x - crownCenter.x, knuckleCenter.z - crownCenter.z);
  const tangentPoint = {
    x: knuckleCenter.x + tangentDirection.x * knuckleRadius,
    z: knuckleCenter.z + tangentDirection.z * knuckleRadius,
  };
  const apex = {
    x: 0,
    z: crownCenter.z + crownRadius,
  };

  return {
    shellRadius,
    crownRadius,
    knuckleRadius,
    crownCenter,
    knuckleCenter,
    tangentPoint,
    knuckleStart: {x: shellRadius, z: straightFlange},
    apex,
    dishHeight: apex.z - straightFlange,
    totalHeight: apex.z,
  };
};

export const computeHeadDerivedGeometry = (config: HeadCadConfig): HeadDerivedGeometry => {
  const {crownRadiusOuter, knuckleRadiusOuter} = getStandardGeometry(config);
  const thickness = config.thickness;
  const shellRadiusOuter = config.diameterOuter / 2;
  const shellRadiusInner = shellRadiusOuter - thickness;
  const crownRadiusInner = crownRadiusOuter - thickness;
  const knuckleRadiusInner = knuckleRadiusOuter - thickness;

  const outer = buildSectionGeometry(
    shellRadiusOuter,
    crownRadiusOuter,
    knuckleRadiusOuter,
    config.straightFlange,
  );
  const inner = buildSectionGeometry(
    shellRadiusInner,
    crownRadiusInner,
    knuckleRadiusInner,
    config.straightFlange,
  );

  return {
    outsideDiameter: config.diameterOuter,
    thickness,
    straightFlange: config.straightFlange,
    crownRadiusOuter,
    crownRadiusInner,
    knuckleRadiusOuter,
    knuckleRadiusInner,
    dishHeight: outer.dishHeight,
    totalHeight: outer.totalHeight,
    tangentPointOuter: outer.tangentPoint,
    tangentPointInner: inner.tangentPoint,
    outer,
    inner,
  };
};

export const computeSingleBevelHeight = (config: HeadCadConfig) =>
  Math.tan(toRadians(config.bevelAngle)) * (config.thickness - config.rootFace);

export const computeDoubleBevelHeight = (config: HeadCadConfig) =>
  Math.tan(toRadians(config.bevelAngle)) * ((config.thickness - config.rootFace) / 2);
