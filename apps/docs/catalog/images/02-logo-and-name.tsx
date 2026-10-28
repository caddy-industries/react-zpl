import { readFileSync } from 'node:fs';
import { Box, Image, Label, Text } from '@caddy-industries/react-zpl';

export const title = 'Logo with a wordmark';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x2', '4x1'];

const logo = readFileSync(new URL('../assets/logo.png', import.meta.url));

export default function LogoAndName() {
  return (
    <Label width="3in" height="1in" className="flex items-center gap-3 px-4">
      <Image src={logo} className="w-14" />
      <Box>
        <Text className="text-3xl">PARCEL CO.</Text>
        <Text className="text-xs">parcelco.example</Text>
      </Box>
    </Label>
  );
}
