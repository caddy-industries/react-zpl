import { createElement, type ReactNode } from 'react';
import type { Style } from './style/types';
import type { Length } from './units';

export interface BaseProps {
  /** Tailwind classes, e.g. "flex items-center gap-2 p-4 border-2". */
  className?: string;
  /** Inline styles. These win over className. */
  style?: Style;
}

export interface LabelProps extends BaseProps {
  /** Label width, e.g. "4in", "100mm" or 384 (CSS px). */
  width: Length;
  /** Label height, e.g. "6in". */
  height: Length;
  /** Printer resolution. Render options can override this. Default 203. */
  dpi?: number;
  /**
   * Area at the label edges the printer can't reach, e.g. "1.5mm" or "1mm 2mm"
   * (CSS order: top right bottom left). Content is laid out inside it.
   * Render options can override this.
   */
  printMargin?: Length;
  /** Number of copies (^PQ). */
  quantity?: number;
  /** Print darkness adjustment from -30 to 30 (^MD). */
  darkness?: number;
  /** Print speed in inches per second (^PR). */
  speed?: number;
  /** Print the label upside down (^POI). */
  inverted?: boolean;
  children?: ReactNode;
}

export interface BoxProps extends BaseProps {
  children?: ReactNode;
}

export interface TextProps extends BaseProps {
  children?: ReactNode;
  /** Maximum number of lines. */
  maxLines?: number;
  /** Add "..." when text is cut off by maxLines. Default true. */
  ellipsis?: boolean;
  /** Rotate the text clockwise. */
  rotate?: 0 | 90 | 180 | 270;
}

export type BarcodeType = 'code128' | 'code39' | 'ean13' | 'upca' | 'datamatrix' | 'pdf417';

export interface BarcodeProps extends BaseProps {
  value: string;
  /** Symbology. Default "code128". */
  type?: BarcodeType;
  /** Bar height for linear codes, or row height for PDF417. Default 48px (linear) / 3 modules (PDF417). */
  height?: Length;
  /** Width of the narrowest bar (or module size for 2D codes). Rounded to whole dots. Default 0.25mm. */
  moduleWidth?: Length;
  /** Wide-to-narrow ratio for Code 39 (2 to 3). Default 3. */
  ratio?: number;
  /** Show the value under linear barcodes. Default true. */
  showText?: boolean;
  /** Font size of the value under the barcode. Default 14px. */
  textSize?: Length;
  /** PDF417 data columns. Default 4. */
  columns?: number;
  /** PDF417 error correction level 0-8. Default 2. */
  securityLevel?: number;
}

export interface QRCodeProps extends BaseProps {
  value: string;
  /** Size of one module, rounded to whole dots. Default 0.5mm. Ignored when `size` is set. */
  moduleSize?: Length;
  /** Target size; the largest whole-dot module size that fits is used. */
  size?: Length;
  /** Error correction level. Default "M". */
  errorCorrection?: 'L' | 'M' | 'Q' | 'H';
}

export interface ImageProps extends BaseProps {
  /** PNG data as bytes, or a data: URL. */
  src: Uint8Array | ArrayBuffer | string;
  /** Pixels darker than this (0-255) print black. Default 128. */
  threshold?: number;
  /** Use Floyd-Steinberg dithering for photos and gradients. */
  dither?: boolean;
  /** Swap black and white. */
  invert?: boolean;
}

export interface LineProps extends BaseProps {
  /** Draw a vertical line instead of a horizontal one. */
  vertical?: boolean;
  /** Line thickness. Default 2px. */
  thickness?: Length;
  /** Line length. By default it fills the parent. */
  length?: Length;
}

const h = createElement as (type: string, props: object, ...children: ReactNode[]) => any;

/** The root of every label. Defines its size and printer settings. */
export function Label({ children, ...props }: LabelProps) {
  return h('zpl-label', props, children);
}

/** A layout container, like a <div>. Supports flexbox, borders and black fill. */
export function Box({ children, ...props }: BoxProps) {
  return h('zpl-box', props, children);
}

/** Text in the printer's built-in font. */
export function Text({ children, ...props }: TextProps) {
  return h('zpl-text', props, children);
}

/** A linear or 2D barcode drawn natively by the printer. */
export function Barcode(props: BarcodeProps) {
  return h('zpl-barcode', { type: 'code128', ...props });
}

/** A QR code drawn natively by the printer. */
export function QRCode(props: QRCodeProps) {
  return h('zpl-barcode', { ...props, type: 'qrcode' });
}

/** A PNG image, converted to black and white. */
export function Image(props: ImageProps) {
  return h('zpl-image', props);
}

/** A horizontal or vertical rule. */
export function Line({ vertical, thickness = 2, length, className, style }: LineProps) {
  const base: Style = vertical
    ? { width: thickness, height: length, alignSelf: length === undefined ? 'stretch' : undefined, flexShrink: 0 }
    : { height: thickness, width: length, alignSelf: length === undefined ? 'stretch' : undefined, flexShrink: 0 };
  return h('zpl-box', { className, style, defaultStyle: { backgroundColor: 'black', ...base } });
}

export const Divider = Line;
