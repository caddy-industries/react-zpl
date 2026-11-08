import { Resvg } from '@resvg/resvg-js';
import { PNG } from 'pngjs';
import { describe, expect, it } from 'vitest';
import { Barcode, Box, Image, Label, previewZpl, QRCode, renderLabel, Text } from '../src';
import { turnMargin, turnRect } from '../src/layout/rotate';

/** Black (1) / white (0) per dot of a preview, `width` × `height`. */
function raster(zpl: string, width: number, height: number) {
  const { svg } = previewZpl(zpl, { width, height });
  const png = PNG.sync.read(Buffer.from(new Resvg(svg, { shapeRendering: 0 }).render().asPng()));
  expect([png.width, png.height]).toEqual([width, height]);
  const out = new Uint8Array(width * height);
  for (let i = 0; i < out.length; i++) out[i] = png.data[i * 4] < 128 ? 1 : 0;
  return out;
}

/** `bits` (w × h) turned 90° clockwise: h × w. */
function turn90(bits: Uint8Array, w: number, h: number) {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) out[x * h + (h - 1 - y)] = bits[y * w + x];
  return out;
}

// A small asymmetric 1-bit PNG: 4 × 2, only the top-left 2 × 1 black.
function tinyPng() {
  const png = new PNG({ width: 4, height: 2 });
  png.data.fill(255);
  for (const i of [0, 1]) png.data.set([0, 0, 0, 255], i * 4);
  return new Uint8Array(PNG.sync.write(png));
}

// Everything but text and QR codes (text is anti-aliased differently once
// turned, and QR codes always print upright).
const shapes = (rotate: 0 | 90 | 180 | 270) => (
  <Label width="300dots" height="200dots" rotate={rotate}>
    <Box className="flex-row gap-2 h-full" style={{ padding: '10dots' }}>
      <Box style={{ width: '40dots', height: '90dots', backgroundColor: 'black' }} />
      <Box className="gap-2">
        <Barcode value="AB-123" height="50dots" moduleWidth="2dots" showText={false} />
        <Barcode type="datamatrix" value="AB-123" moduleWidth="3dots" />
        <Image src={tinyPng()} style={{ width: '40dots', height: '20dots' }} />
      </Box>
    </Box>
  </Label>
);

describe('rotate', () => {
  it('lays a turned label out as read and swaps the stock size', async () => {
    const r = await renderLabel(
      <Label width="5in" height="3in" rotate={90}>
        <Text>ZONE</Text>
        <Barcode value="bin_123" />
      </Label>,
    );
    expect(r.zpl).toContain('^PW609\n^LL1015\n');
    expect(r.zpl).toMatch(/\^A0R,/);
    expect(r.zpl).toMatch(/\^BCR,/);
    expect(r.setup).toMatchObject({ width: 609, height: 1015 });
    expect(r.warnings).toEqual([]);
  });

  it('prints the same picture turned', async () => {
    const upright = await renderLabel(shapes(0));
    const turned = await renderLabel(shapes(90));
    const a = raster(upright.zpl, 300, 200);
    const b = raster(turned.zpl, 200, 300);
    expect(a.some((v) => v)).toBe(true);
    expect(Buffer.from(b).equals(Buffer.from(turn90(a, 300, 200)))).toBe(true);
  });

  it('turns 270 and 180 the other way round', async () => {
    const r90 = raster((await renderLabel(shapes(90))).zpl, 200, 300);
    const r270 = raster((await renderLabel(shapes(270))).zpl, 200, 300);
    const r180 = raster((await renderLabel(shapes(180))).zpl, 300, 200);
    // 270 = 90 then 180 more; 180 = upright turned twice
    const upright = raster((await renderLabel(shapes(0))).zpl, 300, 200);
    const twice = turn90(turn90(upright, 300, 200), 200, 300);
    expect(Buffer.from(r180).equals(Buffer.from(twice))).toBe(true);
    const thrice = turn90(twice, 300, 200);
    expect(Buffer.from(r270).equals(Buffer.from(thrice))).toBe(true);
    expect(Buffer.from(r90).equals(Buffer.from(r270))).toBe(false);
  });

  it('keeps QR codes upright in their turned place', async () => {
    const r = await renderLabel(
      <Label width="400dots" height="200dots" rotate={90}>
        <QRCode value="hello" moduleSize="4dots" />
      </Label>,
    );
    expect(r.zpl).toMatch(/\^BQN,2,4/);
    // laid out at the top-left as read = the top-right of the stock
    const qr = r.ops.find((o) => o.kind === 'barcode')!;
    expect(qr.x).toBeGreaterThan(100);
    expect(qr.y).toBe(0);
  });

  it('turns boxes and margins with the label', () => {
    expect(turnRect({ x: 10, y: 20, w: 30, h: 40 }, 90, 300, 200)).toEqual({ x: 140, y: 10, w: 40, h: 30 });
    expect(turnRect({ x: 10, y: 20, w: 30, h: 40 }, 270, 300, 200)).toEqual({ x: 20, y: 260, w: 40, h: 30 });
    expect(turnMargin({ top: 1, right: 2, bottom: 3, left: 4 }, 90)).toEqual({ top: 4, right: 1, bottom: 2, left: 3 });
  });

  it('refuses other angles', async () => {
    await expect(
      renderLabel(
        // @ts-expect-error not a quarter turn
        <Label width="1in" height="1in" rotate={45}>
          <Text>x</Text>
        </Label>,
      ),
    ).rejects.toThrow(/rotate/);
  });
});
