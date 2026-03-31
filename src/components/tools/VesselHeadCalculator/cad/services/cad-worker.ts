/// <reference lib="webworker" />

import type {OpenCascadeInstance} from 'replicad-opencascadejs';
import {addNozzlesToHeadSolid} from '../geometry/add-nozzles';
import {buildHeadProfile} from '../geometry/build-head-profile';
import {buildHeadSolid} from '../geometry/build-head-solid';
import {computeHeadDerivedGeometry} from '../geometry/compute-head-geometry';
import {validateHeadCadConfig, validateHeadDerivedGeometry} from '../geometry/validation';
import type {CadWorkerMessage, CadWorkerRequest, CadWorkerResultMessage} from './cad-worker-protocol';

type ReplicadModule = typeof import('replicad');

let replicadPromise: Promise<ReplicadModule> | null = null;
let ocInitPromise: Promise<OpenCascadeInstance> | null = null;

const loadReplicad = () => {
  if (!replicadPromise) {
    replicadPromise = import('replicad');
  }

  return replicadPromise;
};

const ensureOpenCascade = async () => {
  if (!ocInitPromise) {
    ocInitPromise = (async () => {
      const [replicadModule, ocModule] = await Promise.all([loadReplicad(), import('replicad-opencascadejs')]);
      const wasmUrl = new URL('replicad-opencascadejs/src/replicad_single.wasm', import.meta.url).toString();
      const ocFactory = ocModule.default as unknown as (options?: {
        locateFile?: (path: string, scriptDir: string) => string;
      }) => Promise<OpenCascadeInstance>;
      const oc = await ocFactory({
        locateFile: (path) => (path.endsWith('.wasm') ? wasmUrl : path),
      });

      replicadModule.setOC(oc);
      return oc;
    })();
  }

  try {
    return await ocInitPromise;
  } catch (error) {
    ocInitPromise = null;
    throw error;
  }
};

const ctx = self as unknown as DedicatedWorkerGlobalScope;

const post = (message: CadWorkerMessage, transfer?: Transferable[]) => {
  ctx.postMessage(message, transfer ?? []);
};

const postError = (requestId: string, error: unknown) => {
  const resolvedError = error instanceof Error ? error : new Error(String(error));
  const message: CadWorkerResultMessage = {
    type: 'result',
    requestId,
    ok: false,
    payload: {
      message: resolvedError.message,
      stack: resolvedError.stack,
    },
  };
  post(message);
};

ctx.onmessage = async (event: MessageEvent<CadWorkerRequest>) => {
  const request = event.data;
  if (!request || typeof request !== 'object') {
    return;
  }

  const {requestId} = request;

  try {
    if (request.type === 'warmup') {
      post({type: 'progress', requestId, stage: 'init', done: 0, total: 1});
      await ensureOpenCascade();
      post({type: 'progress', requestId, stage: 'init', done: 1, total: 1});

      const result: CadWorkerResultMessage = {
        type: 'result',
        requestId,
        ok: true,
        payload: {step: new ArrayBuffer(0)},
      };
      post(result, [result.payload.step]);
      return;
    }

    if (request.type !== 'generate-step') {
      throw new Error(`Unknown cad-worker request type: ${(request as {type?: string}).type ?? 'undefined'}`);
    }

    post({type: 'progress', requestId, stage: 'init', done: 0, total: 1});
    await ensureOpenCascade();
    post({type: 'progress', requestId, stage: 'init', done: 1, total: 1});

    const replicadModule = await loadReplicad();

    post({type: 'progress', requestId, stage: 'geometry', done: 0, total: 4});
    validateHeadCadConfig(request.config);
    post({type: 'progress', requestId, stage: 'geometry', done: 1, total: 4});

    const geometry = computeHeadDerivedGeometry(request.config);
    validateHeadDerivedGeometry(geometry);
    post({type: 'progress', requestId, stage: 'geometry', done: 2, total: 4});

    const profile = buildHeadProfile(request.config, geometry);
    let solid = buildHeadSolid(replicadModule, profile);
    post({type: 'progress', requestId, stage: 'geometry', done: 3, total: 4});

    solid = addNozzlesToHeadSolid(solid, request.nozzles);
    post({type: 'progress', requestId, stage: 'geometry', done: 4, total: 4});

    post({type: 'progress', requestId, stage: 'export', done: 0, total: 1});
    const blob = solid.blobSTEP();
    const buffer = await blob.arrayBuffer();
    post({type: 'progress', requestId, stage: 'export', done: 1, total: 1});

    const result: CadWorkerResultMessage = {
      type: 'result',
      requestId,
      ok: true,
      payload: {step: buffer},
    };
    post(result, [buffer]);
  } catch (error) {
    postError(requestId, error);
  }
};
