import React, {useEffect, useMemo, useState} from 'react';
import clsx from 'clsx';
import {ExternalLink, Ruler, Scissors, Settings} from 'lucide-react';
import {EDGE_PREP_OPTIONS, EDGE_PREP_SIDES, MATERIALS, STANDARDS} from '../constants';
import {computeDoubleBevelHeight, computeSingleBevelHeight} from '../cad/geometry/compute-head-geometry';
import {useVesselHeadStore} from '../store';
import type {EdgePrep, EdgePrepSide, HeadStandard} from '../types';
import {getMaxAllowableThickness, getMinimumStraightFlange} from '../utils';
import styles from '../styles.module.css';

type ConfigPanelProps = {
  onOpenEdgePrep?: () => void;
};

type NumericFieldName =
  | 'diameterOuter'
  | 'thickness'
  | 'straightFlange'
  | 'bevelAngle'
  | 'rootFace';

type NumericDraftState = Record<NumericFieldName, string>;
type NumericFieldErrors = Partial<Record<NumericFieldName, string>>;
const BLOCKING_FIELDS: Record<NumericFieldName, NumericFieldName[]> = {
  diameterOuter: ['diameterOuter', 'thickness', 'straightFlange', 'rootFace'],
  thickness: ['thickness', 'straightFlange', 'rootFace'],
  straightFlange: ['straightFlange'],
  bevelAngle: ['bevelAngle', 'straightFlange'],
  rootFace: ['rootFace', 'bevelAngle', 'straightFlange'],
};

const toDraftState = (values: Record<NumericFieldName, number>): NumericDraftState => ({
  diameterOuter: values.diameterOuter.toString(),
  thickness: values.thickness.toString(),
  straightFlange: values.straightFlange.toString(),
  bevelAngle: values.bevelAngle.toString(),
  rootFace: values.rootFace.toString(),
});

const parseDrafts = (drafts: NumericDraftState) => ({
  diameterOuter: Number(drafts.diameterOuter),
  thickness: Number(drafts.thickness),
  straightFlange: Number(drafts.straightFlange),
  bevelAngle: Number(drafts.bevelAngle),
  rootFace: Number(drafts.rootFace),
});

const getFieldErrors = (
  drafts: NumericDraftState,
  config: ReturnType<typeof useVesselHeadStore.getState>['config'],
  hasCustomH1: boolean,
): NumericFieldErrors => {
  const parsedDrafts = parseDrafts(drafts);
  const errors: NumericFieldErrors = {};
  const diameter = parsedDrafts.diameterOuter;
  const thickness = parsedDrafts.thickness;
  const straightFlange = parsedDrafts.straightFlange;
  const bevelAngle = parsedDrafts.bevelAngle;
  const rootFace = parsedDrafts.rootFace;
  const activeDiameter = Number.isFinite(diameter) && diameter > 0 ? diameter : config.diameterOuter;
  const activeThickness = Number.isFinite(thickness) && thickness > 0 ? thickness : config.thickness;
  const activeStraightFlange =
    Number.isFinite(straightFlange) && straightFlange >= 0 ? straightFlange : config.straightFlange;
  const minimumStraightFlange = getMinimumStraightFlange(config.standard, activeDiameter, activeThickness);
  const maxAllowableThickness = getMaxAllowableThickness(config.standard, activeDiameter);

  if (drafts.diameterOuter.trim() === '' || !Number.isFinite(diameter)) {
    errors.diameterOuter = 'Enter a valid diameter.';
  } else if (diameter <= 0) {
    errors.diameterOuter = 'Enter a value greater than 0.';
  }

  if (drafts.thickness.trim() === '' || !Number.isFinite(thickness)) {
    errors.thickness = 'Enter a valid thickness.';
  } else if (thickness <= 0) {
    errors.thickness = 'Enter a value greater than 0.';
  } else if (!errors.diameterOuter && thickness >= maxAllowableThickness) {
    errors.thickness = `Thickness must stay below ${Math.max(0, maxAllowableThickness - 0.01).toFixed(2)} mm.`;
  }

  if (drafts.straightFlange.trim() === '' || !Number.isFinite(straightFlange)) {
    errors.straightFlange = 'Enter a valid straight flange value.';
  } else if (straightFlange < 0) {
    errors.straightFlange = 'Enter 0 or a larger value.';
  } else if (hasCustomH1 && straightFlange < minimumStraightFlange) {
    errors.straightFlange = `Enter at least ${minimumStraightFlange} mm for this standard.`;
  }

  if (config.edgePrep !== 'None') {
    if (drafts.bevelAngle.trim() === '' || !Number.isFinite(bevelAngle)) {
      errors.bevelAngle = 'Enter a valid bevel angle.';
    } else if (bevelAngle <= 0 || bevelAngle >= 80) {
      errors.bevelAngle = 'Enter an angle between 0 and 80 degrees.';
    }

    if (drafts.rootFace.trim() === '' || !Number.isFinite(rootFace)) {
      errors.rootFace = 'Enter a valid root face value.';
    } else if (rootFace <= 0) {
      errors.rootFace = 'Enter a value greater than 0.';
    } else if (!errors.thickness && rootFace >= activeThickness) {
      errors.rootFace = 'Root face must be smaller than thickness.';
    }

    if (!errors.thickness && !errors.rootFace && !errors.bevelAngle && !errors.straightFlange) {
      const draftConfig = {
        ...config,
        diameterOuter: activeDiameter,
        thickness: activeThickness,
        straightFlange: activeStraightFlange,
        bevelAngle,
        rootFace,
      };

      if (config.edgePrepSide === 'single') {
        if (computeSingleBevelHeight(draftConfig) >= activeStraightFlange) {
          errors.straightFlange = 'Increase h1 or reduce bevel depth.';
        }
      } else if (computeDoubleBevelHeight(draftConfig) <= 0) {
        errors.bevelAngle = 'Adjust bevel angle or root face to create a valid double bevel.';
      }
    }
  }

  return errors;
};

export default function ConfigPanel({onOpenEdgePrep}: ConfigPanelProps) {
  const config = useVesselHeadStore((state) => state.config);
  const setConfig = useVesselHeadStore((state) => state.setConfig);
  const setStandard = useVesselHeadStore((state) => state.setStandard);
  const [hasCustomH1, setHasCustomH1] = useState(false);
  const [drafts, setDrafts] = useState<NumericDraftState>(() =>
    toDraftState({
      diameterOuter: config.diameterOuter,
      thickness: config.thickness,
      straightFlange: config.straightFlange,
      bevelAngle: config.bevelAngle,
      rootFace: config.rootFace,
    }),
  );

  useEffect(() => {
    setDrafts(
      toDraftState({
        diameterOuter: config.diameterOuter,
        thickness: config.thickness,
        straightFlange: config.straightFlange,
        bevelAngle: config.bevelAngle,
        rootFace: config.rootFace,
      }),
    );
  }, [config.bevelAngle, config.diameterOuter, config.rootFace, config.straightFlange, config.thickness]);

  const minimumStraightFlange = useMemo(
    () => getMinimumStraightFlange(config.standard, config.diameterOuter, config.thickness),
    [config.standard, config.diameterOuter, config.thickness],
  );
  const parsedDrafts = useMemo(() => parseDrafts(drafts), [drafts]);
  const activeDiameter =
    Number.isFinite(parsedDrafts.diameterOuter) && parsedDrafts.diameterOuter > 0
      ? parsedDrafts.diameterOuter
      : config.diameterOuter;
  const activeThickness =
    Number.isFinite(parsedDrafts.thickness) && parsedDrafts.thickness > 0
      ? parsedDrafts.thickness
      : config.thickness;
  const minimumStraightFlangeForDraft = useMemo(
    () => getMinimumStraightFlange(config.standard, activeDiameter, activeThickness),
    [activeDiameter, activeThickness, config.standard],
  );
  const fieldErrors = useMemo(
    () => getFieldErrors(drafts, config, hasCustomH1),
    [config, drafts, hasCustomH1],
  );
  const hasDraftErrors = Object.values(fieldErrors).some(Boolean);

  useEffect(() => {
    if (hasCustomH1) {
      return;
    }

    if (config.straightFlange !== minimumStraightFlange) {
      setConfig({straightFlange: minimumStraightFlange});
    }
  }, [config.straightFlange, hasCustomH1, minimumStraightFlange, setConfig]);

  const updateNumericField = (field: NumericFieldName, rawValue: string) => {
    const nextDrafts = {
      ...drafts,
      [field]: rawValue,
    };
    setDrafts(nextDrafts);

    const numericValue = Number(rawValue);
    if (!rawValue.trim() || !Number.isFinite(numericValue)) {
      return;
    }

    const nextErrors = getFieldErrors(nextDrafts, config, hasCustomH1);
    const hasBlockingError = BLOCKING_FIELDS[field].some((fieldName) => Boolean(nextErrors[fieldName]));

    if (hasBlockingError) {
      return;
    }

    if (field === 'diameterOuter' && numericValue > 0) {
      setConfig({diameterOuter: numericValue});
    }

    if (field === 'thickness' && numericValue > 0) {
      setConfig({thickness: numericValue});
    }

    if (field === 'straightFlange' && numericValue >= 0) {
      setConfig({straightFlange: numericValue});
    }

    if (field === 'bevelAngle' && numericValue > 0 && numericValue < 80) {
      setConfig({bevelAngle: numericValue});
    }

    if (field === 'rootFace' && numericValue > 0) {
      setConfig({rootFace: numericValue});
    }
  };

  return (
    <>
      <section className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Ruler size={20} className="text-blue-500" /> Standard
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {STANDARDS.map((std) => (
            <button
              key={std}
              type="button"
              onClick={() => setStandard(std as HeadStandard)}
              className={clsx(
                'py-2 px-3 text-xs md:text-sm rounded-lg border font-medium transition-all',
                config.standard === std
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg'
                  : 'bg-neutral-900 border-neutral-700 text-neutral-400 hover:border-neutral-500',
              )}
            >
              {std}
            </button>
          ))}
        </div>
      </section>

      <section className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Settings size={20} className="text-blue-500" /> Geometry &amp; Material
        </h2>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="group">
              <label className="block text-xs text-neutral-400 mb-1 ml-1">Diameter (Da)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={drafts.diameterOuter}
                onChange={(event) => updateNumericField('diameterOuter', event.target.value)}
                aria-invalid={Boolean(fieldErrors.diameterOuter)}
                className={clsx(
                  'w-full bg-neutral-900 border rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-600 outline-hidden',
                  fieldErrors.diameterOuter ? 'border-red-500/80' : 'border-neutral-700',
                )}
              />
              {fieldErrors.diameterOuter ? (
                <p className="text-xs text-red-400 mt-2">{fieldErrors.diameterOuter}</p>
              ) : null}
            </div>

            <div className="group">
              <label className="block text-xs text-neutral-400 mb-1 ml-1">Thickness (s)</label>
              <input
                type="number"
                min="0"
                step="0.1"
                value={drafts.thickness}
                onChange={(event) => updateNumericField('thickness', event.target.value)}
                aria-invalid={Boolean(fieldErrors.thickness)}
                className={clsx(
                  'w-full bg-neutral-900 border rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-600 outline-hidden',
                  fieldErrors.thickness ? 'border-red-500/80' : 'border-neutral-700',
                )}
              />
              {fieldErrors.thickness ? (
                <p className="text-xs text-red-400 mt-2">{fieldErrors.thickness}</p>
              ) : null}
            </div>
          </div>

          <div className="group">
            <label className="block text-xs text-neutral-400 mb-1 ml-1">Straight Flange (h1)</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={minimumStraightFlangeForDraft}
                step="0.1"
                value={drafts.straightFlange}
                onChange={(event) => {
                  setHasCustomH1(true);
                  updateNumericField('straightFlange', event.target.value);
                }}
                aria-invalid={Boolean(fieldErrors.straightFlange)}
                className={clsx(
                  'w-full bg-neutral-900 border rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-600 outline-hidden',
                  fieldErrors.straightFlange ? 'border-red-500/80' : 'border-neutral-700',
                )}
              />
              <span className="text-xs text-neutral-500">mm</span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-2">
              Minimum by standard: {minimumStraightFlangeForDraft} mm
            </p>
            {fieldErrors.straightFlange ? (
              <p className="text-xs text-red-400 mt-2">{fieldErrors.straightFlange}</p>
            ) : null}
          </div>

          <div className="group">
            <label className="block text-xs text-neutral-400 mb-1 ml-1">Material</label>
            <select
              value={config.material}
              onChange={(event) => setConfig({material: event.target.value})}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-600 outline-hidden"
            >
              {MATERIALS.map((material) => (
                <option key={material} value={material}>
                  {material}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700 shadow-xl">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Scissors size={20} className="text-blue-500" /> Weld Edge Prep
        </h2>
        <div className="space-y-4">
          <div className="group">
            <label className="block text-xs text-neutral-400 mb-1 ml-1">Type</label>
            <select
              value={config.edgePrep}
              onChange={(event) => setConfig({edgePrep: event.target.value as EdgePrep})}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2.5 px-3 text-white focus:ring-2 focus:ring-blue-600 outline-hidden"
            >
              {EDGE_PREP_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          {config.edgePrep !== 'None' ? (
            <div className={clsx('grid grid-cols-1 sm:grid-cols-3 gap-4', styles.animateFadeIn)}>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Angle (u)</label>
                <input
                  type="number"
                  min="0"
                  max="80"
                  step="0.1"
                  value={drafts.bevelAngle}
                  onChange={(event) => updateNumericField('bevelAngle', event.target.value)}
                  aria-invalid={Boolean(fieldErrors.bevelAngle)}
                  className={clsx(
                    'w-full bg-neutral-900 border rounded-lg py-2 px-3 text-white',
                    fieldErrors.bevelAngle ? 'border-red-500/80' : 'border-neutral-700',
                  )}
                />
                {fieldErrors.bevelAngle ? (
                  <p className="text-xs text-red-400 mt-2">{fieldErrors.bevelAngle}</p>
                ) : null}
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Root Face (mm)</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={drafts.rootFace}
                  onChange={(event) => updateNumericField('rootFace', event.target.value)}
                  aria-invalid={Boolean(fieldErrors.rootFace)}
                  className={clsx(
                    'w-full bg-neutral-900 border rounded-lg py-2 px-3 text-white',
                    fieldErrors.rootFace ? 'border-red-500/80' : 'border-neutral-700',
                  )}
                />
                {fieldErrors.rootFace ? (
                  <p className="text-xs text-red-400 mt-2">{fieldErrors.rootFace}</p>
                ) : null}
              </div>
              <div>
                <label className="block text-xs text-neutral-400 mb-1">Sides</label>
                <select
                  value={config.edgePrepSide}
                  onChange={(event) => setConfig({edgePrepSide: event.target.value as EdgePrepSide})}
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg py-2 px-3 text-white"
                >
                  {EDGE_PREP_SIDES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}
          {hasDraftErrors ? (
            <p className="text-xs text-amber-300/90">
              Calculations and geometry keep using the last valid values until these input errors are fixed.
            </p>
          ) : null}
          <button
            type="button"
            onClick={onOpenEdgePrep}
            className="inline-flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            <ExternalLink size={14} /> View edge prep detail
          </button>
        </div>
      </section>
    </>
  );
}
