import React from 'react';

type ExportActionsProps = {
  disabled: boolean;
  onExportPdf: () => void;
  onExportTxt: () => void;
  onExportCsv: () => void;
};

export default function ExportActions({
  disabled,
  onExportPdf,
  onExportTxt,
  onExportCsv,
}: ExportActionsProps) {
  return (
    <div className="mt-8 border-t border-white/10 pt-6">
      <h3 className="mb-4 text-center text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
        Export options
      </h3>
      <div className="flex flex-wrap justify-center gap-4">
        <ActionButton disabled={disabled} onClick={onExportPdf} tone="blue">
          PDF Report
        </ActionButton>
        <ActionButton disabled={disabled} onClick={onExportTxt} tone="emerald">
          TXT List
        </ActionButton>
        <ActionButton disabled={disabled} onClick={onExportCsv} tone="amber">
          CSV Data
        </ActionButton>
      </div>
    </div>
  );
}

function ActionButton({
  disabled,
  onClick,
  tone,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  tone: 'blue' | 'emerald' | 'amber';
  children: React.ReactNode;
}) {
  const toneClass =
    tone === 'blue'
      ? 'bg-blue-600 hover:bg-blue-500'
      : tone === 'emerald'
        ? 'bg-emerald-700 hover:bg-emerald-600'
        : 'bg-amber-700 hover:bg-amber-600';

  return (
    <button
      type="button"
      disabled={disabled}
      className={[
        'rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition',
        toneClass,
        disabled ? 'cursor-not-allowed opacity-45' : '',
      ].join(' ')}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
