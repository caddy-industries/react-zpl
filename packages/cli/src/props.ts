/** Helpers for the viewer's sample data: JSON-safe copies, variants and template placeholders. */

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && Object.getPrototypeOf(v) === Object.prototype;

/** What a value that JSON can't hold (a Buffer, a function...) shows as in the editor. */
function marker(v: unknown): string | undefined {
  if (v instanceof Uint8Array) return `[binary ${v.byteLength} bytes]`;
  if (typeof v === 'function') return '[function]';
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'bigint') return `${v}n`;
  return undefined;
}

/** A copy that can go through JSON. Values it can't hold become marker strings. */
export function toJsonSafe(v: unknown): Json {
  const m = marker(v);
  if (m !== undefined) return m;
  if (Array.isArray(v)) return v.map(toJsonSafe);
  if (isPlainObject(v)) {
    return Object.fromEntries(Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => [k, toJsonSafe(x)]));
  }
  if (typeof v === 'object' && v !== null) return String(v);
  return v as Json;
}

/** Puts back values from `original` wherever the edited copy still holds their marker. */
export function restoreValues(edited: unknown, original: unknown): unknown {
  const m = marker(original);
  if (m !== undefined && edited === m) return original;
  if (Array.isArray(edited)) return edited.map((x, i) => restoreValues(x, Array.isArray(original) ? original[i] : undefined));
  if (isPlainObject(edited)) {
    const src = isPlainObject(original) ? original : {};
    return Object.fromEntries(Object.entries(edited).map(([k, x]) => [k, restoreValues(x, src[k])]));
  }
  return edited;
}

/** Variant values are merged over PreviewProps, so a variant only lists what changes. */
export function deepMerge(base: unknown, over: unknown): unknown {
  if (isPlainObject(base) && isPlainObject(over)) {
    const out: Record<string, unknown> = { ...base };
    // An explicit undefined clears the value.
    for (const [k, v] of Object.entries(over)) out[k] = v === undefined ? undefined : deepMerge(base[k], v);
    return out;
  }
  return over === undefined ? base : over;
}

/** Paths of every string value, e.g. ["to.name", "items.0.sku"]. */
export function stringPaths(v: unknown, prefix = ''): string[] {
  if (typeof v === 'string') return prefix ? [prefix] : [];
  if (Array.isArray(v)) return v.flatMap((x, i) => stringPaths(x, prefix ? `${prefix}.${i}` : String(i)));
  if (isPlainObject(v)) return Object.entries(v).flatMap(([k, x]) => stringPaths(x, prefix ? `${prefix}.${k}` : k));
  return [];
}

/** Replaces the strings at `paths` with `{{path}}`. */
export function withPlaceholders(v: unknown, paths: Set<string>, prefix = ''): unknown {
  if (typeof v === 'string') return paths.has(prefix) ? `{{${prefix}}}` : v;
  if (Array.isArray(v)) return v.map((x, i) => withPlaceholders(x, paths, prefix ? `${prefix}.${i}` : String(i)));
  if (isPlainObject(v)) {
    return Object.fromEntries(
      Object.entries(v).map(([k, x]) => [k, withPlaceholders(x, paths, prefix ? `${prefix}.${k}` : k)]),
    );
  }
  return v;
}
