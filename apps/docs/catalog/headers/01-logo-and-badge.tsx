import { readFileSync } from 'node:fs';
import { Box, Image, Label, Text } from '@caddy-industries/react-zpl';

export const title = 'Logo with service badge';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x2', '4x1.5'];

const logo = readFileSync(new URL('../assets/logo.png', import.meta.url));

export default function LogoAndBadge() {
  return (
    <Label width="4in" height="1.25in" className="flex items-center justify-between px-4">
      <Box className="flex items-center gap-3">
        <Image src={logo} className="w-12" />
        <Box>
          <Text className="text-2xl">PARCEL CO.</Text>
          <Text className="text-xs">parcelco.example</Text>
        </Box>
      </Box>
      <Box className="bg-black rounded px-3 py-2 items-center">
        <Text className="text-white text-4xl leading-none">P</Text>
        <Text className="text-white text-xs">PRIORITY</Text>
      </Box>
    </Label>
  );
}
