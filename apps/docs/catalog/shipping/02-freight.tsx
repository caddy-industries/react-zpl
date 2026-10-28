import { Barcode, Box, Label, Line, Text } from '@caddy-industries/react-zpl';

export const title = 'Freight label';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x8'];

export default function Freight() {
  return (
    <Label width="4in" height="6in" className="p-4 gap-3">
      <Box className="flex justify-between items-end">
        <Text className="text-4xl">FREIGHT</Text>
        <Text className="text-base">PRO 884-221-907</Text>
      </Box>
      <Line thickness={6} />
      <Box className="flex gap-4">
        <Box className="flex-1 gap-1">
          <Text className="text-xs">SHIPPER</Text>
          <Text className="text-sm">Acme Warehouse</Text>
          <Text className="text-sm">Reno, NV 89502</Text>
        </Box>
        <Box className="flex-1 gap-1">
          <Text className="text-xs">CONSIGNEE</Text>
          <Text className="text-sm">Bayview Retail DC</Text>
          <Text className="text-sm">Oakland, CA 94607</Text>
        </Box>
      </Box>
      <Line />
      <Box className="flex border-2">
        {[['PIECES', '4'], ['WEIGHT', '1,240 LB'], ['CLASS', '70']].map(([key, value]) => (
          <Box key={key} className="flex-1 items-center py-2">
            <Text className="text-xs">{key}</Text>
            <Text className="text-2xl">{value}</Text>
          </Box>
        ))}
      </Box>
      <Box className="flex-1 items-center justify-center gap-2">
        <Barcode value="884221907" height="1.1in" moduleWidth="3dots" />
      </Box>
      <Box className="bg-black items-center py-2">
        <Text className="text-white text-xl">DO NOT DOUBLE STACK</Text>
      </Box>
    </Label>
  );
}
