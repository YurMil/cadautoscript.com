import type {AxisProfile, HeadCadConfig, HeadDerivedGeometry, Point2D} from '../types/cad-types';
import {computeDoubleBevelHeight, computeSingleBevelHeight} from './compute-head-geometry';

const EPSILON = 1e-6;

const isFiniteNumber = (value: number) => Number.isFinite(value);

const assertCondition = (condition: boolean, message: string) => {
  if (!condition) {
    throw new Error(message);
  }
};

const pointsMatch = (first: Point2D, second: Point2D) =>
  Math.abs(first.x - second.x) <= EPSILON && Math.abs(first.z - second.z) <= EPSILON;

export const validateHeadCadConfig = (config: HeadCadConfig) => {
  assertCondition(isFiniteNumber(config.diameterOuter) && config.diameterOuter > 0, 'Outside diameter must be greater than 0.');
  assertCondition(isFiniteNumber(config.thickness) && config.thickness > 0, 'Thickness must be greater than 0.');
  assertCondition(
    isFiniteNumber(config.straightFlange) && config.straightFlange >= 0,
    'Straight flange height must be 0 or greater.',
  );

  const shellRadiusOuter = config.diameterOuter / 2;
  const crownRadiusOuter = config.standard === 'DIN28013' ? config.diameterOuter * 0.8 : config.diameterOuter;
  const knuckleRadiusOuter = config.standard === 'DIN28013' ? config.diameterOuter * 0.154 : config.diameterOuter * 0.1;
  const maxAllowableThickness = Math.min(shellRadiusOuter, crownRadiusOuter, knuckleRadiusOuter) - EPSILON;

  assertCondition(
    config.thickness < maxAllowableThickness,
    `Thickness is too large for ${config.standard}. Keep it below ${maxAllowableThickness.toFixed(2)} mm.`,
  );

  if ((config.includeEdgePrep ?? config.edgePrep !== 'None') && config.edgePrep === 'V-Bevel') {
    assertCondition(config.rootFace > 0, 'Root face must be greater than 0 for V-bevel edge preparation.');
    assertCondition(config.rootFace < config.thickness, 'Root face must be smaller than the material thickness.');
    assertCondition(config.bevelAngle > 0 && config.bevelAngle < 80, 'Bevel angle must be between 0 and 80 degrees.');

    if (config.edgePrepSide === 'single') {
      const bevelHeight = computeSingleBevelHeight(config);
      assertCondition(
        bevelHeight < config.straightFlange,
        'Single-side bevel exceeds the available straight flange height. Increase h1 or reduce bevel depth.',
      );
    } else {
      const bevelHeight = computeDoubleBevelHeight(config);
      assertCondition(
        bevelHeight > 0,
        'Double-side bevel did not produce a valid land. Increase the bevel angle or reduce the root face.',
      );
    }
  }
};

export const validateHeadDerivedGeometry = (geometry: HeadDerivedGeometry) => {
  assertCondition(geometry.outer.apex.z > geometry.inner.apex.z, 'The inner apex cannot exceed the outer apex.');
  assertCondition(geometry.inner.shellRadius > 0, 'The inner shell radius must stay positive.');
  assertCondition(geometry.inner.crownRadius > 0, 'The inner crown radius must stay positive.');
  assertCondition(geometry.inner.knuckleRadius > 0, 'The inner knuckle radius must stay positive.');
  assertCondition(
    geometry.outer.tangentPoint.x > geometry.inner.tangentPoint.x,
    'The inner tangent point must remain inside the outer tangent point.',
  );
  assertCondition(geometry.outer.tangentPoint.z > geometry.outer.knuckleStart.z, 'Outer tangent point must sit above the straight flange.');
  assertCondition(geometry.inner.tangentPoint.z > geometry.inner.knuckleStart.z, 'Inner tangent point must sit above the straight flange.');
};

export const validateHeadProfile = (profile: AxisProfile) => {
  assertCondition(profile.closedSegments.length >= 4, 'Head profile is incomplete and cannot be revolved into a solid.');

  const firstSegment = profile.closedSegments[0];
  const lastSegment = profile.closedSegments[profile.closedSegments.length - 1];

  assertCondition(
    pointsMatch(firstSegment.from, lastSegment.to),
    'Head profile must be a closed contour before STEP generation.',
  );

  profile.closedSegments.forEach((segment) => {
    assertCondition(segment.from.x >= -EPSILON && segment.to.x >= -EPSILON, 'Profile extends through the axis and would self-intersect when revolved.');
    assertCondition(
      isFiniteNumber(segment.from.x) &&
        isFiniteNumber(segment.from.z) &&
        isFiniteNumber(segment.to.x) &&
        isFiniteNumber(segment.to.z),
      'Profile contains non-finite coordinates.',
    );

    if (segment.kind === 'arc') {
      assertCondition(segment.radius > EPSILON, 'Profile contains a zero-radius arc.');
      assertCondition(
        isFiniteNumber(segment.via.x) && isFiniteNumber(segment.via.z),
        'Profile contains an invalid arc midpoint.',
      );
    }
  });
};
