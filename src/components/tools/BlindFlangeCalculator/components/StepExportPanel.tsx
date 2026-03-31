import {useMemo, useState} from 'react';
import {Box, Download, Loader2} from 'lucide-react';
import type {CalculationInput} from '../bfTypes';
import type {BlindFlangeCadSource} from '../cad/types/cad-types';
import {computeBlindFlangeCadGeometry} from '../cad/geometry/compute-flange-geometry';
import {useBlindFlangeCad} from '../cad/hooks/useBlindFlangeCad';
import type {BlindFlangeWorkerProgress} from '../cad/services/cad-worker-protocol';

type Props = {
  source: BlindFlangeCadSource;
  input: CalculationInput;
  targetPN: number;
};

const getProgressLabel = (message: BlindFlangeWorkerProgress) => {
  if (message.stage === 'init') {
    return message.done >= message.total ? 'CAD kernel ready.' : 'Initializing CAD kernel...';
  }

  if (message.stage === 'export') {
    return message.done >= message.total ? 'STEP export complete.' : 'Exporting STEP...';
  }

  const progressLabel =
    message.total > 0 ? ` (${Math.min(message.done, message.total)}/${message.total})` : '';
  return `Building blind flange geometry...${progressLabel}`;
};

const downloadStepFile = (
  stepBuffer: ArrayBuffer,
  input: CalculationInput,
  targetPN: number,
  outerDiameter: number,
) => {
  const blob = new Blob([stepBuffer], {type: 'application/step'});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `blind-flange_DN${input.dn}_PN${targetPN}_${Math.round(outerDiameter)}mm.step`;
  anchor.click();
  URL.revokeObjectURL(url);
};

export default function StepExportPanel({source, input, targetPN}: Props) {
  const {workerStatus, workerError, generateStep} = useBlindFlangeCad();
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);

  const hasGeometrySource = useMemo(
    () => Boolean(source.designConfig || source.customResult || source.result),
    [source.customResult, source.designConfig, source.result],
  );

  const handleDownloadStep = async () => {
    setIsGenerating(true);
    setErrorText(null);
    setSuccessText(null);
    setStatusText('Initializing CAD kernel...');

    try {
      const geometry = computeBlindFlangeCadGeometry(source);
      const step = await generateStep(geometry, {
        onProgress: (message) => {
          setStatusText(getProgressLabel(message));
        },
      });

      downloadStepFile(step, input, targetPN, geometry.outerDiameter);
      setSuccessText('STEP file generated successfully.');
      setStatusText('Done');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setErrorText(message);
      setStatusText('');
    } finally {
      setIsGenerating(false);
    }
  };

  const helperText = (() => {
    if (isGenerating) {
      return statusText || 'Processing blind flange geometry in the browser...';
    }

    if (workerStatus === 'warming') {
      return 'CAD kernel is warming up in the background...';
    }

    if (successText) {
      return successText;
    }

    return 'Exports the current blind flange as a 3D STEP model with the base disk and bolt-hole pattern.';
  })();

  return (
    <div className="w-full rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-2 text-emerald-300">
          <Box size={18} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-100">3D STEP export</p>
          <p className="mt-1 text-xs text-slate-400">{helperText}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleDownloadStep}
          disabled={!hasGeometrySource || isGenerating}
          className="flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900/60 disabled:text-slate-500"
        >
          {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          <span>{isGenerating ? 'Generating 3D STEP...' : 'Download .STEP (3D)'}</span>
        </button>
      </div>

      {errorText || workerError ? (
        <div className="mt-3 text-xs text-amber-200">{errorText ?? workerError}</div>
      ) : null}

      {source.gasketFacing && source.gasketFacing !== 'FF' ? (
        <div className="mt-3 text-xs text-slate-500">
          Facing type is tracked, but the current STEP MVP exports the base flange body without RF / groove features.
        </div>
      ) : null}
    </div>
  );
}
