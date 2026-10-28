---
title: react-zpl dev
description: A local viewer for your labels, with live reload.
---

## Usage

```sh
npx react-zpl dev [--dir labels] [--port 3000] [--host localhost] [--margin 1.5mm]
```

| Option | Default | Description |
| --- | --- | --- |
| `--dir` | `labels` | Folder with your label files. Subfolders show as a tree |
| `--port` | `3000` | Port for the viewer |
| `--host` | `localhost` | Host to listen on |
| `--margin` | none | Printer margin for every label. Overrides `printMargin` |

Files and folders whose names start with `_` or `.` are skipped, so you can keep shared components next to your labels.

## What the viewer shows

The preview doesn't redraw your React tree. It reads the generated ZPL the way a printer would and draws that, so what you see is what the printer receives. It works offline.

| Feature | What it does |
| --- | --- |
| Data | Switch between `PreviewProps` and each of the [`PreviewVariants`](#preview-data) |
| Template | Show `{{field}}` placeholders in place of text. See [Templates](#templates) |
| Resolution | Preview at the label's dpi, or at 203, 300 or 600 |
| Zoom | Fit, physical size (1×) or 2× |
| Margin | Try a printer margin. The unprintable edge is shaded |
| Boxes | Outline every element's layout box |
| React tab | The label's source code |
| Props tab | Edit the sample data as JSON |
| ZPL tab | The generated ZPL, to copy or download |
| Checks tab | Content off the label or in the margin, unsupported classes, other warnings |
| Print | Send the ZPL to a network printer on port 9100 |

Use the up and down arrow keys to move between labels.
