import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  clean: true,
  target: 'node20',
  banner: { js: '#!/usr/bin/env node' },
  external: ['vite', 'react', '@caddy-industries/react-zpl'],
  loader: { '.html': 'text' },
});
