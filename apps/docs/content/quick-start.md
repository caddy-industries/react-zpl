---
title: Quick start
description: Set up a labels folder and preview your first label in a few minutes.
---

## 1. Install

```sh
npm install @caddy-industries/react-zpl react
npm install -D @caddy-industries/react-zpl-cli
```

## 2. Create a label

Make a `labels` folder. Each `.tsx` file in it default-exports a component that returns a `<Label>`. `PreviewProps` gives the viewer sample data.

```tsx
// labels/shipping.tsx
import { Barcode, Box, Label, Text } from '@caddy-industries/react-zpl';

interface Props {
  name: string;
  tracking: string;
}

export default function Shipping({ name, tracking }: Props) {
  return (
    <Label width="4in" height="6in" className="p-4 gap-3">
      <Text className="text-xs uppercase">Ship to</Text>
      <Text className="text-3xl">{name}</Text>
      <Box className="flex-1 items-center justify-center">
        <Barcode value={tracking} height="1in" />
      </Box>
    </Label>
  );
}

Shipping.PreviewProps = { name: 'Jordan Rivera', tracking: '1Z999AA10123456784' } satisfies Props;
```

## 3. Preview it

```sh
npx react-zpl dev
```

Open [http://localhost:3000](http://localhost:3000). The preview reloads every time you save. See [react-zpl dev](#cli-dev) for what the viewer can do.

## 4. Export or render

Write every label to `.zpl` files:

```sh
npx react-zpl export --out out
```

Or render one from your own code. See [Manual setup](#manual-setup).
