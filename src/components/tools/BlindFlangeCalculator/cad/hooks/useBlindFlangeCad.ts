import {useCallback, useEffect, useRef, useState} from 'react';
import type {BlindFlangeCadGeometry} from '../types/cad-types';
import {generateStepInWorker, warmupCadWorker} from '../services/cad-worker-client';
import type {BlindFlangeWorkerProgress} from '../services/cad-worker-protocol';

type WorkerStatus = 'idle' | 'warming' | 'ready' | 'error';

export type UseBlindFlangeCadResult = {
  workerStatus: WorkerStatus;
  workerError: string | null;
  warmupWorker: () => Promise<void>;
  generateStep: (
    geometry: BlindFlangeCadGeometry,
    options?: {onProgress?: (message: BlindFlangeWorkerProgress) => void},
  ) => Promise<ArrayBuffer>;
};

export const useBlindFlangeCad = (): UseBlindFlangeCadResult => {
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
      geometry: BlindFlangeCadGeometry,
      options?: {onProgress?: (message: BlindFlangeWorkerProgress) => void},
    ) => {
      if (workerStatus !== 'ready') {
        await warmupWorker();
      }

      return generateStepInWorker(geometry, options);
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
