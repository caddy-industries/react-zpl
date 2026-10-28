import { Barcode, Box, Label, Line, Text } from '@caddy-industries/react-zpl';

export const title = 'Shelf label';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x1.25', '4x2'];

export default function ShelfTag() {
  return (
    <Label width="3in" height="1.25in" className="flex p-2 gap-3">
      <Box className="flex-1 justify-between">
        <Text className="text-base" maxLines={2} ellipsis>Sparkling Mineral Water, Lime, 12 × 355 ml</Text>
        <Line />
        <Box className="flex justify-between items-end">
          <Text className="text-xs">$0.42 / 100 ml</Text>
          <Text className="text-3xl">$17.99</Text>
        </Box>
      </Box>
      <Barcode type="ean13" value="400638133393" height="0.6in" moduleWidth="1dots" />
    </Label>
  );
}
