// Dev-only helper: renders ZPL from stdin with Labelary and writes a PNG.
// Usage: node scripts/labelary.mjs out.png [dpmm] [WxH inches] < label.zpl
import { writeFileSync, readFileSync } from 'node:fs';
const [out, dpmm = '8', size = '4x6'] = process.argv.slice(2);
const zpl = readFileSync(0, 'utf8');
const res = await fetch(`http://api.labelary.com/v1/printers/${dpmm}dpmm/labels/${size}/0/`, {
  method: 'POST',
  body: zpl,
  headers: { Accept: 'image/png', 'Content-Type': 'application/x-www-form-urlencoded' },
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
writeFileSync(out, Buffer.from(await res.arrayBuffer()));
const warn = res.headers.get('x-warnings');
if (warn) console.error('Labelary warnings:', warn);
