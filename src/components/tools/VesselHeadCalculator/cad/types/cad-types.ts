import type {HeadConfig, Nozzle} from '../../types';

export type HeadCadConfig = HeadConfig & {
  includeEdgePrep?: boolean;
  includeNozzles?: boolean;
};

export type Point2D = {
  x: number;
  z: number;
};

export type AxisLineSegment = {
  kind: 'line';
  from: Point2D;
  to: Point2D;
};

export type AxisArcSegment = {
  kind: 'arc';
  center: Point2D;
  radius: number;
  from: Point2D;
  via: Point2D;
  to: Point2D;
};

export type AxisSegment = AxisLineSegment | AxisArcSegment;

export type HeadSectionGeometry = {
  shellRadius: number;
  crownRadius: number;
  knuckleRadius: number;
  crownCenter: Point2D;
  knuckleCenter: Point2D;
  tangentPoint: Point2D;
  knuckleStart: Point2D;
  apex: Point2D;
  dishHeight: number;
  totalHeight: number;
};

export type HeadDerivedGeometry = {
  outsideDiameter: number;
  thickness: number;
  straightFlange: number;
  crownRadiusOuter: number;
  crownRadiusInner: number;
  knuckleRadiusOuter: number;
  knuckleRadiusInner: number;
  dishHeight: number;
  totalHeight: number;
  tangentPointOuter: Point2D;
  tangentPointInner: Point2D;
  outer: HeadSectionGeometry;
  inner: HeadSectionGeometry;
};

export type EdgePrepGeometry = {
  mode: 'none' | 'single-v' | 'double-v';
  bevelHeight: number;
  rootFace: number;
  outerStart: Point2D;
  innerEnd: Point2D;
  closurePath: Point2D[];
};

export type AxisProfile = {
  outerSegments: AxisSegment[];
  innerSegments: AxisSegment[];
  closureSegments: AxisSegment[];
  closedSegments: AxisSegment[];
  outerStart: Point2D;
  outerApex: Point2D;
  innerApex: Point2D;
  innerEnd: Point2D;
  edgePrep: EdgePrepGeometry;
};

export type HeadCadJobInput = {
  config: HeadCadConfig;
  nozzles: Nozzle[];
};
