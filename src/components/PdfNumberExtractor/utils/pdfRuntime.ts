import type {PdfRuntime, PdfRuntimeConfig} from '../types';

type WindowWithPdfJs = Window & {
  pdfjsLib?: PdfRuntime;
};

let runtimePromise: Promise<PdfRuntime> | null = null;
let activeConfigKey: string | null = null;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-pdfjs-src="${src}"]`);
    if (existing) {
      if ((window as WindowWithPdfJs).pdfjsLib) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), {once: true});
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), {
        once: true,
      });
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.pdfjsSrc = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

export async function getPdfRuntime(config: PdfRuntimeConfig) {
  if (typeof window === 'undefined') {
    throw new Error('PDF runtime is only available in the browser.');
  }

  const configKey = `${config.scriptSrc}::${config.workerSrc}`;
  if (!runtimePromise || activeConfigKey !== configKey) {
    activeConfigKey = configKey;
    runtimePromise = (async () => {
      await loadScript(config.scriptSrc);
      const runtime = (window as WindowWithPdfJs).pdfjsLib;
      if (!runtime) {
        throw new Error('PDF.js did not initialize correctly.');
      }
      runtime.GlobalWorkerOptions.workerSrc = config.workerSrc;
      return runtime;
    })();
  }

  return runtimePromise;
}
