import { Box, Label, Line, Text } from '@caddy-industries/react-zpl';

export const title = 'Routing code';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x2', '4x3'];

export default function RoutingCode() {
  return (
    <Label width="4in" height="1.5in" className="flex border-4">
      <Box className="w-1/3 items-center justify-center bg-black">
        <Text className="text-white text-6xl">SF4</Text>
      </Box>
      <Box className="flex-1 justify-center px-4 gap-1">
        <Text className="text-xs">SORT CENTER</Text>
        <Text className="text-2xl">OAKLAND HUB</Text>
        <Line />
        <Text className="text-sm">ROUTE 12 · STOP 31</Text>
      </Box>
    </Label>
  );
}
