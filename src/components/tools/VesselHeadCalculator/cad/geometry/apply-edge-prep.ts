import type {EdgePrepGeometry, HeadCadConfig, HeadDerivedGeometry, Point2D} from '../types/cad-types';
import {computeDoubleBevelHeight, computeSingleBevelHeight} from './compute-head-geometry';

const point = (x: number, z: number): Point2D => ({x, z});

export const applyEdgePrep = (
  config: HeadCadConfig,
  geometry: HeadDerivedGeometry,
): EdgePrepGeometry => {
  const useEdgePrep = config.includeEdgePrep ?? config.edgePrep !== 'None';
  const baseOuterStart = point(geometry.outer.shellRadius, 0);
  const innerBase = point(geometry.inner.shellRadius, 0);

  if (!useEdgePrep || config.edgePrep === 'None') {
    return {
      mode: 'none',
      bevelHeight: 0,
      rootFace: geometry.thickness,
      outerStart: baseOuterStart,
      innerEnd: innerBase,
      closurePath: [innerBase, baseOuterStart],
    };
  }

  if (config.edgePrepSide === 'double') {
    const bevelHeight = computeDoubleBevelHeight(config);
    const halfLandInset = (geometry.thickness - config.rootFace) / 2;
    const innerBevelStart = point(geometry.inner.shellRadius, bevelHeight);
    const outerBevelStart = point(geometry.outer.shellRadius, bevelHeight);
    const centralLandStart = point(geometry.inner.shellRadius + halfLandInset, 0);
    const centralLandEnd = point(centralLandStart.x + config.rootFace, 0);

    return {
      mode: 'double-v',
      bevelHeight,
      rootFace: config.rootFace,
      outerStart: outerBevelStart,
      innerEnd: innerBevelStart,
      closurePath: [innerBevelStart, centralLandStart, centralLandEnd, outerBevelStart],
    };
  }

  const bevelHeight = computeSingleBevelHeight(config);
  const innerEnd = point(geometry.inner.shellRadius, bevelHeight);
  const outerRootFaceEnd = point(geometry.outer.shellRadius - config.rootFace, 0);

  return {
    mode: 'single-v',
    bevelHeight,
    rootFace: config.rootFace,
    outerStart: baseOuterStart,
    innerEnd,
    closurePath: [innerEnd, outerRootFaceEnd, baseOuterStart],
  };
};
