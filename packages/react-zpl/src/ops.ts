import type { LinearType, MatrixType } from './barcode/encode';

/** A positioned drawing instruction. All numbers are whole printer dots. */
export type DrawOp = RectOp | TextOp | BarcodeOp | ImageOp;

/** ^GB: a box outline, or a filled box when thickness >= the shorter side. */
export interface RectOp {
  kind: 'rect';
  x: number;
  y: number;
  w: number;
  h: number;
  thickness: number;
  color: 'B' | 'W';
  /** Corner rounding 0-8. */
  rounding: number;
}

export interface TextOp {
  kind: 'text';
  x: number;
  y: number;
  text: string;
  fontHeight: number;
  fontWidth: number;
  orientation: 'N' | 'R' | 'I' | 'B';
  /** White text: printed with field reverse (^FR) over what is underneath. */
  reverse: boolean;
}

export interface BarcodeOp {
  kind: 'barcode';
  x: number;
  y: number;
  type: LinearType | MatrixType;
  /** Data as sent to the printer. */
  data: string;
  /** Narrow bar / module size in dots. */
  moduleWidth: number;
  /** Code 39 wide-to-narrow ratio. */
  ratio: number;
  /** Bar height (linear) or row height (PDF417). */
  height: number;
  errorCorrection?: string | number;
  columns?: number;
}

export interface ImageOp {
  kind: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  /** 1 bit per dot, rows padded to whole bytes, 1 = black. */
  bytesPerRow: number;
  data: Uint8Array;
}

export interface LabelSetup {
  width: number;
  height: number;
  dpmm: number;
  dpi: number;
  /** Unprintable area at each edge, in dots. */
  margin: { top: number; right: number; bottom: number; left: number };
  quantity?: number;
  darkness?: number;
  speed?: number;
  inverted?: boolean;
}

export interface LayoutBox {
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
}
