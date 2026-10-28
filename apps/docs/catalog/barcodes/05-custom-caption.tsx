import { Barcode, Box, Label, Text } from '@caddy-industries/react-zpl';

export const title = 'Barcode with your own caption';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x2', '4x3'];

export default function CustomCaption() {
  return (
    <Label width="4in" height="1.5in" className="items-center justify-center gap-2">
      <Barcode value="SSCC00123456789012345" showText={false} height="0.7in" moduleWidth="2dots" />
      <Box className="flex gap-4">
        <Text className="text-xs">(00)</Text>
        <Text className="text-base">1234 5678 9012 345</Text>
      </Box>
    </Label>
  );
}
