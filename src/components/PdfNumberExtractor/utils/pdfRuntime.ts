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
    script.onerror = () => {
      // Drop the failed tag: left in place, the next attempt would find it
      // above and wait for a `load` event that can never fire.
      script.remove();
      reject(new Error(`Failed to load ${src}`));
    };
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
    // A transient network failure must not disable the tool until reload:
    // forget the rejected promise so the next call retries.
    const attempt = runtimePromise;
    attempt.catch(() => {
      if (runtimePromise === attempt) {
        runtimePromise = null;
        activeConfigKey = null;
      }
    });
  }

  return runtimePromise;
}

/**
 * Opens a PDF with the vendored PDF.js (3.4.120). Versions before 4.2.67 build
 * font glyph renderers with `new Function`, so a crafted PDF could run script
 * on this origin, where the Supabase session lives (CVE-2024-4367). Disabling
 * eval is the upstream mitigation for those versions; every caller must go
 * through here rather than calling getDocument directly.
 */
export function openPdfDocument(runtime: PdfRuntime, data: Uint8Array) {
  return runtime.getDocument({data, isEvalSupported: false}).promise;
}
