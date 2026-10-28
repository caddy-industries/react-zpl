import { encodeSymbol, type LinearType, linearElementWidths, retailDigits } from '../barcode/encode';
import type { LayoutBox } from '../ops';
import { BASELINE, charAdvance, measureText, wrapText } from '../text/font0';
import { dpmmFor } from '../units';
import { decompressGraphic } from '../zpl/compress';
import { QR_TOP_OFFSET, RETAIL_GUARD_EXTENSION } from '../zpl/quirks';

export interface SvgOptions {
  /** Printer resolution, used when the ZPL has no ^PW/^LL. Default 203. */
  dpi?: number;
  /** Label size in dots when the ZPL has no ^PW/^LL. Default 4x6 inches. */
  width?: number;
  height?: number;
  /** Multiplies the SVG's width/height attributes. Default 1 (one unit per dot). */
  scale?: number;
  /** Draws element outlines on top, e.g. `renderLabel().boxes`. */
  overlay?: LayoutBox[];
  /** Shades the unprintable margin, e.g. `renderLabel().setup.margin`. */
  margin?: { top: number; right: number; bottom: number; left: number };
}

export interface PreviewResult {
  svg: string;
  width: number;
  height: number;
  /** ZPL commands the preview does not understand. */
  warnings: string[];
}

/** SVG font stack that looks close to the printer's font 0. */
const FONT_FAMILY = "'Roboto Condensed','Arial Narrow','Helvetica Neue Condensed',Arial,sans-serif";
/** Font size multiplier that makes common condensed fonts match font 0's cap height. */
const FONT_SCALE = 1.04;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

interface State {
  x: number;
  y: number;
  /** ^FT positions are baselines / bottom edges rather than top-left corners. */
  typeset: boolean;
  homeX: number;
  homeY: number;
  font: { orientation: string; height: number; width: number };
  defaultFont: { height: number; width: number };
  reverse: boolean;
  hexIndicator?: string;
  by: { w: number; r: number; h: number };
  pending?: { cmd: string; params: string[] };
  block?: { width: number; lines: number; spacing: number; justify: string };
}

function num(v: string | undefined, fallback: number): number {
  if (v === undefined || v.trim() === '') return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function unhex(data: string, indicator: string): string {
  const bytes: number[] = [];
  const enc = new TextEncoder();
  for (let i = 0; i < data.length; i++) {
    if (data[i] === indicator && /^[0-9a-f]{2}$/i.test(data.slice(i + 1, i + 3))) {
      bytes.push(Number.parseInt(data.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      bytes.push(...enc.encode(data[i]));
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

/** Outline (or filled) rounded box as a path, matching ^GB. */
function boxPath(x: number, y: number, w: number, h: number, t: number, rounding: number): string {
  w = Math.max(w, t);
  h = Math.max(h, t);
  const r = (Math.min(Math.max(rounding, 0), 8) / 8) * (Math.min(w, h) / 2);
  const rect = (x0: number, y0: number, ww: number, hh: number, rr: number) => {
    rr = Math.min(rr, ww / 2, hh / 2);
    if (rr <= 0) return `M${x0},${y0}h${ww}v${hh}h${-ww}z`;
    return `M${x0 + rr},${y0}h${ww - 2 * rr}a${rr},${rr} 0 0 1 ${rr},${rr}v${hh - 2 * rr}a${rr},${rr} 0 0 1 ${-rr},${rr}h${-(ww - 2 * rr)}a${rr},${rr} 0 0 1 ${-rr},${-rr}v${-(hh - 2 * rr)}a${rr},${rr} 0 0 1 ${rr},${-rr}z`;
  };
  let d = rect(x, y, w, h, r);
  if (w - 2 * t > 0 && h - 2 * t > 0) d += rect(x + t, y + t, w - 2 * t, h - 2 * t, Math.max(0, r - t));
  return d;
}

/** Runs of black cells merged into rectangles. */
function matrixRects(cells: Uint8Array, cols: number, rows: number, x: number, y: number, mw: number, mh: number) {
  let d = '';
  for (let r = 0; r < rows; r++) {
    let c = 0;
    while (c < cols) {
      if (!cells[r * cols + c]) {
        c++;
        continue;
      }
      const start = c;
      while (c < cols && cells[r * cols + c]) c++;
      d += `M${x + start * mw},${y + r * mh}h${(c - start) * mw}v${mh}h${-(c - start) * mw}z`;
    }
  }
  return d;
}

/** Interprets ZPL and draws it as SVG. Supports the commands react-zpl emits plus common extras. */
export function previewZpl(zpl: string, options: SvgOptions = {}): PreviewResult {
  const dpmm = dpmmFor(options.dpi ?? 203);
  let width = options.width ?? Math.floor(4 * 25.4 * dpmm);
  let height = options.height ?? Math.floor(6 * 25.4 * dpmm);
  const shapes: string[] = [];
  const warnings = new Set<string>();

  const fresh = (): State => ({
    x: 0,
    y: 0,
    typeset: false,
    homeX: 0,
    homeY: 0,
    font: { orientation: 'N', height: 9, width: 5 },
    defaultFont: { height: 9, width: 5 },
    reverse: false,
    by: { w: 2, r: 3, h: 10 },
  });
  let s = fresh();

  const fill = (d: string, white: boolean, reverse: boolean) => {
    if (!d) return;
    if (reverse) shapes.push(`<path d="${d}" fill="#fff" fill-rule="evenodd" style="mix-blend-mode:difference"/>`);
    else shapes.push(`<path d="${d}" fill="${white ? '#fff' : '#000'}" fill-rule="evenodd"/>`);
  };

  const drawText = (text: string, x: number, y: number, o: string, h: number, w: number, reverse: boolean) => {
    if (!text) return;
    const len = measureText(text, w);
    let transform = `translate(${x},${y})`;
    if (o === 'R') transform = `translate(${x + h},${y}) rotate(90)`;
    else if (o === 'I') transform = `translate(${x + len},${y + h}) rotate(180)`;
    else if (o === 'B') transform = `translate(${x},${y + len}) rotate(270)`;
    // Place every glyph at the printer's advance width, scaled for ^A width != height.
    const sx = w / h;
    if (Math.abs(sx - 1) > 0.001) transform += ` scale(${sx.toFixed(4)},1)`;
    const xs: string[] = [];
    let chars = '';
    let cursor = 0;
    for (const ch of text) {
      const adv = charAdvance(ch) * h;
      // Font 0 draws "-" as a wide dash; an en dash is the closest common glyph.
      const glyph = ch === '-' ? '\u2013' : ch;
      xs.push(cursor.toFixed(2));
      chars += glyph;
      cursor += adv;
    }
    const fillAttr = reverse ? 'fill="#fff" style="mix-blend-mode:difference"' : 'fill="#000"';
    shapes.push(
      `<text transform="${transform}" x="${xs.join(' ')}" y="${(h * BASELINE).toFixed(2)}" font-family="${FONT_FAMILY}" font-weight="700" font-stretch="condensed" font-size="${(h * FONT_SCALE).toFixed(2)}" ${fillAttr} xml:space="preserve">${esc(chars)}</text>`,
    );
  };

  const fieldText = (data: string) => {
    const f = s.font;
    let { x, y } = s;
    if (s.typeset) y -= Math.round(f.height * BASELINE);
    if (s.block) {
      const b = s.block;
      const lines = wrapText(data.replace(/\\&/g, '\n'), { maxWidth: b.width, fontWidth: f.width, wrap: true, maxLines: b.lines });
      lines.forEach((line, i) => {
        const lw = measureText(line, f.width);
        const off = b.justify === 'C' ? (b.width - lw) / 2 : b.justify === 'R' ? b.width - lw : 0;
        drawText(line, x + off, y + i * (f.height + b.spacing), f.orientation, f.height, f.width, s.reverse);
      });
      return;
    }
    drawText(data, x, y, f.orientation, f.height, f.width, s.reverse);
  };

  const fieldBarcode = (cmd: string, p: string[], data: string) => {
    const mw = s.by.w;
    let { x, y } = s;
    try {
      if (cmd === 'BQ') {
        const mag = num(p[2], 2);
        const m = /^([HQML])([AM]),(.*)$/s.exec(data);
        const ecc = m ? m[1] : 'Q';
        const value = m ? m[3] : data;
        const sym = encodeSymbol('qrcode', value, { errorCorrection: ecc });
        if (sym.kind !== 'matrix') return;
        if (s.typeset) y -= sym.rows * mag;
        fill(matrixRects(sym.cells, sym.cols, sym.rows, x, y + QR_TOP_OFFSET, mag, mag), false, s.reverse);
        return;
      }
      if (cmd === 'BX') {
        const size = num(p[1], 2);
        const sym = encodeSymbol('datamatrix', data);
        if (sym.kind !== 'matrix') return;
        if (s.typeset) y -= sym.rows * size;
        fill(matrixRects(sym.cells, sym.cols, sym.rows, x, y, size, size), false, s.reverse);
        return;
      }
      if (cmd === 'B7') {
        const rowH = num(p[1], s.by.h);
        const sym = encodeSymbol('pdf417', data, { errorCorrection: num(p[2], 0), columns: num(p[3], 4) });
        if (sym.kind !== 'matrix') return;
        if (s.typeset) y -= sym.rows * rowH;
        fill(matrixRects(sym.cells, sym.cols, sym.rows, x, y, mw, rowH), false, s.reverse);
        return;
      }
      const map: Record<string, LinearType> = { BC: 'code128', B3: 'code39', BE: 'ean13', BU: 'upca' };
      const type = map[cmd];
      const h = num(cmd === 'B3' ? p[2] : p[1], s.by.h);
      let value = data;
      if (type === 'ean13' || type === 'upca') value = retailDigits(type, data);
      const sym = encodeSymbol(type, value);
      if (sym.kind !== 'linear') return;
      if (s.typeset) y -= h;
      const widths = linearElementWidths(sym, type, mw, s.by.r);
      const retail = type === 'ean13' || type === 'upca';
      // Guard bars (and UPC-A's outer digits) extend below the rest.
      const last = widths.length - 1;
      const isGuard = (i: number) =>
        i <= 2 || (i >= 27 && i <= 31) || i >= last - 2 || (type === 'upca' && (i <= 6 || i >= last - 6));
      let d = '';
      let cx = x;
      widths.forEach((w, i) => {
        if (i % 2 === 0) {
          const bh = retail && isGuard(i) ? h + RETAIL_GUARD_EXTENSION : h;
          d += `M${cx},${y}h${w}v${bh}h${-w}z`;
        }
        cx += w;
      });
      fill(d, false, s.reverse);
    } catch (err) {
      warnings.add(err instanceof Error ? err.message : String(err));
    }
  };

  const tokens = zpl.split(/(?=[\^~])/);
  for (const token of tokens) {
    if (token.length < 2 || (token[0] !== '^' && token[0] !== '~')) continue;
    let cmd = token.slice(1, 3).toUpperCase();
    let rest = token.slice(3);
    // ^A<font> takes the font name as its second character.
    if (cmd[0] === 'A' && token[0] === '^') {
      rest = token.slice(3);
      cmd = 'A';
    }
    const p = rest.split(',');
    switch (cmd) {
      case 'XA':
        s = fresh();
        break;
      case 'XZ':
      case 'CI':
      case 'PO':
      case 'PQ':
      case 'PR':
      case 'MD':
      case 'MN':
      case 'MT':
      case 'MM':
      case 'FX':
      case 'JU':
      case 'FN':
      case 'LS':
      case 'PM':
        break;
      case 'PW':
        width = num(p[0], width);
        break;
      case 'LL':
        height = num(p[0], height);
        break;
      case 'LH':
        s.homeX = num(p[0], 0);
        s.homeY = num(p[1], 0);
        break;
      case 'FO':
      case 'FT':
        s.x = s.homeX + num(p[0], 0);
        s.y = s.homeY + num(p[1], 0);
        s.typeset = cmd === 'FT';
        break;
      case 'CF': {
        const h = num(p[1], s.defaultFont.height);
        s.defaultFont = { height: h, width: num(p[2], h) };
        s.font = { ...s.font, ...s.defaultFont };
        if (rest[0] && rest[0] !== '0') warnings.add('Only font 0 is previewed; other fonts are drawn as font 0.');
        break;
      }
      case 'A': {
        const font = token[2];
        if (font !== '0') warnings.add('Only font 0 is previewed; other fonts are drawn as font 0.');
        const o = (p[0] || 'N').trim().toUpperCase() || 'N';
        const h = num(p[1], s.defaultFont.height);
        s.font = { orientation: o, height: h, width: num(p[2], h) };
        break;
      }
      case 'FW':
        s.font.orientation = (p[0] || 'N').toUpperCase();
        break;
      case 'FR':
        s.reverse = true;
        break;
      case 'FH':
        s.hexIndicator = rest[0] || '_';
        break;
      case 'FB':
        s.block = {
          width: num(p[0], 0),
          lines: num(p[1], 1),
          spacing: num(p[2], 0),
          justify: (p[3] || 'L').toUpperCase(),
        };
        break;
      case 'BY':
        s.by = { w: num(p[0], s.by.w), r: num(p[1], s.by.r), h: num(p[2], s.by.h) };
        break;
      case 'BC':
      case 'B3':
      case 'BE':
      case 'BU':
      case 'BQ':
      case 'BX':
      case 'B7':
        s.pending = { cmd, params: p };
        break;
      case 'GB': {
        const w = num(p[0], 1);
        const h = num(p[1], 1);
        const t = num(p[2], 1);
        const color = (p[3] || 'B').trim().toUpperCase();
        let { x, y } = s;
        if (s.typeset) y -= h;
        fill(boxPath(x, y, w, h, t, num(p[4], 0)), color === 'W', s.reverse);
        break;
      }
      case 'GF': {
        const format = (p[0] || 'A').toUpperCase();
        const total = num(p[1], 0);
        const perRow = num(p[3], 1);
        const data = p.slice(4).join(',');
        if (format !== 'A' || /^:(Z64|B64):/.test(data)) {
          warnings.add('Only ASCII hex ^GF graphics are previewed.');
          break;
        }
        const bytes = decompressGraphic(data, perRow, total);
        const rows = Math.ceil(total / perRow);
        const bits = new Uint8Array(perRow * 8 * rows);
        for (let i = 0; i < bytes.length; i++) for (let b = 0; b < 8; b++) bits[i * 8 + b] = (bytes[i] >> (7 - b)) & 1;
        let { x, y } = s;
        if (s.typeset) y -= rows;
        fill(matrixRects(bits, perRow * 8, rows, x, y, 1, 1), false, s.reverse);
        break;
      }
      case 'FD': {
        let data = rest;
        if (s.hexIndicator) data = unhex(data, s.hexIndicator);
        if (s.pending) fieldBarcode(s.pending.cmd, s.pending.params, data);
        else fieldText(data);
        s.pending = undefined;
        break;
      }
      case 'FS':
        s.reverse = false;
        s.hexIndicator = undefined;
        s.pending = undefined;
        s.block = undefined;
        s.typeset = false;
        break;
      default:
        warnings.add(`^${cmd} is not supported by the preview.`);
    }
  }

  const scale = options.scale ?? 1;
  let overlay = '';
  if (options.overlay?.length) {
    overlay = `<g fill="none" stroke="#e5484d" stroke-width="1" vector-effect="non-scaling-stroke" opacity="0.8">${options.overlay
      .map((b) => `<rect x="${b.x + 0.5}" y="${b.y + 0.5}" width="${Math.max(0, b.width - 1)}" height="${Math.max(0, b.height - 1)}"><title>${esc(b.type)}</title></rect>`)
      .join('')}</g>`;
  }
  const m = options.margin;
  if (m && (m.top || m.right || m.bottom || m.left)) overlay = marginOverlay(width, height, m) + overlay;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width * scale}" height="${height * scale}" shape-rendering="crispEdges"><g style="isolation:isolate"><rect width="${width}" height="${height}" fill="#fff"/>${shapes.join('')}</g>${overlay}</svg>`;
  return { svg, width, height, warnings: [...warnings] };
}

/** Hatched bands over the area the printer can't reach, plus a dashed printable edge. */
export function marginOverlay(width: number, height: number, m: { top: number; right: number; bottom: number; left: number }) {
  const inner = `M${m.left},${m.top}h${width - m.left - m.right}v${height - m.top - m.bottom}h${-(width - m.left - m.right)}z`;
  return `<defs><pattern id="zpl-margin" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="8" height="8" fill="#e5484d" fill-opacity="0.08"/><path d="M0,0v8" stroke="#e5484d" stroke-opacity="0.35" stroke-width="2"/></pattern></defs><path d="M0,0h${width}v${height}h${-width}z${inner}" fill="url(#zpl-margin)" fill-rule="evenodd"/><path d="${inner}" fill="none" stroke="#e5484d" stroke-opacity="0.6" stroke-width="1" stroke-dasharray="6 4" vector-effect="non-scaling-stroke"/>`;
}

/** Draws ZPL as an SVG string for previews. */
export function renderToSvg(zpl: string, options: SvgOptions = {}): string {
  return previewZpl(zpl, options).svg;
}

