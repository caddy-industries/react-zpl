import type { DrawOp, LabelSetup } from '../ops';
import { compressGraphic } from './compress';
import { QR_TOP_OFFSET } from './quirks';

/** Escapes field data. Uses ^FH only when the data contains special characters. */
export function fieldData(data: string): string {
  if (!/[\^~\x00-\x1f]/.test(data)) return `^FD${data}`;
  const escaped = data.replace(/[\^~_\x00-\x1f]/g, (c) => `_${c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()}`);
  return `^FH_^FD${escaped}`;
}

function op(o: DrawOp): string {
  // QR codes print below their field origin, so move the origin up to compensate.
  const y = o.kind === 'barcode' && o.type === 'qrcode' ? Math.max(0, o.y - QR_TOP_OFFSET) : o.y;
  const fo = `^FO${o.x},${y}`;
  switch (o.kind) {
    case 'rect':
      return `${fo}^GB${o.w},${o.h},${o.thickness},${o.color},${o.rounding}^FS`;
    case 'text':
      return `${fo}^A0${o.orientation},${o.fontHeight},${o.fontWidth}${o.reverse ? '^FR' : ''}${fieldData(o.text)}^FS`;
    case 'image': {
      const total = o.bytesPerRow * o.height;
      return `${fo}^GFA,${total},${total},${o.bytesPerRow},${compressGraphic(o.data, o.bytesPerRow, o.height)}^FS`;
    }
    case 'barcode':
      switch (o.type) {
        case 'code128':
          return `${fo}^BY${o.moduleWidth}^BCN,${o.height},N,N,N,A${fieldData(o.data)}^FS`;
        case 'code39':
          return `${fo}^BY${o.moduleWidth},${o.ratio.toFixed(1)}^B3N,N,${o.height},N,N${fieldData(o.data)}^FS`;
        case 'ean13':
          return `${fo}^BY${o.moduleWidth}^BEN,${o.height},N,N${fieldData(o.data)}^FS`;
        case 'upca':
          return `${fo}^BY${o.moduleWidth}^BUN,${o.height},N,N,N${fieldData(o.data)}^FS`;
        case 'qrcode':
          return `${fo}^BQN,2,${o.moduleWidth}${fieldData(`${o.errorCorrection ?? 'M'}A,${o.data}`)}^FS`;
        case 'datamatrix':
          return `${fo}^BXN,${o.moduleWidth},200${fieldData(o.data)}^FS`;
        case 'pdf417':
          return `${fo}^BY${o.moduleWidth}^B7N,${o.height},${o.errorCorrection ?? 2},${o.columns ?? 4}${fieldData(o.data)}^FS`;
      }
  }
}

export function emitZpl(setup: LabelSetup, ops: DrawOp[]): string {
  const lines = ['^XA', '^CI28', `^PW${setup.width}`, `^LL${setup.height}`, '^LH0,0'];
  lines.push(setup.inverted ? '^POI' : '^PON');
  if (setup.darkness !== undefined) lines.push(`^MD${Math.max(-30, Math.min(30, Math.round(setup.darkness)))}`);
  if (setup.speed !== undefined) lines.push(`^PR${Math.round(setup.speed)}`);
  for (const o of ops) lines.push(op(o));
  if (setup.quantity !== undefined && setup.quantity > 1) lines.push(`^PQ${Math.round(setup.quantity)}`);
  lines.push('^XZ');
  return `${lines.join('\n')}\n`;
}
