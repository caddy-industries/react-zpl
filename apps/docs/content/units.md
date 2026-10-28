---
title: Units and resolution
description: Design once and print at the same physical size at any resolution.
---

## Units

A bare number is a CSS pixel, 1/96 of an inch, the same as on the web. Strings can use any of these:

| Unit | Example | Notes |
| --- | --- | --- |
| `px` | `"12px"` | 1/96 in |
| `in` | `"4in"` | |
| `mm`, `cm` | `"100mm"` | |
| `pt` | `"10pt"` | 1/72 in |
| `%` | `"50%"` | Of the parent |
| `dots` | `"3dots"` | Raw printer dots, not scaled |

## Resolution

Printers print at a fixed number of dots per inch. react-zpl converts every length to dots for the target printer, so one design prints at the same physical size everywhere:

| dpi | dots per mm | 4 in is |
| --- | --- | --- |
| 152 | 6 | 608 dots |
| 203 | 8 | 812 dots |
| 300 | 12 | 1200 dots |
| 600 | 24 | 2400 dots |

Set it on the label, or per printer when you render:

```tsx
<Label width="4in" height="6in" dpi={300}>…</Label>

await render(<MyLabel />, { dpi: 600 });
```

## Barcode sizes

Barcode bars and QR modules must be whole dots. `moduleWidth` and `moduleSize` are rounded to the nearest dot, so use `"2dots"` or `"3dots"` when you need an exact bar width.
