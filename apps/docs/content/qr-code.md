---
title: QR code
description: QR codes drawn by the printer, for links and serial numbers.
---

{{example codes-2d/01-qr}}

## Usage

```tsx
<QRCode value="https://parcelco.example/t/1Z999AA10123456784" moduleSize="4dots" />
<QRCode value="ASSET-000981" size="0.75in" errorCorrection="H" />
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `value` | `string` | required | The data to encode |
| `moduleSize` | `Length` | `0.5mm` | Size of one square, rounded to whole dots |
| `size` | `Length` | none | Target size. Uses the largest whole-dot module that fits |
| `errorCorrection` | `"L" \| "M" \| "Q" \| "H"` | `"M"` | Higher levels survive more damage but need more modules |

## Error correction

{{example codes-2d/02-error-correction}}

> Printers draw QR codes 10 dots below their field position. react-zpl corrects for this, so the code lands where the layout puts it.

See [all QR examples](#components-codes-2d).
