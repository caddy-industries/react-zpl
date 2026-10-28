import { Box, Label, Text } from '@caddy-industries/react-zpl';

export const title = 'White on black';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x2', '4x1'];

export default function Reversed() {
  return (
    <Label width="3in" height="1.5in" className="p-3 gap-2">
      <Box className="bg-black rounded-lg px-3 py-2 items-center">
        <Text className="text-white text-3xl">OVERNIGHT</Text>
      </Box>
      <Box className="flex gap-2">
        <Box className="flex-1 bg-black px-2 py-1"><Text className="text-white text-sm text-center">HAZMAT</Text></Box>
        <Box className="flex-1 border-2 px-2 py-1"><Text className="text-sm text-center">KEEP DRY</Text></Box>
      </Box>
    </Label>
  );
}
