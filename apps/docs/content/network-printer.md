---
title: Network printer
description: Send ZPL straight to a printer over TCP port 9100.
---

Most network label printers accept raw ZPL on TCP port 9100. Open a socket, write the string and close it.

```ts
import { Socket } from 'node:net';
import { render } from '@caddy-industries/react-zpl';

function print(host: string, zpl: string) {
  return new Promise<void>((resolve, reject) => {
    const socket = new Socket();
    socket.setTimeout(5000, () => socket.destroy(new Error('Printer timed out')));
    socket.once('error', reject);
    socket.connect(9100, host, () => socket.end(zpl, () => resolve()));
  });
}

await print('192.168.1.50', await render(<ShippingLabel {...order} />));
```

The **Print** button in [react-zpl dev](#cli-dev) does the same thing from the viewer.

> Match the label's `dpi` to the printer. A 300 dpi printer prints a 203 dpi label at about two thirds of its size.
