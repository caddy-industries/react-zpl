---
title: Accuracy and limits
description: How close the preview is to the printer, and what react-zpl can't do.
---

## How close is the preview?

| Element | Match |
| --- | --- |
| Positions, boxes and lines | Exact, to the dot |
| Barcode sizes | Exact. Barcodes are encoded while laying out |
| Text size, wrapping and alignment | Exact. Character widths were measured from printer output |
| Letter shapes | Close. The preview uses a similar condensed font |
| QR module pattern | Same size and position. The pattern itself can differ |

The preview was checked pixel by pixel against [Labelary](https://labelary.com), a ZPL printer emulator. The comparison script lives in `packages/react-zpl/scripts/compare-labelary.tsx`; it needs network access and is never used at runtime.

## Printer quirks handled for you

- QR codes print 10 dots below their field position.
- EAN and UPC guard bars extend 13 dots below the other bars.
- Font 0 draws `-`, `+` and `=` wider than most fonts.

## Limitations

- Only font 0. Custom fonts aren't supported, and font weight classes do nothing because font 0 is always bold.
- Black and white only. Other colours become whichever is closer.
- Corner rounding uses ZPL's 0–8 scale, so small radii on large boxes may become square corners.
- White text uses field reverse (`^FR`): it prints white over black and black over white.
