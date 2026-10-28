import { PNG } from 'pngjs';

export interface Grayscale {
  width: number;
  height: number;
  /** 0 = black, 255 = white. Transparent pixels count as white. */
  data: Uint8Array;
}

function toBytes(src: Uint8Array | ArrayBuffer | string): Uint8Array {
  if (typeof src === 'string') {
    const m = /^data:image\/png;base64,(.+)$/i.exec(src);
    if (!m) throw new Error('react-zpl: <Image src> must be PNG bytes or a data:image/png;base64 URL');
    return Uint8Array.from(Buffer.from(m[1], 'base64'));
  }
  return src instanceof Uint8Array ? src : new Uint8Array(src);
}

const decoded = new WeakMap<object, Grayscale>();
const decodedStrings = new Map<string, Grayscale>();

export function decodePng(src: Uint8Array | ArrayBuffer | string): Grayscale {
  const cached = typeof src === 'string' ? decodedStrings.get(src) : decoded.get(src);
  if (cached) return cached;
  const png = PNG.sync.read(Buffer.from(toBytes(src)));
  const data = new Uint8Array(png.width * png.height);
  for (let i = 0; i < data.length; i++) {
    const r = png.data[i * 4];
    const g = png.data[i * 4 + 1];
    const b = png.data[i * 4 + 2];
    const a = png.data[i * 4 + 3] / 255;
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    data[i] = Math.round(lum * a + 255 * (1 - a));
  }
  const result = { width: png.width, height: png.height, data };
  if (typeof src === 'string') decodedStrings.set(src, result);
  else decoded.set(src, result);
  return result;
}

/** Box-filter resample to the target size. */
function resample(img: Grayscale, width: number, height: number): Float32Array {
  const out = new Float32Array(width * height);
  const sx = img.width / width;
  const sy = img.height / height;
  for (let y = 0; y < height; y++) {
    const y0 = y * sy;
    const y1 = Math.max(y0 + 1e-6, (y + 1) * sy);
    for (let x = 0; x < width; x++) {
      const x0 = x * sx;
      const x1 = Math.max(x0 + 1e-6, (x + 1) * sx);
      let sum = 0;
      let area = 0;
      for (let yy = Math.floor(y0); yy < Math.ceil(y1); yy++) {
        const wy = Math.min(y1, yy + 1) - Math.max(y0, yy);
        if (wy <= 0) continue;
        for (let xx = Math.floor(x0); xx < Math.ceil(x1); xx++) {
          const wx = Math.min(x1, xx + 1) - Math.max(x0, xx);
          if (wx <= 0) continue;
          const v = img.data[Math.min(yy, img.height - 1) * img.width + Math.min(xx, img.width - 1)];
          sum += v * wx * wy;
          area += wx * wy;
        }
      }
      out[y * width + x] = area ? sum / area : 255;
    }
  }
  return out;
}

export interface MonoOptions {
  threshold?: number;
  dither?: boolean;
  invert?: boolean;
}

/** Scales and converts to a packed 1-bit bitmap (1 = black). */
export function toMonochrome(img: Grayscale, width: number, height: number, opts: MonoOptions = {}) {
  const threshold = opts.threshold ?? 128;
  const gray = resample(img, width, height);
  const bytesPerRow = Math.ceil(width / 8);
  const data = new Uint8Array(bytesPerRow * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      const old = gray[i];
      const black = old < threshold;
      if (opts.dither) {
        const err = old - (black ? 0 : 255);
        if (x + 1 < width) gray[i + 1] += (err * 7) / 16;
        if (y + 1 < height) {
          if (x > 0) gray[i + width - 1] += (err * 3) / 16;
          gray[i + width] += (err * 5) / 16;
          if (x + 1 < width) gray[i + width + 1] += err / 16;
        }
      }
      if (black !== !!opts.invert) data[y * bytesPerRow + (x >> 3)] |= 0x80 >> (x & 7);
    }
  }
  return { width, height, bytesPerRow, data };
}
