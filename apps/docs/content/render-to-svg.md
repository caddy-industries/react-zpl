---
title: renderToSvg()
description: Draw any ZPL as an SVG, offline.
---

## Usage

```ts
import { render, renderToSvg } from '@caddy-industries/react-zpl';

const zpl = await render(<ShippingLabel {...order} />);
const svg = renderToSvg(zpl, { dpi: 203 });
```

`renderToSvg` is a small ZPL interpreter. It works on ZPL you didn't make with react-zpl too, as long as it uses the commands below.

## Options

| Option | Type | Description |
| --- | --- | --- |
| `dpi` | `number` | Resolution the ZPL was written for. Default 203 |
| `width`, `height` | `number` | Label size in dots, if the ZPL has no `^PW`/`^LL` |
| `scale` | `number` | Scale the SVG |
| `overlay` | `boolean` | Outline every field |
| `margin` | `object` | Shade a printer margin |

## previewZpl

Returns the SVG with its size and a list of commands it couldn't draw:

```ts
const { svg, width, height, warnings } = previewZpl(zpl, { dpi: 203 });
```

## Supported commands

`^FO`, `^FT`, `^A0`, `^CF`, `^FB`, `^GB`, `^GF` (ASCII hex, compressed), `^FR`, `^FH`, `^BY`, `^BC`, `^B3`, `^BE`, `^BU`, `^BQ`, `^BX` and `^B7`. Anything else is skipped and reported in `warnings`.
