---
title: Printers
description: What react-zpl prints on.
---

react-zpl writes standard ZPL II. Any printer that understands ZPL II can print it, including Zebra desktop, industrial and mobile printers and the many printers from other brands that accept ZPL.

| Resolution | Dots per mm | Common in |
| --- | --- | --- |
| 152 dpi | 6 | Older mobile printers |
| 203 dpi | 8 | Desktop and shipping printers |
| 300 dpi | 12 | Small labels, dense barcodes |
| 600 dpi | 24 | Electronics and jewelry labels |

## Common stock sizes

| Size | Used for |
| --- | --- |
| 4 × 6 in | Parcel shipping labels |
| 4 × 8 in | Freight |
| 4 × 4 in, 4 × 3 in, 4 × 2 in | Cartons, bins, shelf labels |
| 3 × 2 in, 3 × 1 in | Products and barcodes |
| 2.25 × 1.25 in | Retail price tags |
| 2 × 1 in | Small barcodes and asset tags |

## Commands used

react-zpl only emits common commands: `^XA`, `^PW`, `^LL`, `^CI28`, `^FO`, `^A0`, `^FD`, `^FH`, `^FR`, `^GB`, `^GFA`, `^BY`, the barcode commands, and `^PQ`, `^MD`, `^PR` and `^PO` when you set them.
