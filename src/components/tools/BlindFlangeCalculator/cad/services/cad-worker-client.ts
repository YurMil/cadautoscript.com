import type {BlindFlangeCadGeometry} from '../types/cad-types';
import type {
  BlindFlangeStepRequest,
  BlindFlangeWorkerMessage,
  BlindFlangeWorkerProgress,
  BlindFlangeWarmupRequest,
} from './cad-worker-protocol';

const createRequestId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}`;
};

type PendingRequest = {
  resolve: (value: ArrayBuffer) => void;
  reject: (error: Error) => void;
  onProgress?: (message: BlindFlangeWorkerProgress) => void;
};

let worker: Worker | null = null;
const pending = new Map<string, PendingRequest>();

const getWorker = () => {
  if (typeof Worker === 'undefined') {
    throw new Error('CAD STEP export is only available in the browser.');
  }

  if (worker) {
    return worker;
  }

  worker = new Worker(new URL('./cad-worker.ts', import.meta.url), {type: 'module'});
  worker.addEventListener('message', (event: MessageEvent<BlindFlangeWorkerMessage>) => {
    const message = event.data;
    if (!message || typeof message !== 'object') {
      return;
    }

    if (message.type === 'progress') {
      pending.get(message.requestId)?.onProgress?.(message);
      return;
    }

    const handler = pending.get(message.requestId);
    if (!handler) {
      return;
    }

    pending.delete(message.requestId);

    if (message.ok) {
      handler.resolve(message.payload.step);
      return;
    }

    const payload = message.payload as {message: string; stack?: string};
    const error = new Error(payload.message);
    if (payload.stack) {
      error.stack = payload.stack;
    }
    handler.reject(error);
  });

  worker.addEventListener('error', (event) => {
    const error = event.error instanceof Error ? event.error : new Error(String(event.message));
    pending.forEach((handler) => handler.reject(error));
    pending.clear();
  });

  return worker;
};

export const warmupCadWorker = async () => {
  const requestId = createRequestId();
  const currentWorker = getWorker();

  await new Promise<ArrayBuffer>((resolve, reject) => {
    pending.set(requestId, {resolve, reject});
    const request: BlindFlangeWarmupRequest = {
      type: 'warmup',
      requestId,
    };
    currentWorker.postMessage(request);
  });
};

export const generateStepInWorker = async (
  geometry: BlindFlangeCadGeometry,
  options?: {onProgress?: (message: BlindFlangeWorkerProgress) => void},
) =>
  new Promise<ArrayBuffer>((resolve, reject) => {
    const requestId = createRequestId();
    const currentWorker = getWorker();

    pending.set(requestId, {resolve, reject, onProgress: options?.onProgress});
    const request: BlindFlangeStepRequest = {
      type: 'generate-step',
      requestId,
      geometry,
    };
    currentWorker.postMessage(request);
  });
