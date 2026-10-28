/**
 * Lengths are written like CSS. A bare number means CSS pixels (1/96 inch),
 * so a design looks the same at any printer resolution.
 * Supported suffixes: px, in, mm, cm, pt, dot/dots (raw printer dots), %.
 */
export type Length = number | string;

/** Dots per millimetre for the common Zebra resolutions. */
export function dpmmFor(dpi: number): number {
  switch (dpi) {
    case 152:
      return 6;
    case 203:
      return 8;
    case 300:
      return 12;
    case 600:
      return 24;
    default:
      return dpi / 25.4;
  }
}

/** Nominal dots per inch (Zebra counts 203 dots per inch at 8 dots/mm). */
export function dpiFor(dpmm: number): number {
  switch (dpmm) {
    case 6:
      return 152;
    case 8:
      return 203;
    case 12:
      return 300;
    case 24:
      return 600;
    default:
      return dpmm * 25.4;
  }
}

export type ParsedLength = { dots: number } | { percent: number } | 'auto';

const RE = /^(-?\d*\.?\d+)\s*(px|in|mm|cm|pt|dots?|%)?$/;

export function parseLength(value: Length | undefined, dpmm: number): ParsedLength | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return { dots: pxToDots(value, dpmm) };
  const v = value.trim();
  if (v === 'auto') return 'auto';
  const m = RE.exec(v);
  if (!m) throw new Error(`react-zpl: invalid length "${value}"`);
  const n = Number(m[1]);
  switch (m[2] ?? 'px') {
    case 'px':
      return { dots: pxToDots(n, dpmm) };
    case 'in':
      return { dots: n * dpiFor(dpmm) };
    case 'mm':
      return { dots: n * dpmm };
    case 'cm':
      return { dots: n * 10 * dpmm };
    case 'pt':
      return { dots: (n / 72) * dpiFor(dpmm) };
    case 'dot':
    case 'dots':
      return { dots: n };
    case '%':
      return { percent: n };
  }
  return undefined;
}

/** Converts a length to dots. Percentages and `auto` are not allowed here. */
export function toDots(value: Length | undefined, dpmm: number, fallback = 0): number {
  const p = parseLength(value, dpmm);
  if (p === undefined) return fallback;
  if (p === 'auto' || 'percent' in p) throw new Error(`react-zpl: "${value}" must be an absolute length`);
  return p.dots;
}

export function pxToDots(px: number, dpmm: number): number {
  return (px / 96) * dpiFor(dpmm);
}
