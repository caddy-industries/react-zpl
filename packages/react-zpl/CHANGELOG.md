# @caddy-industries/react-zpl

## 0.3.0

### Minor Changes

- 90395e0: `<Label rotate={90 | 180 | 270}>` turns the whole label on the stock: lay it out as it is read (e.g. 5 × 3 in) and it prints on stock fed the other way (3 × 5 in), with every text field, barcode, box and image turned (`^A0R`, `^BCR`, …; QR codes stay upright, as ZPL requires). Barcodes now take an orientation, and the SVG preview draws turned barcodes. Placement checked against Labelary.

  Layout now also warns when something drawn runs off the label (e.g. a barcode wider than the room flexbox gave it), not only when an element's box does.

### Patch Changes

- a215a5f: Work with React 19.2: use react-reconciler 0.33 (0.34 needs React 19.3) and declare `react ^19.2.0`. Tested with React 19.2.3 and 19.3.1.
- a8a5f11: Bundles with Metro (React Native): barcodes are encoded with bwip-js's platform-free build (`bwip-js/generic`), so its React Native entry, which imports `react-zlib-js`, is never pulled in. Checked by bundling an Expo app for Android (Hermes).

## 0.2.0

### Minor Changes

- 43657e6: Run without WebAssembly. Layout now falls back to a plain JavaScript build of Yoga when WebAssembly is missing or blocked, and React Native (Hermes) gets a build that only uses it. Add `setLayoutEngine('auto' | 'wasm' | 'js')` to choose the engine.

  `<Image>` no longer needs Node built-ins: PNGs are decoded in plain JavaScript (replacing pngjs), so images work in React Native too.
