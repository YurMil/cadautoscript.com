import type {CalculationResult, DesignConfiguration, GasketFacing} from '../../bfTypes';
import type {ManualCheckResult} from '../../manualCheckTypes';

export type BlindFlangeFacingType = 'FF' | 'RF' | 'RTJ' | 'CUSTOM';

export type BlindFlangeCadGeometry = {
  outerDiameter: number;
  thickness: number;
  boltCircleDiameter: number;
  boltHoleCount: number;
  boltHoleDiameter: number;
  boltSize?: string;
  gasketId?: number;
  gasketOd?: number;
  facingType?: BlindFlangeFacingType;
  raisedFaceHeight?: number;
  raisedFaceDiameter?: number;
  source: 'manual' | 'design' | 'custom' | 'standard';
};

export type BlindFlangeCadSource = {
  manualCheck?: ManualCheckResult | null;
  result?: CalculationResult | null;
  customResult?: CalculationResult | null;
  designConfig?: DesignConfiguration | null;
  gasketFacing?: GasketFacing;
};

export type BoltHoleCenter = {
  x: number;
  y: number;
};
