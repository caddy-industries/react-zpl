---
title: Line
description: Horizontal and vertical rules. Also exported as Divider.
---

{{example lines/01-dividers}}

## Usage

```tsx
<Line />
<Line thickness={4} />
<Line vertical />
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `vertical` | `boolean` | `false` | Draw a vertical line |
| `thickness` | `Length` | `2px` | Line thickness |
| `length` | `Length` | fills the parent | Line length |

## Vertical rules

A vertical line stretches to the height of a row:

{{example lines/02-vertical}}
