/**
 * Serves dist/ locally the way a static host would: "/docs/text/" serves
 * docs/text/index.html and unknown paths get 404.html.
 *
 *   pnpm --filter react-zpl-docs preview [--port 4321]
 */
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const dist = join(import.meta.dirname, 'dist');
const portArg = process.argv.indexOf('--port');
const port = Number(portArg > -1 ? process.argv[portArg + 1] : process.env.PORT ?? 4321);
const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.xml': 'application/xml',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

async function find(urlPath: string) {
  const file = join(dist, normalize(decodeURIComponent(urlPath)).replace(/^(\.\.[/\\])+/, ''));
  const info = await stat(file).catch(() => null);
  if (info?.isFile()) return file;
  if (info?.isDirectory()) {
    if (!urlPath.endsWith('/')) return { redirect: `${urlPath}/` };
    return join(file, 'index.html');
  }
  return null;
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const found = await find(url.pathname);
  if (found && typeof found === 'object') {
    res.writeHead(301, { location: found.redirect + url.search }).end();
    return;
  }
  const file = found ?? join(dist, '404.html');
  res.writeHead(found ? 200 : 404, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
  res.end(await readFile(file));
}).listen(port, () => console.log(`Docs at http://localhost:${port}/`));
