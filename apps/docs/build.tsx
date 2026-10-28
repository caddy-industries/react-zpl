/**
 * Builds the docs site: renders every example in ./catalog to ZPL with
 * react-zpl, draws it with the offline preview, and writes a static site to
 * ./dist with one HTML file per page. Upload dist/ to any static host.
 *
 *   pnpm --filter react-zpl-docs build
 *
 * Optional environment variables:
 *   SITE_URL   full URL the site is hosted at (https://zpl.example.com/docs).
 *              Adds canonical links, sitemap.xml and robots.txt.
 *   BASE_PATH  path the site is served from, used by 404.html, whose links
 *              can't be relative. Defaults to "/" or the path of SITE_URL.
 */
import { createHash } from 'node:crypto';
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createElement, type ComponentType } from 'react';
import { previewZpl, renderLabel } from '@caddy-industries/react-zpl';
import { categories, stockNames } from './catalog/categories';
import { nav } from './content/nav';
import { frontmatter, markdown } from './md';
import { esc, highlight } from './site/highlight';
import {
  type Example,
  type Page,
  type Render,
  type Section,
  type Site,
  catalogHome,
  category,
  docsPage,
  exArticle,
  notFound,
  shell,
  urls,
} from './site/templates';

const here = import.meta.dirname;
const catalogDir = join(here, 'catalog');
const outDir = join(here, 'dist');

const inchKey = (dots: number, dpi: number) => String(+(dots / dpi).toFixed(2));

let dropped = 0;
let problems = 0;
const sections: Section[] = [];
for (const category of categories) {
  const dir = join(catalogDir, category.slug);
  const files = readdirSync(dir).filter((f) => f.endsWith('.tsx')).sort();
  const examples: Example[] = [];
  for (const file of files) {
    const path = join(dir, file);
    const mod = (await import(pathToFileURL(path).href)) as { default: ComponentType; title?: string; sizes?: string[] };
    const element = createElement(mod.default);
    const renders: Render[] = [];
    // First the label's own size, then each extra stock size from `export const sizes`.
    for (const size of [null, ...(mod.sizes ?? [])]) {
      const [w, h] = size ? size.split('x') : [];
      const result = await renderLabel(element, size ? { width: `${w}in`, height: `${h}in` } : {});
      const preview = previewZpl(result.zpl, { dpi: result.setup.dpi });
      const warnings = [...result.warnings, ...preview.warnings];
      const key = `${inchKey(result.setup.width, result.setup.dpi)}x${inchKey(result.setup.height, result.setup.dpi)}`;
      if (warnings.length) {
        // The default size must render cleanly; an extra size that doesn't fit is left out.
        if (size) {
          dropped++;
          console.warn(`  - ${category.slug}/${file} at ${size} in: left out (${warnings[0]})`);
          continue;
        }
        problems++;
        console.warn(`  ! ${category.slug}/${file}: ${warnings.join('; ')}`);
      }
      if (renders.some((r) => r.size === key)) continue;
      renders.push({
        size: key,
        name: stockNames[key],
        zpl: result.zpl,
        svg: preview.svg,
        width: result.setup.width,
        height: result.setup.height,
        dpi: result.setup.dpi,
      });
    }
    examples.push({
      key: `${category.slug}/${file.replace(/\.tsx$/, '')}`,
      slug: file.replace(/^\d+-/, '').replace(/\.tsx$/, ''),
      title: mod.title ?? file,
      source: readFileSync(path, 'utf8'),
      renders,
    });
  }
  sections.push({ ...category, examples });
  console.log(`  ✓ ${category.title} (${examples.length})`);
}

// Docs pages: Markdown in ./content, ordered by content/nav.ts.
const examplesByKey = new Map(sections.flatMap((s) => s.examples.map((ex) => [ex.key, { s, ex }] as const)));
const pageSlugs = new Set(nav.flatMap((g) => g.pages));

/** Docs links are written as "#page", "#page.heading", "#components" or "#components-section". */
function resolveLink(href: string, root: string, from: string) {
  if (!href.startsWith('#')) return href;
  const hash = href.slice(1);
  if (hash === 'components') return root + urls.components;
  if (hash.startsWith('components-')) {
    const rest = hash.slice('components-'.length);
    const s = sections.find((x) => rest === x.slug || rest.startsWith(`${x.slug}-`));
    if (s) return root + urls.section(s.slug) + (rest === s.slug ? '' : `#${rest.slice(s.slug.length + 1)}`);
  }
  const [page, anchor] = hash.split('.');
  if (pageSlugs.has(page)) return root + urls.docs(page) + (anchor ? `#${anchor}` : '');
  throw new Error(`content/${from}.md: link "${href}" doesn't match a page or section`);
}

const codeBlock = (lang: string, text: string) =>
  `<div class="codeblock"><div class="codeblock-bar"><span>${lang === 'text' ? '' : esc(lang)}</span><button type="button" class="btn" data-copy-block>Copy</button></div><pre class="code">${highlight(lang, text)}</pre></div>`;

const pages: Page[] = nav.flatMap(({ group, pages: slugs }) =>
  slugs.map((slug) => {
    const { data: meta, body } = frontmatter(readFileSync(join(here, 'content', `${slug}.md`), 'utf8'));
    const render = (root: string) =>
      markdown(body, {
        example: (key) => {
          const found = examplesByKey.get(key);
          if (!found) throw new Error(`content/${slug}.md: no catalog example "${key}"`);
          return exArticle(found.s, found.ex, root, { embed: true });
        },
        link: (href) => resolveLink(href, root, slug),
        code: codeBlock,
      });
    const { toc } = render('../../');
    const title = meta.title ?? slug;
    const description = meta.description ?? '';
    return { slug, group, title, description, markdown: `# ${title}\n\n${description}\n\n${body.trim()}\n`, html: (root) => render(root).html, toc };
  }),
);
console.log(`  ✓ ${pages.length} docs pages`);

// Assets
const css = readFileSync(join(here, 'site/styles.css'), 'utf8');
const js = readFileSync(join(here, 'site/client.js'), 'utf8');
const siteUrl = process.env.SITE_URL?.replace(/\/?$/, '/');
const site: Site = {
  version: JSON.parse(readFileSync(join(here, '../../packages/react-zpl/package.json'), 'utf8')).version,
  sections,
  pages,
  assetVersion: createHash('sha1').update(css).update(js).digest('hex').slice(0, 8),
  siteUrl,
};

rmSync(outDir, { recursive: true, force: true });
const written: string[] = [];
/** Writes `path` ("docs/text/" or "404.html") under dist. */
function write(path: string, html: string) {
  const file = join(outDir, path.endsWith('/') || path === '' ? `${path}index.html` : path);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  if (path.endsWith('/') || path === '') written.push(path);
}
for (const page of pages) write(`${urls.docs(page.slug)}index.md`, page.markdown);
const rootFor = (path: string) => '../'.repeat(path.split('/').filter(Boolean).length) || './';

// The home page shows the introduction; every docs page also has its own URL.
const intro = pages[0];
for (const [path, page] of [['', intro] as const, ...pages.map((p) => [urls.docs(p.slug), p] as const)]) {
  const root = rootFor(path);
  write(
    path,
    shell({
      site,
      root,
      path: path === '' ? urls.docs(intro.slug) : path,
      title: path === '' ? 'react-zpl · Build Zebra printer labels with React' : `${page.title} · react-zpl`,
      description: page.description,
      nav: 'docs',
      body: docsPage(site, page, root),
    }),
  );
}
write(
  urls.components,
  shell({
    site,
    root: rootFor(urls.components),
    path: urls.components,
    title: 'Components · react-zpl',
    description: 'Copy-paste React components for thermal printer labels, previewed at common label stock sizes.',
    nav: 'components',
    body: catalogHome(site, rootFor(urls.components)),
  }),
);
for (const s of sections) {
  const path = urls.section(s.slug);
  write(
    path,
    shell({
      site,
      root: rootFor(path),
      path,
      title: `${s.title} · react-zpl Components`,
      description: s.description,
      nav: 'components',
      body: category(site, s, rootFor(path)),
    }),
  );
}
const base = process.env.BASE_PATH ?? (siteUrl ? new URL(siteUrl).pathname : '/');
write(
  '404.html',
  shell({ site, root: base.replace(/\/?$/, '/'), path: '404.html', title: 'Page not found · react-zpl', description: 'Page not found.', nav: null, body: notFound(base.replace(/\/?$/, '/')) }),
);

mkdirSync(join(outDir, 'assets'), { recursive: true });
writeFileSync(join(outDir, 'assets/site.css'), css);
writeFileSync(join(outDir, 'assets/site.js'), js);
cpSync(join(here, 'site/favicon.svg'), join(outDir, 'favicon.svg'));
if (siteUrl) {
  writeFileSync(
    join(outDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${written
      .filter((p) => p !== '')
      .map((p) => `  <url><loc>${siteUrl}${p}</loc></url>`)
      .join('\n')}\n</urlset>\n`,
  );
  writeFileSync(join(outDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}sitemap.xml\n`);
}

const count = sections.reduce((n, s) => n + s.examples.length, 0);
console.log(`\nBuilt ${written.length} pages (${count} examples in ${sections.length} sections) -> dist/`);
if (dropped) console.log(`${dropped} extra size(s) left out because the layout didn't fit.`);
if (problems) {
  console.log(`${problems} example(s) have warnings at their own size.`);
  process.exitCode = 1;
}
