import type { ReactNode } from 'react';
import { layout } from './layout';
import type { DrawOp, LabelSetup, LayoutBox } from './ops';
import { renderTree } from './reconciler';
import type { Length } from './units';
import { emitZpl } from './zpl/emit';

export interface RenderOptions {
  /** Printer resolution: 152, 203, 300 or 600. Overrides <Label dpi>. */
  dpi?: number;
  /** Unprintable area at the label edges, e.g. "1.5mm". Overrides <Label printMargin>. */
  printMargin?: Length;
  /** Label stock width, e.g. "4in". Overrides <Label width>. */
  width?: Length;
  /** Label stock height, e.g. "6in". Overrides <Label height>. */
  height?: Length;
}

export interface RenderResult {
  zpl: string;
  setup: LabelSetup;
  ops: DrawOp[];
  /** Position of every element, for debugging overlays. */
  boxes: LayoutBox[];
  /** Things that may not print as written, such as unsupported classes. */
  warnings: string[];
}

/** Renders a label and returns the ZPL plus layout details. */
export async function renderLabel(element: ReactNode, options: RenderOptions = {}): Promise<RenderResult> {
  const tree = renderTree(element);
  const result = await layout(tree, options);
  return { zpl: emitZpl(result.setup, result.ops), ...result };
}

/** Renders a label to a ZPL string. */
export async function render(element: ReactNode, options: RenderOptions = {}): Promise<string> {
  return (await renderLabel(element, options)).zpl;
}
