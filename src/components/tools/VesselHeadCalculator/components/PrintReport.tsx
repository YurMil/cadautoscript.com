import React, {useMemo, useRef, useState} from 'react';
import clsx from 'clsx';
import {Download, Info, X} from 'lucide-react';
import {APP_VERSION} from '../constants';
import {useVesselHeadStore} from '../store';
import {calculateGeometry, getNozzleDiameter} from '../utils';
import EdgePrepPreview from './EdgePrepPreview';
import {buildHeadDrawingModel, getDrawingFontSize, HeadProfile} from './HeadVisualizer';

const loadScript = (src: string, globalKey: string) =>
  new Promise<void>((resolve, reject) => {
    if ((window as typeof window & {[key: string]: unknown})[globalKey]) {
      resolve();
      return;
    }

    const existing = document.querySelector(`script[data-lib="${globalKey}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), {once: true});
      existing.addEventListener('error', () => reject(new Error(`Failed to load ${src}`)), {once: true});
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.dataset.lib = globalKey;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });

const loadPdfLibraries = () =>
  Promise.all([
    loadScript('https://cdn.jsdelivr.net/npm/jspdf@4.0.0/dist/jspdf.umd.min.js', 'jspdf'),
    loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js', 'html2canvas'),
  ]);

type PrintReportProps = {
  isVisible: boolean;
  onClose: () => void;
};

const formatNumber = (value: number) => {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(1).replace('.', '_');
};

const formatMaterial = (material: string) =>
  material
    .replace(/\(.*?\)/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9-]/g, '');

const inlineComputedStyles = (sourceNode: Element, targetNode: Element) => {
  const computedStyle = window.getComputedStyle(sourceNode);

  for (let index = 0; index < computedStyle.length; index += 1) {
    const propertyName = computedStyle[index];
    const propertyValue = computedStyle.getPropertyValue(propertyName);
    const propertyPriority = computedStyle.getPropertyPriority(propertyName);
    const isUnsupportedValue =
      propertyValue.includes('oklch(') || propertyValue.includes('oklab(') || propertyValue.includes('color-mix(');

    if (propertyName.startsWith('--') || isUnsupportedValue) {
      continue;
    }

    if (targetNode instanceof HTMLElement || targetNode instanceof SVGElement) {
      targetNode.style.setProperty(propertyName, propertyValue, propertyPriority);
    }
  }

  const sourceChildren = Array.from(sourceNode.children);
  const targetChildren = Array.from(targetNode.children);
  sourceChildren.forEach((child, index) => {
    const targetChild = targetChildren[index];
    if (targetChild) {
      inlineComputedStyles(child, targetChild);
    }
  });
};

const prepareHtml2CanvasClone = (sourceRoot: HTMLElement, clonedDocument: Document) => {
  const clonedRoot = clonedDocument.querySelector('[data-pdf-report-root="true"]');
  if (!clonedRoot) {
    return;
  }

  inlineComputedStyles(sourceRoot, clonedRoot);
  clonedDocument.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => node.remove());
  if (clonedDocument.body) {
    clonedDocument.body.style.background = '#ffffff';
  }
};

export default function PrintReport({isVisible, onClose}: PrintReportProps) {
  const config = useVesselHeadStore((state) => state.config);
  const nozzles = useVesselHeadStore((state) => state.nozzles);
  const reportRef = useRef<HTMLDivElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const reportGeometryState = useMemo(() => {
    try {
      const calculated = calculateGeometry(config);
      const printFontSize = getDrawingFontSize(config.diameterOuter);
      const drawing = buildHeadDrawingModel(config, printFontSize);

      return {
        calculated,
        printFontSize,
        drawing,
        printViewBox: `0 0 ${drawing.layout.width} ${drawing.layout.height}`,
        error: null as string | null,
      };
    } catch (error) {
      return {
        calculated: null,
        printFontSize: null,
        drawing: null,
        printViewBox: '0 0 100 100',
        error: error instanceof Error ? error.message : 'Enter valid dimensions to build the report preview.',
      };
    }
  }, [config]);

  const handleDownload = async () => {
    if (!reportRef.current || isDownloading || reportGeometryState.error) {
      return;
    }

    setIsDownloading(true);
    try {
      await loadPdfLibraries();
      const html2canvas = (window as typeof window & {html2canvas?: (el: HTMLElement, options?: object) => Promise<HTMLCanvasElement>})
        .html2canvas;
      const jspdf = (window as typeof window & {jspdf?: {jsPDF: new (options: object) => {addImage: (...args: unknown[]) => void; save: (name: string) => void; internal: {pageSize: {getWidth: () => number; getHeight: () => number}}}}})
        .jspdf;

      if (!html2canvas || !jspdf) {
        return;
      }

      const canvas = await html2canvas(reportRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
        onclone: (clonedDocument: Document) => {
          if (reportRef.current) {
            prepareHtml2CanvasClone(reportRef.current, clonedDocument);
          }
        },
      });

      const pdf = new jspdf.jsPDF({orientation: 'p', unit: 'mm', format: 'a4', compress: true});
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      let imgWidth = pageWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;
      if (imgHeight > pageHeight) {
        const scale = pageHeight / imgHeight;
        imgWidth *= scale;
        imgHeight *= scale;
      }

      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;
      pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight, undefined, 'FAST');

      const filename = `Dished Head_${config.standard}_Da${formatNumber(config.diameterOuter)}_S${formatNumber(
        config.thickness,
      )}_h1-${formatNumber(config.straightFlange)}_${formatMaterial(config.material)}`;
      pdf.save(`${filename}.pdf`);
    } finally {
      setIsDownloading(false);
    }
  };

  const containerClassName = clsx(
    isVisible ? 'fixed inset-0 z-50 overflow-y-auto' : 'hidden',
    'print:block print:static print:overflow-visible bg-white text-black p-8 font-serif w-full h-full',
  );

  const totalHeightText = reportGeometryState.calculated ? `${reportGeometryState.calculated.totalHeight.toFixed(1)} mm` : '--';
  const weightText = reportGeometryState.calculated ? `${reportGeometryState.calculated.weight.toFixed(1)} kg` : '--';
  const diameterToleranceText = reportGeometryState.calculated
    ? `+${reportGeometryState.calculated.tolerances.daPlus} / -${reportGeometryState.calculated.tolerances.daMinus}`
    : '--';
  const ovalityToleranceText = reportGeometryState.calculated
    ? `Max ${reportGeometryState.calculated.tolerances.ovality}`
    : '--';
  const heightToleranceText = reportGeometryState.calculated
    ? `+${reportGeometryState.calculated.tolerances.hPlus} / -${reportGeometryState.calculated.tolerances.hMinus}`
    : '--';
  const thicknessToleranceText = reportGeometryState.calculated
    ? `Min ${(config.thickness - reportGeometryState.calculated.tolerances.thicknessMin).toFixed(1)}`
    : '--';

  return (
    <div className={containerClassName}>
      <div className="print:hidden mb-6 flex justify-between items-center bg-gray-100 p-4 rounded-lg shadow-xs">
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <Info size={18} className="text-blue-600" />
          <span>
            {reportGeometryState.error
              ? 'Enter valid values to enable the PDF report.'
              : <>Click <b>Download PDF</b> to save the report.</>}
          </span>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading || Boolean(reportGeometryState.error)}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-md text-sm',
              isDownloading || reportGeometryState.error
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white',
            )}
          >
            <Download size={16} /> {isDownloading ? 'Preparing...' : 'Download PDF'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-white border text-gray-700 rounded-md text-sm"
          >
            <X size={16} /> Close
          </button>
        </div>
      </div>

      <div ref={reportRef} data-pdf-report-root="true" className="max-w-[210mm] mx-auto bg-white min-h-[290mm]">
        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold uppercase tracking-wider">Manufacturing Report</h1>
            <h2 className="text-xl mt-1 text-gray-700">Dished Head Specification &amp; QC</h2>
          </div>
          <div className="text-right text-sm">
            <div>Job No: ________________</div>
            <div>Date: {new Date().toLocaleDateString()}</div>
            <div className="text-xs text-gray-400 mt-1">v{APP_VERSION}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <h3 className="font-bold text-lg border-b border-gray-400 mb-2">Design Data</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-1 text-gray-600">Standard</td>
                  <td className="py-1 font-medium text-right">{config.standard}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-1 text-gray-600">Material</td>
                  <td className="py-1 font-medium text-right">{config.material}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-1 text-gray-600">Edge Prep</td>
                  <td className="py-1 font-medium text-right">
                    {config.edgePrep === 'None' ? 'Square Cut' : `${config.edgePrep} ${config.bevelAngle}u`}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="font-bold text-lg border-b border-gray-400 mb-2">Dimensions (Nominal)</h3>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-1 text-gray-600">Da (Outer Dia)</td>
                  <td className="py-1 font-medium text-right">{config.diameterOuter} mm</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-1 text-gray-600">s (Thickness)</td>
                  <td className="py-1 font-medium text-right">{config.thickness} mm</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-1 text-gray-600">H (Total Height)</td>
                  <td className="py-1 font-medium text-right">{totalHeightText}</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-1 text-gray-600">Est. Weight</td>
                  <td className="py-1 font-medium text-right">{weightText}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="mb-6 border border-gray-300 rounded-sm p-4 flex justify-center h-80">
          {reportGeometryState.drawing && reportGeometryState.printFontSize ? (
            <svg viewBox={reportGeometryState.printViewBox} className="h-full w-auto">
              <line
                x1={reportGeometryState.drawing.layout.centerX}
                y1="0"
                x2={reportGeometryState.drawing.layout.centerX}
                y2={reportGeometryState.drawing.layout.height}
                stroke="#9ca3af"
                strokeDasharray="6,4"
              />
              <HeadProfile
                config={config}
                drawing={reportGeometryState.drawing}
                fontSize={reportGeometryState.printFontSize}
                isPrint
              />
              {nozzles.map((nozzle) => {
                const nozzleWidth = getNozzleDiameter(nozzle.size);
                const nozzleVisualWidth = Math.max(20, nozzleWidth);
                const nozzleHeight = 60;
                const nozzleX = reportGeometryState.drawing.layout.centerX + nozzle.offset;
                const nozzleY = reportGeometryState.drawing.layout.apexY + config.thickness + 10;

                return (
                  <rect
                    key={nozzle.id}
                    x={nozzleX - nozzleVisualWidth / 2}
                    y={nozzleY - nozzleHeight}
                    width={nozzleVisualWidth}
                    height={nozzleHeight}
                    fill="none"
                    stroke="black"
                    strokeWidth={Math.max(1, config.diameterOuter / 1000)}
                  />
                );
              })}
            </svg>
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-sm bg-gray-50 px-8 text-center">
              <div>
                <p className="text-sm font-semibold text-gray-700">Report preview is waiting for valid input.</p>
                <p className="mt-2 text-sm text-gray-500">
                  {reportGeometryState.error ?? 'Enter values greater than zero to build the report drawing.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {config.edgePrep !== 'None' ? (
          <div className="mb-6 border border-gray-300 rounded-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">Weld Edge Preparation</h3>
              <span className="text-xs text-gray-600">
                {config.edgePrep} · {config.edgePrepSide === 'double' ? 'Double side' : 'Single side'}
              </span>
            </div>
            <EdgePrepPreview
              edgePrep={config.edgePrep}
              edgePrepSide={config.edgePrepSide}
              thickness={config.thickness}
              rootFace={config.rootFace}
              bevelAngle={config.bevelAngle}
              orientation="head"
              variant="report"
            />
          </div>
        ) : null}

        <div className="mb-8">
          <h3 className="font-bold text-lg border-b-2 border-black mb-3 pb-1 bg-gray-50 px-2">
            Quality Control / Measurement Report
          </h3>
          <p className="text-xs text-gray-500 mb-2 italic">
            Tolerances based on DIN 28005-1 (Formed Heads). All dimensions in mm.
          </p>

          <table className="w-full text-sm border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 p-2 text-left w-1/4">Parameter</th>
                <th className="border border-gray-300 p-2 text-center w-1/6">Nominal</th>
                <th className="border border-gray-300 p-2 text-center w-1/6">Tolerance</th>
                <th className="border border-gray-300 p-2 text-center w-1/6">Actual 1</th>
                <th className="border border-gray-300 p-2 text-center w-1/6">Actual 2</th>
                <th className="border border-gray-300 p-2 text-center w-1/6">Result / Dev</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2 font-medium">
                  Outer Diameter (Da) <br />
                  <span className="text-xs font-normal text-gray-500">Measure at 0u / 90u</span>
                </td>
                <td className="border border-gray-300 p-2 text-center">{config.diameterOuter}</td>
                <td className="border border-gray-300 p-2 text-center">{diameterToleranceText}</td>
                <td className="border border-gray-300 p-2"></td>
                <td className="border border-gray-300 p-2"></td>
                <td className="border border-gray-300 p-2 bg-gray-50"></td>
              </tr>

              <tr>
                <td className="border border-gray-300 p-2 font-medium">
                  Ovality (u) <br />
                  <span className="text-xs font-normal text-gray-500">Max diff (Dmax - Dmin)</span>
                </td>
                <td className="border border-gray-300 p-2 text-center">0</td>
                <td className="border border-gray-300 p-2 text-center">{ovalityToleranceText}</td>
                <td className="border border-gray-300 p-2 bg-gray-100 text-center text-xs text-gray-400" colSpan={2}>
                  - Calculated -
                </td>
                <td className="border border-gray-300 p-2"></td>
              </tr>

              <tr>
                <td className="border border-gray-300 p-2 font-medium">Total Height (H)</td>
                <td className="border border-gray-300 p-2 text-center">
                  {reportGeometryState.calculated ? reportGeometryState.calculated.totalHeight.toFixed(1) : '--'}
                </td>
                <td className="border border-gray-300 p-2 text-center">{heightToleranceText}</td>
                <td className="border border-gray-300 p-2"></td>
                <td className="border border-gray-300 p-2 bg-gray-100"></td>
                <td className="border border-gray-300 p-2"></td>
              </tr>

              <tr>
                <td className="border border-gray-300 p-2 font-medium">
                  Wall Thickness (s) <br />
                  <span className="text-xs font-normal text-gray-500">Min. after forming</span>
                </td>
                <td className="border border-gray-300 p-2 text-center">{config.thickness}</td>
                <td className="border border-gray-300 p-2 text-center">{thicknessToleranceText}</td>
                <td className="border border-gray-300 p-2"></td>
                <td className="border border-gray-300 p-2"></td>
                <td className="border border-gray-300 p-2"></td>
              </tr>

              <tr>
                <td className="border border-gray-300 p-2 font-medium">
                  Edge Preparation <br />
                  <span className="text-xs font-normal text-gray-500">{config.edgePrep} check</span>
                </td>
                <td className="border border-gray-300 p-2 text-center">-</td>
                <td className="border border-gray-300 p-2 text-center">Visual</td>
                <td className="border border-gray-300 p-2 text-center text-xs text-gray-400" colSpan={2}>
                  Pass / Fail
                </td>
                <td className="border border-gray-300 p-2"></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="grid grid-cols-2 gap-12 mt-auto">
          <div>
            <div className="h-12 border-b border-black"></div>
            <div className="text-xs mt-1">QC Inspector (Name &amp; Sign)</div>
          </div>
          <div>
            <div className="h-12 border-b border-black"></div>
            <div className="text-xs mt-1">Date</div>
          </div>
        </div>
      </div>
    </div>
  );
}
