import type { BarcodeOp, DrawOp, LayoutBox } from '../ops';
import { measureText } from '../text/font0';

export type Rotation = 0 | 90 | 180 | 270;
type Orientation = 'N' | 'R' | 'I' | 'B';

const ORDER: Orientation[] = ['N', 'R', 'I', 'B'];

/** An orientation turned a further `deg` clockwise. */
export function turn(o: Orientation, deg: Rotation): Orientation {
  return ORDER[(ORDER.indexOf(o) + deg / 90) % 4];
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Where a box laid out on a label as it is read (`width` × `height`) lands on
 * the stock when the label is turned `deg` clockwise to print.
 */
export function turnRect(r: Rect, deg: Rotation, width: number, height: number): Rect {
  switch (deg) {
    case 90:
      return { x: height - r.y - r.h, y: r.x, w: r.h, h: r.w };
    case 180:
      return { x: width - r.x - r.w, y: height - r.y - r.h, w: r.w, h: r.h };
    case 270:
      return { x: r.y, y: width - r.x - r.w, w: r.h, h: r.w };
    default:
      return r;
  }
}

/** ZPL can only print QR codes upright (^BQ takes N alone). */
const UPRIGHT_ONLY = new Set<BarcodeOp['type']>(['qrcode']);

/** The box a draw op covers, in the space it was laid out in. */
function extent(op: DrawOp): Rect {
  switch (op.kind) {
    case 'rect':
      return { x: op.x, y: op.y, w: op.w, h: op.h };
    case 'image':
      return { x: op.x, y: op.y, w: op.width, h: op.height };
    case 'text': {
      const len = Math.round(measureText(op.text, op.fontWidth));
      const side = op.orientation === 'R' || op.orientation === 'B';
      return { x: op.x, y: op.y, w: side ? op.fontHeight : len, h: side ? len : op.fontHeight };
    }
    case 'barcode': {
      const o = op.orientation ?? 'N';
      const side = o === 'R' || o === 'B';
      const w = op.symbolWidth ?? 0;
      const h = op.symbolHeight ?? op.height;
      return { x: op.x, y: op.y, w: side ? h : w, h: side ? w : h };
    }
  }
}

/** Turns a 1-bit image (rows padded to whole bytes) `deg` clockwise. */
function turnBits(data: Uint8Array, width: number, height: number, bytesPerRow: number, deg: Rotation) {
  const side = deg === 90 || deg === 270;
  const outW = side ? height : width;
  const outH = side ? width : height;
  const outBytes = Math.ceil(outW / 8);
  const out = new Uint8Array(outBytes * outH);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!((data[y * bytesPerRow + (x >> 3)] >> (7 - (x & 7))) & 1)) continue;
      let nx = x;
      let ny = y;
      if (deg === 90) [nx, ny] = [height - 1 - y, x];
      else if (deg === 180) [nx, ny] = [width - 1 - x, height - 1 - y];
      else if (deg === 270) [nx, ny] = [y, width - 1 - x];
      out[ny * outBytes + (nx >> 3)] |= 0x80 >> (nx & 7);
    }
  }
  return { data: out, width: outW, height: outH, bytesPerRow: outBytes };
}

/** A draw op laid out on the label as read, moved and turned for the stock. */
export function turnOp(op: DrawOp, deg: Rotation, width: number, height: number): DrawOp {
  if (deg === 0) return op;
  const box = turnRect(extent(op), deg, width, height);
  switch (op.kind) {
    case 'rect':
      return { ...op, x: box.x, y: box.y, w: box.w, h: box.h };
    case 'image':
      return { ...op, x: box.x, y: box.y, ...turnBits(op.data, op.width, op.height, op.bytesPerRow, deg) };
    case 'text':
      return { ...op, x: box.x, y: box.y, orientation: turn(op.orientation, deg) };
    case 'barcode':
      if (UPRIGHT_ONLY.has(op.type)) return { ...op, x: box.x, y: box.y };
      return { ...op, x: box.x, y: box.y, orientation: turn(op.orientation ?? 'N', deg) };
  }
}

export function turnBox(b: LayoutBox, deg: Rotation, width: number, height: number): LayoutBox {
  const r = turnRect({ x: b.x, y: b.y, w: b.width, h: b.height }, deg, width, height);
  return { ...b, x: r.x, y: r.y, width: r.w, height: r.h };
}

type Margin = { top: number; right: number; bottom: number; left: number };

/** The stock's margins for margins given as the label is read. */
export function turnMargin(m: Margin, deg: Rotation): Margin {
  switch (deg) {
    case 90:
      return { top: m.left, right: m.top, bottom: m.right, left: m.bottom };
    case 180:
      return { top: m.bottom, right: m.left, bottom: m.top, left: m.right };
    case 270:
      return { top: m.right, right: m.bottom, bottom: m.left, left: m.top };
    default:
      return m;
  }
}
