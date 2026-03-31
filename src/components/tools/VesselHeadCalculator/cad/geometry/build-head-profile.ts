import type {AxisArcSegment, AxisLineSegment, AxisProfile, HeadCadConfig, HeadDerivedGeometry, Point2D} from '../types/cad-types';
import {applyEdgePrep} from './apply-edge-prep';
import {computeHeadDerivedGeometry} from './compute-head-geometry';
import {validateHeadDerivedGeometry, validateHeadProfile} from './validation';

const samePoint = (first: Point2D, second: Point2D) =>
  Math.abs(first.x - second.x) <= 1e-6 && Math.abs(first.z - second.z) <= 1e-6;

const line = (from: Point2D, to: Point2D): AxisLineSegment => ({
  kind: 'line',
  from,
  to,
});

const normalizedDelta = (start: number, end: number) => {
  let delta = end - start;
  while (delta <= -Math.PI) delta += Math.PI * 2;
  while (delta > Math.PI) delta -= Math.PI * 2;
  return delta;
};

const arcViaPoint = (from: Point2D, to: Point2D, center: Point2D, radius: number): Point2D => {
  const startAngle = Math.atan2(from.z - center.z, from.x - center.x);
  const endAngle = Math.atan2(to.z - center.z, to.x - center.x);
  const midAngle = startAngle + normalizedDelta(startAngle, endAngle) / 2;

  return {
    x: center.x + radius * Math.cos(midAngle),
    z: center.z + radius * Math.sin(midAngle),
  };
};

const arc = (from: Point2D, to: Point2D, center: Point2D, radius: number): AxisArcSegment => ({
  kind: 'arc',
  center,
  radius,
  from,
  via: arcViaPoint(from, to, center, radius),
  to,
});

const connectPoints = (points: Point2D[]) => {
  const segments: AxisLineSegment[] = [];

  for (let index = 0; index < points.length - 1; index += 1) {
    const from = points[index];
    const to = points[index + 1];

    if (!samePoint(from, to)) {
      segments.push(line(from, to));
    }
  }

  return segments;
};

export const buildHeadProfile = (
  config: HeadCadConfig,
  inputGeometry?: HeadDerivedGeometry,
): AxisProfile => {
  const geometry = inputGeometry ?? computeHeadDerivedGeometry(config);
  validateHeadDerivedGeometry(geometry);

  const edgePrep = applyEdgePrep(config, geometry);
  const outerSegments = [
    ...connectPoints([edgePrep.outerStart, geometry.outer.knuckleStart]),
    arc(
      geometry.outer.knuckleStart,
      geometry.outer.tangentPoint,
      geometry.outer.knuckleCenter,
      geometry.outer.knuckleRadius,
    ),
    arc(
      geometry.outer.tangentPoint,
      geometry.outer.apex,
      geometry.outer.crownCenter,
      geometry.outer.crownRadius,
    ),
  ];

  const innerSegments = [
    arc(
      geometry.inner.apex,
      geometry.inner.tangentPoint,
      geometry.inner.crownCenter,
      geometry.inner.crownRadius,
    ),
    arc(
      geometry.inner.tangentPoint,
      geometry.inner.knuckleStart,
      geometry.inner.knuckleCenter,
      geometry.inner.knuckleRadius,
    ),
    ...connectPoints([geometry.inner.knuckleStart, edgePrep.innerEnd]),
  ];

  const axisSegment = line(geometry.outer.apex, geometry.inner.apex);
  const closureSegments = connectPoints(edgePrep.closurePath);
  const closedSegments = [...outerSegments, axisSegment, ...innerSegments, ...closureSegments];

  const profile: AxisProfile = {
    outerSegments,
    innerSegments,
    closureSegments,
    closedSegments,
    outerStart: edgePrep.outerStart,
    outerApex: geometry.outer.apex,
    innerApex: geometry.inner.apex,
    innerEnd: edgePrep.innerEnd,
    edgePrep,
  };

  validateHeadProfile(profile);
  return profile;
};
