import type { Yoga } from 'yoga-layout/load';
import wrapAssembly from './wrapAssembly.js';
import loadYogaAsm from './yoga-asmjs.js';

/**
 * Loads Yoga compiled to plain JavaScript instead of WebAssembly. Same
 * version and layout results as yoga-layout, for runtimes without
 * WebAssembly such as React Native's Hermes engine.
 */
export async function loadYogaJs(): Promise<Yoga> {
  return wrapAssembly(await loadYogaAsm());
}
