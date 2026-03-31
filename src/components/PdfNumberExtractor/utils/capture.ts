export function getCaptureOrigin(params: {
  canvasX: number;
  canvasY: number;
  captureWidth: number;
  captureHeight: number;
  captureX: number;
  captureY: number;
}) {
  const {canvasX, canvasY, captureWidth, captureHeight, captureX, captureY} = params;
  return {
    sx: canvasX - captureWidth * (captureX / 100),
    sy: canvasY - captureHeight * (captureY / 100),
  };
}

export function cropCanvasRegion(params: {
  sourceCanvas: HTMLCanvasElement;
  sx: number;
  sy: number;
  captureWidth: number;
  captureHeight: number;
}) {
  const {sourceCanvas, sx, sy, captureWidth, captureHeight} = params;
  const shot = document.createElement('canvas');
  shot.width = captureWidth;
  shot.height = captureHeight;

  const context = shot.getContext('2d');
  if (!context) {
    throw new Error('Could not initialize screenshot canvas.');
  }

  context.drawImage(
    sourceCanvas,
    sx,
    sy,
    captureWidth,
    captureHeight,
    0,
    0,
    captureWidth,
    captureHeight,
  );

  return shot;
}
