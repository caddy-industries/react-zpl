---
title: Image
description: PNG images converted to black and white for the printer.
---

{{example images/02-logo-and-name}}

## Usage

```tsx
import { readFileSync } from 'node:fs';

const logo = readFileSync(new URL('./logo.png', import.meta.url));

<Image src={logo} className="w-14" />
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `src` | `Uint8Array \| ArrayBuffer \| string` | required | PNG bytes or a `data:` URL |
| `threshold` | `number` | `128` | Pixels darker than this (0–255) print black |
| `dither` | `boolean` | `false` | Floyd–Steinberg dithering, for photos and gradients |
| `invert` | `boolean` | `false` | Swap black and white |

## How images print

The PNG is resized to the printer's dots, turned into 1-bit black and white, and sent as a compressed `^GFA` graphic inside the ZPL. Give the image a width or height; the other side keeps the aspect ratio.

Simple, high-contrast logos print best. Use `dither` for photos.

{{example images/04-inverted}}

See [all Image examples](#components-images).
