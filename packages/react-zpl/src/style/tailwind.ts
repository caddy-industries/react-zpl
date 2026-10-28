import type { Style } from './types';

/**
 * A small Tailwind-compatible class parser. It covers the utilities that make
 * sense on a monochrome label: layout, spacing, sizing, borders, black/white
 * colours and text. Unknown classes are reported as warnings.
 */
export interface TailwindResult {
  style: Style;
  unknown: string[];
}

const FONT_SIZES: Record<string, number> = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
  '7xl': 72,
  '8xl': 96,
  '9xl': 128,
};

const LEADING: Record<string, number> = {
  none: 1,
  tight: 1.25,
  snug: 1.375,
  normal: 1.5,
  relaxed: 1.625,
  loose: 2,
};

const RADII: Record<string, number> = {
  none: 0,
  xs: 2,
  sm: 4,
  '': 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  '4xl': 32,
  full: 9999,
};

const BORDER_WIDTHS: Record<string, number> = { '': 1, '0': 0, '2': 2, '4': 4, '8': 8 };

/** Classes that are accepted but do nothing (font 0 is always bold). */
const NO_OPS = new Set([
  'font-thin',
  'font-extralight',
  'font-light',
  'font-normal',
  'font-medium',
  'font-semibold',
  'font-bold',
  'font-extrabold',
  'font-black',
  'font-sans',
  'border-solid',
  'block',
  'overflow-hidden',
  'box-border',
]);

/** Parses an arbitrary value like `[12px]` or `[2mm]`. */
function arbitrary(token: string): string | undefined {
  if (token.startsWith('[') && token.endsWith(']')) return token.slice(1, -1).replace(/_/g, ' ');
  return undefined;
}

/** Spacing scale: `4` is 16px (0.25rem steps), `px` is 1px, `[3mm]` is literal. */
function spacing(token: string): string | number | undefined {
  const arb = arbitrary(token);
  if (arb !== undefined) return arb;
  if (token === 'px') return 1;
  if (/^\d+(\.\d+)?$/.test(token)) return Number(token) * 4;
  return undefined;
}

function size(token: string): string | number | undefined {
  if (token === 'full') return '100%';
  if (token === 'auto') return 'auto';
  const frac = /^(\d+)\/(\d+)$/.exec(token);
  if (frac) return `${(Number(frac[1]) / Number(frac[2])) * 100}%`;
  return spacing(token);
}

function negate(v: string | number | undefined, neg: boolean): string | number | undefined {
  if (!neg || v === undefined) return v;
  if (typeof v === 'number') return -v;
  return v.startsWith('-') ? v.slice(1) : `-${v}`;
}

const JUSTIFY: Record<string, Style['justifyContent']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};
const ALIGN: Record<string, Style['alignItems']> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
};

const SPACING_PROPS: Record<string, (keyof Style)[]> = {
  p: ['padding'],
  px: ['paddingLeft', 'paddingRight'],
  py: ['paddingTop', 'paddingBottom'],
  pt: ['paddingTop'],
  pr: ['paddingRight'],
  pb: ['paddingBottom'],
  pl: ['paddingLeft'],
  m: ['margin'],
  mx: ['marginLeft', 'marginRight'],
  my: ['marginTop', 'marginBottom'],
  mt: ['marginTop'],
  mr: ['marginRight'],
  mb: ['marginBottom'],
  ml: ['marginLeft'],
  gap: ['gap'],
  'gap-x': ['columnGap'],
  'gap-y': ['rowGap'],
  top: ['top'],
  right: ['right'],
  bottom: ['bottom'],
  left: ['left'],
  inset: ['top', 'right', 'bottom', 'left'],
  'inset-x': ['left', 'right'],
  'inset-y': ['top', 'bottom'],
};

const SIZE_PROPS: Record<string, (keyof Style)[]> = {
  w: ['width'],
  h: ['height'],
  size: ['width', 'height'],
  'min-w': ['minWidth'],
  'max-w': ['maxWidth'],
  'min-h': ['minHeight'],
  'max-h': ['maxHeight'],
  basis: ['flexBasis'],
};

const BORDER_SIDES: Record<string, (keyof Style)[]> = {
  border: ['borderWidth'],
  'border-t': ['borderTopWidth'],
  'border-r': ['borderRightWidth'],
  'border-b': ['borderBottomWidth'],
  'border-l': ['borderLeftWidth'],
  'border-x': ['borderLeftWidth', 'borderRightWidth'],
  'border-y': ['borderTopWidth', 'borderBottomWidth'],
};

function set(style: Style, keys: (keyof Style)[], value: unknown) {
  for (const k of keys) (style as Record<string, unknown>)[k] = value;
}

/** Splits `p-4` style classes into prefix and value, trying the longest prefix first. */
function splitPrefix(cls: string, table: Record<string, unknown>): [string, string] | undefined {
  let best: [string, string] | undefined;
  for (const prefix of Object.keys(table)) {
    if (cls.startsWith(`${prefix}-`) && (!best || prefix.length > best[0].length)) {
      best = [prefix, cls.slice(prefix.length + 1)];
    }
  }
  return best;
}

function applyClass(style: Style, raw: string, flags: { flex: boolean }): boolean {
  if (NO_OPS.has(raw)) return true;
  let cls = raw;
  let neg = false;
  if (cls.startsWith('-')) {
    neg = true;
    cls = cls.slice(1);
  }

  switch (cls) {
    case 'flex':
    case 'inline-flex':
      style.display = 'flex';
      flags.flex = true;
      return true;
    case 'hidden':
      style.display = 'none';
      return true;
    case 'flex-row':
      style.flexDirection = 'row';
      return true;
    case 'flex-col':
      style.flexDirection = 'column';
      return true;
    case 'flex-row-reverse':
      style.flexDirection = 'row-reverse';
      return true;
    case 'flex-col-reverse':
      style.flexDirection = 'column-reverse';
      return true;
    case 'flex-wrap':
      style.flexWrap = 'wrap';
      return true;
    case 'flex-nowrap':
      style.flexWrap = 'nowrap';
      return true;
    case 'flex-1':
      style.flexGrow = 1;
      style.flexShrink = 1;
      style.flexBasis = 0;
      return true;
    case 'flex-auto':
      style.flexGrow = 1;
      style.flexShrink = 1;
      style.flexBasis = 'auto';
      return true;
    case 'flex-initial':
      style.flexGrow = 0;
      style.flexShrink = 1;
      return true;
    case 'flex-none':
      style.flexGrow = 0;
      style.flexShrink = 0;
      return true;
    case 'grow':
      style.flexGrow = 1;
      return true;
    case 'grow-0':
      style.flexGrow = 0;
      return true;
    case 'shrink':
      style.flexShrink = 1;
      return true;
    case 'shrink-0':
      style.flexShrink = 0;
      return true;
    case 'absolute':
      style.position = 'absolute';
      return true;
    case 'relative':
      style.position = 'relative';
      return true;
    case 'aspect-square':
      style.aspectRatio = 1;
      return true;
    case 'bg-black':
      style.backgroundColor = 'black';
      return true;
    case 'bg-white':
      style.backgroundColor = 'white';
      return true;
    case 'bg-transparent':
      style.backgroundColor = 'transparent';
      return true;
    case 'text-black':
      style.color = 'black';
      return true;
    case 'text-white':
      style.color = 'white';
      return true;
    case 'border-black':
      style.borderColor = 'black';
      return true;
    case 'border-white':
      style.borderColor = 'white';
      return true;
    case 'text-left':
    case 'text-start':
      style.textAlign = 'left';
      return true;
    case 'text-center':
      style.textAlign = 'center';
      return true;
    case 'text-right':
    case 'text-end':
      style.textAlign = 'right';
      return true;
    case 'uppercase':
      style.textTransform = 'uppercase';
      return true;
    case 'lowercase':
      style.textTransform = 'lowercase';
      return true;
    case 'capitalize':
      style.textTransform = 'capitalize';
      return true;
    case 'normal-case':
      style.textTransform = 'none';
      return true;
    case 'whitespace-nowrap':
    case 'text-nowrap':
      style.whiteSpace = 'nowrap';
      return true;
    case 'whitespace-normal':
    case 'text-wrap':
      style.whiteSpace = 'normal';
      return true;
    case 'truncate':
      style.lineClamp = 1;
      style.textOverflow = 'ellipsis';
      style.whiteSpace = 'nowrap';
      return true;
    case 'text-ellipsis':
      style.textOverflow = 'ellipsis';
      return true;
    case 'text-clip':
      style.textOverflow = 'clip';
      return true;
    case 'font-condensed':
      style.fontStretch = 0.8;
      return true;
    case 'font-expanded':
      style.fontStretch = 1.25;
      return true;
    case 'mx-auto':
      style.marginLeft = 'auto';
      style.marginRight = 'auto';
      return true;
    case 'my-auto':
      style.marginTop = 'auto';
      style.marginBottom = 'auto';
      return true;
    case 'm-auto':
      style.margin = 'auto';
      return true;
    case 'ml-auto':
      style.marginLeft = 'auto';
      return true;
    case 'mr-auto':
      style.marginRight = 'auto';
      return true;
    case 'mt-auto':
      style.marginTop = 'auto';
      return true;
    case 'mb-auto':
      style.marginBottom = 'auto';
      return true;
  }

  // justify-*, items-*, self-*, content-*
  let m = /^justify-(\w+)$/.exec(cls);
  if (m && JUSTIFY[m[1]]) return (style.justifyContent = JUSTIFY[m[1]]), true;
  m = /^items-(\w+)$/.exec(cls);
  if (m && ALIGN[m[1]]) return (style.alignItems = ALIGN[m[1]]), true;
  m = /^self-(\w+)$/.exec(cls);
  if (m && (ALIGN[m[1]] || m[1] === 'auto')) {
    style.alignSelf = m[1] === 'auto' ? 'auto' : ALIGN[m[1]];
    return true;
  }
  m = /^content-(\w+)$/.exec(cls);
  if (m && (ALIGN[m[1]] || JUSTIFY[m[1]])) {
    style.alignContent = (ALIGN[m[1]] ?? JUSTIFY[m[1]]) as Style['alignContent'];
    return true;
  }
  m = /^(grow|shrink)-(\d+)$/.exec(cls);
  if (m) {
    style[m[1] === 'grow' ? 'flexGrow' : 'flexShrink'] = Number(m[2]);
    return true;
  }

  // Text sizes: text-xl, text-[20px]
  m = /^text-(.+)$/.exec(cls);
  if (m) {
    if (FONT_SIZES[m[1]]) return (style.fontSize = FONT_SIZES[m[1]]), true;
    const arb = arbitrary(m[1]);
    if (arb !== undefined) return (style.fontSize = arb), true;
  }
  m = /^leading-(.+)$/.exec(cls);
  if (m) {
    if (LEADING[m[1]] !== undefined) return (style.lineHeight = LEADING[m[1]]), true;
    const sp = spacing(m[1]);
    if (sp !== undefined) return (style.lineHeight = typeof sp === 'number' ? `${sp}px` : sp), true;
  }
  m = /^line-clamp-(\d+)$/.exec(cls);
  if (m) {
    style.lineClamp = Number(m[1]);
    style.textOverflow = 'ellipsis';
    return true;
  }
  m = /^rotate-(\d+)$/.exec(cls);
  if (m && ['0', '90', '180', '270'].includes(m[1])) {
    style.rotate = Number(m[1]) as Style['rotate'];
    return true;
  }
  m = /^aspect-\[(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\]$/.exec(cls);
  if (m) return (style.aspectRatio = Number(m[1]) / Number(m[2])), true;

  // Rounded corners
  m = /^rounded(?:-(.+))?$/.exec(cls);
  if (m) {
    const key = m[1] ?? '';
    if (RADII[key] !== undefined) return (style.borderRadius = RADII[key]), true;
    const arb = arbitrary(key);
    if (arb !== undefined) return (style.borderRadius = arb), true;
  }

  // Borders: border, border-2, border-t-4, border-[3px]
  if (cls === 'border' || cls.startsWith('border-')) {
    for (const [prefix, keys] of Object.entries(BORDER_SIDES).sort((a, b) => b[0].length - a[0].length)) {
      if (cls === prefix) return set(style, keys, 1), true;
      if (cls.startsWith(`${prefix}-`)) {
        const v = cls.slice(prefix.length + 1);
        if (BORDER_WIDTHS[v] !== undefined) return set(style, keys, BORDER_WIDTHS[v]), true;
        const arb = arbitrary(v);
        if (arb !== undefined) return set(style, keys, arb), true;
      }
    }
  }

  // Sizing
  const sz = splitPrefix(cls, SIZE_PROPS);
  if (sz) {
    const v = size(sz[1]);
    if (v !== undefined) return set(style, SIZE_PROPS[sz[0]], v), true;
  }

  // Spacing and positions
  const sp = splitPrefix(cls, SPACING_PROPS);
  if (sp) {
    const v = sp[0].startsWith('inset') || ['top', 'right', 'bottom', 'left'].includes(sp[0]) ? size(sp[1]) : spacing(sp[1]);
    if (v !== undefined) {
      if (neg && sp[0].startsWith('gap')) return false;
      return set(style, SPACING_PROPS[sp[0]], negate(v, neg)), true;
    }
  }

  return false;
}

const cache = new Map<string, TailwindResult>();

export function tw(className: string | undefined): TailwindResult {
  if (!className) return { style: {}, unknown: [] };
  const hit = cache.get(className);
  if (hit) return hit;
  const style: Style = {};
  const unknown: string[] = [];
  const flags = { flex: false };
  for (const cls of className.split(/\s+/).filter(Boolean)) {
    if (!applyClass(style, cls, flags)) unknown.push(cls);
  }
  // Like the web: `flex` makes a row unless a direction is given.
  if (flags.flex && !style.flexDirection) style.flexDirection = 'row';
  const result = { style, unknown };
  cache.set(className, result);
  return result;
}
