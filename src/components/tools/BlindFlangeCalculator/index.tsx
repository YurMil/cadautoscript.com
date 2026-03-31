import {useCallback, useEffect, useMemo, useState} from 'react';
import {Gauge, Layers} from 'lucide-react';
import InputForm from './components/InputForm';
import ResultsPanel from './components/ResultsPanel';
import ExportActions from './components/ExportActions';
import {AVAILABLE_DNS, DEFAULT_FASTENER_ID, MATERIALS, getFastenerOptionsFor} from './data';
import {getHydroTestPressure} from './allowables';
import type {CustomSizingResult} from './custom';
import {calculateBlindFlange, findClosestStandardFromDims, getCalculatedPN, getMaxAvailablePN} from './utils';
import type {
  FastenerGradeId,
  FastenerStandard,
  FastenerType,
  FrictionPreset,
  GasketFacing,
  GasketMaterial,
  DesignConfiguration,
  GeometryMode,
  MaterialId,
  TighteningMethod,
} from './bfTypes';
import type {ManualCheckResult} from './manualCheckTypes';

const MAX_STANDARD_PN = 400;

export default function BlindFlangeCalculator() {
  const [dn, setDn] = useState(100);
  const [pressureOp, setPressureOp] = useState(10);
  const [pressureTest, setPressureTest] = useState(15);
  const [temperature, setTemperature] = useState(20);
  const [material, setMaterial] = useState<MaterialId>('P265GH');
  const [corrosionAllowance, setCorrosionAllowance] = useState(1);
  const [gasketMaterial, setGasketMaterial] = useState<GasketMaterial>('graphite');
  const [gasketThickness, setGasketThickness] = useState(2);
  const [gasketFacing, setGasketFacing] = useState<GasketFacing>('RF');
  const [geometryMode, setGeometryMode] = useState<GeometryMode>('standard');
  const [customOuterDiameter, setCustomOuterDiameter] = useState<number | undefined>(undefined);
  const [customNozzleId, setCustomNozzleId] = useState<number | undefined>(undefined);
  const [designConfig, setDesignConfig] = useState<DesignConfiguration | null>(null);
  const [isUserDefined, setIsUserDefined] = useState(false);
  const [geometryMatchNote, setGeometryMatchNote] = useState<string | undefined>(undefined);
  const [frictionPreset, setFrictionPreset] = useState<FrictionPreset>('dry');
  const [tighteningMethod, setTighteningMethod] = useState<TighteningMethod>('k_factor');
  const [fastenerStandard, setFastenerStandard] = useState<FastenerStandard>('EN');
  const [fastenerType, setFastenerType] = useState<FastenerType>('BOLT');
  const [fastenerGradeId, setFastenerGradeId] = useState<FastenerGradeId>(DEFAULT_FASTENER_ID);
  const [manualTestPressure, setManualTestPressure] = useState(false);
  const [customResult, setCustomResult] = useState<CustomSizingResult | null>(null);
  const [manualCheckResult, setManualCheckResult] = useState<ManualCheckResult | null>(null);

  const calculatedPn = useMemo(() => getCalculatedPN(pressureOp), [pressureOp]);
  const maxAvailablePn = useMemo(() => getMaxAvailablePN(dn), [dn]);
  const exceedsPnCap = pressureOp > MAX_STANDARD_PN || pressureTest > MAX_STANDARD_PN;
  const forceCustom = geometryMode === 'custom' ? false : exceedsPnCap || (maxAvailablePn !== undefined && calculatedPn > maxAvailablePn);

  const hydroAuto = useMemo(
    () =>
      getHydroTestPressure({
        code: 'EN13445',
        P_design_bar: pressureOp,
        P_op_bar: pressureOp,
        T_design_C: temperature,
        T_test_C: 20,
        materialId: material,
      }),
    [pressureOp, temperature, material],
  );

  const hydroAutoRounded = Number.parseFloat(hydroAuto.P_test_bar.toFixed(1));
  const isTestBelowAuto = manualTestPressure && pressureTest < hydroAutoRounded;

  useEffect(() => {
    const available = getFastenerOptionsFor(fastenerStandard, fastenerType);
    const hasCurrent = available.some((entry) => entry.id === fastenerGradeId);
    if (!hasCurrent && available.length > 0) {
      setFastenerGradeId(available[0].id);
    }
  }, [fastenerStandard, fastenerType, fastenerGradeId]);

  useEffect(() => {
    if (!manualTestPressure) {
      setPressureTest(Math.max(hydroAutoRounded, pressureOp));
    }
  }, [manualTestPressure, hydroAutoRounded, pressureOp]);

  useEffect(() => {
    if (geometryMode !== 'custom') return;
    if (!customNozzleId || customNozzleId <= 0) return;
    const nearestDn = AVAILABLE_DNS.reduce((closest, candidate) => {
      if (!closest) return candidate;
      return Math.abs(candidate - customNozzleId) < Math.abs(closest - customNozzleId)
        ? candidate
        : closest;
    }, 0);
    if (nearestDn && nearestDn !== dn) {
      setDn(nearestDn);
    }
  }, [geometryMode, customNozzleId, dn]);

  const input = useMemo(
    () => ({
      geometryMode,
      dn,
      customOuterDiameter,
      customNozzleId,
      pressureOp,
      pressureTest,
      temperature,
      material,
      corrosionAllowance,
      gasketMaterial,
      gasketThickness,
      gasketFacing,
      frictionPreset,
      tighteningMethod,
      fastenerStandard,
      fastenerType,
      fastenerGradeId,
    }),
    [
      geometryMode,
      dn,
      customOuterDiameter,
      customNozzleId,
      pressureOp,
      pressureTest,
      temperature,
      material,
      corrosionAllowance,
      gasketMaterial,
      gasketThickness,
      gasketFacing,
      frictionPreset,
      tighteningMethod,
      fastenerStandard,
      fastenerType,
      fastenerGradeId,
    ],
  );

  const standardResult = useMemo(() => calculateBlindFlange({...input, geometryMode: 'standard'}), [input]);
  const autoCustomDims = useMemo(() => {
    if (geometryMode !== 'custom') return null;
    if (!standardResult) return null;
    return {
      D: customOuterDiameter ?? standardResult.dims.D,
      k: standardResult.dims.k,
      bolts: standardResult.dims.bolts,
      size: standardResult.dims.size,
      d2: standardResult.dims.d2,
    };
  }, [geometryMode, standardResult, customOuterDiameter]);

  const calcInput = useMemo(() => {
    if (geometryMode !== 'custom' || !autoCustomDims) return input;
    return {
      ...input,
      customOuterDiameter: autoCustomDims.D,
      customBoltCircle: autoCustomDims.k,
      customBoltCount: autoCustomDims.bolts,
      customBoltSize: autoCustomDims.size,
      customBoltHoleDiameter: autoCustomDims.d2,
    };
  }, [geometryMode, autoCustomDims, input]);

  const result = useMemo(() => calculateBlindFlange(calcInput), [calcInput]);
  const exportResult = customResult?.result ?? result;

  useEffect(() => {
    if (result) {
      if (forceCustom) {
      } else {
        setCustomResult(null);
        setManualCheckResult(null);
      }
    }
  }, [result, forceCustom]);

  useEffect(() => {
    if (geometryMode !== 'custom') return;
    if (!standardResult) return;
    setCustomOuterDiameter((prev) => (prev && prev > 0 ? prev : standardResult.dims.D));
    setCustomNozzleId((prev) => (prev && prev > 0 ? prev : standardResult.gasketId ?? dn));
  }, [geometryMode, standardResult, dn]);

  useEffect(() => {
    if (!exportResult) return;
    if (isUserDefined) return;
    const gasketId = exportResult.gasketId ?? customNozzleId ?? dn;
    const gasketOd = exportResult.gasketOd ?? gasketId + 20;
    setDesignConfig({
      outerDiameter: exportResult.dims.D,
      thickness: exportResult.recommendedThickness,
      boltCircle: exportResult.dims.k,
      boltCount: exportResult.dims.bolts,
      boltSize: exportResult.dims.size,
      boltHoleDiameter: exportResult.dims.d2,
      gasketId,
      gasketOd,
    });
  }, [exportResult, isUserDefined, customNozzleId, dn]);

  const handleGeometryModeChange = (mode: GeometryMode) => {
    if (mode === geometryMode) return;
    setIsUserDefined(false);
    if (mode === 'custom') {
      if (standardResult) {
        setCustomOuterDiameter(standardResult.dims.D);
        setCustomNozzleId(standardResult.gasketId ?? dn);
      }
      setGeometryMatchNote(undefined);
      setGeometryMode('custom');
      return;
    }

    const customDims = designConfig
      ? {
          D: designConfig.outerDiameter,
          k: designConfig.boltCircle,
          bolts: designConfig.boltCount,
          size: designConfig.boltSize,
          d2: designConfig.boltHoleDiameter,
        }
      : autoCustomDims
        ? {
            D: autoCustomDims.D,
            k: autoCustomDims.k,
            bolts: autoCustomDims.bolts,
            size: autoCustomDims.size,
            d2: autoCustomDims.d2,
          }
        : null;
    if (customDims) {
      const match = findClosestStandardFromDims(customDims);
      if (match) {
        setDn(match.dn);
        setGeometryMatchNote(
          match.exact
            ? undefined
            : `No exact match found. Using nearest DN ${match.dn} / PN ${match.pn} (D=${match.dims.D} mm, K=${match.dims.k} mm).`,
        );
      } else {
        setGeometryMatchNote('No close EN 1092-1 match found. Standard mode reset to current DN.');
      }
    }
    setGeometryMode('standard');
  };

  const selectedPn = result?.selectedPN;

  const handleCustomResultChange = useCallback((value: CustomSizingResult | null) => {
    setCustomResult(value);
    setManualCheckResult(null);
  }, []);

  const handleManualResultChange = useCallback((value: ManualCheckResult | null) => {
    setManualCheckResult(value);
    setCustomResult(null);
  }, []);

  const handleDesignConfigChange = useCallback((value: DesignConfiguration, isUser?: boolean) => {
    setDesignConfig(value);
    if (isUser === false) {
      setIsUserDefined(false);
      return;
    }
    if (isUser) setIsUserDefined(true);
  }, []);

  return (
    <div className="min-h-full bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 lg:px-8 lg:py-10">
        <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs uppercase tracking-wide text-cyan-200">
              <Layers size={14} />
              EN 13445-3 / EN 1092-1
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-slate-100">Blind Flange Calculator</h1>
              <p className="text-sm text-slate-400">
                Automatic PN selection and thickness sizing with a quick weight estimate.
              </p>
            </div>
          </div>
          <ExportActions
            input={input}
            result={exportResult}
            stepBaseResult={result}
            stepCustomResult={customResult?.result ?? null}
            designConfig={designConfig}
            gasketFacing={gasketFacing}
            manualCheckResult={manualCheckResult}
            targetPN={calculatedPn}
            customDebug={customResult?.debug}
          />
        </header>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 space-y-6">
            <InputForm
              geometryMode={geometryMode}
              dn={dn}
              customOuterDiameter={customOuterDiameter}
              customNozzleId={customNozzleId}
              pressureOp={pressureOp}
              pressureTest={pressureTest}
              temperature={temperature}
              material={material}
              corrosionAllowance={corrosionAllowance}
              gasketMaterial={gasketMaterial}
              gasketThickness={gasketThickness}
              gasketFacing={gasketFacing}
              frictionPreset={frictionPreset}
              tighteningMethod={tighteningMethod}
              fastenerStandard={fastenerStandard}
              fastenerType={fastenerType}
              fastenerGradeId={fastenerGradeId}
              autoTestPressure={hydroAutoRounded}
              autoTestBasis={hydroAuto.basis}
              autoTestRatio={hydroAuto.ratioUsed}
              autoTestClampedToOp={hydroAuto.clampedToOp}
              showTestPressureWarning={isTestBelowAuto}
              availableDns={AVAILABLE_DNS}
              materials={MATERIALS}
              geometryMatchNote={geometryMatchNote}
              onGeometryModeChange={handleGeometryModeChange}
              onDnChange={setDn}
              onCustomOuterDiameterChange={setCustomOuterDiameter}
              onCustomNozzleIdChange={setCustomNozzleId}
              onPressureOpChange={(value) => {
                setPressureOp(value);
                setManualTestPressure(false);
              }}
              onPressureTestChange={(value) => {
                setPressureTest(Math.max(value, pressureOp));
                setManualTestPressure(true);
              }}
              onTemperatureChange={setTemperature}
              onMaterialChange={setMaterial}
              onCorrosionAllowanceChange={setCorrosionAllowance}
              onGasketMaterialChange={setGasketMaterial}
              onGasketThicknessChange={setGasketThickness}
              onGasketFacingChange={setGasketFacing}
              onFrictionPresetChange={setFrictionPreset}
              onTighteningMethodChange={setTighteningMethod}
              onFastenerStandardChange={setFastenerStandard}
              onFastenerTypeChange={setFastenerType}
              onFastenerGradeChange={setFastenerGradeId}
            />

            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300">
              <div className="flex items-start gap-3">
                <div className="mt-1 text-cyan-300">
                  <Gauge size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-slate-400">PN selection</p>
                  {!forceCustom ? (
                    <p className="mt-1">
                      Operating pressure {pressureOp} bar maps to PN {calculatedPn}. Selected class:
                      <span className="ml-1 font-semibold text-slate-100">
                        {selectedPn ? `PN ${selectedPn}` : 'No match'}
                      </span>
                      .
                    </p>
                  ) : (
                    <p className="mt-1 text-amber-200">
                      Operating pressure {pressureOp} bar exceeds standard PN {MAX_STANDARD_PN}. Switching to custom sizing.
                    </p>
                  )}
                  {maxAvailablePn && maxAvailablePn < calculatedPn ? (
                    <p className="mt-2 text-xs text-amber-200">
                      This build only includes EN 1092-1 bolt patterns up to PN {maxAvailablePn} for DN {dn}. Add PN{' '}
                      {calculatedPn} data to enable high-pressure sizing.
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <ResultsPanel
             result={forceCustom ? null : result}
             customResult={customResult}
             manualCheckResult={manualCheckResult}
             designConfig={designConfig}
             isUserDefined={isUserDefined}
             dn={dn}
             pressureOp={pressureOp}
             targetPN={calculatedPn}
             maxAvailablePN={maxAvailablePn}
             input={input}
             onCustomResultChange={handleCustomResultChange}
             onManualResultChange={handleManualResultChange}
             onDesignConfigChange={handleDesignConfigChange}
           />
          </div>
        </div>
      </div>
    </div>
  );
}
