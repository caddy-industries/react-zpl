---
title: Layout and styling
description: Flexbox layout with Tailwind classes or a style prop.
---

## How layout works

Layout runs on [Yoga](https://yogalayout.dev), the flexbox engine behind React Native, set up to behave like CSS on the web:

- Elements stack vertically by default.
- The `flex` class makes a row.
- Long text shrinks and wraps to fit its box.
- `absolute` positions an element relative to its parent.

{{example layout/01-columns}}

## Tailwind classes

Every component takes `className`. react-zpl reads the classes itself, with no Tailwind build step. The supported classes are:

| Group | Classes |
| --- | --- |
| Layout | `flex`, `flex-row`, `flex-col`, `flex-wrap`, `flex-1`, `grow`, `shrink-0`, `basis-*`, `items-*`, `justify-*`, `self-*`, `gap-*`, `hidden`, `aspect-square` |
| Spacing and size | `p-*`, `m-*` (negative and `auto` too), `w-*`, `h-*`, `size-*`, `min-w-*`, `max-h-*`, fractions like `w-1/2`, `full` |
| Position | `absolute`, `relative`, `inset-*`, `top-*`, `right-*`, `bottom-*`, `left-*` |
| Borders | `border`, `border-{0,2,4,8}`, `border-{t,r,b,l,x,y}-*`, `rounded-*` |
| Colour | `bg-black`, `bg-white`, `text-black`, `text-white` |
| Text | `text-xs` to `text-9xl`, `text-left`, `text-center`, `text-right`, `leading-*`, `uppercase`, `truncate`, `line-clamp-*`, `whitespace-nowrap`, `rotate-{90,180,270}`, `font-condensed`, `font-expanded` |
| Arbitrary values | `w-[2in]`, `p-[3mm]`, `text-[20px]`, `rounded-[6px]` |

Classes react-zpl doesn't support are skipped and listed in the render warnings and the viewer's Checks tab.

## The style prop

`style` takes the same properties as CSS, in camelCase. It wins over `className`.

```tsx
<Box style={{ flexDirection: 'row', gap: 8, padding: '2mm', borderWidth: 2 }}>
  <Text style={{ fontSize: 24, textTransform: 'uppercase' }}>Fragile</Text>
</Box>
```

## Colour

Thermal labels are black and white. `bg-black` fills a box, and `text-white` on top of it prints white text. Other colours are mapped to whichever of black or white is closer.

{{example text/03-reversed}}
