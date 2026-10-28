---
title: Browser printing
description: Print labels from a web app through a print service on the user's computer.
---

Browsers can't send raw data to a USB printer by themselves. A small print service on the user's computer does it, and your page passes it the ZPL. Render the label on your server, then hand the string to the service.

## Zebra Browser Print

Zebra's free service for its own printers:

```js
const zpl = await fetch(`/orders/${id}/label.zpl`).then((r) => r.text());

BrowserPrint.getDefaultDevice('printer', (printer) => printer.send(zpl));
```

## QZ Tray

Works with Zebra and other printers that accept raw ZPL:

```js
const config = qz.configs.create('Zebra ZD421');
await qz.print(config, [{ type: 'raw', format: 'command', flavor: 'plain', data: zpl }]);
```

Check each service's own docs for setup and security settings.
