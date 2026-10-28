# react-zpl docs

The docs site and component catalog, built as a plain static website. Every
label preview is rendered at build time by react-zpl itself, so the docs always
show what the current code prints.

```sh
pnpm docs:build      # from the repo root: builds react-zpl, then the site into apps/docs/dist
pnpm docs:preview    # serves apps/docs/dist at http://localhost:4321
```

## Hosting

`apps/docs/dist` is a folder of HTML, CSS and SVG with no server code. Each page
is its own `index.html` (`/docs/barcode/`, `/components/shipping/`), and all links
are relative, so it works at a domain root or in a subfolder.

| Host | Build command | Output folder |
| --- | --- | --- |
| Vercel, Netlify, Cloudflare Pages | `pnpm docs:build` | `apps/docs/dist` |
| GitHub Pages | run `pnpm docs:build` in an Action, upload `apps/docs/dist` | |
| Any web server or S3 bucket | run `pnpm docs:build` and copy `apps/docs/dist` | |

Optional settings, as environment variables at build time:

- `SITE_URL=https://zpl.example.com/` adds canonical links, `sitemap.xml` and `robots.txt`.
- `BASE_PATH=/react-zpl/` sets where the site lives when it isn't at the domain
  root (GitHub Pages project sites). Only `404.html` needs it, since its links
  can't be relative. It defaults to the path in `SITE_URL`, or `/`.

Most hosts serve `404.html` for missing pages automatically.

## Editing

- `content/` holds the guide pages as Markdown. `content/nav.ts` sets the sidebar
  order. Link to other pages with `#page`, `#page.heading`, `#components` or
  `#components-<section>`; the build turns these into real URLs and fails on a
  link that doesn't match anything. `{{example barcodes/01-code128}}` embeds a
  live example from the catalog.
- `catalog/<section>/*.tsx` holds the copy-paste examples. Each file
  default-exports a component, sets `export const title`, and can list extra stock
  sizes in `export const sizes = ['4x2', '3x1']`. A size the layout doesn't fit is
  left out of the build with a note.
- `site/templates.ts` renders the pages, `site/styles.css` styles them, and
  `site/client.js` is the only script the browser runs (tabs, size buttons, copy).
