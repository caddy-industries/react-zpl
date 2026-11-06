// React Native build of ./yoga.ts. Hermes has no WebAssembly, so this only
// includes the plain JavaScript build of Yoga and never imports the WASM one.
import type { Yoga } from 'yoga-layout/load';
import type { LayoutEngine } from './yoga';
import { loadYogaJs } from './yoga-js/index';

export type { LayoutEngine };

let instance: Promise<Yoga> | undefined;

export function setLayoutEngine(next: LayoutEngine): void {
  if (next === 'wasm') throw new Error('react-zpl: the WebAssembly layout engine is not available in React Native.');
}

export function getYoga(): Promise<Yoga> {
  instance ??= loadYogaJs();
  return instance;
}
