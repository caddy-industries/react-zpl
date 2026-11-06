import { afterEach, describe, expect, it } from 'vitest';
import { render, setLayoutEngine } from '../src';
import { fixtures } from './fixtures';

afterEach(() => setLayoutEngine('auto'));

async function renderAll() {
  const out: Record<string, string> = {};
  for (const [name, element] of Object.entries(fixtures)) out[name] = await render(element);
  return out;
}

describe('layout engine', () => {
  it('gives the same output with the JavaScript and WebAssembly builds', async () => {
    setLayoutEngine('wasm');
    const wasm = await renderAll();
    setLayoutEngine('js');
    const js = await renderAll();
    expect(js).toEqual(wasm);
  });

  it('falls back to JavaScript when WebAssembly is missing', async () => {
    setLayoutEngine('wasm');
    const expected = await render(fixtures.barcodes);
    const original = globalThis.WebAssembly;
    // @ts-expect-error simulate a runtime without WebAssembly, like Hermes
    delete globalThis.WebAssembly;
    try {
      setLayoutEngine('auto');
      expect(await render(fixtures.barcodes)).toBe(expected);
    } finally {
      globalThis.WebAssembly = original;
    }
  });
});
