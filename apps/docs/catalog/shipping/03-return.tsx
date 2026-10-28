import { Barcode, Box, Label, Line, Text } from '@caddy-industries/react-zpl';

export const title = 'Prepaid return label';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x6', '4x5'];

export default function Return() {
  return (
    <Label width="4in" height="4in" className="p-4 gap-3">
      <Box className="flex justify-between items-center">
        <Text className="text-3xl">RETURN</Text>
        <Box className="border-2 rounded px-2 py-1"><Text className="text-sm">PREPAID</Text></Box>
      </Box>
      <Line thickness={4} />
      <Box className="gap-1">
        <Text className="text-xs">DELIVER TO</Text>
        <Text className="text-xl">Acme Returns Center</Text>
        <Text className="text-base">500 Industrial Pkwy, Reno, NV 89502</Text>
      </Box>
      <Box className="flex-1 items-center justify-center">
        <Barcode value="RMA20431" height="0.8in" moduleWidth="3dots" />
      </Box>
      <Text className="text-xs text-center">Drop off at any Parcel Co. location. No printer? Show this code.</Text>
    </Label>
  );
}
