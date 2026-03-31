import type {Shape3D} from 'replicad';
import type {AxisProfile} from '../types/cad-types';

type ReplicadModule = typeof import('replicad');

type SketcherConstructor = new (plane?: 'XZ') => {
  movePointerTo(point: [number, number]): any;
  lineTo(point: [number, number]): any;
  threePointsArcTo(point: [number, number], midPoint: [number, number]): any;
  done(): {revolve(axis?: [number, number, number], config?: {origin?: [number, number, number]}): Shape3D};
};

const getSketcherConstructor = (replicadModule: ReplicadModule): SketcherConstructor => {
  const Sketcher = (replicadModule as ReplicadModule & {default?: ReplicadModule}).Sketcher ??
    (replicadModule as ReplicadModule & {default?: ReplicadModule}).default?.Sketcher;

  if (!Sketcher) {
    throw new Error('Replicad Sketcher() export was not found.');
  }

  return Sketcher as unknown as SketcherConstructor;
};

export const buildHeadSolid = (replicadModule: ReplicadModule, profile: AxisProfile): Shape3D => {
  const Sketcher = getSketcherConstructor(replicadModule);
  const [firstSegment] = profile.closedSegments;

  const sketcher = new Sketcher('XZ');
  let cursor = sketcher.movePointerTo([firstSegment.from.x, firstSegment.from.z]);

  profile.closedSegments.forEach((segment) => {
    if (segment.kind === 'line') {
      cursor = cursor.lineTo([segment.to.x, segment.to.z]);
      return;
    }

    cursor = cursor.threePointsArcTo([segment.to.x, segment.to.z], [segment.via.x, segment.via.z]);
  });

  const solid = cursor.done().revolve([0, 0, 1], {origin: [0, 0, 0]});
  return typeof solid.simplify === 'function' ? solid.simplify() : solid;
};
