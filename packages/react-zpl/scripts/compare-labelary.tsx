/**
 * Dev-only calibration check (needs network): renders labels with our offline
 * preview and with the Labelary API, then reports how many pixels differ and
 * writes side-by-side images (ours | labelary | diff) to the output folder.
 *
 * Usage: npx tsx scripts/compare-labelary.tsx [outDir]
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import type { ReactElement } from 'react';
import { renderLabel, renderToSvg } from '../src';
import { fixtures } from '../test/fixtures';

const outDir = process.argv[2] ?? 'compare-out';
mkdirSync(outDir, { recursive: true });

async function labelary(zpl: string, dpmm: number, w: number, h: number) {
  const inches = `${(w / dpmm / 25.4).toFixed(3)}x${(h / dpmm / 25.4).toFixed(3)}`;
  const res = await fetch(`http://api.labelary.com/v1/printers/${dpmm}dpmm/labels/${inches}/0/`, {
    method: 'POST',
    body: zpl,
    headers: { Accept: 'image/png', 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  if (!res.ok) throw new Error(`Labelary: ${res.status} ${await res.text()}`);
  return PNG.sync.read(Buffer.from(await res.arrayBuffer()));
}

function black(png: PNG, x: number, y: number) {
  if (x >= png.width || y >= png.height) return false;
  return png.data[(y * png.width + x) * 4] < 128;
}

for (const [name, element] of Object.entries(fixtures) as [string, ReactElement][]) {
  const result = await renderLabel(element);
  const { width, height, dpmm } = result.setup;
  const ours = PNG.sync.read(
    new Resvg(renderToSvg(result.zpl), { font: { loadSystemFonts: true } }).render().asPng(),
  );
  const theirs = await labelary(result.zpl, dpmm, width, height);
  const out = new PNG({ width: width * 3, height });
  let diff = 0;
  let inkTheirs = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const a = black(ours, x, y);
      const b = black(theirs, x, y);
      if (b) inkTheirs++;
      if (a !== b) diff++;
      const put = (ox: number, r: number, g: number, bl: number) => {
        const i = (y * out.width + ox + x) * 4;
        out.data[i] = r;
        out.data[i + 1] = g;
        out.data[i + 2] = bl;
        out.data[i + 3] = 255;
      };
      put(0, a ? 0 : 255, a ? 0 : 255, a ? 0 : 255);
      put(width, b ? 0 : 255, b ? 0 : 255, b ? 0 : 255);
      if (a && b) put(width * 2, 0, 0, 0);
      else if (a) put(width * 2, 230, 60, 60);
      else if (b) put(width * 2, 40, 110, 230);
      else put(width * 2, 255, 255, 255);
    }
  }
  writeFileSync(join(outDir, `${name}.png`), PNG.sync.write(out));
  const pct = ((diff / Math.max(1, inkTheirs)) * 100).toFixed(1);
  console.log(`${name.padEnd(20)} ${String(diff).padStart(7)} px differ (${pct}% of printed ink)`);
  await new Promise((r) => setTimeout(r, 400));
}
