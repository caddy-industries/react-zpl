import path from 'node:path';
import { defineConfig, type Options } from 'tsup';

const shared: Options = {
  format: ['esm'],
  target: 'es2022',
  external: ['react'],
};

/** Swaps the layout engine loader for its React Native version. */
const nativeYoga = {
  name: 'native-yoga',
  setup(build: { onResolve: (o: { filter: RegExp }, cb: (a: { importer: string }) => { path: string }) => void }) {
    build.onResolve({ filter: /^\.\/yoga$/ }, (args) => ({
      path: path.join(path.dirname(args.importer), 'yoga.native.ts'),
    }));
  },
};

export default defineConfig([
  // Node, browsers and edge runtimes: WebAssembly Yoga with a JavaScript fallback.
  { ...shared, entry: { index: 'src/index.ts' }, dts: true },
  // React Native (Metro picks it via the "react-native" condition): JavaScript Yoga only.
  { ...shared, entry: { 'index.native': 'src/index.ts' }, splitting: false, esbuildPlugins: [nativeYoga] },
]);
