import { deflateSync } from 'node:zlib';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { decodeBase64, readPng } from '../src/image/png';

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(bytes: Uint8Array) {
  let c = 0xffffffff;
  for (const b of bytes) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  out.set(data, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}

const CHANNELS: Record<number, number> = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
const ADAM7 = [
  [0, 0, 8, 8],
  [4, 0, 8, 8],
  [0, 4, 4, 8],
  [2, 0, 4, 4],
  [0, 2, 2, 4],
  [1, 0, 2, 2],
  [0, 1, 1, 2],
];

/** Seeded random numbers, so failures are reproducible. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x80000000;
  };
}

function paeth(a: number, b: number, c: number) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

interface Spec {
  width: number;
  height: number;
  colorType: number;
  depth: number;
  interlace: boolean;
  trns: boolean;
  seed: number;
}

/** Writes a PNG with random pixels and a random filter on each row. */
function makePng(s: Spec): Buffer {
  const rand = rng(s.seed);
  const channels = CHANNELS[s.colorType];
  const max = 2 ** s.depth - 1;
  const paletteSize = s.colorType === 3 ? Math.min(256, max + 1) : 0;
  // A few distinct values make tRNS matches likely.
  const sample = () => (s.colorType === 3 ? Math.floor(rand() * paletteSize) : rand() < 0.3 ? max : Math.floor(rand() * (max + 1)));
  const pixels = Array.from({ length: s.width * s.height }, () => Array.from({ length: channels }, sample));
  const trans = s.trns && (s.colorType === 0 || s.colorType === 2) ? Array(channels).fill(max) : undefined;

  const bitsPerPixel = channels * s.depth;
  const bpp = Math.max(1, bitsPerPixel >> 3);
  const rows: number[] = [];
  for (const [xs, ys, dx, dy] of s.interlace ? ADAM7 : [[0, 0, 1, 1]]) {
    const pw = Math.ceil((s.width - xs) / dx);
    const ph = Math.ceil((s.height - ys) / dy);
    if (pw <= 0 || ph <= 0) continue;
    const rowBytes = Math.ceil((pw * bitsPerPixel) / 8);
    let prev = new Uint8Array(rowBytes);
    for (let y = 0; y < ph; y++) {
      const row = new Uint8Array(rowBytes);
      let bit = 0;
      for (let px = 0; px < pw; px++) {
        for (const v of pixels[(ys + y * dy) * s.width + xs + px * dx]) {
          if (s.depth === 16) {
            row[bit >> 3] = v >> 8;
            row[(bit >> 3) + 1] = v & 0xff;
          } else if (s.depth === 8) row[bit >> 3] = v;
          else row[bit >> 3] |= v << (8 - s.depth - (bit & 7));
          bit += s.depth;
        }
      }
      const filter = Math.floor(rand() * 5);
      rows.push(filter);
      for (let i = 0; i < rowBytes; i++) {
        const a = i >= bpp ? row[i - bpp] : 0;
        const b = prev[i];
        const c = i >= bpp ? prev[i - bpp] : 0;
        const pred = [0, a, b, (a + b) >> 1, paeth(a, b, c)][filter];
        rows.push((row[i] - pred) & 0xff);
      }
      prev = row;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(s.width, 0);
  ihdr.writeUInt32BE(s.height, 4);
  ihdr.set([s.depth, s.colorType, 0, 0, s.interlace ? 1 : 0], 8);
  const parts = [Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr)];
  if (s.colorType === 3) {
    parts.push(chunk('PLTE', Uint8Array.from({ length: paletteSize * 3 }, () => Math.floor(rand() * 256))));
    if (s.trns) parts.push(chunk('tRNS', Uint8Array.from({ length: Math.ceil(paletteSize / 2) }, () => Math.floor(rand() * 256))));
  }
  if (trans) {
    const t = Buffer.alloc(trans.length * 2);
    trans.forEach((v, i) => t.writeUInt16BE(v, i * 2));
    parts.push(chunk('tRNS', t));
  }
  // Split the data over two IDAT chunks, which decoders must join.
  const data = deflateSync(Uint8Array.from(rows));
  const half = data.length >> 1;
  parts.push(chunk('IDAT', data.subarray(0, half)), chunk('IDAT', data.subarray(half)), chunk('IEND', new Uint8Array()));
  return Buffer.concat(parts);
}

const FORMATS: [number, number[]][] = [
  [0, [1, 2, 4, 8, 16]],
  [2, [8, 16]],
  [3, [1, 2, 4, 8]],
  [4, [8, 16]],
  [6, [8, 16]],
];

describe('PNG decoder', () => {
  let seed = 1;
  for (const [colorType, depths] of FORMATS) {
    for (const depth of depths) {
      for (const interlace of [false, true]) {
        for (const trns of colorType === 4 || colorType === 6 ? [false] : [false, true]) {
          const name = `colour type ${colorType}, ${depth}-bit${interlace ? ', interlaced' : ''}${trns ? ', tRNS' : ''}`;
          it(`matches pngjs: ${name}`, () => {
            for (const [width, height] of [
              [1, 1],
              [13, 7],
              [33, 19],
            ]) {
              const png = makePng({ width, height, colorType, depth, interlace, trns, seed: seed++ });
              const expected = PNG.sync.read(png);
              const actual = readPng(new Uint8Array(png));
              expect([actual.width, actual.height]).toEqual([expected.width, expected.height]);
              expect(Buffer.from(actual.data).equals(expected.data)).toBe(true);
            }
          });
        }
      }
    }
  }

  it('reads PNGs written by pngjs', () => {
    const png = new PNG({ width: 9, height: 5 });
    for (let i = 0; i < png.data.length; i++) png.data[i] = (i * 37) & 0xff;
    const bytes = PNG.sync.write(png);
    expect(Buffer.from(readPng(new Uint8Array(bytes)).data).equals(PNG.sync.read(bytes).data)).toBe(true);
  });

  it('rejects files that are not PNGs', () => {
    expect(() => readPng(new Uint8Array([1, 2, 3]))).toThrow(/could not read PNG/);
  });
});

describe('base64', () => {
  it('matches Buffer', () => {
    for (let n = 0; n < 40; n++) {
      const bytes = Uint8Array.from({ length: n }, (_, i) => (i * 97 + n) & 0xff);
      const b64 = Buffer.from(bytes).toString('base64');
      expect(Buffer.from(decodeBase64(b64)).equals(Buffer.from(bytes))).toBe(true);
    }
  });
});
