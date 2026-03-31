import {useState} from 'react';
import {FileDown, FileText, Loader2} from 'lucide-react';
import {buildDxf, buildDxfFromManual, downloadTextFile, exportPdfReport} from '../exportUtils';
import type {CalculationInput, CalculationResult, DesignConfiguration, GasketFacing} from '../bfTypes';
import type {ManualCheckResult} from '../manualCheckTypes';
import type {CustomSizingDebug} from '../custom';
import StepExportPanel from './StepExportPanel';

type Props = {
  input: CalculationInput;
  result: CalculationResult | null;
  stepBaseResult?: CalculationResult | null;
  stepCustomResult?: CalculationResult | null;
  designConfig?: DesignConfiguration | null;
  gasketFacing: GasketFacing;
  manualCheckResult?: ManualCheckResult | null;
  targetPN: number;
  customDebug?: CustomSizingDebug | null;
};

export default function ExportActions({
  input,
  result,
  stepBaseResult,
  stepCustomResult,
  designConfig,
  gasketFacing,
  manualCheckResult,
  targetPN,
  customDebug,
}: Props) {
  const [isPdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const handlePdf = async () => {
    if (!result && !manualCheckResult) return;
    try {
      setPdfLoading(true);
      setPdfError(null);
      await exportPdfReport({
        input,
        result,
        targetPN,
        debug: result?.source === 'custom' ? customDebug : null,
        manualCheck: manualCheckResult ?? undefined,
      });
    } catch (err) {
      console.error('PDF export failed', err);
      setPdfError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDxf = () => {
    if (manualCheckResult?.manualInput) {
      const dxf = buildDxfFromManual(manualCheckResult);
      if (!dxf) return;
      downloadTextFile(dxf, `blind-flange-manual-DN${input.dn}-PN${targetPN}.dxf`);
      return;
    }
    if (result) {
      const dxf = buildDxf(result);
      downloadTextFile(dxf, `blind-flange-DN${input.dn}-PN${targetPN}.dxf`);
    }
  };

  const disabledPdf = !result && !manualCheckResult;
  const disabledDxf = !result && !manualCheckResult?.manualInput;

  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handlePdf}
          disabled={disabledPdf || isPdfLoading}
          className="flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900/60 disabled:text-slate-500"
        >
          {isPdfLoading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
          <span>Export PDF</span>
        </button>
        <button
          type="button"
          onClick={handleDxf}
          disabled={disabledDxf}
          className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900/60 disabled:text-slate-500"
        >
          <FileDown size={16} />
          <span>Download DXF</span>
        </button>
      </div>
      {pdfError ? <div className="text-xs text-amber-200">PDF export failed: {pdfError}</div> : null}
      <StepExportPanel
        source={{
          manualCheck: manualCheckResult ?? null,
          result: stepBaseResult ?? null,
          customResult: stepCustomResult ?? null,
          designConfig: designConfig ?? null,
          gasketFacing,
        }}
        input={input}
        targetPN={targetPN}
      />
    </div>
  );
}
