import WIDTHS from './font0-widths.json';

/**
 * Metrics for ZPL's built-in scalable font 0 (a bold condensed sans).
 * Advance widths were measured from printer output (see scripts/calibrate-font0.mjs)
 * and are given as a fraction of the ^A0 width parameter.
 */
const TABLE = WIDTHS as Record<string, number>;
const FALLBACK = 0.5;

/** Baseline position as a fraction of the font height. */
export const BASELINE = 0.75;
/** Cap height as a fraction of the font height. */
export const CAP_HEIGHT = 0.745;

export function charAdvance(ch: string): number {
  return TABLE[ch] ?? FALLBACK;
}

/** Width in dots of `text` set in font 0 with the given ^A0 width parameter. */
export function measureText(text: string, fontWidth: number): number {
  let w = 0;
  for (const ch of text) w += charAdvance(ch) * fontWidth;
  return w;
}

export interface WrapOptions {
  maxWidth: number;
  fontWidth: number;
  wrap: boolean;
  maxLines?: number;
  ellipsis?: boolean;
}

const ELLIPSIS = '...';

/**
 * Breaks text into lines that fit `maxWidth`. Whitespace collapses like CSS,
 * `\n` forces a break and words longer than a line are split by character.
 */
export function wrapText(text: string, opts: WrapOptions): string[] {
  const { maxWidth, fontWidth } = opts;
  const paragraphs = text.split('\n').map((p) => p.replace(/\s+/g, ' ').trim());
  let lines: string[] = [];

  for (const para of paragraphs) {
    if (!opts.wrap || !Number.isFinite(maxWidth)) {
      lines.push(para);
      continue;
    }
    let line = '';
    for (const word of para.split(' ')) {
      if (word === '') continue;
      const candidate = line ? `${line} ${word}` : word;
      if (measureText(candidate, fontWidth) <= maxWidth + 0.01) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      line = '';
      // Never split a {{placeholder}}: it would no longer match when filled in.
      if (word.includes('{{')) {
        line = word;
        continue;
      }
      // The word alone may still be too long: split it.
      for (const ch of word) {
        if (line && measureText(line + ch, fontWidth) > maxWidth + 0.01) {
          lines.push(line);
          line = '';
        }
        line += ch;
      }
    }
    lines.push(line);
  }

  const max = opts.maxLines;
  if (max && max > 0 && lines.length > max) {
    const cut = lines.slice(0, max);
    if (opts.ellipsis) cut[max - 1] = fitWithEllipsis(cut[max - 1], maxWidth, fontWidth);
    lines = cut;
  } else if (opts.ellipsis && Number.isFinite(maxWidth) && lines.length === 1 && !opts.wrap) {
    if (measureText(lines[0], fontWidth) > maxWidth + 0.01) lines[0] = fitWithEllipsis(lines[0], maxWidth, fontWidth);
  }
  return lines;
}

function fitWithEllipsis(line: string, maxWidth: number, fontWidth: number): string {
  let s = line.trimEnd();
  while (s && measureText(s + ELLIPSIS, fontWidth) > maxWidth + 0.01) s = s.slice(0, -1).trimEnd();
  return s + ELLIPSIS;
}

/** `{{name}}` template placeholders. Text transforms leave them as written. */
const PLACEHOLDER = /(\{\{[^{}]*\}\})/;

export function transformText(text: string, transform: string | undefined): string {
  if (!transform || transform === 'none') return text;
  if (PLACEHOLDER.test(text)) {
    let atWordStart = true;
    return text
      .split(PLACEHOLDER)
      .map((part, i) => {
        if (i % 2 === 1) {
          atWordStart = false;
          return part;
        }
        const out = transformPart(part, transform, atWordStart);
        if (part) atWordStart = /\s$/.test(part);
        return out;
      })
      .join('');
  }
  return transformPart(text, transform, true);
}

function transformPart(text: string, transform: string, atWordStart: boolean): string {
  switch (transform) {
    case 'uppercase':
      return text.toUpperCase();
    case 'lowercase':
      return text.toLowerCase();
    case 'capitalize':
      return text.replace(/(^|\s)(\S)/g, (m, a, b, offset) => (offset === 0 && !a && !atWordStart ? m : a + b.toUpperCase()));
    default:
      return text;
  }
}
