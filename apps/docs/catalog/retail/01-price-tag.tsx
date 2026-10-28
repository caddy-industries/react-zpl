import { Barcode, Box, Label, Text } from '@caddy-industries/react-zpl';

export const title = 'Price tag';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['2x1', '3x1'];

export default function PriceTag() {
  return (
    <Label width="2.25in" height="1.25in" className="p-2 gap-1">
      <Text className="text-sm" maxLines={2} ellipsis>Organic Cold Brew Coffee Concentrate</Text>
      <Box className="flex justify-between items-end flex-1">
        <Text className="text-4xl">$14.99</Text>
        <Barcode type="upca" value="03600029145" height="0.35in" moduleWidth="1dots" showText={false} />
      </Box>
    </Label>
  );
}
