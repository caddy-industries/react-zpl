---
title: Printer margins
description: Keep content inside the area your printer can reach.
---

## Why margins matter

Most printers can't print right up to the edge of the label. Set the unprintable margin, and react-zpl lays the whole label out inside the printable area.

{{example label/04-print-margin}}

## Setting the margin

```tsx
<Label width="4in" height="6in" printMargin="1.5mm">      {/* all sides */}
<Label width="4in" height="6in" printMargin="1mm 2mm">    {/* top/bottom, left/right */}
```

The values follow CSS order: top, right, bottom, left.

The margin usually depends on the printer, not the label, so you can also set it when rendering. This overrides the label's own value:

```ts
await render(<MyLabel />, { printMargin: '1.5mm' });
```

```sh
npx react-zpl dev --margin 1.5mm
```

## What changes in the ZPL

`^PW` and `^LL` still describe the full label, so the printer feeds the right length. Only the content moves inward. Anything that still reaches into the margin, such as an element with a negative absolute position, shows up as a warning.
