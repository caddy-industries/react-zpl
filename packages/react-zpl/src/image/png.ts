import { unzlibSync } from 'fflate';

/**
 * A small PNG decoder in plain JavaScript, so images work without Node
 * built-ins (zlib, Buffer), for example in React Native. Supports every
 * standard PNG: grayscale, RGB, palette and alpha, 1 to 16 bits, tRNS
 * transparency and interlacing. Output matches pngjs: 8-bit RGBA, with
 * transparent-colour pixels set to all zeros.
 */
export interface Rgba {
  width: number;
  height: number;
  data: Uint8Array;
}

const SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const CHANNELS: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
const DEPTHS: Record<number, number[]> = { 0: [1, 2, 4, 8, 16], 2: [8, 16], 3: [1, 2, 4, 8], 4: [8, 16], 6: [8, 16] };
// Adam7 passes: x start, y start, x step, y step.
const ADAM7 = [
  [0, 0, 8, 8],
  [4, 0, 8, 8],
  [0, 4, 4, 8],
  [2, 0, 4, 4],
  [0, 2, 2, 4],
  [1, 0, 2, 2],
  [0, 1, 1, 2],
];

function fail(why: string): never {
  throw new Error(`react-zpl: could not read PNG image (${why}).`);
}

function u32(b: Uint8Array, i: number) {
  return ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
}

function paeth(a: number, b: number, c: number) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

export function readPng(bytes: Uint8Array): Rgba {
  if (bytes.length < 8 || SIGNATURE.some((v, i) => bytes[i] !== v)) fail('not a PNG file');

  let width = 0;
  let height = 0;
  let depth = 0;
  let colorType = -1;
  let interlace = 0;
  let palette: Uint8Array | undefined;
  let paletteAlpha: Uint8Array | undefined;
  let transColor: number[] | undefined;
  const idat: Uint8Array[] = [];

  let pos = 8;
  while (pos + 8 <= bytes.length) {
    const len = u32(bytes, pos);
    const type = String.fromCharCode(bytes[pos + 4], bytes[pos + 5], bytes[pos + 6], bytes[pos + 7]);
    const start = pos + 8;
    const end = start + len;
    if (end + 4 > bytes.length) fail('truncated file');
    const chunk = bytes.subarray(start, end);
    if (type === 'IHDR') {
      width = u32(chunk, 0);
      height = u32(chunk, 4);
      depth = chunk[8];
      colorType = chunk[9];
      if (chunk[10] !== 0 || chunk[11] !== 0) fail('unknown compression or filter method');
      interlace = chunk[12];
    } else if (type === 'PLTE') {
      palette = chunk;
    } else if (type === 'tRNS') {
      if (colorType === 3) paletteAlpha = chunk;
      else if (colorType === 0) transColor = [(chunk[0] << 8) | chunk[1]];
      else if (colorType === 2)
        transColor = [(chunk[0] << 8) | chunk[1], (chunk[2] << 8) | chunk[3], (chunk[4] << 8) | chunk[5]];
    } else if (type === 'IDAT') {
      idat.push(chunk);
    } else if (type === 'IEND') {
      break;
    }
    pos = end + 4; // skip the CRC
  }

  const channels = CHANNELS[colorType];
  if (!channels || !DEPTHS[colorType].includes(depth)) fail(`unsupported colour type ${colorType} at ${depth} bits`);
  if (!(width > 0 && height > 0)) fail('missing size');
  if (colorType === 3 && !palette) fail('missing palette');
  if (!idat.length) fail('no image data');

  let compressed: Uint8Array;
  if (idat.length === 1) compressed = idat[0];
  else {
    compressed = new Uint8Array(idat.reduce((n, c) => n + c.length, 0));
    let o = 0;
    for (const c of idat) {
      compressed.set(c, o);
      o += c.length;
    }
  }
  let raw: Uint8Array;
  try {
    raw = unzlibSync(compressed);
  } catch {
    fail('corrupt image data');
  }

  const out = new Uint8Array(width * height * 4);
  const bitsPerPixel = channels * depth;
  const bpp = Math.max(1, bitsPerPixel >> 3); // bytes per pixel for filtering
  const maxSample = 2 ** depth - 1;
  const scale = (v: number) => (depth === 8 ? v : Math.floor((v * 255) / maxSample + 0.5));
  const samples = new Array<number>(channels);

  const writePixel = (o: number) => {
    if (colorType === 3) {
      const idx = samples[0];
      if (idx * 3 + 2 >= palette!.length) fail(`colour index ${idx} is not in the palette`);
      out[o] = palette![idx * 3];
      out[o + 1] = palette![idx * 3 + 1];
      out[o + 2] = palette![idx * 3 + 2];
      out[o + 3] = paletteAlpha && idx < paletteAlpha.length ? paletteAlpha[idx] : 255;
      return;
    }
    if (transColor && transColor.every((t, i) => t === samples[i])) {
      out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0;
      return;
    }
    if (colorType === 0 || colorType === 4) {
      out[o] = out[o + 1] = out[o + 2] = scale(samples[0]);
      out[o + 3] = colorType === 4 ? scale(samples[1]) : 255;
    } else {
      out[o] = scale(samples[0]);
      out[o + 1] = scale(samples[1]);
      out[o + 2] = scale(samples[2]);
      out[o + 3] = colorType === 6 ? scale(samples[3]) : 255;
    }
  };

  let rp = 0;
  const passes = interlace ? ADAM7 : [[0, 0, 1, 1]];
  for (const [xs, ys, dx, dy] of passes) {
    const pw = Math.ceil((width - xs) / dx);
    const ph = Math.ceil((height - ys) / dy);
    if (pw <= 0 || ph <= 0) continue;
    const rowBytes = Math.ceil((pw * bitsPerPixel) / 8);
    let prev = new Uint8Array(rowBytes);
    let row = new Uint8Array(rowBytes);
    for (let y = 0; y < ph; y++) {
      if (rp + 1 + rowBytes > raw.length) fail('truncated image data');
      const filter = raw[rp++];
      for (let i = 0; i < rowBytes; i++) {
        const x = raw[rp + i];
        const a = i >= bpp ? row[i - bpp] : 0;
        const b = prev[i];
        const c = i >= bpp ? prev[i - bpp] : 0;
        switch (filter) {
          case 0: row[i] = x; break;
          case 1: row[i] = x + a; break;
          case 2: row[i] = x + b; break;
          case 3: row[i] = x + ((a + b) >> 1); break;
          case 4: row[i] = x + paeth(a, b, c); break;
          default: fail(`unknown row filter ${filter}`);
        }
      }
      rp += rowBytes;

      let bit = 0;
      for (let px = 0; px < pw; px++) {
        for (let ch = 0; ch < channels; ch++) {
          if (depth === 8) samples[ch] = row[bit >> 3];
          else if (depth === 16) samples[ch] = (row[bit >> 3] << 8) | row[(bit >> 3) + 1];
          else samples[ch] = (row[bit >> 3] >> (8 - depth - (bit & 7))) & maxSample;
          bit += depth;
        }
        writePixel(((ys + y * dy) * width + xs + px * dx) * 4);
      }
      [prev, row] = [row, prev];
    }
  }
  return { width, height, data: out };
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_LOOKUP = new Uint8Array(128).fill(255);
for (let i = 0; i < B64.length; i++) B64_LOOKUP[B64.charCodeAt(i)] = i;
B64_LOOKUP['-'.charCodeAt(0)] = 62; // URL-safe alphabet
B64_LOOKUP['_'.charCodeAt(0)] = 63;

/** Decodes base64 without Buffer or atob, which some runtimes lack. */
export function decodeBase64(text: string): Uint8Array {
  const clean = text.replace(/[\s=]/g, '');
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let o = 0;
  let acc = 0;
  let bits = 0;
  for (let i = 0; i < clean.length; i++) {
    const code = clean.charCodeAt(i);
    const v = code < 128 ? B64_LOOKUP[code] : 255;
    if (v === 255) throw new Error('react-zpl: <Image src> has invalid base64 data.');
    acc = ((acc << 6) | v) & 0xffffff;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[o++] = (acc >> bits) & 0xff;
    }
  }
  return out.subarray(0, o);
}
