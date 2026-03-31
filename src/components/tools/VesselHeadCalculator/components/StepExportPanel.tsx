import React, {useMemo, useState} from 'react';
import {Box, Download, LoaderCircle} from 'lucide-react';
import {useVesselHeadStore} from '../store';
import {useVesselHeadCad} from '../cad/hooks/useVesselHeadCad';
import type {HeadCadConfig} from '../cad/types/cad-types';
import type {CadWorkerProgressMessage} from '../cad/services/cad-worker-protocol';

const getProgressLabel = (message: CadWorkerProgressMessage) => {
  if (message.stage === 'init') {
    return message.done >= message.total ? 'CAD kernel ready.' : 'Initializing CAD kernel...';
  }

  if (message.stage === 'export') {
    return message.done >= message.total ? 'STEP export complete.' : 'Exporting STEP...';
  }

  const progressLabel =
    message.total > 0 ? ` (${Math.min(message.done, message.total)}/${message.total})` : '';
  return `Building head geometry...${progressLabel}`;
};

const downloadStepFile = (stepBuffer: ArrayBuffer, config: HeadCadConfig) => {
  const blob = new Blob([stepBuffer], {type: 'application/step'});
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `vessel-head_${config.standard.toLowerCase()}_${Math.round(config.diameterOuter)}mm.step`;
  anchor.click();
  URL.revokeObjectURL(url);
};

export default function StepExportPanel() {
  const config = useVesselHeadStore((state) => state.config);
  const nozzles = useVesselHeadStore((state) => state.nozzles);
  const {workerStatus, workerError, generateStep} = useVesselHeadCad();
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successText, setSuccessText] = useState<string | null>(null);

  const cadConfig = useMemo<HeadCadConfig>(
    () => ({
      ...config,
      includeEdgePrep: config.edgePrep !== 'None',
      includeNozzles: nozzles.length > 0,
    }),
    [config, nozzles.length],
  );

  const handleDownloadStep = async () => {
    setIsGenerating(true);
    setErrorText(null);
    setSuccessText(null);
    setStatusText('Initializing CAD kernel...');

    try {
      const step = await generateStep(cadConfig, nozzles, {
        onProgress: (message) => {
          setStatusText(getProgressLabel(message));
        },
      });

      downloadStepFile(step, cadConfig);
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
      return statusText || 'Processing vessel head geometry in the browser...';
    }

    if (workerStatus === 'warming') {
      return 'CAD kernel is warming up in the background...';
    }

    if (successText) {
      return successText;
    }

    return 'Axisymmetric head geometry is generated in a Web Worker and exported as a 3D STEP file.';
  })();

  return (
    <section className="bg-neutral-800 rounded-2xl p-6 border border-neutral-700 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-blue-600/15 border border-blue-500/20 p-2 text-blue-400">
          <Box size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold text-white">3D STEP Export</h2>
          <p className="mt-1 text-sm text-neutral-400">{helperText}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={handleDownloadStep}
        disabled={isGenerating}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-800/60"
      >
        {isGenerating ? <LoaderCircle size={18} className="animate-spin" /> : <Download size={18} />}
        <span>{isGenerating ? 'Generating 3D STEP...' : 'Download .STEP (3D)'}</span>
      </button>

      {errorText || workerError ? (
        <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorText ?? workerError}
        </div>
      ) : null}

      {nozzles.length > 0 ? (
        <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Nozzles are tracked in the UI, but the current STEP MVP exports the base head without nozzle cuts.
        </div>
      ) : null}

      {config.edgePrep !== 'None' ? (
        <div className="mt-4 rounded-xl border border-neutral-700 bg-neutral-900/70 px-4 py-3 text-xs text-neutral-400">
          Edge prep is included in the export: {config.edgePrep} / {config.edgePrepSide} / {config.bevelAngle}
          deg / root face {config.rootFace} mm.
        </div>
      ) : null}
    </section>
  );
}
