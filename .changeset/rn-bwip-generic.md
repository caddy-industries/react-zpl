---
"@caddy-industries/react-zpl": patch
---

Bundles with Metro (React Native): barcodes are encoded with bwip-js's platform-free build (`bwip-js/generic`), so its React Native entry, which imports `react-zlib-js`, is never pulled in. Checked by bundling an Expo app for Android (Hermes).
