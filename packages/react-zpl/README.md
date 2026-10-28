# react-zpl

Build labels for Zebra printers with React. Lay them out with flexbox, style
them with Tailwind classes or a `style` prop, and get ZPL out.

```tsx
import { Barcode, Box, Label, Text, render } from '@caddy-industries/react-zpl';

function ShippingLabel({ name, tracking }: { name: string; tracking: string }) {
  return (
    <Label width="4in" height="6in" className="p-4 gap-3">
      <Text className="text-xs uppercase">Ship to</Text>
      <Text className="text-3xl">{name}</Text>
      <Box className="bg-black px-3 py-2">
        <Text className="text-white text-2xl">PRIORITY</Text>
      </Box>
      <Barcode value={tracking} height="1in" />
    </Label>
  );
}

const zpl = await render(<ShippingLabel name="Jordan Rivera" tracking="1Z999AA10123456784" />);
// ^XA ^CI28 ^PW812 ^LL1218 ... ^XZ
```

## Install

```sh
npm install @caddy-industries/react-zpl react
npm install -D @caddy-industries/react-zpl-cli   # live preview and export
```

Needs Node 20 or newer. The package is ESM only.

## Preview while you design

Put label components in a `labels/` folder (subfolders are fine). Each file
default-exports a component. `PreviewProps` gives it sample data, and
`PreviewVariants` names more examples, each merged over `PreviewProps`:

```tsx
// labels/shipping.tsx
export default function Shipping(props: Props) { /* ... */ }
Shipping.PreviewProps = { name: 'Jordan Rivera', tracking: '1Z999AA10123456784' };
Shipping.PreviewVariants = {
  'Long name': { name: 'Maximilian Alexander Featherstonehaugh' },
};
```

```sh
npx react-zpl dev                        # http://localhost:3000, reloads on save
npx react-zpl export --out out --svg     # writes out/<label>.zpl (+ .svg)
npx react-zpl export --template          # ZPL with {{field}} placeholders
```

The preview works offline. It doesn't redraw your React tree. It reads the
generated ZPL the same way a printer would and draws that, so what you see is
what the printer receives. The viewer has:

- **Data**: switch between `PreviewProps` and each of the `PreviewVariants`.
- **Props tab**: edit the sample data as JSON and the label redraws as you type.
  Edits are kept in your browser until you press Reset.
- **Template**: every string prop is drawn as `{{path}}` (`{{to.name}}`,
  `{{items.0.sku}}`), so you can see which parts are dynamic and download the
  ZPL as a template to fill in elsewhere. A field the label can't draw as a
  placeholder, such as an EAN barcode that only takes digits, keeps its sample
  value, and the viewer tells you which.
- **React / ZPL tabs**: the label's source and the generated ZPL, with copy and download.
- **Checks tab**: content outside the label or in the printer margin,
  unsupported Tailwind classes and other warnings.
- Printer resolution, zoom, printer margin and layout boxes, plus sending the
  ZPL straight to a network printer on port 9100.

## Components

| Component | What it does |
| --- | --- |
| `<Label width height dpi? printMargin? quantity? darkness? speed? inverted?>` | The root. Sets the label size and printer settings. |
| `<Box>` | A flex container, like a `div`. Supports borders, rounded corners and black/white fill. |
| `<Text maxLines? ellipsis? rotate?>` | Text in the printer's built-in font. Wraps to fit its box. |
| `<Barcode type value height? moduleWidth? showText? textSize?>` | `code128` (default), `code39`, `ean13`, `upca`, `datamatrix`, `pdf417`. |
| `<QRCode value moduleSize? size? errorCorrection?>` | A QR code. `size` picks the largest module size that fits. |
| `<Image src threshold? dither? invert?>` | A PNG (bytes or `data:` URL), converted to black and white. |
| `<Line vertical? thickness? length?>` | A horizontal or vertical rule. `Divider` is an alias. |

Everything accepts `className` and `style`. Your own components, hooks and
context work as usual.

The viewer has two tabs: **React** shows the label's source code, and **ZPL**
shows the output.

## Layout and styling

Layout uses [Yoga](https://yogalayout.dev), the flexbox engine behind React
Native, so it behaves like CSS: block elements stack vertically, the `flex`
class makes a row, and `absolute` positions an element relative to its
parent.

Supported Tailwind classes:

- **Layout:** `flex`, `flex-row/col(-reverse)`, `flex-wrap`, `flex-1/auto/none`, `grow`, `shrink-0`, `basis-*`, `items-*`, `justify-*`, `self-*`, `content-*`, `gap(-x/y)-*`, `hidden`, `aspect-square`
- **Spacing and size:** `p*-*`, `m*-*` (including negative values and `auto`), `w-*`, `h-*`, `size-*`, `min/max-w/h-*`, fractions such as `w-1/2`, and `full`
- **Position:** `absolute`, `relative`, `inset-*`, `top/right/bottom/left-*`
- **Borders:** `border`, `border-{0,2,4,8}`, `border-{t,r,b,l,x,y}-*`, `rounded-*`, `border-black/white`
- **Colour:** `bg-black`, `bg-white`, `text-black`, `text-white`
- **Text:** `text-xs` … `text-9xl`, `text-left/center/right`, `leading-*`, `uppercase`, `lowercase`, `capitalize`, `truncate`, `line-clamp-*`, `whitespace-nowrap`, `rotate-{90,180,270}`, `font-condensed`, `font-expanded`
- **Arbitrary values:** `w-[2in]`, `p-[3mm]`, `text-[20px]`, `rounded-[6px]`

Unsupported classes are skipped and reported in the render warnings.

### Units

A bare number is a CSS pixel (1/96 inch), just like on the web. Strings can
use `px`, `in`, `mm`, `cm`, `pt`, `%`, or `dots` for raw printer dots. Lengths
are converted to dots for the printer's resolution, so a label designed once
prints at the same physical size at 203, 300 or 600 dpi:

```ts
await render(<MyLabel />, { dpi: 300 });
```

### Printer margins

Most printers can't print right up to the edge of the label. Set the
unprintable margin and the layout stays inside the printable area:

```tsx
<Label width="4in" height="6in" printMargin="1.5mm">        {/* all sides */}
<Label width="4in" height="6in" printMargin="1mm 2mm">      {/* top/bottom, left/right */}
await render(<MyLabel />, { printMargin: '1.5mm' });       // per printer, overrides the label
```

`^PW`/`^LL` still describe the full label. Elements that reach into the
margin (for example with negative absolute positions) produce a warning. The
viewer shades the margin, and you can try different values in its Margin box,
or pass `--margin 1.5mm` to `react-zpl dev` and `react-zpl export`.

## API

```ts
render(element, { dpi?, printMargin?, width?, height? }): Promise<string>  // ZPL
renderLabel(element, { dpi?, printMargin?, width?, height? }): Promise<RenderResult>   // { zpl, setup, ops, boxes, warnings }
renderToSvg(zpl, { dpi?, scale?, overlay?, margin? }): string  // preview any ZPL
previewZpl(zpl, options): { svg, width, height, warnings }
```

`renderToSvg` also works on ZPL you didn't generate with react-zpl. It handles
`^FO`/`^FT`, `^A0`/`^CF`, `^FB`, `^GB`, `^GF` (ASCII hex), `^FR`, `^FH`,
`^BY` and the barcode commands above, and warns about anything else.

## How accurate is it?

- **Text** uses the printer's built-in scalable font (`^A0`). Each
  character's advance width was measured from printer output, and line
  breaking happens in react-zpl, not on the printer. So wrapping, alignment and
  sizes match. The preview draws glyphs with a similar condensed font, so the
  letter shapes differ slightly.
- **Barcodes** are encoded by [bwip-js](https://github.com/metafloor/bwip-js)
  for both layout and preview. Their sizes match the printer to the dot. QR
  codes keep the same size and position, but the module pattern can differ
  from the printer's.
- **Printer quirks** are handled for you: QR codes print 10 dots below their
  field origin, and EAN/UPC guard bars extend 13 dots below the other bars.
- `packages/react-zpl/scripts/compare-labelary.tsx` (run with `pnpm compare`)
  compares the preview pixel by pixel with
  [Labelary](https://labelary.com), a Zebra printer emulator. It needs network
  access and is never used at runtime.

## Limitations

- Only font 0 is used. Custom fonts aren't supported, and font weight classes
  do nothing (font 0 is always bold).
- Colours are black or white. Other hex colours are mapped to whichever is
  closer.
- Corner rounding follows ZPL's 0–8 scale, which is relative to the box's
  shorter side. Small radii on large boxes may round down to square corners.
- White text uses field reverse (`^FR`), so it shows white on black and
  black on white.
