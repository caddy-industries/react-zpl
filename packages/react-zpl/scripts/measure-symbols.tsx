// Dev-only: compares predicted barcode bounds with Labelary output.
import type React from 'react';
import { PNG } from 'pngjs';
import { Barcode, Label, QRCode, renderLabel, Text, Box } from '../src';

async function labelary(zpl: string, dpmm = 8) {
  const res = await fetch(`http://api.labelary.com/v1/printers/${dpmm}dpmm/labels/4x6/0/`, {
    method: 'POST', body: zpl, headers: { Accept: 'image/png', 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (!res.ok) throw new Error(await res.text());
  return PNG.sync.read(Buffer.from(await res.arrayBuffer()));
}
function bbox(png: PNG) {
  let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) if (png.data[(y * png.width + x) * 4] < 128) {
    x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x + 1); y1 = Math.max(y1, y + 1);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}
const cases: [string, React.ReactElement][] = [
  ['code128', <Barcode value="ABC-12345" showText={false} />],
  ['code128 num', <Barcode value="1234567890" showText={false} />],
  ['code39', <Barcode type="code39" value="ABC-123" showText={false} />],
  ['ean13', <Barcode type="ean13" value="400638133393" showText={false} />],
  ['upca', <Barcode type="upca" value="03600029145" showText={false} />],
  ['qr', <QRCode value="https://example.com" />],
  ['qr H mag6', <QRCode value="HELLO 123" errorCorrection="H" moduleSize="6dots" />],
  ['datamatrix', <Barcode type="datamatrix" value="ABC123456" />],
  ['pdf417', <Barcode type="pdf417" value="HELLO WORLD 1234" />],
  ['rot90', <Text rotate={90} className="text-xl self-start">Rotated</Text>],
  ['rot180', <Text rotate={180} className="text-xl self-start">Rotated</Text>],
  ['rot270', <Text rotate={270} className="text-xl self-start">Rotated</Text>],
  ['rounded', <Box className="border-4 rounded-2xl w-40 h-20" />],
];
for (const [name, el] of cases) {
  const r = await renderLabel(<Label width="4in" height="6in"><Box style={{ padding: '100dots' }} className="items-start">{el}</Box></Label>);
  const png = await labelary(r.zpl);
  const b = bbox(png);
  const box = r.boxes[r.boxes.length - 1];
  console.log(name.padEnd(12), 'pred', box.x, box.y, box.width, box.height, ' actual', b.x, b.y, b.w, b.h, '  ', r.zpl.split('\n').filter(l => l.startsWith('^FO')).join(' '));
  await new Promise((res) => setTimeout(res, 300));
}
