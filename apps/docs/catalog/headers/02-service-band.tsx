import { Box, Label, Text } from '@caddy-industries/react-zpl';

export const title = 'Service band';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['3x1', '4x2'];

export default function ServiceBand() {
  return (
    <Label width="4in" height="1in" className="justify-center">
      <Box className="bg-black flex justify-between items-center px-4 py-2">
        <Text className="text-white text-3xl uppercase">Ground</Text>
        <Text className="text-white text-xl">3.2 LB</Text>
      </Box>
      <Box className="flex justify-between px-4 py-1">
        <Text className="text-xs">SHIP DATE 2026-10-27</Text>
        <Text className="text-xs">ZONE 4</Text>
      </Box>
    </Label>
  );
}
