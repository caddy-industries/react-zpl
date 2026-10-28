import { createServer, type ServerResponse } from 'node:http';
import { Socket } from 'node:net';
import type { LabelLoader } from './loader';
import UI from './ui.html';

function json(res: ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { 'content-type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readBody(req: import('node:http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 5_000_000) reject(new Error('Body too large'));
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

/** Sends raw ZPL to a network printer (port 9100 is the Zebra raw print port). */
function sendToPrinter(host: string, port: number, zpl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const socket = new Socket();
    socket.setTimeout(5000);
    socket.once('timeout', () => {
      socket.destroy();
      reject(new Error(`Timed out connecting to ${host}:${port}`));
    });
    socket.once('error', reject);
    socket.connect(port, host, () => {
      socket.end(zpl, () => resolve());
    });
  });
}

export function startServer(loader: LabelLoader, port: number, host: string, printMargin?: string) {
  const clients = new Set<ServerResponse>();
  let timer: NodeJS.Timeout | undefined;
  const notify = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      loader.invalidate();
      for (const c of clients) c.write('data: change\n\n');
    }, 50);
  };
  loader.vite.watcher.add(loader.dir);
  loader.vite.watcher.on('change', notify);
  loader.vite.watcher.on('add', notify);
  loader.vite.watcher.on('unlink', notify);

  const server = createServer(async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost');
    try {
      if (url.pathname === '/') {
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        res.end(UI);
      } else if (url.pathname === '/api/labels') {
        json(res, 200, loader.list());
      } else if (url.pathname === '/api/render') {
        // GET for simple links; POST carries edited props from the viewer.
        const q = url.searchParams;
        const body = req.method === 'POST' ? JSON.parse((await readBody(req)) || '{}') : {};
        const id = String(body.id ?? q.get('id') ?? '');
        try {
          const result = await loader.render(id, {
            dpi: Number(body.dpi ?? q.get('dpi')) || undefined,
            printMargin: body.margin || q.get('margin') || printMargin,
            variant: body.variant || q.get('variant') || undefined,
            props: body.props,
            template: Boolean(body.template ?? q.get('template')),
          });
          json(res, 200, { ...result, source: loader.source(id) });
        } catch (err) {
          const e = err as Error;
          loader.vite.ssrFixStacktrace(e);
          json(res, 200, { error: { message: e.message, stack: e.stack }, source: loader.source(id) });
        }
      } else if (url.pathname === '/api/events') {
        res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' });
        res.write(': connected\n\n');
        clients.add(res);
        req.on('close', () => clients.delete(res));
      } else if (url.pathname === '/api/print' && req.method === 'POST') {
        const { host: printer, port: printerPort = 9100, zpl } = JSON.parse(await readBody(req));
        if (typeof printer !== 'string' || !printer || typeof zpl !== 'string') {
          json(res, 400, { error: 'host and zpl are required' });
          return;
        }
        await sendToPrinter(printer, Number(printerPort), zpl);
        json(res, 200, { ok: true });
      } else {
        res.writeHead(404).end('Not found');
      }
    } catch (err) {
      json(res, 500, { error: (err as Error).message });
    }
  });

  return new Promise<typeof server>((resolve) => server.listen(port, host, () => resolve(server)));
}
