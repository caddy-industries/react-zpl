---
title: Templates
description: Export ZPL with {{field}} placeholders to fill in from another system.
---

## Template mode

Some systems fill ZPL templates themselves, for example a WMS that swaps in an order number before printing. Template mode renders a label with every string prop replaced by a `{{path}}` placeholder:

```zpl
^FO40,412^A0N,34,30^FD{{to.name}}^FS
^FO40,452^A0N,28,25^FD{{to.city}}, {{to.state}} {{to.zip}}^FS
```

Paths follow the props: `{{to.name}}`, `{{items.0.sku}}`.

Turn on **Template** in the viewer, or export every label as a template:

```sh
npx react-zpl export --template
```

## Fields that keep their sample value

Some fields can't hold a placeholder. An EAN-13 barcode only encodes digits, for example. Those fields keep their sample value, and the viewer and the export tell you which ones.

## Layout caveat

The layout is worked out for the placeholder text, not the values filled in later. A placeholder is usually wider or narrower than the real value, so check long values with real data in normal mode. Text casing classes such as `uppercase` leave placeholders as written, and placeholders are never split across lines.
