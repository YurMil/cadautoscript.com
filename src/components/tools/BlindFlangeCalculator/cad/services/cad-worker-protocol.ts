import type {BlindFlangeCadGeometry} from '../types/cad-types';

export type BlindFlangeWarmupRequest = {
  type: 'warmup';
  requestId: string;
};

export type BlindFlangeStepRequest = {
  type: 'generate-step';
  requestId: string;
  geometry: BlindFlangeCadGeometry;
};

export type BlindFlangeWorkerRequest = BlindFlangeWarmupRequest | BlindFlangeStepRequest;

export type BlindFlangeWorkerProgress = {
  type: 'progress';
  requestId: string;
  stage: 'init' | 'geometry' | 'export';
  done: number;
  total: number;
};

export type BlindFlangeWorkerResult =
  | {
      type: 'result';
      requestId: string;
      ok: true;
      payload: {step: ArrayBuffer};
    }
  | {
      type: 'result';
      requestId: string;
      ok: false;
      payload: {message: string; stack?: string};
    };

export type BlindFlangeWorkerMessage = BlindFlangeWorkerProgress | BlindFlangeWorkerResult;
