import { readFileSync } from 'node:fs';
import { Box, Image, Label, Text } from '@caddy-industries/react-zpl';

export const title = 'Inverted on a black band';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x1', '4x2'];

const logo = readFileSync(new URL('../assets/logo.png', import.meta.url));

export default function Inverted() {
  return (
    <Label width="3in" height="1in" className="flex items-center gap-3 px-4 bg-black">
      <Image src={logo} invert className="w-14" />
      <Text className="text-white text-3xl">PARCEL CO.</Text>
    </Label>
  );
}
