export function isCanvasBlank(canvas: HTMLCanvasElement) {
  if (!canvas.width || !canvas.height) {
    return true;
  }

  const context = canvas.getContext('2d');
  if (!context) {
    return true;
  }

  const buffer = new Uint32Array(
    context.getImageData(0, 0, canvas.width, canvas.height).data.buffer,
  );

  return buffer.every((color) => color === buffer[0]);
}
