import type {CalculationResult, DesignConfiguration, GasketFacing} from '../../bfTypes';
import type {ManualCheckResult} from '../../manualCheckTypes';
import type {BlindFlangeCadGeometry, BlindFlangeCadSource, BlindFlangeFacingType} from '../types/cad-types';
import {assertValidBlindFlangeCadGeometry} from './validation';

const mapFacingType = (gasketFacing?: GasketFacing): BlindFlangeFacingType | undefined => {
  if (gasketFacing === 'FF') return 'FF';
  if (gasketFacing === 'RF') return 'RF';
  if (gasketFacing === 'IBC') return 'CUSTOM';
  return undefined;
};

const buildRaisedFaceDefaults = (gasketFacing?: GasketFacing, gasketOd?: number) => {
  if (gasketFacing !== 'RF' || !gasketOd || gasketOd <= 0) {
    return {
      raisedFaceHeight: undefined,
      raisedFaceDiameter: undefined,
    };
  }

  return {
    raisedFaceHeight: 2,
    raisedFaceDiameter: gasketOd,
  };
};

const fromResult = (
  result: CalculationResult,
  gasketFacing: GasketFacing | undefined,
  source: BlindFlangeCadGeometry['source'],
): BlindFlangeCadGeometry => {
  const facingType = mapFacingType(gasketFacing);
  const facingDefaults = buildRaisedFaceDefaults(gasketFacing, result.gasketOd);

  return {
    outerDiameter: result.dims.D,
    thickness: result.recommendedThickness,
    boltCircleDiameter: result.dims.k,
    boltHoleCount: result.dims.bolts,
    boltHoleDiameter: result.dims.d2,
    boltSize: result.dims.size,
    gasketId: result.gasketId,
    gasketOd: result.gasketOd,
    facingType,
    ...facingDefaults,
    source,
  };
};

const fromDesignConfig = (
  designConfig: DesignConfiguration,
  gasketFacing: GasketFacing | undefined,
): BlindFlangeCadGeometry => {
  const facingType = mapFacingType(gasketFacing);
  const facingDefaults = buildRaisedFaceDefaults(gasketFacing, designConfig.gasketOd);

  return {
    outerDiameter: designConfig.outerDiameter,
    thickness: designConfig.thickness,
    boltCircleDiameter: designConfig.boltCircle,
    boltHoleCount: designConfig.boltCount,
    boltHoleDiameter: designConfig.boltHoleDiameter,
    boltSize: designConfig.boltSize,
    gasketId: designConfig.gasketId,
    gasketOd: designConfig.gasketOd,
    facingType,
    ...facingDefaults,
    source: 'design',
  };
};

const fromManualCheck = (
  manualCheck: ManualCheckResult,
  gasketFacing: GasketFacing | undefined,
): BlindFlangeCadGeometry => {
  const manual = manualCheck.manualInput;

  if (!manual) {
    throw new Error('Manual check result does not include a manual geometry input.');
  }

  const resolvedFacing = manual.gasketFacing ?? manualCheck.gasketSummary?.facing ?? gasketFacing;
  const resolvedGasketId = manualCheck.gasketSummary?.gasketId ?? manual.gasketId;
  const resolvedGasketOd = manualCheck.gasketSummary?.gasketOd ?? manual.gasketOd;
  const facingType = mapFacingType(resolvedFacing);
  const facingDefaults = buildRaisedFaceDefaults(resolvedFacing, resolvedGasketOd);

  return {
    outerDiameter: manual.outerDiameter,
    thickness: manual.thickness,
    boltCircleDiameter: manual.boltCircle,
    boltHoleCount: manual.boltCount,
    boltHoleDiameter: manual.boltHoleDiameter,
    boltSize: manual.boltSize,
    gasketId: resolvedGasketId,
    gasketOd: resolvedGasketOd,
    facingType,
    ...facingDefaults,
    source: 'manual',
  };
};

export const computeBlindFlangeCadGeometry = (source: BlindFlangeCadSource): BlindFlangeCadGeometry => {
  let geometry: BlindFlangeCadGeometry | null = null;

  if (source.manualCheck?.manualInput) {
    geometry = fromManualCheck(source.manualCheck, source.gasketFacing);
  } else if (source.designConfig) {
    geometry = fromDesignConfig(source.designConfig, source.gasketFacing);
  } else if (source.customResult) {
    geometry = fromResult(source.customResult, source.gasketFacing, 'custom');
  } else if (source.result) {
    geometry = fromResult(source.result, source.gasketFacing, 'standard');
  }

  if (!geometry) {
    throw new Error('No active blind flange geometry is available. Calculate a flange or define a design configuration before exporting STEP.');
  }

  assertValidBlindFlangeCadGeometry(geometry);
  return geometry;
};
