import { Box, Label, Text } from '@caddy-industries/react-zpl';

export const title = 'Absolute positioning';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x4', '4x2'];

export default function Absolute() {
  return (
    <Label width="3in" height="2in" className="border-4 items-center justify-center">
      <Text className="text-5xl">FRAGILE</Text>
      <Box className="absolute top-3 left-3 bg-black rounded px-2 py-1">
        <Text className="text-white text-sm">HANDLE WITH CARE</Text>
      </Box>
      <Text className="absolute bottom-3 right-3 text-xs">THIS SIDE UP</Text>
    </Label>
  );
}
