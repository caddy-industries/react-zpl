---
'@caddy-industries/react-zpl': minor
---

Run without WebAssembly. Layout now falls back to a plain JavaScript build of Yoga when WebAssembly is missing or blocked, and React Native (Hermes) gets a build that only uses it. Add `setLayoutEngine('auto' | 'wasm' | 'js')` to choose the engine.

`<Image>` no longer needs Node built-ins: PNGs are decoded in plain JavaScript (replacing pngjs), so images work in React Native too.
