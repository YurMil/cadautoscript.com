import {useCallback, useEffect, useRef, useState} from 'react';
import type {Nozzle} from '../../types';
import type {HeadCadConfig} from '../types/cad-types';
import {generateStepInWorker, warmupCadWorker} from '../services/cad-worker-client';
import type {CadWorkerProgressMessage} from '../services/cad-worker-protocol';

type WorkerStatus = 'idle' | 'warming' | 'ready' | 'error';

export type UseVesselHeadCadResult = {
  workerStatus: WorkerStatus;
  workerError: string | null;
  warmupWorker: () => Promise<void>;
  generateStep: (
    config: HeadCadConfig,
    nozzles: Nozzle[],
    options?: {onProgress?: (message: CadWorkerProgressMessage) => void},
  ) => Promise<ArrayBuffer>;
};

export const useVesselHeadCad = (): UseVesselHeadCadResult => {
  const [workerStatus, setWorkerStatus] = useState<WorkerStatus>('idle');
  const [workerError, setWorkerError] = useState<string | null>(null);
  const warmupStarted = useRef(false);

  const warmupWorker = useCallback(async () => {
    if (typeof window === 'undefined') {
      return;
    }

    if (workerStatus === 'warming' || workerStatus === 'ready') {
      return;
    }

    setWorkerStatus('warming');
    setWorkerError(null);

    try {
      await warmupCadWorker();
      setWorkerStatus('ready');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setWorkerError(message);
      setWorkerStatus('error');
      throw error;
    }
  }, [workerStatus]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    if (warmupStarted.current) {
      return;
    }

    warmupStarted.current = true;
    void warmupWorker();
  }, [warmupWorker]);

  const generateStep = useCallback(
    async (
      config: HeadCadConfig,
      nozzles: Nozzle[],
      options?: {onProgress?: (message: CadWorkerProgressMessage) => void},
    ) => {
      if (workerStatus !== 'ready') {
        await warmupWorker();
      }

      return generateStepInWorker(config, nozzles, options);
    },
    [warmupWorker, workerStatus],
  );

  return {
    workerStatus,
    workerError,
    warmupWorker,
    generateStep,
  };
};
