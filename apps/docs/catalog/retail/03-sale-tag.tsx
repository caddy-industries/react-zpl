import { Box, Label, Text } from '@caddy-industries/react-zpl';

export const title = 'Sale tag';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['3x2', '4x4'];

export default function SaleTag() {
  return (
    <Label width="2in" height="2in" className="p-2">
      <Box className="bg-black rounded-xl h-full items-center justify-center gap-1">
        <Text className="text-white text-xl">SALE</Text>
        <Text className="text-white text-6xl">30%</Text>
        <Text className="text-white text-sm">OFF MARKED PRICE</Text>
      </Box>
    </Label>
  );
}
