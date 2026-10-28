---
title: react-zpl
description: Build thermal printer labels with React and Tailwind classes, and print them as ZPL.
---

## Why

ZPL is the language Zebra printers, and most other thermal label printers, understand. Writing it by hand means placing every field at exact dot positions, reprinting to check the fit, and starting over for a new label size or printer resolution.

react-zpl brings the way you build web pages to labels. You lay a label out with flexbox and Tailwind classes, pass data in as props, preview it locally, and render it to a ZPL string your printer prints directly.

{{example shipping/01-parcel}}

## Getting started

:::cards
- [Quick start](#quick-start) Create a labels folder and preview it with live reload.
- [Manual setup](#manual-setup) Add react-zpl to an existing Node app or API.
:::

## Components

:::cards
- [Label](#label) Size, resolution, print margin and printer settings.
- [Box](#box) Flexbox layout, borders and black fill.
- [Text](#text) The printer's font 0 at any size.
- [Barcode](#barcode) Code 128, Code 39, EAN-13, UPC-A, Data Matrix, PDF417.
- [QR code](#qr-code) QR codes with chosen error correction.
- [Image](#image) PNG logos converted to 1-bit graphics.
:::

Browse [44 copy-paste examples](#components) at common stock sizes.

## Integrations

`render()` returns a plain ZPL string, so it works anywhere you can send bytes to a printer.

:::cards
- [Network printer](#network-printer) Send ZPL over TCP port 9100.
- [HTTP API](#http-api) Return labels from an Express or Next.js route.
- [Browser printing](#browser-print) Print from a web app through a local print service.
:::

## Support

react-zpl writes standard ZPL II and works at 152, 203, 300 and 600 dpi. See [supported printers](#printers).
