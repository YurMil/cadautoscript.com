import type {EdgePrepGeometry, HeadCadConfig, HeadDerivedGeometry, Point2D} from '../types/cad-types';
import {computeDoubleBevelHeight, computeSingleBevelHeight} from './compute-head-geometry';

const point = (x: number, z: number): Point2D => ({x, z});

export const applyEdgePrep = (
  config: HeadCadConfig,
  geometry: HeadDerivedGeometry,
): EdgePrepGeometry => {
  const useEdgePrep = config.includeEdgePrep ?? config.edgePrep !== 'None';
  const outerStart = point(geometry.outer.shellRadius, 0);
  const innerBase = point(geometry.inner.shellRadius, 0);

  if (!useEdgePrep || config.edgePrep === 'None') {
    return {
      mode: 'none',
      bevelHeight: 0,
      rootFace: geometry.thickness,
      outerStart,
      innerEnd: innerBase,
      closurePath: [innerBase, outerStart],
    };
  }

  if (config.edgePrepSide === 'double') {
    const bevelHeight = computeDoubleBevelHeight(config);
    const halfLandInset = (geometry.thickness - config.rootFace) / 2;
    const centralLandStart = point(geometry.inner.shellRadius + halfLandInset, bevelHeight);
    const centralLandEnd = point(centralLandStart.x + config.rootFace, bevelHeight);

    return {
      mode: 'double-v',
      bevelHeight,
      rootFace: config.rootFace,
      outerStart,
      innerEnd: innerBase,
      closurePath: [innerBase, centralLandStart, centralLandEnd, outerStart],
    };
  }

  const bevelHeight = computeSingleBevelHeight(config);
  const innerEnd = point(geometry.inner.shellRadius, bevelHeight);
  const outerRootFaceEnd = point(geometry.outer.shellRadius - config.rootFace, 0);

  return {
    mode: 'single-v',
    bevelHeight,
    rootFace: config.rootFace,
    outerStart,
    innerEnd,
    closurePath: [innerEnd, outerRootFaceEnd, outerStart],
  };
};
