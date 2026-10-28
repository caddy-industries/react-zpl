import { Barcode, Box, Label, Line, Text } from '@caddy-industries/react-zpl';

export const title = 'Pallet label';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x8'];

export default function Pallet() {
  return (
    <Label width="4in" height="6in" className="p-4 gap-3">
      <Text className="text-xs">SSCC</Text>
      <Text className="text-3xl">(00) 0 0614141 123456789 0</Text>
      <Line thickness={4} />
      <Box className="flex gap-4">
        <Box className="flex-1 gap-1">
          <Text className="text-xs">CONTENT</Text>
          <Text className="text-xl">Cold Brew 32oz</Text>
        </Box>
        <Box className="gap-1">
          <Text className="text-xs">COUNT</Text>
          <Text className="text-xl">96</Text>
        </Box>
      </Box>
      <Box className="flex gap-4">
        <Box className="flex-1 gap-1">
          <Text className="text-xs">BATCH</Text>
          <Text className="text-xl">L-2026-1027</Text>
        </Box>
        <Box className="gap-1">
          <Text className="text-xs">BEST BEFORE</Text>
          <Text className="text-xl">2027-04-30</Text>
        </Box>
      </Box>
      <Line />
      <Box className="flex-1 items-center justify-center">
        <Barcode value="00006141411234567890" height="1.2in" moduleWidth="2dots" />
      </Box>
    </Label>
  );
}
