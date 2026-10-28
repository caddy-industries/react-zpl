import { describe, expect, it } from 'vitest';
import { deepMerge, restoreValues, stringPaths, toJsonSafe, withPlaceholders } from '../src/props';

describe('preview props', () => {
  it('merges variants over PreviewProps', () => {
    const base = { to: { name: 'A', company: 'B', zip: '1' }, service: 'X' };
    expect(deepMerge(base, { to: { name: 'C', company: undefined } })).toEqual({ to: { name: 'C', company: undefined, zip: '1' }, service: 'X' });
  });
  it('round-trips values JSON cannot hold', () => {
    const logo = new Uint8Array([1, 2, 3]);
    const props = { logo, title: 'Hi' };
    const safe = toJsonSafe(props) as Record<string, unknown>;
    expect(safe.logo).toBe('[binary 3 bytes]');
    const edited = JSON.parse(JSON.stringify({ ...safe, title: 'Bye' }));
    expect(restoreValues(edited, props)).toEqual({ logo, title: 'Bye' });
  });
  it('replaces strings with placeholders', () => {
    const props = { to: { name: 'A' }, items: [{ sku: 'X' }], qty: 2 };
    const paths = stringPaths(props);
    expect(paths).toEqual(['to.name', 'items.0.sku']);
    expect(withPlaceholders(props, new Set(paths))).toEqual({ to: { name: '{{to.name}}' }, items: [{ sku: '{{items.0.sku}}' }], qty: 2 });
  });
});
