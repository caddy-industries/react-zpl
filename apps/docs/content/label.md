---
title: Label
description: The root of every label. Sets its size, resolution and printer settings.
---

{{example label/01-four-by-six}}

## Usage

```tsx
import { Label, Text } from '@caddy-industries/react-zpl';

<Label width="4in" height="6in" className="p-4">
  <Text>Hello</Text>
</Label>
```

`Label` lays out like a `Box`: children stack vertically, and it takes the same classes.

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `width` | `Length` | required | Label width, e.g. `"4in"`, `"100mm"` |
| `height` | `Length` | required | Label height |
| `dpi` | `number` | `203` | Printer resolution: 152, 203, 300 or 600 |
| `printMargin` | `Length` | none | Unprintable edge, in CSS order (`"1mm 2mm"`) |
| `quantity` | `number` | `1` | Copies to print (`^PQ`) |
| `darkness` | `number` | none | Darkness adjustment from -30 to 30 (`^MD`) |
| `speed` | `number` | none | Print speed in inches per second (`^PR`) |
| `inverted` | `boolean` | `false` | Print upside down (`^POI`) |
| `rotate` | `0 \| 90 \| 180 \| 270` | `0` | Turn the whole label clockwise on the stock. `width`, `height` and `printMargin` stay as the label is read |
| `className` | `string` | | Tailwind classes |
| `style` | `Style` | | Inline styles, which win over `className` |

`dpi`, `printMargin`, `width` and `height` can all be overridden by [render options](#render), so one component can print on different printers and stock.

## Labels printed sideways

Stock that is fed narrow side first, such as 3 × 5 in on a 4 in printer, can still carry a landscape label. Lay it out as it is read and turn it with `rotate`:

```tsx
<Label width="5in" height="3in" rotate={90}>
  <Text className="text-6xl">A-01-03</Text>
  <Barcode value="bin_123" height="1in" />
</Label>
```

The ZPL is 3 in across the printhead (`^PW609 ^LL1015` at 203 dpi) and every field is turned to match (`^A0R`, `^BCR`). QR codes stay upright, because ZPL can't turn them; they still scan, and they keep their place.

## Examples

{{example label/03-metric}}

See [all Label examples](#components-label).
