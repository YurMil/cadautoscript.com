import React from 'react';
import {CAPTURE_PREVIEW_SCALE} from '../constants';
import type {ExtractorSettings} from '../types';
import NumericInputField from './NumericInputField';

type ScreenshotSettingsProps = {
  settings: ExtractorSettings;
  onSettingChange: <Key extends keyof ExtractorSettings>(
    key: Key,
    value: ExtractorSettings[Key],
  ) => void;
};

export default function ScreenshotSettings({
  settings,
  onSettingChange,
}: ScreenshotSettingsProps) {
  const previewWidth = Math.max(20, settings.captureWidth * CAPTURE_PREVIEW_SCALE);
  const previewHeight = Math.max(20, settings.captureHeight * CAPTURE_PREVIEW_SCALE);

  return (
    <section className="space-y-6">
      <h3 className="text-lg font-semibold text-white">Screenshot settings</h3>

      <div className="grid grid-cols-2 gap-4">
        <NumericInputField
          label="Width (px)"
          value={settings.captureWidth}
          min={20}
          onCommit={(value) => onSettingChange('captureWidth', value)}
        />

        <NumericInputField
          label="Height (px)"
          value={settings.captureHeight}
          min={20}
          onCommit={(value) => onSettingChange('captureHeight', value)}
        />
      </div>

      <RangeField
        label="Horizontal (X)"
        value={settings.captureX}
        onChange={(value) => onSettingChange('captureX', value)}
      />
      <RangeField
        label="Vertical (Y)"
        value={settings.captureY}
        onChange={(value) => onSettingChange('captureY', value)}
      />

      <div className="rounded-[28px] border border-white/8 bg-slate-950/55 p-5">
        <p className="mb-4 text-sm text-slate-200">
          Live crop preview. The crosshair shows where the matched number will sit inside the
          captured screenshot.
        </p>

        <div className="flex justify-center">
          <div
            className="relative overflow-hidden rounded-xl border-2 border-dashed border-slate-500 bg-slate-800 shadow-inner"
            style={{
              width: `${previewWidth}px`,
              height: `${previewHeight}px`,
            }}
          >
            <div
              className="absolute inset-y-0 w-px bg-rose-300"
              style={{left: `${settings.captureX}%`}}
            />
            <div
              className="absolute inset-x-0 h-px bg-rose-300"
              style={{top: `${settings.captureY}%`}}
            />
            <div
              className="absolute rounded bg-rose-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-900"
              style={{
                left: `${settings.captureX}%`,
                top: `${settings.captureY}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              12345
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function RangeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-200">
        <span>{label}</span>
        <span className="rounded-full border border-cyan-300/25 bg-cyan-300/12 px-2 py-0.5 text-cyan-50">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        className="w-full accent-cyan-300"
        onChange={(event) => onChange(Number.parseInt(event.target.value, 10))}
      />
    </div>
  );
}
