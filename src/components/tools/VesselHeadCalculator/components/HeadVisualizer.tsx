import React, {useMemo} from 'react';
import clsx from 'clsx';
import {useVesselHeadStore} from '../store';
import {
  calculateGeometry,
  calculateVolumeM3,
  getNozzleDiameter,
} from '../utils';
import type {HeadConfig} from '../types';
import {buildHeadProfile} from '../cad/geometry/build-head-profile';
import {computeHeadDerivedGeometry} from '../cad/geometry/compute-head-geometry';
import type {AxisArcSegment, AxisSegment, HeadCadConfig, HeadDerivedGeometry, Point2D} from '../cad/types/cad-types';
import styles from '../styles.module.css';

type Orientation = 'horizontal' | 'vertical';

type DrawingLayout = {
  width: number;
  height: number;
  centerX: number;
  baseY: number;
  apexY: number;
  outerLeftX: number;
  outerRightX: number;
  bottomDimensionY: number;
  totalHeightDimensionX: number;
  straightFlangeDimensionX: number;
  thicknessLeaderMidX: number;
  thicknessLabelX: number;
  thicknessLabelY: number;
};

type HeadDrawingModel = {
  layout: DrawingLayout;
  derivedGeometry: HeadDerivedGeometry;
  sectionPath: string;
};

type SvgDimensionProps = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  text: string;
  offset?: number;
  color?: string;
  fontSize?: number;
  orientation?: Orientation;
};

type HeadProfileProps = {
  config: HeadConfig;
  drawing: HeadDrawingModel;
  fontSize: number;
  isPrint?: boolean;
};

const EPSILON = 1e-6;

const round = (value: number) => Number(value.toFixed(3));

const formatDimensionValue = (value: number) => {
  if (Math.abs(value - Math.round(value)) <= 0.05) {
    return Math.round(value).toString();
  }

  return value.toFixed(1);
};

export const getDrawingFontSize = (diameterOuter: number) =>
  Math.min(22, Math.max(12, diameterOuter * 0.016));

const normalizedDelta = (start: number, end: number) => {
  let delta = end - start;
  while (delta <= -Math.PI) delta += Math.PI * 2;
  while (delta > Math.PI) delta -= Math.PI * 2;
  return delta;
};

const dedupePoints = (points: Point2D[]) =>
  points.filter((point, index) => {
    if (index === 0) {
      return true;
    }

    const previous = points[index - 1];
    return Math.abs(point.x - previous.x) > EPSILON || Math.abs(point.z - previous.z) > EPSILON;
  });

const mirrorPoint = (point: Point2D): Point2D => ({
  x: -point.x,
  z: point.z,
});

const sampleArcSegment = (segment: AxisArcSegment) => {
  const startAngle = Math.atan2(segment.from.z - segment.center.z, segment.from.x - segment.center.x);
  const endAngle = Math.atan2(segment.to.z - segment.center.z, segment.to.x - segment.center.x);
  const delta = normalizedDelta(startAngle, endAngle);
  const resolution = Math.max(14, Math.ceil((Math.abs(delta) * segment.radius) / 18));

  const points: Point2D[] = [];
  for (let index = 0; index <= resolution; index += 1) {
    const angle = startAngle + (delta * index) / resolution;
    points.push({
      x: segment.center.x + segment.radius * Math.cos(angle),
      z: segment.center.z + segment.radius * Math.sin(angle),
    });
  }

  return points;
};

const sampleSegment = (segment: AxisSegment) =>
  segment.kind === 'line' ? [segment.from, segment.to] : sampleArcSegment(segment);

const sampleSegments = (segments: AxisSegment[]) => {
  const points: Point2D[] = [];

  segments.forEach((segment, index) => {
    const sampled = sampleSegment(segment);
    if (index === 0) {
      points.push(...sampled);
      return;
    }

    points.push(...sampled.slice(1));
  });

  return dedupePoints(points);
};

const buildLayout = (config: HeadConfig, geometry: HeadDerivedGeometry, fontSize: number): DrawingLayout => {
  const outerWidth = geometry.outsideDiameter;
  const totalHeight = geometry.totalHeight;
  const leftMargin = Math.max(fontSize * 8.5, outerWidth * 0.18);
  const rightMargin = Math.max(fontSize * 12, outerWidth * 0.28);
  const topMargin = Math.max(fontSize * 3.5, totalHeight * 0.16);
  const bottomMargin = Math.max(fontSize * 5.8, totalHeight * 0.2);
  const centerX = leftMargin + outerWidth / 2;
  const baseY = topMargin + totalHeight;

  return {
    width: leftMargin + outerWidth + rightMargin,
    height: topMargin + totalHeight + bottomMargin,
    centerX,
    baseY,
    apexY: topMargin,
    outerLeftX: centerX - outerWidth / 2,
    outerRightX: centerX + outerWidth / 2,
    bottomDimensionY: baseY + fontSize * 2.7,
    totalHeightDimensionX: centerX + outerWidth / 2 + fontSize * 3.8,
    straightFlangeDimensionX: centerX - outerWidth / 2 - fontSize * 3.2,
    thicknessLeaderMidX: centerX + outerWidth / 2 + fontSize * 2.2,
    thicknessLabelX: centerX + outerWidth / 2 + fontSize * 3.1,
    thicknessLabelY: baseY - config.straightFlange * 0.35,
  };
};

const toSvgPoint = (point: Point2D, layout: DrawingLayout) => ({
  x: layout.centerX + point.x,
  y: layout.baseY - point.z,
});

const pointsToPath = (points: Point2D[], layout: DrawingLayout) => {
  const [firstPoint, ...rest] = points;
  const first = toSvgPoint(firstPoint, layout);
  const commands = [`M ${round(first.x)} ${round(first.y)}`];

  rest.forEach((point) => {
    const svgPoint = toSvgPoint(point, layout);
    commands.push(`L ${round(svgPoint.x)} ${round(svgPoint.y)}`);
  });

  commands.push('Z');
  return commands.join(' ');
};

const buildSectionPath = (config: HeadConfig, fontSize: number): HeadDrawingModel => {
  const cadConfig: HeadCadConfig = {
    ...config,
    includeEdgePrep: config.edgePrep !== 'None',
    includeNozzles: false,
  };
  const derivedGeometry = computeHeadDerivedGeometry(cadConfig);
  const profile = buildHeadProfile(cadConfig, derivedGeometry);
  const layout = buildLayout(config, derivedGeometry, fontSize);
  const outerRight = sampleSegments(profile.outerSegments);
  const innerRight = sampleSegments(profile.innerSegments);
  const closureRight = dedupePoints(profile.edgePrep.closurePath);

  const closedSectionPoints = dedupePoints([
    ...outerRight.map(mirrorPoint),
    ...[...outerRight].reverse().slice(1),
    ...[...closureRight].reverse().slice(1),
    ...[...innerRight].reverse().slice(1),
    ...innerRight.map(mirrorPoint).slice(1),
    ...closureRight.map(mirrorPoint).slice(1),
  ]);

  return {
    layout,
    derivedGeometry,
    sectionPath: pointsToPath(closedSectionPoints, layout),
  };
};

export const buildHeadDrawingModel = (config: HeadConfig, fontSize: number) =>
  buildSectionPath(config, fontSize);

const DimensionText = ({
  text,
  x,
  y,
  color,
  strokeColor,
  fontSize,
  textAnchor,
}: {
  text: string;
  x: number;
  y: number;
  color: string;
  strokeColor: string;
  fontSize: number;
  textAnchor: 'start' | 'middle' | 'end';
}) => {
  return (
    <text
      x={round(x)}
      y={round(y)}
      fill={color}
      fontSize={fontSize}
      textAnchor={textAnchor}
      dominantBaseline="middle"
      fontWeight="700"
      letterSpacing={fontSize * 0.012}
      style={{
        paintOrder: 'stroke',
        stroke: strokeColor,
        strokeWidth: Math.max(1.6, fontSize * 0.22),
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
      }}
    >
      {text}
    </text>
  );
};

const SvgDimension = ({
  x1,
  y1,
  x2,
  y2,
  text,
  offset = 10,
  color = 'black',
  fontSize = 14,
  orientation = 'horizontal',
}: SvgDimensionProps) => {
  const arrowSize = fontSize / 2.7;

  let lx1 = x1;
  let ly1 = y1;
  let lx2 = x2;
  let ly2 = y2;
  let tx = (x1 + x2) / 2;
  let ty = (y1 + y2) / 2;
  let textAnchor: 'start' | 'middle' | 'end' = 'middle';
  const textStrokeColor = color === '#111111' ? '#ffffff' : '#0f172a';

  if (orientation === 'horizontal') {
    ly1 += offset;
    ly2 += offset;
    ty = ly1 - fontSize * 0.58;
  } else {
    lx1 += offset;
    lx2 += offset;
    tx = lx1 + (offset >= 0 ? fontSize * 0.95 : -fontSize * 0.95);
    ty = (ly1 + ly2) / 2;
    textAnchor = offset >= 0 ? 'start' : 'end';
  }

  return (
    <g className="dimension-line">
      <line x1={round(x1)} y1={round(y1)} x2={round(lx1)} y2={round(ly1)} stroke={color} strokeWidth="0.8" opacity="0.65" />
      <line x1={round(x2)} y1={round(y2)} x2={round(lx2)} y2={round(ly2)} stroke={color} strokeWidth="0.8" opacity="0.65" />
      <line x1={round(lx1)} y1={round(ly1)} x2={round(lx2)} y2={round(ly2)} stroke={color} strokeWidth="1.1" />
      {orientation === 'horizontal' ? (
        <>
          <path
            d={`M ${round(lx1)} ${round(ly1)} L ${round(lx1 + arrowSize)} ${round(ly1 - arrowSize / 2)} L ${round(
              lx1 + arrowSize,
            )} ${round(ly1 + arrowSize / 2)} Z`}
            fill={color}
          />
          <path
            d={`M ${round(lx2)} ${round(ly2)} L ${round(lx2 - arrowSize)} ${round(ly2 - arrowSize / 2)} L ${round(
              lx2 - arrowSize,
            )} ${round(ly2 + arrowSize / 2)} Z`}
            fill={color}
          />
        </>
      ) : (
        <>
          <path
            d={`M ${round(lx1)} ${round(ly1)} L ${round(lx1 - arrowSize / 2)} ${round(ly1 + arrowSize)} L ${round(
              lx1 + arrowSize / 2,
            )} ${round(ly1 + arrowSize)} Z`}
            fill={color}
          />
          <path
            d={`M ${round(lx2)} ${round(ly2)} L ${round(lx2 - arrowSize / 2)} ${round(ly2 - arrowSize)} L ${round(
              lx2 + arrowSize / 2,
            )} ${round(ly2 - arrowSize)} Z`}
            fill={color}
          />
        </>
      )}
      <DimensionText
        text={text}
        x={tx}
        y={ty}
        color={color}
        strokeColor={textStrokeColor}
        fontSize={fontSize}
        textAnchor={textAnchor}
      />
    </g>
  );
};

export const HeadProfile = ({
  config,
  drawing,
  fontSize,
  isPrint = false,
}: HeadProfileProps) => {
  const {layout, derivedGeometry, sectionPath} = drawing;
  const fill = isPrint ? '#ffffff' : 'url(#metalGradient)';
  const stroke = isPrint ? '#111111' : '#60a5fa';
  const strokeWidth = isPrint ? Math.max(1.2, config.diameterOuter / 850) : Math.max(1.4, config.diameterOuter / 900);
  const dimColor = isPrint ? '#111111' : '#d1d5db';
  const dimTextStrokeColor = isPrint ? '#ffffff' : '#0f172a';
  const thicknessProbePoint = toSvgPoint(
    {
      x: derivedGeometry.outer.shellRadius - config.thickness / 2,
      z: Math.max(config.straightFlange * 0.55, config.thickness * 1.8),
    },
    layout,
  );

  return (
    <g>
      <path d={sectionPath} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />

      <g className="dimensions">
        <line
          x1={round(layout.centerX)}
          y1={round(layout.apexY - fontSize * 0.9)}
          x2={round(layout.centerX)}
          y2={round(layout.baseY + fontSize * 0.9)}
          stroke={dimColor}
          strokeWidth="0.8"
          strokeDasharray={`${round(fontSize * 0.7)} ${round(fontSize * 0.45)}`}
          opacity="0.6"
        />

        <SvgDimension
          x1={layout.outerLeftX}
          y1={layout.baseY}
          x2={layout.outerRightX}
          y2={layout.baseY}
          text={`Da = ${formatDimensionValue(config.diameterOuter)} mm`}
          offset={layout.bottomDimensionY - layout.baseY}
          fontSize={fontSize}
          orientation="horizontal"
          color={dimColor}
        />

        <SvgDimension
          x1={layout.outerRightX}
          y1={layout.apexY}
          x2={layout.outerRightX}
          y2={layout.baseY}
          text={`H = ${formatDimensionValue(derivedGeometry.totalHeight)} mm`}
          offset={layout.totalHeightDimensionX - layout.outerRightX}
          fontSize={fontSize}
          orientation="vertical"
          color={dimColor}
        />

        <SvgDimension
          x1={layout.outerLeftX}
          y1={layout.baseY - config.straightFlange}
          x2={layout.outerLeftX}
          y2={layout.baseY}
          text={`h1 = ${formatDimensionValue(config.straightFlange)} mm`}
          offset={layout.straightFlangeDimensionX - layout.outerLeftX}
          fontSize={fontSize * 0.95}
          orientation="vertical"
          color={dimColor}
        />

        <g>
          <line
            x1={round(thicknessProbePoint.x)}
            y1={round(thicknessProbePoint.y)}
            x2={round(layout.thicknessLeaderMidX)}
            y2={round(thicknessProbePoint.y)}
            stroke={dimColor}
            strokeWidth="1"
          />
          <line
            x1={round(layout.thicknessLeaderMidX)}
            y1={round(thicknessProbePoint.y)}
            x2={round(layout.thicknessLeaderMidX)}
            y2={round(layout.thicknessLabelY)}
            stroke={dimColor}
            strokeWidth="1"
          />
          <circle cx={round(thicknessProbePoint.x)} cy={round(thicknessProbePoint.y)} r={round(fontSize / 5)} fill={dimColor} />
          <DimensionText
            text={`s = ${formatDimensionValue(config.thickness)} mm`}
            x={layout.thicknessLabelX}
            y={layout.thicknessLabelY}
            color={dimColor}
            strokeColor={dimTextStrokeColor}
            fontSize={fontSize * 0.96}
            textAnchor="start"
          />
        </g>
      </g>
    </g>
  );
};

export default function HeadVisualizer() {
  const config = useVesselHeadStore((state) => state.config);
  const nozzles = useVesselHeadStore((state) => state.nozzles);

  const calculated = useMemo(() => calculateGeometry(config), [config]);
  const volumeM3 = useMemo(
    () => calculateVolumeM3(config, calculated.totalHeight),
    [config, calculated.totalHeight],
  );
  const dimensionFontSize = getDrawingFontSize(config.diameterOuter);
  const drawing = useMemo(
    () => buildHeadDrawingModel(config, dimensionFontSize),
    [config, dimensionFontSize],
  );

  return (
    <div className="flex-1 bg-neutral-800 rounded-2xl border border-neutral-700 shadow-2xl overflow-hidden relative min-h-[500px] flex flex-col">
      <div className={clsx('flex-1 flex items-center justify-center p-6 lg:p-8', styles.pvdePattern)}>
        <svg
          viewBox={`0 0 ${drawing.layout.width} ${drawing.layout.height}`}
          className="w-full h-full max-h-[640px]"
        >
          <defs>
            <linearGradient id="metalGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#374151" />
              <stop offset="50%" stopColor="#4b5563" />
              <stop offset="100%" stopColor="#374151" />
            </linearGradient>
          </defs>

          <line
            x1={round(drawing.layout.centerX)}
            y1="0"
            x2={round(drawing.layout.centerX)}
            y2={round(drawing.layout.height)}
            stroke="#4b5563"
            strokeDasharray="12 8"
          />

          <HeadProfile config={config} drawing={drawing} fontSize={dimensionFontSize} />

          {nozzles.map((nozzle, index) => {
            const nozzleWidth = getNozzleDiameter(nozzle.size);
            const nozzleVisualWidth = Math.max(20, nozzleWidth);
            const nozzleHeight = Math.max(42, config.diameterOuter * 0.06);
            const nozzleX = drawing.layout.centerX + nozzle.offset;
            const nozzleY = drawing.layout.apexY + config.thickness + 14;

            return (
              <g key={nozzle.id}>
                <rect
                  x={round(nozzleX - nozzleVisualWidth / 2)}
                  y={round(nozzleY - nozzleHeight)}
                  width={round(nozzleVisualWidth)}
                  height={round(nozzleHeight)}
                  fill="#ef4444"
                  stroke="white"
                  strokeWidth="1"
                />
                <text
                  x={round(nozzleX)}
                  y={round(nozzleY - nozzleHeight - 10)}
                  textAnchor="middle"
                  fill="#fca5a5"
                  fontSize={Math.max(16, dimensionFontSize * 0.72)}
                  fontWeight="700"
                >
                  N{index + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="h-20 bg-neutral-800 border-t border-neutral-700 flex items-center justify-around px-4">
        <div className="text-center">
          <div className="text-xs text-neutral-500 uppercase">Volume</div>
          <div className="text-xl font-mono text-white">{volumeM3.toFixed(3)} m3</div>
        </div>
        <div className="h-10 w-px bg-neutral-700"></div>
        <div className="text-center">
          <div className="text-xs text-neutral-500 uppercase">Weight</div>
          <div className="text-xl font-mono text-blue-400">{calculated.weight.toFixed(1)} kg</div>
        </div>
      </div>
    </div>
  );
}
