import { Barcode, Box, Label, Text } from '@caddy-industries/react-zpl';

export const title = 'Bin location';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x3', '4x1.5'];

export default function BinLocation() {
  return (
    <Label width="4in" height="2in" className="flex p-3 gap-3">
      <Box className="bg-black rounded px-4 items-center justify-center">
        <Text className="text-white text-xs">ZONE</Text>
        <Text className="text-white text-7xl">A</Text>
      </Box>
      <Box className="flex-1 justify-between">
        <Text className="text-5xl">04-C-12</Text>
        <Barcode type="code39" value="A-04-C-12" showText={false} height="0.6in" moduleWidth="2dots" />
      </Box>
    </Label>
  );
}
