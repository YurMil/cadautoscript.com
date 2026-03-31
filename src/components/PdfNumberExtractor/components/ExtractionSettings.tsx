import React from 'react';
import type {ExtractorSettings} from '../types';
import NumericInputField from './NumericInputField';

type ExtractionSettingsProps = {
  settings: ExtractorSettings;
  onSettingChange: <Key extends keyof ExtractorSettings>(
    key: Key,
    value: ExtractorSettings[Key],
  ) => void;
};

export default function ExtractionSettings({
  settings,
  onSettingChange,
}: ExtractionSettingsProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Extraction rules</h3>
        <span className="rounded-full border border-cyan-300/25 bg-cyan-300/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-50">
          Auto quick-scan refresh
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
            Prefix
          </span>
          <input
            type="text"
            value={settings.prefix}
            maxLength={5}
            className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-center text-white outline-none transition focus:border-cyan-300/60 focus:bg-slate-950"
            onChange={(event) => onSettingChange('prefix', event.target.value)}
          />
        </label>

        <NumericInputField
          label="Max length"
          value={settings.maxLength}
          min={1}
          align="center"
          onCommit={(value) => onSettingChange('maxLength', value)}
        />
      </div>

      <div className="space-y-3 rounded-[24px] border border-white/8 bg-slate-950/55 p-4">
        <OptionRow
          checked={settings.processLatestRevisionOnly}
          onChange={(checked) => onSettingChange('processLatestRevisionOnly', checked)}
          label="Process only latest revision (_rXX_)"
        />
        <OptionRow
          checked={settings.includeRevisionInReports}
          onChange={(checked) => onSettingChange('includeRevisionInReports', checked)}
          label="Include revision in reports"
        />
        <OptionRow
          checked={settings.removeCsvDuplicatesKeepLongest}
          onChange={(checked) => onSettingChange('removeCsvDuplicatesKeepLongest', checked)}
          label="Remove duplicates in CSV (keep longest)"
        />
        <OptionRow
          checked={settings.prefillCommentsWithDrawingName}
          onChange={(checked) => onSettingChange('prefillCommentsWithDrawingName', checked)}
          label="Prefill comments with drawing name"
        />
      </div>
    </section>
  );
}

function OptionRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-2xl px-2 py-2 text-sm font-medium text-slate-100 transition hover:bg-white/5 hover:text-white">
      <input
        type="checkbox"
        checked={checked}
        className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-cyan-300 focus:ring-cyan-300/60"
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}
