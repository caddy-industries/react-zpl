import { PNG } from 'pngjs';
import { createContext, useContext } from 'react';
import { describe, expect, it } from 'vitest';
import { Barcode, Box, Image, Label, previewZpl, QRCode, render, renderLabel, Text } from '../src';
import { compressGraphic, decompressGraphic } from '../src/zpl/compress';
import { fixtures } from './fixtures';

describe('render', () => {
  it('emits a label header and footer', async () => {
    const zpl = await render(
      <Label width="4in" height="6in" quantity={3}>
        <Text>Hi</Text>
      </Label>,
    );
    expect(zpl.startsWith('^XA\n^CI28\n^PW812\n^LL1218\n')).toBe(true);
    expect(zpl).toContain('^PQ3');
    expect(zpl.trimEnd().endsWith('^XZ')).toBe(true);
  });

  it('scales with dpi', async () => {
    const label = (
      <Label width="2in" height="1in">
        <Box className="border-2 h-full" />
      </Label>
    );
    expect(await render(label, { dpi: 203 })).toContain('^PW406');
    expect(await render(label, { dpi: 300 })).toContain('^PW600');
  });

  it('positions flex children', async () => {
    const r = await renderLabel(
      <Label width="400dots" height="200dots">
        <Box className="flex justify-between h-full" style={{ padding: '10dots' }}>
          <Box style={{ width: '50dots', height: '50dots', backgroundColor: 'black' }} />
          <Box style={{ width: '50dots', height: '50dots', backgroundColor: 'black' }} />
        </Box>
      </Label>,
    );
    const rects = r.ops.filter((o) => o.kind === 'rect');
    expect(rects.map((o) => [o.x, o.y])).toEqual([
      [10, 10],
      [340, 10],
    ]);
  });

  it('supports absolute positioning', async () => {
    const r = await renderLabel(
      <Label width="400dots" height="200dots">
        <Box style={{ position: 'absolute', right: '20dots', bottom: '20dots', width: '30dots', height: '30dots' }} className="bg-black" />
      </Label>,
    );
    expect(r.ops[0]).toMatchObject({ kind: 'rect', x: 350, y: 150, w: 30, h: 30 });
  });

  it('works with components, hooks and context', async () => {
    const Ctx = createContext('default');
    const Name = () => <Text>{useContext(Ctx)}</Text>;
    const zpl = await render(
      <Ctx.Provider value="from context">
        <Label width="2in" height="1in">
          <Name />
        </Label>
      </Ctx.Provider>,
    );
    expect(zpl).toContain('^FDfrom context^FS');
  });

  it('escapes special characters', async () => {
    const zpl = await render(
      <Label width="2in" height="1in">
        <Text>a^b~c_d</Text>
      </Label>,
    );
    expect(zpl).toContain('^FH_^FDa_5Eb_7Ec_5Fd^FS');
  });

  it('uses field reverse for white text', async () => {
    const zpl = await render(
      <Label width="2in" height="1in">
        <Text className="bg-black text-white">X</Text>
      </Label>,
    );
    expect(zpl).toMatch(/\^GB\d+,\d+,\d+,B,0\^FS\n\^FO\d+,\d+\^A0N,\d+,\d+\^FR\^FDX\^FS/);
  });

  it('compensates for the QR code offset', async () => {
    const r = await renderLabel(
      <Label width="2in" height="2in">
        <Box style={{ padding: '50dots' }}>
          <QRCode value="hi" />
        </Box>
      </Label>,
    );
    expect(r.zpl).toContain('^FO50,40^BQN,2,4^FDMA,hi^FS');
  });

  it('warns about unsupported classes and HTML elements', async () => {
    const r = await renderLabel(
      <Label width="2in" height="1in">
        <Box className="shadow-xl" />
      </Label>,
    );
    expect(r.warnings).toEqual(['Unsupported class "shadow-xl" was ignored.']);
    await expect(
      render(
        <Label width="2in" height="1in">
          <div />
        </Label>,
      ),
    ).rejects.toThrow(/<div> is not supported/);
  });

  it('rejects invalid barcodes with a clear error', async () => {
    await expect(
      render(
        <Label width="2in" height="1in">
          <Barcode type="ean13" value="123" />
        </Label>,
      ),
    ).rejects.toThrow(/ean13 needs 12 digits/);
  });

  it('converts PNG images', async () => {
    const png = new PNG({ width: 16, height: 8 });
    for (let i = 0; i < 16 * 8; i++) {
      const x = i % 16;
      png.data.set(x < 8 ? [0, 0, 0, 255] : [255, 255, 255, 255], i * 4);
    }
    const r = await renderLabel(
      <Label width="100dots" height="100dots">
        <Image src={PNG.sync.write(png)} style={{ width: '16dots' }} />
      </Label>,
    );
    const img = r.ops[0];
    expect(img).toMatchObject({ kind: 'image', width: 16, height: 8, bytesPerRow: 2 });
    expect(r.zpl).toContain('^GFA,16,16,2,');
  });

  for (const [name, element] of Object.entries(fixtures)) {
    it(`matches snapshot: ${name}`, async () => {
      expect(await render(element)).toMatchSnapshot();
    });
  }
});

describe('graphic compression', () => {
  it('round-trips', () => {
    const data = new Uint8Array(40);
    data.set([0xff, 0xff, 0xf0, 0, 0, 0xaa, 0xaa, 0xaa, 0xaa, 0xaa], 0);
    data.set(data.slice(0, 10), 10); // repeated row
    data.set([0x12, 0x34, 0x56, 0x78, 0x9a, 0xff, 0xff, 0xff, 0xff, 0xff], 30);
    const compressed = compressGraphic(data, 10, 4);
    expect(decompressGraphic(compressed, 10, 40)).toEqual(data);
  });
});

describe('preview', () => {
  it('draws every emitted element', async () => {
    const r = await renderLabel(fixtures.barcodes);
    const p = previewZpl(r.zpl);
    expect(p.warnings).toEqual([]);
    expect(p.width).toBe(812);
    expect(p.svg).toContain('<svg');
  });

  it('previews hand-written ZPL', () => {
    const p = previewZpl('^XA^PW400^LL200^CF0,30^FO20,20^FDHello^FS^FO20,60^GB100,50,3^FS^FT20,180^A0N,40^FDBase^FS^XZ');
    expect(p.svg).toContain('>Hello</text>');
    expect(p.svg).toContain('translate(20,150)');
    expect(p.warnings).toEqual([]);
  });

  it('reports unknown commands', () => {
    expect(previewZpl('^XA^ZZ1^XZ').warnings).toEqual(['^ZZ is not supported by the preview.']);
  });
});

describe('print margin', () => {
  const label = (props: object = {}) => (
    <Label width="400dots" height="200dots" {...props}>
      <Box className="bg-black h-full" />
    </Label>
  );

  it('lays content out inside the printable area', async () => {
    const r = await renderLabel(label({ printMargin: '10dots 20dots' }));
    expect(r.setup.margin).toEqual({ top: 10, right: 20, bottom: 10, left: 20 });
    expect(r.ops[0]).toMatchObject({ kind: 'rect', x: 20, y: 10, w: 360, h: 180 });
    expect(r.zpl).toContain('^PW400');
    expect(r.warnings).toEqual([]);
  });

  it('lets render options override the label', async () => {
    const r = await renderLabel(label({ printMargin: '10dots' }), { printMargin: '1mm' });
    expect(r.setup.margin.left).toBe(8);
  });

  it('warns when content reaches into the margin', async () => {
    const r = await renderLabel(
      <Label width="400dots" height="200dots" printMargin="10dots">
        <Box className="absolute bg-black" style={{ top: '-10dots', left: 0, width: '20dots', height: '20dots' }} />
      </Label>,
    );
    expect(r.warnings).toContain('Some content reaches into the unprintable margin and may be cut off.');
  });

  it('rejects margins that leave no space', async () => {
    await expect(renderLabel(label({ printMargin: '250dots' }))).rejects.toThrow(/no printable area/);
  });
});

describe('size override', () => {
  it('lays the same label out on other stock sizes', async () => {
    const { renderLabel } = await import('../src');
    const el = (
      <Label width="4in" height="6in">
        <Text>Hi</Text>
      </Label>
    );
    const result = await renderLabel(el, { width: '4in', height: '2in' });
    expect(result.setup.width).toBe(812);
    expect(result.setup.height).toBe(406);
    expect(result.zpl).toContain('^LL406');
  });
});
