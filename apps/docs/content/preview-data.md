---
title: Preview data
description: Give labels sample data for the viewer, with named variants for edge cases.
---

## PreviewProps

The viewer renders each label with its `PreviewProps`:

```tsx
export default function ShippingLabel(props: Props) { /* … */ }

ShippingLabel.PreviewProps = {
  to: { name: 'Jordan Rivera', city: 'San Francisco' },
  tracking: '1Z999AA10123456784',
} satisfies Props;
```

## PreviewVariants

Labels break on real data: long names, missing fields, odd values. `PreviewVariants` names more examples. Each one is merged over `PreviewProps`, so it lists only what changes:

```tsx
ShippingLabel.PreviewVariants = {
  'Long address': { to: { name: 'Maximilian Alexander Featherstonehaugh' } },
  'No company': { to: { company: undefined } },
  Overnight: { service: 'Overnight' },
} satisfies Record<string, Partial<Props>>;
```

Pick a variant from the **Data** menu in the viewer. Setting a value to `undefined` removes it.

## Editing in the viewer

The **Props** tab shows the data the label is rendering with as JSON. Edit it and the label redraws as you type. Edits are kept in your browser until you press **Reset**. Values JSON can't hold, such as image bytes, show as `[binary 1234 bytes]` and are kept as they are.
