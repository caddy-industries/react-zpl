import bwip from 'bwip-js';

export type LinearType = 'code128' | 'code39' | 'ean13' | 'upca';
export type MatrixType = 'qrcode' | 'datamatrix' | 'pdf417';
export type SymbolType = LinearType | MatrixType;

export interface LinearSymbol {
  kind: 'linear';
  /** Alternating bar/space widths in modules, starting with a bar. */
  widths: number[];
}

export interface MatrixSymbol {
  kind: 'matrix';
  cols: number;
  rows: number;
  /** Row-major cells, 1 = black. */
  cells: Uint8Array;
}

export type EncodedSymbol = LinearSymbol | MatrixSymbol;

export interface EncodeOptions {
  /** QR: L, M, Q or H. PDF417: 0-8. */
  errorCorrection?: string | number;
  /** PDF417 data columns. */
  columns?: number;
}

const cache = new Map<string, EncodedSymbol>();

/** Encodes a symbol the same way for layout, ZPL output and preview. */
export function encodeSymbol(type: SymbolType, value: string, opts: EncodeOptions = {}): EncodedSymbol {
  const key = `${type}\u0000${value}\u0000${opts.errorCorrection ?? ''}\u0000${opts.columns ?? ''}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const bwipOpts: Record<string, unknown> = {};
  // Note: QR module patterns can differ from the printer's (it segments data
  // differently), but the symbol size and position match.
  if (type === 'qrcode') bwipOpts.eclevel = opts.errorCorrection ?? 'M';
  if (type === 'pdf417') {
    bwipOpts.eclevel = opts.errorCorrection ?? 2;
    bwipOpts.columns = opts.columns ?? 4;
    bwipOpts.rowmult = 1;
  }

  let raw: { sbs?: number[]; pixs?: number[]; pixx?: number; pixy?: number }[];
  try {
    raw = bwip.raw(type, value, bwipOpts as never) as never;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`react-zpl: cannot encode ${type} "${value}": ${msg}`);
  }
  const sym = raw[0];
  let result: EncodedSymbol;
  if (sym.sbs) {
    const widths = [...sym.sbs];
    if (widths.length % 2 === 0) widths.pop(); // trailing inter-character gap
    result = { kind: 'linear', widths };
  } else {
    result = { kind: 'matrix', cols: sym.pixx!, rows: sym.pixy!, cells: Uint8Array.from(sym.pixs!) };
  }
  cache.set(key, result);
  return result;
}

/** Width in dots of a linear symbol. Wide elements of Code 39 use `ratio`. */
export function linearElementWidths(sym: LinearSymbol, type: LinearType, moduleWidth: number, ratio: number): number[] {
  return sym.widths.map((w) => (type === 'code39' && w > 1 ? Math.round(moduleWidth * ratio) : w * moduleWidth));
}

export function sum(values: number[]): number {
  let s = 0;
  for (const v of values) s += v;
  return s;
}

/** Normalises EAN/UPC input to the digits Zebra expects (without the check digit). */
export function retailDigits(type: 'ean13' | 'upca', value: string): string {
  const digits = value.replace(/\D/g, '');
  const len = type === 'ean13' ? 12 : 11;
  if (digits.length !== len && digits.length !== len + 1) {
    throw new Error(`react-zpl: ${type} needs ${len} digits (or ${len + 1} with check digit), got "${value}"`);
  }
  return digits.slice(0, len);
}
