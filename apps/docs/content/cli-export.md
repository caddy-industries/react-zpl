---
title: react-zpl export
description: Write every label to a .zpl file.
---

## Usage

```sh
npx react-zpl export [--dir labels] [--out out] [--dpi 203] [--margin 1mm] [--svg] [--template]
```

| Option | Default | Description |
| --- | --- | --- |
| `--dir` | `labels` | Folder with your label files |
| `--out` | `out` | Where to write the files. Subfolders are kept |
| `--dpi` | label's own | Printer resolution for every label |
| `--margin` | none | Printer margin for every label |
| `--svg` | off | Also write an `.svg` preview of each label |
| `--template` | off | Write ZPL with `{{field}}` placeholders. See [Templates](#templates) |

Each label renders with its `PreviewProps`. Warnings are printed under the label they belong to, and the command exits with code 1 if any label fails to render, so you can run it in CI.

```
  ✓ product-tag
  ✓ shipping-label
  ✓ warehouse/inventory-bin

Exported 3 of 3 labels to out
```
