import { Box, Label, Text } from '@caddy-industries/react-zpl';

export const title = 'Rotated text';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x3', '4x2'];

export default function Rotated() {
  return (
    <Label width="3in" height="2in" className="flex p-3 gap-3">
      <Box className="bg-black px-1 justify-center">
        <Text rotate={270} className="text-white text-xl">PRIORITY</Text>
      </Box>
      <Box className="flex-1 justify-center gap-1">
        <Text className="text-2xl">Jordan Rivera</Text>
        <Text className="text-base">1200 Market St</Text>
        <Text className="text-base">San Francisco, CA</Text>
      </Box>
      <Text rotate={90} className="text-xs">SIDE A</Text>
    </Label>
  );
}
