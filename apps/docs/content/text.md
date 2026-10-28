---
title: Text
description: Text in the printer's built-in font 0, at any size.
---

{{example text/01-sizes}}

## Usage

```tsx
<Text className="text-2xl uppercase">Ship to</Text>
<Text className="text-sm" maxLines={2}>{description}</Text>
<Text rotate={90}>Side A</Text>
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `maxLines` | `number` | none | Cut the text off after this many lines |
| `ellipsis` | `boolean` | `true` | Add `…` when text is cut off |
| `rotate` | `0 \| 90 \| 180 \| 270` | `0` | Rotate clockwise |
| `className` | `string` | | Tailwind classes |
| `style` | `Style` | | Inline styles |

## Font

Text uses font 0, the scalable font built into every ZPL printer, so nothing is downloaded to the printer. It's always bold. `font-condensed` and `font-expanded` change the width of the letters.

react-zpl measures each character with widths taken from printer output and breaks lines itself. Each line is its own field in the ZPL, so line breaks match the preview exactly.

## Wrapping

{{example text/04-wrapping}}

## White on black

{{example text/03-reversed}}

See [all Text examples](#components-text).
