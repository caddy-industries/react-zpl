import { Box, Label, Line, Text } from '@caddy-industries/react-zpl';

export const title = 'Space between';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x2', '3x1'];

export default function SpaceBetween() {
  return (
    <Label width="4in" height="1.25in" className="px-4 py-3 gap-2">
      <Box className="flex justify-between items-center">
        <Text className="text-2xl">ORDER 20431</Text>
        <Text className="text-base">Box 1 of 3</Text>
      </Box>
      <Line />
      <Box className="flex justify-between">
        <Text className="text-sm">Packed 2026-10-27</Text>
        <Text className="text-sm">Station 4</Text>
      </Box>
    </Label>
  );
}
