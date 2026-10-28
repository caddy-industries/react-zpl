// Dev-only: measures ZPL font 0 advance widths using the Labelary API.
// Usage: node scripts/calibrate-font0.mjs > src/text/font0-widths.json
import { PNG } from 'pngjs';

const SIZE = 40;
const N = 15;
const ROW = 52;
const URL = 'http://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/';

async function renderZpl(zpl) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(URL, { method: 'POST', body: zpl, headers: { Accept: 'image/png', 'Content-Type': 'application/x-www-form-urlencoded' } });
    if (res.ok) return PNG.sync.read(Buffer.from(await res.arrayBuffer()));
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error('labelary failed');
}

const hex = (s) =>
  [...Buffer.from(s, 'utf8')].map((b) => '_' + b.toString(16).padStart(2, '0')).join('');

function rightmostInk(png, y0, y1) {
  for (let x = png.width - 1; x >= 0; x--) {
    for (let y = y0; y < y1; y++) {
      if (png.data[(y * png.width + x) * 4] < 128) return x;
    }
  }
  return -1;
}

const chars = [];
for (let c = 32; c < 127; c++) chars.push(String.fromCharCode(c));
for (const c of 'ÄÖÜäöüßéèêáàâíóúñçÉÁ°€£±×') chars.push(c);
const rows = ['', ...chars];
const perLabel = Math.floor(1200 / ROW);
const results = {};
let base = null;
for (let i = 0; i < rows.length; i += perLabel) {
  const batch = rows.slice(i, i + perLabel);
  let zpl = '^XA^CI28';
  batch.forEach((c, j) => {
    zpl += `^FO10,${j * ROW + 4}^A0N,${SIZE},${SIZE}^FH_^FD${hex('|' + c.repeat(N) + '|')}^FS`;
  });
  zpl += '^XZ';
  const png = await renderZpl(zpl);
  batch.forEach((c, j) => {
    const r = rightmostInk(png, j * ROW + 2, j * ROW + ROW - 2);
    if (c === '') base = r;
    else results[c] = r;
  });
  await new Promise((r) => setTimeout(r, 400));
}
const out = {};
for (const c of chars) out[c] = +((results[c] - base) / N / SIZE).toFixed(4);
console.log(JSON.stringify(out));
