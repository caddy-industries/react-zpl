---
title: render()
description: Turn a React element into a ZPL string.
---

## render

```ts
import { render } from '@caddy-industries/react-zpl';

const zpl: string = await render(<ShippingLabel {...order} />, { dpi: 300 });
```

## renderLabel

Like `render`, but also returns the layout and any warnings:

```ts
const { zpl, setup, boxes, warnings } = await renderLabel(<ShippingLabel {...order} />);

if (warnings.length) console.warn(warnings);
```

| Field | Description |
| --- | --- |
| `zpl` | The ZPL string |
| `setup` | Width and height in dots, dpi and margin |
| `boxes` | Position and size of every element, in dots |
| `warnings` | Anything that may not print as written |

## Options

| Option | Type | Description |
| --- | --- | --- |
| `dpi` | `number` | Printer resolution. Overrides `<Label dpi>` |
| `printMargin` | `Length` | Unprintable edge. Overrides `<Label printMargin>` |
| `width` | `Length` | Stock width. Overrides `<Label width>` |
| `height` | `Length` | Stock height. Overrides `<Label height>` |

`width` and `height` let one component print on several stock sizes. Every example in the [component catalog](#components) is shown at several sizes this way:

```ts
await render(<BinLocation />, { width: '4in', height: '3in' });
```

## Warnings

You get a warning when content falls outside the label or into the printer margin, when a QR code is too close to the top edge, or when a class isn't supported.
