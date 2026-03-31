import type {Shape3D} from 'replicad';
import type {BlindFlangeCadGeometry} from '../types/cad-types';
import {buildBoltHolePattern} from './build-bolt-hole-pattern';
import {buildFacingFeatures} from './build-facing-features';

type ReplicadModule = typeof import('replicad');

const getReplicadExport = <TExport,>(
  replicadModule: ReplicadModule,
  exportName: string,
): TExport | undefined => {
  const moduleWithDefault = replicadModule as ReplicadModule & {default?: ReplicadModule};
  return (moduleWithDefault as unknown as Record<string, TExport | undefined>)[exportName] ??
    (moduleWithDefault.default as unknown as Record<string, TExport | undefined> | undefined)?.[exportName];
};

export const buildBlindFlangeSolid = (
  replicadModule: ReplicadModule,
  geometry: BlindFlangeCadGeometry,
): Shape3D => {
  const makeCylinder = getReplicadExport<
    (radius: number, height: number, location?: [number, number, number], direction?: [number, number, number]) => Shape3D
  >(replicadModule, 'makeCylinder');
  const makeCompound = getReplicadExport<(shapes: Shape3D[]) => Shape3D>(replicadModule, 'makeCompound');

  if (!makeCylinder) {
    throw new Error('Replicad makeCylinder() export was not found.');
  }

  const outerRadius = geometry.outerDiameter / 2;
  const holeRadius = geometry.boltHoleDiameter / 2;
  let solid = makeCylinder(outerRadius, geometry.thickness, [0, 0, 0], [0, 0, 1]);
  const holeCenters = buildBoltHolePattern(geometry);
  const holeDepth = geometry.thickness + 2;
  const holeOffset = -1;
  const holeSolids = holeCenters.map((center) =>
    makeCylinder(holeRadius, holeDepth, [center.x, center.y, holeOffset], [0, 0, 1]),
  );

  if (holeSolids.length > 0) {
    if (makeCompound) {
      try {
        solid = solid.cut(makeCompound(holeSolids));
      } catch {
        holeSolids.forEach((holeSolid) => {
          solid = solid.cut(holeSolid);
        });
      }
    } else {
      holeSolids.forEach((holeSolid) => {
        solid = solid.cut(holeSolid);
      });
    }
  }

  const featuredSolid = buildFacingFeatures(solid, geometry);
  return typeof featuredSolid.simplify === 'function' ? featuredSolid.simplify() : featuredSolid;
};
