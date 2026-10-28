/**
 * HTML for every page of the site. Everything is rendered at build time; the
 * browser only runs site/client.js for tabs, size buttons and copy.
 *
 * `root` is the relative path from the current page to the site root ("./",
 * "../", "../../"), so the built site works from any folder on any host.
 */
import type { Heading } from '../md';
import { esc, highlightTsx, highlightZpl } from './highlight';

export interface Render {
  /** "4x6" style key, in inches. */
  size: string;
  name?: string;
  zpl: string;
  svg: string;
  width: number;
  height: number;
  dpi: number;
}

export interface Example {
  /** "barcodes/01-code128": how docs pages embed it. */
  key: string;
  slug: string;
  title: string;
  source: string;
  renders: Render[];
}

export interface Section {
  slug: string;
  title: string;
  kind: string;
  description: string;
  examples: Example[];
}

export interface Page {
  slug: string;
  group: string;
  title: string;
  description: string;
  /** The page as Markdown, for "Copy page". */
  markdown: string;
  /** Page body, rendered for a given root. */
  html: (root: string) => string;
  toc: Heading[];
}

export interface Site {
  version: string;
  sections: Section[];
  pages: Page[];
  /** Cache-busting suffix for the CSS and JS. */
  assetVersion: string;
  /** Full URL the site is hosted at, for canonical links. Optional. */
  siteUrl?: string;
}

export const urls = {
  docs: (slug: string) => `docs/${slug}/`,
  components: 'components/',
  section: (slug: string) => `components/${slug}/`,
};

const inches = (dots: number, dpi: number) => +(dots / dpi).toFixed(2);
const sizeOf = (r: Render) => `${inches(r.width, r.dpi)} × ${inches(r.height, r.dpi)} in`;
const sizeShort = (r: Render) => r.size.replace('x', '×');
const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
const specOf = (r: Render) => `${r.width} × ${r.height} dots · ${r.dpi} dpi`;
const hidden = (k: number) => (k === 0 ? '' : ' hidden');
const componentName = (ex: Example) => (ex.source.match(/export default function (\w+)/) ?? [, 'Label'])[1];

/* ---------- a label drawn on its liner ---------- */

// Thumbnails fit a 16:11 box; the stage shows labels near physical size (96 CSS px per inch).
function thumbPaper(r: Render) {
  const W = 16;
  const H = 11;
  const w = r.width / r.dpi;
  const h = r.height / r.dpi;
  const s = Math.min((0.78 * W) / w, (0.74 * H) / h);
  return `<div class="paper" style="width:${((s * w) / W) * 100}%;aspect-ratio:${r.width}/${r.height}">${r.svg}</div>`;
}

function stagePaper(r: Render, attrs = '') {
  const w = (r.width / r.dpi) * 96;
  const h = (r.height / r.dpi) * 96;
  const scale = Math.min(1.25, 560 / h);
  return `<div class="paper"${attrs} style="width:${w * scale}px;aspect-ratio:${r.width}/${r.height}">${r.svg}</div>`;
}

function footOf(ex: Example, r: Render, k: number) {
  const [w, h] = r.size.split('x');
  const call =
    k === 0
      ? ''
      : `<span>Rendered with <code>render(&lt;${esc(componentName(ex))} /&gt;, { width: '${w}in', height: '${h}in' })</code></span>`;
  return `<span>${Buffer.byteLength(r.zpl).toLocaleString('en-US')} bytes of ZPL</span><span>${r.zpl.trim().split('\n').length} lines</span>${call}`;
}

/**
 * One example: title, view tabs, size picker, preview and code. Every size is
 * rendered into the page; the size buttons show one and hide the rest.
 */
export function exArticle(s: Section, ex: Example, root: string, { embed = false } = {}) {
  const link = embed ? `${root}${urls.section(s.slug)}#${ex.slug}` : `#${ex.slug}`;
  const many = ex.renders.length > 1;
  const first = ex.renders[0];
  return `<article class="ex${embed ? ' ex-embed' : ''}"${embed ? '' : ` id="${ex.slug}"`}>
    <div class="ex-head">
      <h3><a class="ex-link" href="${link}">${esc(ex.title)}</a></h3>
      <div class="ex-tools">
        <div class="tabs" role="tablist" aria-label="${esc(ex.title)} view">
          <button type="button" role="tab" data-view="preview" aria-selected="true">Preview</button>
          <button type="button" role="tab" data-view="react" aria-selected="false">React</button>
          <button type="button" role="tab" data-view="zpl" aria-selected="false">ZPL</button>
        </div>
        <button type="button" class="btn" data-copy-ex>Copy code</button>
      </div>
    </div>
    <div class="frame">
    <div class="sizes" role="group" aria-label="Label size">
      ${
        many
          ? ex.renders
              .map(
                (r, k) =>
                  `<button type="button" data-size="${k}" aria-pressed="${k === 0}" title="${sizeOf(r)}${r.name ? ` · ${esc(r.name)}` : ''}">${sizeShort(r)}<small>${r.name ? esc(r.name) : 'in'}</small></button>`,
              )
              .join('')
          : `<span class="only">${sizeShort(first)}<small>${first.name ? esc(first.name) : 'in'}</small></span>`
      }
      ${ex.renders.map((r, k) => `<span class="spec" data-r="${k}"${hidden(k)}>${specOf(r)}</span>`).join('')}
    </div>
    <div class="view" data-for="preview"><div class="stage">${ex.renders.map((r, k) => stagePaper(r, ` data-r="${k}"${hidden(k)}`)).join('')}</div></div>
    <div class="view" data-for="react" hidden><pre class="code" data-react>${highlightTsx(ex.source)}</pre></div>
    <div class="view" data-for="zpl" hidden>${ex.renders.map((r, k) => `<pre class="code" data-zpl data-r="${k}"${hidden(k)}>${highlightZpl(r.zpl)}</pre>`).join('')}</div>
    ${ex.renders.map((r, k) => `<div class="ex-foot" data-r="${k}"${hidden(k)}>${footOf(ex, r, k)}</div>`).join('')}
    </div>
  </article>`;
}

/* ---------- page shell ---------- */

interface ShellOptions {
  site: Site;
  root: string;
  /** Path of this page from the site root, e.g. "docs/text/". */
  path: string;
  title: string;
  description: string;
  nav: 'docs' | 'components' | null;
  body: string;
}

export function shell({ site, root, path, title, description, nav, body }: ShellOptions) {
  const canonical = site.siteUrl ? `${site.siteUrl.replace(/\/$/, '')}/${path}` : '';
  const current = (n: string) => (nav === n ? ' aria-current="page"' : '');
  const v = site.assetVersion;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="react-zpl">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${canonical ? `<link rel="canonical" href="${canonical}">\n<meta property="og:url" content="${canonical}">\n` : ''}<meta name="theme-color" content="#e8ebef" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#101215" media="(prefers-color-scheme: dark)">
<script>
  // Follow the system theme unless the visitor picked one.
  (function () {
    var saved = null;
    try { saved = localStorage.getItem('theme'); } catch (e) {}
    var light = window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches;
    document.documentElement.dataset.theme = saved || (light ? 'light' : 'dark');
  })();
</script>
<link rel="icon" href="${root}favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap">
<link rel="stylesheet" href="${root}assets/site.css?v=${v}">
<script src="${root}assets/site.js?v=${v}" defer></script>
</head>
<body>
<header class="top">
  <div class="wrap${nav === 'docs' ? ' full' : ''}">
    <a class="brand" href="${root}" aria-label="react-zpl home">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><rect x="1.5" y="1.5" width="23" height="23" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 7v12M9.5 7v12M11 7v12M14.5 7v12M16 7v12M19 7v12" stroke="currentColor" stroke-width="1.5"/></svg>
      react-zpl <small>v${esc(site.version)}</small>
    </a>
    <nav aria-label="Main">
      <a href="${root}${urls.docs('introduction')}"${current('docs')}>Docs</a>
      <a href="${root}${urls.components}"${current('components')}>Components</a>
      <span class="sep" aria-hidden="true"></span>
      <button type="button" class="theme" data-theme-toggle aria-label="Switch between light and dark theme">
        <svg class="moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
        <svg class="sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      </button>
    </nav>
  </div>
</header>

<main>
${body}
</main>

<footer>
  <div class="wrap">
    <span>react-zpl · MIT License · Previews are drawn from the generated ZPL by react-zpl's offline renderer.</span>
    <span class="spec">203 dpi unless noted · font 0</span>
  </div>
</footer>
<div class="toast" id="toast" role="status" aria-live="polite"></div>
</body>
</html>
`;
}

/* ---------- views ---------- */

const allExamples = (site: Site) => site.sections.flatMap((s) => s.examples);

export function catalogHome(site: Site, root: string) {
  const kinds = [...new Set(site.sections.map((s) => s.kind))];
  const stockCount = new Set(allExamples(site).flatMap((e) => e.renders.map((r) => r.size))).size;
  const intro: Record<string, string> = {
    Components: 'One per building block, with the props that matter.',
    Patterns: 'Common pieces of a label, built from the components.',
    Templates: 'Whole labels to copy and adapt.',
  };
  return `
  <section class="wrap hero">
    <div>
      <p class="eyebrow">Components · ${allExamples(site).length} examples</p>
      <h1>Label components</h1>
      <p class="lede">Copy-paste components for thermal printer labels, built with React and Tailwind classes. Each preview below is the printer output, drawn from the ZPL the example generates.</p>
    </div>
    <div class="install">
      <div class="cmd"><code>npm install @caddy-industries/react-zpl</code><button type="button" class="btn" data-copy="npm install @caddy-industries/react-zpl">Copy</button></div>
      <div class="cmd"><code>npx react-zpl dev</code><button type="button" class="btn" data-copy="npx react-zpl dev">Copy</button></div>
      <div class="facts"><span><b>${site.sections.length}</b> sections</span><span><b>${stockCount}</b> stock sizes</span><span>Font 0 · Code 128 · QR · PNG</span><span>203 / 300 / 600 dpi</span></div>
    </div>
  </section>
  ${kinds
    .map((kind) => {
      const list = site.sections.filter((s) => s.kind === kind);
      return `<section class="wrap group" aria-labelledby="g-${kind}">
      <h2 id="g-${kind}">${esc(kind)} <span>${esc(intro[kind] ?? '')}</span></h2>
      <div class="grid">${list
        .map(
          (s) => `
        <a class="card" href="${root}${urls.section(s.slug)}"><div class="card-inner">
          <div class="thumb">${thumbPaper(s.examples[0].renders[0])}</div>
          <div class="card-body"><h3>${esc(s.title)}</h3><span>${plural(s.examples.length, 'example')}</span></div>
        </div></a>`,
        )
        .join('')}
      </div>
    </section>`;
    })
    .join('')}`;
}

export function category(site: Site, s: Section, root: string) {
  const i = site.sections.indexOf(s);
  const prev = site.sections[i - 1];
  const next = site.sections[i + 1];
  const kinds = [...new Set(site.sections.map((x) => x.kind))];
  return `
  <div class="wrap doc">
    <aside class="side" aria-label="Sections">
      ${kinds
        .map(
          (k) =>
            `<div><h4>${esc(k)}</h4>${site.sections
              .filter((x) => x.kind === k)
              .map(
                (x) =>
                  `<a href="${root}${urls.section(x.slug)}"${x === s ? ' aria-current="page"' : ''}>${esc(x.title)}<span>${x.examples.length}</span></a>`,
              )
              .join('')}</div>`,
        )
        .join('')}
    </aside>
    <div style="min-width:0">
      <p class="crumbs"><a href="${root}${urls.components}">Components</a>${s.kind === 'Components' ? '' : ` / ${esc(s.kind)}`}</p>
      <h1>${esc(s.title)}</h1>
      <p class="lede">${esc(s.description)}</p>
      <div class="examples">${s.examples.map((ex) => exArticle(s, ex, root)).join('')}</div>
      <nav class="pager" aria-label="More sections">
        ${prev ? `<a href="${root}${urls.section(prev.slug)}"><small>Previous</small><b>${esc(prev.title)}</b></a>` : ''}
        ${next ? `<a class="next" href="${root}${urls.section(next.slug)}"><small>Next</small><b>${esc(next.title)}</b></a>` : ''}
      </nav>
    </div>
  </div>`;
}

export function docsPage(site: Site, page: Page, root: string) {
  const i = site.pages.indexOf(page);
  const prev = site.pages[i - 1];
  const next = site.pages[i + 1];
  const groups = [...new Set(site.pages.map((p) => p.group))];
  const sideNav = groups
    .map(
      (g) =>
        `<div><h4>${esc(g)}</h4>${site.pages
          .filter((p) => p.group === g)
          .map((p) => `<a href="${root}${urls.docs(p.slug)}"${p === page ? ' aria-current="page"' : ''}>${esc(p.title)}</a>`)
          .join('')}</div>`,
    )
    .join('');
  const toc = page.toc.filter((h) => h.level === 2);
  return `
  <div class="docs">
    <aside class="docs-side" aria-label="Docs">
      <details class="docs-menu"><summary>${esc(page.group)} <b>/ ${esc(page.title)}</b></summary><nav>${sideNav}</nav></details>
      <nav class="docs-nav">${sideNav}</nav>
    </aside>
    <div class="docs-panel">
    <article class="prose" style="min-width:0">
      <div class="page-head">
        <p class="crumbs">${esc(page.group)}</p>
        <button type="button" class="btn copy-page" data-copy-page="${root}${urls.docs(page.slug)}index.md">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>
          Copy page
        </button>
      </div>
      <h1>${esc(page.title)}</h1>
      <p class="lede">${esc(page.description)}</p>
      ${page.html(root)}
      <nav class="pager" aria-label="More pages">
        ${prev ? `<a href="${root}${urls.docs(prev.slug)}"><small>Previous</small><b>${esc(prev.title)}</b></a>` : ''}
        ${next ? `<a class="next" href="${root}${urls.docs(next.slug)}"><small>Next</small><b>${esc(next.title)}</b></a>` : ''}
      </nav>
    </article>
    <aside class="toc" aria-label="On this page">
      ${toc.length ? `<h4>On this page</h4>${toc.map((h) => `<a href="#${h.id}">${h.text}</a>`).join('')}` : ''}
    </aside>
    </div>
  </div>`;
}

export function notFound(root: string) {
  return `
  <section class="wrap hero">
    <div>
      <p class="eyebrow">404</p>
      <h1>Page not found</h1>
      <p class="lede">That page isn't here. It may have moved when the docs were reorganised.</p>
    </div>
    <div class="install">
      <a class="link-card" href="${root}${urls.docs('introduction')}"><b>Docs</b><span>Start with the introduction.</span></a>
      <a class="link-card" href="${root}${urls.components}"><b>Components</b><span>Browse the label examples.</span></a>
    </div>
  </section>`;
}
