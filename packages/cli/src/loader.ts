import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import type { ReactElement } from 'react';
import { createServer, type ViteDevServer } from 'vite';
import { deepMerge, restoreValues, stringPaths, toJsonSafe, withPlaceholders } from './props';

type ReactZpl = typeof import('@caddy-industries/react-zpl');
type ReactModule = typeof import('react');

export interface RenderOptions {
  dpi?: number;
  printMargin?: string;
  /** A key of the component's PreviewVariants. */
  variant?: string;
  /** Props from the viewer's editor. Overrides PreviewProps and the variant. */
  props?: unknown;
  /** Render with {{placeholders}} in place of string props. */
  template?: boolean;
}

export interface LabelEntry {
  /** Path relative to the labels folder, e.g. "shipping/fedex.tsx". */
  id: string;
  name: string;
}

const LABEL_FILE = /\.(tsx|jsx)$/;

/** Finds label files. Files and folders starting with "_" or "." are skipped. */
export function findLabels(dir: string): LabelEntry[] {
  const out: LabelEntry[] = [];
  const walk = (d: string) => {
    for (const name of readdirSync(d).sort()) {
      if (name.startsWith('_') || name.startsWith('.') || name === 'node_modules') continue;
      const full = join(d, name);
      if (statSync(full).isDirectory()) walk(full);
      else if (LABEL_FILE.test(name)) {
        const id = relative(dir, full).split(sep).join('/');
        out.push({ id, name: id.replace(LABEL_FILE, '') });
      }
    }
  };
  walk(dir);
  return out;
}

/**
 * Loads label modules through Vite so TypeScript/JSX work without a build step
 * and edits are picked up without restarting.
 */
export class LabelLoader {
  private constructor(
    readonly vite: ViteDevServer,
    readonly dir: string,
    private zpl: ReactZpl,
    private react: ReactModule,
  ) {}

  static async create(root: string, dir: string, watch: boolean) {
    const vite = await createServer({
      root,
      configFile: false,
      logLevel: 'error',
      appType: 'custom',
      server: { middlewareMode: true, hmr: false, ws: false, watch: watch ? {} : null },
      oxc: { jsx: { runtime: 'automatic' } },
      optimizeDeps: { noDiscovery: true, include: [] },
    });
    // Use the project's own copies so labels and renderer share one React.
    const require = createRequire(join(root, 'package.json'));
    const zpl = (await import(pathToFileURL(require.resolve('@caddy-industries/react-zpl')).href)) as ReactZpl;
    const react = (await import(pathToFileURL(require.resolve('react')).href)) as ReactModule;
    return new LabelLoader(vite, resolve(root, dir), zpl, react);
  }

  list() {
    return findLabels(this.dir);
  }

  invalidate() {
    this.vite.moduleGraph.invalidateAll();
  }

  private file(id: string) {
    const file = resolve(this.dir, id);
    if (!file.startsWith(this.dir + sep)) throw new Error('Label must be inside the labels folder.');
    return file;
  }

  /** The label's source code, for the viewer's React tab. */
  source(id: string): string {
    try {
      return readFileSync(this.file(id), 'utf8');
    } catch {
      return '';
    }
  }

  private async component(id: string) {
    const mod = await this.vite.ssrLoadModule(this.file(id));
    const Component = mod.default;
    if (typeof Component !== 'function') {
      throw new Error(`${id} needs a default export: a component that returns a <Label>.`);
    }
    const variants: Record<string, unknown> = Component.PreviewVariants ?? {};
    return { Component, previewProps: (Component.PreviewProps ?? {}) as unknown, variants };
  }

  /** The props a label renders with: PreviewProps, a variant merged over it, or edited JSON. */
  private async resolve(id: string, opts: RenderOptions) {
    const { Component, previewProps, variants } = await this.component(id);
    let base = previewProps;
    if (opts.variant) {
      if (!(opts.variant in variants)) throw new Error(`${id} has no preview variant named "${opts.variant}".`);
      base = deepMerge(previewProps, variants[opts.variant]);
    }
    const props = opts.props === undefined ? base : restoreValues(opts.props, base);
    return { Component, props, base, variants: Object.keys(variants) };
  }

  async element(id: string, opts: RenderOptions = {}): Promise<ReactElement> {
    const { Component, props } = await this.resolve(id, opts);
    return this.react.createElement(Component, props as object);
  }

  async render(id: string, opts: RenderOptions = {}) {
    const { Component, props, base, variants } = await this.resolve(id, opts);
    const draw = (p: unknown) =>
      this.zpl.renderLabel(this.react.createElement(Component, p as object), { dpi: opts.dpi, printMargin: opts.printMargin });

    let result: Awaited<ReturnType<typeof draw>>;
    let template: { fields: string[]; kept: string[] } | undefined;
    if (opts.template) {
      // Swap every string for {{path}}. A field the label can't render that way
      // (an EAN barcode needs digits, say) keeps its sample value.
      const all = stringPaths(props);
      const used = new Set(all);
      const attempt = await draw(withPlaceholders(props, used)).catch(() => undefined);
      if (attempt) result = attempt;
      else {
        used.clear();
        result = await draw(props);
        for (const path of all) {
          used.add(path);
          const r = await draw(withPlaceholders(props, used)).catch(() => undefined);
          if (r) result = r;
          else used.delete(path);
        }
      }
      template = { fields: all.filter((p) => used.has(p)), kept: all.filter((p) => !used.has(p)) };
    } else {
      result = await draw(props);
    }

    const preview = this.zpl.previewZpl(result.zpl, { dpi: result.setup.dpi });
    const { ops: _ops, ...rest } = result;
    return {
      ...rest,
      svg: preview.svg,
      previewWarnings: preview.warnings,
      props: toJsonSafe(props),
      defaultProps: toJsonSafe(base),
      variants,
      template,
    };
  }

  close() {
    return this.vite.close();
  }
}
