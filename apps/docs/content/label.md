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
| `className` | `string` | | Tailwind classes |
| `style` | `Style` | | Inline styles, which win over `className` |

`dpi`, `printMargin`, `width` and `height` can all be overridden by [render options](#render), so one component can print on different printers and stock.

## Examples

{{example label/03-metric}}

See [all Label examples](#components-label).
