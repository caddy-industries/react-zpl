import type { Yoga } from 'yoga-layout/load';

/**
 * Which build of the Yoga layout engine to use.
 * - `auto`: WebAssembly when it is available, otherwise plain JavaScript.
 * - `wasm`: always WebAssembly.
 * - `js`: always plain JavaScript. Slower, but works where WebAssembly is
 *   missing or blocked, such as React Native or a strict Content Security Policy.
 */
export type LayoutEngine = 'auto' | 'wasm' | 'js';

let engine: LayoutEngine = 'auto';
let instance: Promise<Yoga> | undefined;

async function loadWasm(): Promise<Yoga> {
  const { loadYoga } = await import('yoga-layout/load');
  return loadYoga();
}

async function loadJs(): Promise<Yoga> {
  const { loadYogaJs } = await import('./yoga-js/index');
  return loadYogaJs();
}

async function load(): Promise<Yoga> {
  if (engine === 'js') return loadJs();
  if (engine === 'wasm') return loadWasm();
  if (typeof WebAssembly !== 'object') return loadJs();
  try {
    return await loadWasm();
  } catch {
    // WebAssembly exists but can't compile here, e.g. blocked by a CSP or the host.
    return loadJs();
  }
}

/** Chooses the layout engine build. Call it before the first render. */
export function setLayoutEngine(next: LayoutEngine): void {
  if (next === engine) return;
  engine = next;
  instance = undefined;
}

/** Loads the Yoga layout engine once and reuses it. */
export function getYoga(): Promise<Yoga> {
  instance ??= load();
  return instance;
}
