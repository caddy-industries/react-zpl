---
title: HTTP API
description: Return labels from a web server.
---

## Express

```ts
import express from 'express';
import { render } from '@caddy-industries/react-zpl';

const app = express();

app.get('/orders/:id/label.zpl', async (req, res) => {
  const order = await getOrder(req.params.id);
  const dpi = Number(req.query.dpi) || 203;
  res.type('text/plain').send(await render(<ShippingLabel {...order} />, { dpi }));
});
```

## Next.js route handler

```ts
// app/orders/[id]/label/route.tsx
import { render } from '@caddy-industries/react-zpl';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const order = await getOrder((await params).id);
  return new Response(await render(<ShippingLabel {...order} />), {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
}
```

## Previews

Serve an SVG preview from the same route with [`renderToSvg`](#render-to-svg), for example to show the label in an admin page before printing.
