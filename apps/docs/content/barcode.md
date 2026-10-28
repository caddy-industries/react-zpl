---
title: Barcode
description: Linear and 2D barcodes drawn by the printer.
---

{{example barcodes/01-code128}}

## Usage

```tsx
<Barcode value="1Z999AA10123456784" height="0.8in" moduleWidth="2dots" />
<Barcode type="ean13" value="400638133393" />
<Barcode type="datamatrix" value="SN 8842-AX-0091" moduleWidth="5dots" />
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | required | The data to encode |
| `type` | `BarcodeType` | `"code128"` | `code128`, `code39`, `ean13`, `upca`, `datamatrix`, `pdf417` |
| `height` | `Length` | `48px` | Bar height. For PDF417, the row height |
| `moduleWidth` | `Length` | `0.25mm` | Narrowest bar, or the module size for 2D codes. Rounded to whole dots |
| `ratio` | `number` | `3` | Wide to narrow ratio for Code 39 (2 to 3) |
| `showText` | `boolean` | `true` | Print the value under linear barcodes |
| `textSize` | `Length` | `14px` | Size of the value under the bars |
| `columns` | `number` | `4` | PDF417 data columns |
| `securityLevel` | `number` | `2` | PDF417 error correction, 0 to 8 |

## Sizing

A barcode's width comes from its data: the number of modules times `moduleWidth`. react-zpl encodes the barcode while laying out the label, so the box it takes up matches what the printer draws, to the dot.

## Types

{{example barcodes/03-ean13}}

{{example codes-2d/04-pdf417}}

See [all Barcode examples](#components-barcodes).
