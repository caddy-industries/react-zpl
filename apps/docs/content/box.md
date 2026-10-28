---
title: Box
description: A layout container, like a div. Flexbox, borders, rounded corners and black fill.
---

{{example layout/02-space-between}}

## Usage

```tsx
<Box className="flex justify-between items-center border-2 rounded p-2">
  <Text>Order 20431</Text>
  <Text>1 of 3</Text>
</Box>
```

## Props

| Prop | Type | Description |
| --- | --- | --- |
| `className` | `string` | Tailwind classes. See [Layout and styling](#layout) |
| `style` | `Style` | Inline styles |
| `children` | `ReactNode` | Content |

## Borders and fill

`border`, `border-2`, `border-4` and `border-8` draw a frame with `^GB`. `rounded-*` rounds the corners, and `bg-black` fills the box. Text inside a black box prints white with `text-white`.

ZPL's corner rounding uses a 0–8 scale relative to the box's shorter side, so a small radius on a large box may round down to a square corner.

{{example lines/03-borders}}

## Absolute positioning

{{example layout/04-absolute}}

See [all Box examples](#components-layout).
