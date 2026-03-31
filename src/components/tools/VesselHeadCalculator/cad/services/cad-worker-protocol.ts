import type {Nozzle} from '../../types';
import type {HeadCadConfig} from '../types/cad-types';

export type CadWorkerWarmupRequest = {
  type: 'warmup';
  requestId: string;
};

export type CadWorkerGenerateStepRequest = {
  type: 'generate-step';
  requestId: string;
  config: HeadCadConfig;
  nozzles: Nozzle[];
};

export type CadWorkerRequest = CadWorkerWarmupRequest | CadWorkerGenerateStepRequest;

export type CadWorkerProgressMessage = {
  type: 'progress';
  requestId: string;
  stage: 'init' | 'geometry' | 'export';
  done: number;
  total: number;
};

export type CadWorkerResultMessage =
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

export type CadWorkerMessage = CadWorkerProgressMessage | CadWorkerResultMessage;
