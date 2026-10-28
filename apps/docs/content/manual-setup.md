---
title: Manual setup
description: Use react-zpl inside an existing Node.js project.
---

## Install

```sh
npm install @caddy-industries/react-zpl react
```

react-zpl is ESM only and needs Node.js 20 or later. Your `tsconfig.json` needs `"jsx": "react-jsx"`.

## Render a label

```tsx
import { Label, Text, render } from '@caddy-industries/react-zpl';

function Hello({ name }: { name: string }) {
  return (
    <Label width="2in" height="1in" className="items-center justify-center">
      <Text className="text-2xl">Hello, {name}</Text>
    </Label>
  );
}

const zpl = await render(<Hello name="Jordan" />);
```

`render` returns the ZPL as a string:

```zpl
^XA
^CI28
^PW406
^LL203
^FO...^A0N,...^FDHello, Jordan^FS
^XZ
```

## Next steps

:::cards
- [Network printer](#network-printer) Send the string to a printer.
- [render()](#render) Options for resolution, stock size and margins.
:::
