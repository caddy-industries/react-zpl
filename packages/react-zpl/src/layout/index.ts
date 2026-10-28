import {
  Align,
  Direction,
  Display,
  Edge,
  FlexDirection,
  Gutter,
  Justify,
  MeasureMode,
  type Node as YogaNode,
  PositionType,
  Wrap,
  type Yoga,
} from 'yoga-layout/load';
import { encodeSymbol, type LinearType, linearElementWidths, retailDigits, sum } from '../barcode/encode';
import { decodePng, toMonochrome } from '../image/bitmap';
import type { DrawOp, LabelSetup, LayoutBox } from '../ops';
import type { ElementNode, TreeNode } from '../reconciler';
import { tw } from '../style/tailwind';
import type { Style } from '../style/types';
import { measureText, transformText, wrapText } from '../text/font0';
import { dpmmFor, type Length, parseLength, toDots } from '../units';
import { QR_TOP_OFFSET, RETAIL_GUARD_EXTENSION } from '../zpl/quirks';
import { getYoga } from './yoga';

export interface LayoutOptions {
  dpi?: number;
  /** Unprintable area at the label edges, e.g. "1.5mm" or "1mm 2mm". Overrides <Label printMargin>. */
  printMargin?: Length;
  /** Label stock size. Overrides <Label width/height>, so one layout can print on several sizes. */
  width?: Length;
  height?: Length;
}

export interface LayoutResult {
  setup: LabelSetup;
  ops: DrawOp[];
  boxes: LayoutBox[];
  warnings: string[];
}

/** Text properties that children inherit from their parents, like CSS. */
interface Inherited {
  color: string;
  fontSize: Length;
  fontStretch: number;
  lineHeight: number | string;
  textAlign: 'left' | 'center' | 'right';
  textTransform: Style['textTransform'];
  whiteSpace: 'normal' | 'nowrap';
}

const ROOT_INHERITED: Inherited = {
  color: 'black',
  fontSize: 16,
  fontStretch: 1,
  lineHeight: 1.1,
  textAlign: 'left',
  textTransform: 'none',
  whiteSpace: 'normal',
};

interface TextInfo {
  content: string;
  fontHeight: number;
  fontWidth: number;
  lineHeight: number;
  maxLines?: number;
  ellipsis: boolean;
  wrap: boolean;
  rotate: 0 | 90 | 180 | 270;
}

interface BarcodeInfo {
  /** Size of the node (symbol plus caption) in dots. */
  width: number;
  /** Size of the symbol itself, without the caption. */
  symbolWidth: number;
  symbolHeight: number;
  height: number;
  op: Omit<Extract<DrawOp, { kind: 'barcode' }>, 'x' | 'y'>;
  caption?: { text: string; fontHeight: number; gap: number };
}

interface ImageInfo {
  img: ReturnType<typeof decodePng>;
  intrinsicW: number;
  intrinsicH: number;
}

interface LNode {
  el: ElementNode;
  yoga: YogaNode;
  style: Style;
  inherited: Inherited;
  children: LNode[];
  text?: TextInfo;
  barcode?: BarcodeInfo;
  image?: ImageInfo;
}

class Ctx {
  warnings = new Set<string>();
  constructor(
    public yoga: Yoga,
    public dpmm: number,
  ) {}
  dots(v: Length | undefined, fallback = 0) {
    return toDots(v, this.dpmm, fallback);
  }
  warn(msg: string) {
    this.warnings.add(msg);
  }
}

function findLabel(nodes: TreeNode[]): ElementNode {
  const labels = nodes.filter((n): n is ElementNode => n.kind === 'element' && n.type === 'zpl-label');
  if (labels.length !== 1 || nodes.some((n) => n.kind === 'text' && n.text.trim())) {
    throw new Error('react-zpl: render() expects exactly one <Label> at the root.');
  }
  return labels[0];
}

function resolveStyle(el: ElementNode, ctx: Ctx): Style {
  const { style: twStyle, unknown } = tw(el.props.className);
  for (const cls of unknown) ctx.warn(`Unsupported class "${cls}" was ignored.`);
  return { ...el.props.defaultStyle, ...twStyle, ...el.props.style };
}

function inherit(parent: Inherited, s: Style): Inherited {
  return {
    color: s.color ?? parent.color,
    fontSize: s.fontSize ?? parent.fontSize,
    fontStretch: s.fontStretch ?? parent.fontStretch,
    lineHeight: s.lineHeight ?? parent.lineHeight,
    textAlign: s.textAlign ?? parent.textAlign,
    textTransform: s.textTransform ?? parent.textTransform,
    whiteSpace: s.whiteSpace ?? parent.whiteSpace,
  };
}

type YogaLength = number | 'auto' | `${number}%` | undefined;

function yogaLength(v: Length | undefined, ctx: Ctx): YogaLength {
  const p = parseLength(v, ctx.dpmm);
  if (p === undefined) return undefined;
  if (p === 'auto') return 'auto';
  if ('percent' in p) return `${p.percent}%`;
  return p.dots;
}

/** Expands CSS shorthands like padding: "4px 8px" into per-edge values. */
function edges(all: Length | undefined): [Length?, Length?, Length?, Length?] {
  if (all === undefined) return [];
  if (typeof all === 'number') return [all, all, all, all];
  const parts = all.trim().split(/\s+/);
  const [t, r = t, b = t, l = r] = parts;
  return [t, r, b, l];
}

function boxEdges(s: Style, prefix: 'padding' | 'margin') {
  const [t, r, b, l] = edges(s[prefix]);
  const any = s as Record<string, Length | undefined>;
  const h = any[`${prefix}Horizontal`];
  const v = any[`${prefix}Vertical`];
  return {
    top: any[`${prefix}Top`] ?? v ?? t,
    right: any[`${prefix}Right`] ?? h ?? r,
    bottom: any[`${prefix}Bottom`] ?? v ?? b,
    left: any[`${prefix}Left`] ?? h ?? l,
  };
}

function borderWidths(s: Style, ctx: Ctx) {
  const all = s.borderWidth;
  const get = (v: Length | undefined) => Math.round(ctx.dots(v ?? all, 0));
  return {
    top: get(s.borderTopWidth),
    right: get(s.borderRightWidth),
    bottom: get(s.borderBottomWidth),
    left: get(s.borderLeftWidth),
  };
}

const FLEX_DIRECTION = {
  row: FlexDirection.Row,
  column: FlexDirection.Column,
  'row-reverse': FlexDirection.RowReverse,
  'column-reverse': FlexDirection.ColumnReverse,
};
const JUSTIFY = {
  'flex-start': Justify.FlexStart,
  center: Justify.Center,
  'flex-end': Justify.FlexEnd,
  'space-between': Justify.SpaceBetween,
  'space-around': Justify.SpaceAround,
  'space-evenly': Justify.SpaceEvenly,
};
const ALIGN = {
  auto: Align.Auto,
  'flex-start': Align.FlexStart,
  center: Align.Center,
  'flex-end': Align.FlexEnd,
  stretch: Align.Stretch,
  baseline: Align.Baseline,
  'space-between': Align.SpaceBetween,
  'space-around': Align.SpaceAround,
};
const WRAP = { wrap: Wrap.Wrap, nowrap: Wrap.NoWrap, 'wrap-reverse': Wrap.WrapReverse };

function applyYogaStyle(node: YogaNode, s: Style, ctx: Ctx) {
  node.setDisplay(s.display === 'none' ? Display.None : Display.Flex);
  node.setFlexDirection(FLEX_DIRECTION[s.flexDirection ?? 'column']);
  if (s.flexWrap) node.setFlexWrap(WRAP[s.flexWrap]);
  if (s.justifyContent) node.setJustifyContent(JUSTIFY[s.justifyContent]);
  node.setAlignItems(ALIGN[s.alignItems ?? 'stretch']);
  if (s.alignSelf) node.setAlignSelf(ALIGN[s.alignSelf]);
  if (s.alignContent) node.setAlignContent(ALIGN[s.alignContent]);
  if (s.flex !== undefined) {
    node.setFlexGrow(s.flex);
    node.setFlexShrink(1);
    node.setFlexBasis(0);
  }
  if (s.flexGrow !== undefined) node.setFlexGrow(s.flexGrow);
  if (s.flexShrink !== undefined) node.setFlexShrink(s.flexShrink);
  if (s.flexBasis !== undefined) node.setFlexBasis(yogaLength(s.flexBasis, ctx));
  if (s.aspectRatio !== undefined) node.setAspectRatio(s.aspectRatio);

  const gap = (g: Gutter, v: Length | undefined) => {
    if (v !== undefined) node.setGap(g, yogaLength(v, ctx) as number);
  };
  gap(Gutter.All, s.gap);
  gap(Gutter.Row, s.rowGap);
  gap(Gutter.Column, s.columnGap);

  node.setWidth(yogaLength(s.width, ctx));
  node.setHeight(yogaLength(s.height, ctx));
  if (s.minWidth !== undefined) node.setMinWidth(yogaLength(s.minWidth, ctx) as number);
  if (s.maxWidth !== undefined) node.setMaxWidth(yogaLength(s.maxWidth, ctx) as number);
  if (s.minHeight !== undefined) node.setMinHeight(yogaLength(s.minHeight, ctx) as number);
  if (s.maxHeight !== undefined) node.setMaxHeight(yogaLength(s.maxHeight, ctx) as number);

  const pad = boxEdges(s, 'padding');
  const mar = boxEdges(s, 'margin');
  const edgeList: [keyof typeof pad, Edge][] = [
    ['top', Edge.Top],
    ['right', Edge.Right],
    ['bottom', Edge.Bottom],
    ['left', Edge.Left],
  ];
  for (const [key, edge] of edgeList) {
    if (pad[key] !== undefined) node.setPadding(edge, yogaLength(pad[key], ctx) as number);
    if (mar[key] !== undefined) node.setMargin(edge, yogaLength(mar[key], ctx));
  }

  const b = borderWidths(s, ctx);
  node.setBorder(Edge.Top, b.top);
  node.setBorder(Edge.Right, b.right);
  node.setBorder(Edge.Bottom, b.bottom);
  node.setBorder(Edge.Left, b.left);

  if (s.position === 'absolute') node.setPositionType(PositionType.Absolute);
  const [it, ir, ib, il] = edges(s.inset);
  const pos: [Length | undefined, Edge][] = [
    [s.top ?? it, Edge.Top],
    [s.right ?? ir, Edge.Right],
    [s.bottom ?? ib, Edge.Bottom],
    [s.left ?? il, Edge.Left],
  ];
  for (const [v, edge] of pos) {
    if (v !== undefined) node.setPosition(edge, yogaLength(v, ctx) as number);
  }
}

/** Collects the plain text of a <Text>, including nested <Text> children. */
function collectText(el: ElementNode, ctx: Ctx): string {
  let out = '';
  for (const child of el.children) {
    if (child.kind === 'text') out += child.text;
    else if (child.type === 'zpl-text') out += collectText(child, ctx);
    else ctx.warn(`<${child.type.replace('zpl-', '')}> inside <Text> is not supported and was ignored.`);
  }
  return out;
}

const MIN_FONT = 10;

function textInfo(el: ElementNode, inh: Inherited, s: Style, ctx: Ctx): TextInfo {
  let fontHeight = Math.round(ctx.dots(inh.fontSize));
  if (fontHeight < MIN_FONT) {
    ctx.warn(`Font size ${fontHeight} dots is below the printer minimum; using ${MIN_FONT}.`);
    fontHeight = MIN_FONT;
  }
  const fontWidth = Math.max(MIN_FONT, Math.round(fontHeight * inh.fontStretch));
  const lh = inh.lineHeight;
  const lineHeight = Math.round(typeof lh === 'number' ? lh * fontHeight : ctx.dots(lh));
  const content = transformText(collectText(el, ctx), inh.textTransform);
  return {
    content,
    fontHeight,
    fontWidth,
    lineHeight: Math.max(lineHeight, 1),
    maxLines: el.props.maxLines ?? s.lineClamp,
    ellipsis: el.props.ellipsis ?? (s.textOverflow ? s.textOverflow === 'ellipsis' : true),
    wrap: inh.whiteSpace !== 'nowrap',
    rotate: el.props.rotate ?? s.rotate ?? 0,
  };
}

function textLines(t: TextInfo, maxWidth: number) {
  return wrapText(t.content, {
    maxWidth,
    fontWidth: t.fontWidth,
    wrap: t.wrap,
    maxLines: t.maxLines,
    ellipsis: t.ellipsis && (t.maxLines !== undefined || !t.wrap),
  });
}

function measureLines(t: TextInfo, maxWidth: number) {
  const lines = textLines(t, maxWidth);
  const width = Math.ceil(Math.max(0, ...lines.map((l) => measureText(l, t.fontWidth))));
  return { lines, width, height: lines.length * t.lineHeight };
}

function checkDigit(digits: string): string {
  let total = 0;
  for (let i = 0; i < digits.length; i++) {
    const d = Number(digits[digits.length - 1 - i]);
    total += i % 2 === 0 ? d * 3 : d;
  }
  return String((10 - (total % 10)) % 10);
}

function barcodeInfo(el: ElementNode, ctx: Ctx): BarcodeInfo {
  const p = el.props;
  const type = p.type as string;
  const value = String(p.value ?? '');
  const round = (v: number) => Math.max(1, Math.round(v));

  if (type === 'qrcode') {
    const ecc = p.errorCorrection ?? 'M';
    const sym = encodeSymbol('qrcode', value, { errorCorrection: ecc });
    if (sym.kind !== 'matrix') throw new Error('unexpected');
    let mag = p.size !== undefined ? Math.floor(ctx.dots(p.size) / sym.cols) : round(ctx.dots(p.moduleSize ?? '0.5mm'));
    if (mag > 10) {
      ctx.warn('QR codes can use at most 10 dots per module; the code was made smaller.');
      mag = 10;
    }
    mag = Math.max(1, mag);
    return {
      width: sym.cols * mag,
      symbolWidth: sym.cols * mag,
      symbolHeight: sym.rows * mag,
      height: sym.rows * mag,
      op: { kind: 'barcode', type: 'qrcode', data: value, moduleWidth: mag, ratio: 3, height: 0, errorCorrection: ecc },
    };
  }

  if (type === 'datamatrix' || type === 'pdf417') {
    const m = round(ctx.dots(p.moduleWidth ?? (type === 'datamatrix' ? '0.5mm' : '0.25mm')));
    const opts = type === 'pdf417' ? { errorCorrection: p.securityLevel ?? 2, columns: p.columns ?? 4 } : {};
    const sym = encodeSymbol(type, value, opts);
    if (sym.kind !== 'matrix') throw new Error('unexpected');
    const rowH = type === 'pdf417' ? round(p.height !== undefined ? ctx.dots(p.height) : m * 3) : m;
    return {
      width: sym.cols * m,
      symbolWidth: sym.cols * m,
      symbolHeight: sym.rows * rowH,
      height: sym.rows * rowH,
      op: {
        kind: 'barcode',
        type,
        data: value,
        moduleWidth: m,
        ratio: 3,
        height: rowH,
        errorCorrection: opts.errorCorrection,
        columns: opts.columns,
      },
    };
  }

  const linear = type as LinearType;
  if (!['code128', 'code39', 'ean13', 'upca'].includes(linear)) {
    throw new Error(`react-zpl: unknown barcode type "${type}"`);
  }
  const m = round(ctx.dots(p.moduleWidth ?? '0.25mm'));
  const ratio = Math.min(3, Math.max(2, p.ratio ?? 3));
  let data = value;
  let caption = value;
  if (linear === 'ean13' || linear === 'upca') {
    data = retailDigits(linear, value);
    caption = data + checkDigit(data);
  } else if (linear === 'code39') {
    data = value.toUpperCase();
    caption = data;
  }
  const sym = encodeSymbol(linear, data);
  if (sym.kind !== 'linear') throw new Error('unexpected');
  const width = sum(linearElementWidths(sym, linear, m, ratio));
  const barH = round(ctx.dots(p.height ?? 48));
  const symbolHeight = barH + (linear === 'ean13' || linear === 'upca' ? RETAIL_GUARD_EXTENSION : 0);
  const info: BarcodeInfo = {
    width,
    symbolWidth: width,
    symbolHeight,
    height: symbolHeight,
    op: { kind: 'barcode', type: linear, data, moduleWidth: m, ratio, height: barH },
  };
  if (p.showText !== false) {
    const fontHeight = Math.max(MIN_FONT, Math.round(ctx.dots(p.textSize ?? 14)));
    const gap = Math.round(fontHeight * 0.25);
    info.caption = { text: caption, fontHeight, gap };
    info.height += gap + fontHeight;
    info.width = Math.max(width, Math.ceil(measureText(caption, fontHeight)));
  }
  return info;
}

function build(el: ElementNode, parent: Inherited, ctx: Ctx): LNode {
  const style = resolveStyle(el, ctx);
  const inherited = inherit(parent, style);
  const yoga = ctx.yoga.Node.create(config(ctx));
  applyYogaStyle(yoga, style, ctx);
  const node: LNode = { el, yoga, style, inherited, children: [] };

  if (el.type === 'zpl-text') {
    const t = textInfo(el, inherited, style, ctx);
    node.text = t;
    yoga.setMeasureFunc((width, widthMode, height, heightMode) => {
      const rotated = t.rotate === 90 || t.rotate === 270;
      const along = rotated ? height : width;
      const alongMode = rotated ? heightMode : widthMode;
      const max = alongMode === MeasureMode.Undefined || Number.isNaN(along) ? Number.POSITIVE_INFINITY : along;
      const m = measureLines(t, max);
      return rotated ? { width: m.height, height: m.width } : { width: m.width, height: m.height };
    });
    return node;
  }

  if (el.type === 'zpl-barcode') {
    const b = barcodeInfo(el, ctx);
    node.barcode = b;
    yoga.setMeasureFunc(() => ({ width: b.width, height: b.height }));
    return node;
  }

  if (el.type === 'zpl-image') {
    const img = decodePng(el.props.src);
    const info: ImageInfo = {
      img,
      intrinsicW: Math.round(ctx.dots(img.width)),
      intrinsicH: Math.round(ctx.dots(img.height)),
    };
    node.image = info;
    const ar = img.width / img.height;
    yoga.setMeasureFunc((width, widthMode, height, heightMode) => {
      if (widthMode === MeasureMode.Exactly) return { width, height: width / ar };
      if (heightMode === MeasureMode.Exactly) return { width: height * ar, height };
      let w = info.intrinsicW;
      if (widthMode === MeasureMode.AtMost && w > width) w = width;
      return { width: w, height: w / ar };
    });
    return node;
  }

  let i = 0;
  for (const child of el.children) {
    let childNode: LNode;
    if (child.kind === 'text') {
      if (!child.text.trim()) continue;
      // Bare strings inside a Box behave like <Text>.
      childNode = build({ kind: 'element', type: 'zpl-text', props: {}, children: [child] }, inherited, ctx);
    } else if (child.type === 'zpl-label') {
      throw new Error('react-zpl: <Label> cannot be nested.');
    } else {
      childNode = build(child, inherited, ctx);
    }
    node.children.push(childNode);
    yoga.insertChild(childNode.yoga, i++);
  }
  return node;
}

let sharedConfig: ReturnType<Yoga['Config']['create']> | undefined;
function config(ctx: Ctx) {
  if (!sharedConfig) {
    sharedConfig = ctx.yoga.Config.create();
    sharedConfig.setPointScaleFactor(1);
    // Web defaults: items shrink to fit (flex-shrink: 1), like CSS.
    sharedConfig.setUseWebDefaults(true);
  }
  return sharedConfig;
}

function isDark(color: string | undefined): boolean | undefined {
  if (!color || color === 'transparent') return undefined;
  if (color === 'black') return true;
  if (color === 'white') return false;
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color);
  if (m) {
    const hex = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
    const [r, g, b] = [0, 2, 4].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
    return 0.299 * r + 0.587 * g + 0.114 * b < 128;
  }
  return true;
}

function rounding(radius: number, w: number, h: number): number {
  if (radius <= 0) return 0;
  const short = Math.min(w, h);
  return Math.max(0, Math.min(8, Math.round((radius / (short / 2)) * 8)));
}

function emitNode(node: LNode, ox: number, oy: number, ctx: Ctx, ops: DrawOp[], boxes: LayoutBox[]) {
  const y = node.yoga;
  if (node.style.display === 'none') return;
  const l = y.getComputedLayout();
  const x0 = Math.round(ox + l.left);
  const y0 = Math.round(oy + l.top);
  const w = Math.round(l.width);
  const h = Math.round(l.height);
  boxes.push({ type: node.el.type.replace('zpl-', ''), x: x0, y: y0, width: w, height: h });
  const s = node.style;

  // Background
  const bg = isDark(s.backgroundColor);
  const radius = ctx.dots(s.borderRadius, 0);
  if (bg !== undefined && w > 0 && h > 0) {
    ops.push({
      kind: 'rect',
      x: x0,
      y: y0,
      w,
      h,
      thickness: Math.min(w, h),
      color: bg ? 'B' : 'W',
      rounding: rounding(radius, w, h),
    });
  }

  // Borders
  const b = borderWidths(s, ctx);
  const borderColor = isDark(s.borderColor ?? 'black') === false ? 'W' : 'B';
  if (b.top && b.top === b.right && b.top === b.bottom && b.top === b.left) {
    ops.push({
      kind: 'rect',
      x: x0,
      y: y0,
      w: Math.max(w, b.top),
      h: Math.max(h, b.top),
      thickness: b.top,
      color: borderColor,
      rounding: rounding(radius, w, h),
    });
  } else {
    const side = (x: number, yy: number, ww: number, hh: number) => {
      if (ww > 0 && hh > 0)
        ops.push({ kind: 'rect', x, y: yy, w: ww, h: hh, thickness: Math.min(ww, hh), color: borderColor, rounding: 0 });
    };
    if (b.top) side(x0, y0, w, b.top);
    if (b.bottom) side(x0, y0 + h - b.bottom, w, b.bottom);
    if (b.left) side(x0, y0, b.left, h);
    if (b.right) side(x0 + w - b.right, y0, b.right, h);
  }

  // Content box
  const pl = y.getComputedPadding(Edge.Left) + y.getComputedBorder(Edge.Left);
  const pt = y.getComputedPadding(Edge.Top) + y.getComputedBorder(Edge.Top);
  const pr = y.getComputedPadding(Edge.Right) + y.getComputedBorder(Edge.Right);
  const pb = y.getComputedPadding(Edge.Bottom) + y.getComputedBorder(Edge.Bottom);
  const cx = x0 + Math.round(pl);
  const cy = y0 + Math.round(pt);
  const cw = Math.max(0, w - Math.round(pl + pr));
  const ch = Math.max(0, h - Math.round(pt + pb));
  const align = node.inherited.textAlign;
  const alignOffset = (inner: number, outer: number) =>
    align === 'center' ? Math.round((outer - inner) / 2) : align === 'right' ? outer - inner : 0;

  if (node.text) emitText(node, cx, cy, cw, ch, ops);

  if (node.barcode) {
    const bc = node.barcode;
    const bx = cx + alignOffset(bc.width, cw);
    ops.push({ ...bc.op, x: bx + Math.round((bc.width - bc.symbolWidth) / 2), y: cy });
    if (bc.caption) {
      const tw = measureText(bc.caption.text, bc.caption.fontHeight);
      ops.push({
        kind: 'text',
        x: bx + Math.round((bc.width - tw) / 2),
        y: cy + bc.symbolHeight + bc.caption.gap,
        text: bc.caption.text,
        fontHeight: bc.caption.fontHeight,
        fontWidth: bc.caption.fontHeight,
        orientation: 'N',
        reverse: isDark(node.inherited.color) === false,
      });
    }
  }

  if (node.image && cw > 0 && ch > 0) {
    const mono = toMonochrome(node.image.img, cw, ch, {
      threshold: node.el.props.threshold,
      dither: node.el.props.dither,
      invert: node.el.props.invert,
    });
    ops.push({ kind: 'image', x: cx, y: cy, ...mono });
  }

  for (const child of node.children) emitNode(child, x0, y0, ctx, ops, boxes);
}

const ORIENTATION = { 0: 'N', 90: 'R', 180: 'I', 270: 'B' } as const;

function emitText(node: LNode, cx: number, cy: number, cw: number, ch: number, ops: DrawOp[]) {
  const t = node.text!;
  const rotated = t.rotate === 90 || t.rotate === 270;
  // Lay the text out unrotated in a local box, then rotate the line boxes into place.
  const localW = rotated ? ch : cw;
  const localH = rotated ? cw : ch;
  const lines = textLines(t, localW);
  const align = node.inherited.textAlign;
  const reverse = isDark(node.inherited.color) === false;
  const halfLeading = Math.round((t.lineHeight - t.fontHeight) / 2);

  lines.forEach((line, i) => {
    if (!line) return;
    const lw = Math.round(measureText(line, t.fontWidth));
    let lx = align === 'center' ? Math.round((localW - lw) / 2) : align === 'right' ? localW - lw : 0;
    lx = Math.max(lx, 0);
    const ly = i * t.lineHeight + halfLeading;
    const lh = t.fontHeight;
    // Rotate the line rectangle (lx, ly, lw, lh) within the local box.
    let rx = lx;
    let ry = ly;
    switch (t.rotate) {
      case 90:
        rx = localH - (ly + lh);
        ry = lx;
        break;
      case 180:
        rx = localW - (lx + lw);
        ry = localH - (ly + lh);
        break;
      case 270:
        rx = ly;
        ry = localW - (lx + lw);
        break;
    }
    ops.push({
      kind: 'text',
      x: cx + rx,
      y: cy + ry,
      text: line,
      fontHeight: t.fontHeight,
      fontWidth: t.fontWidth,
      orientation: ORIENTATION[t.rotate],
      reverse,
    });
  });
}

export async function layout(tree: TreeNode[], opts: LayoutOptions = {}): Promise<LayoutResult> {
  const yoga = await getYoga();
  const label = findLabel(tree);
  const dpi = opts.dpi ?? label.props.dpi ?? 203;
  const dpmm = dpmmFor(dpi);
  const ctx = new Ctx(yoga, dpmm);
  // Round down so the label never exceeds the media (4in at 203dpi is 812 dots).
  const width = Math.floor(ctx.dots(opts.width ?? label.props.width) + 0.01);
  const height = Math.floor(ctx.dots(opts.height ?? label.props.height) + 0.01);
  if (!(width > 0 && height > 0)) throw new Error('react-zpl: <Label> needs a width and height.');

  // Lay the label out inside the printable area so nothing lands in the margins.
  const [mt, mr, mb, ml] = edges(opts.printMargin ?? label.props.printMargin).map((v) =>
    Math.max(0, Math.round(ctx.dots(v, 0))),
  );
  const margin = { top: mt ?? 0, right: mr ?? 0, bottom: mb ?? 0, left: ml ?? 0 };
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;
  if (innerW <= 0 || innerH <= 0) throw new Error('react-zpl: printMargin leaves no printable area.');

  const root = build(
    { ...label, props: { ...label.props, style: { ...label.props.style, width: `${innerW}dots`, height: `${innerH}dots` } } },
    ROOT_INHERITED,
    ctx,
  );
  root.yoga.calculateLayout(innerW, innerH, Direction.LTR);
  const ops: DrawOp[] = [];
  const boxes: LayoutBox[] = [];
  try {
    emitNode(root, margin.left, margin.top, ctx, ops, boxes);
  } finally {
    root.yoga.freeRecursive();
  }

  for (const op of ops) {
    if (op.kind === 'barcode' && op.type === 'qrcode' && op.y < QR_TOP_OFFSET) {
      ctx.warn(`QR codes print ${QR_TOP_OFFSET} dots below their position, so one this close to the top edge prints lower than shown.`);
    }
  }
  // Check element boxes against the label and the printable area.
  const hasMargin = margin.top || margin.right || margin.bottom || margin.left;
  for (const b of boxes) {
    if (b.width <= 0 || b.height <= 0) continue;
    if (b.x < 0 || b.y < 0 || b.x + b.width > width || b.y + b.height > height) {
      ctx.warn('Some content is outside the label and will not print.');
      break;
    }
  }
  if (hasMargin) {
    for (const b of boxes) {
      if (b.width <= 0 || b.height <= 0) continue;
      if (b.x < margin.left || b.y < margin.top || b.x + b.width > width - margin.right || b.y + b.height > height - margin.bottom) {
        ctx.warn('Some content reaches into the unprintable margin and may be cut off.');
        break;
      }
    }
  }

  const p = label.props;
  return {
    setup: { width, height, dpmm, dpi, margin, quantity: p.quantity, darkness: p.darkness, speed: p.speed, inverted: p.inverted },
    ops,
    boxes,
    warnings: [...ctx.warnings],
  };
}
