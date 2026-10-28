import { readFileSync } from 'node:fs';
import { Barcode, Box, Image, Label, Line, QRCode, Text } from '@caddy-industries/react-zpl';

export const title = 'Parcel label';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x8', '4x6.5'];

const logo = readFileSync(new URL('../assets/logo.png', import.meta.url));

export default function Parcel() {
  const tracking = '1Z999AA10123456784';
  return (
    <Label width="4in" height="6in" className="p-3">
      <Box className="border-4 rounded-lg h-full">
        <Box className="flex items-center justify-between px-4 py-3">
          <Box className="flex items-center gap-3">
            <Image src={logo} className="w-12" />
            <Text className="text-2xl">PARCEL CO.</Text>
          </Box>
          <Box className="bg-black rounded px-3 py-2 items-center">
            <Text className="text-white text-4xl leading-none">P</Text>
            <Text className="text-white text-xs">PRIORITY</Text>
          </Box>
        </Box>
        <Line thickness={4} />
        <Box className="px-4 py-3 gap-1">
          <Text className="text-xs">FROM</Text>
          <Text className="text-sm">Acme Warehouse, 500 Industrial Pkwy, Reno, NV 89502</Text>
        </Box>
        <Line />
        <Box className="flex px-4 py-3 gap-4 items-center">
          <Box className="flex-1 gap-1">
            <Text className="text-xs">SHIP TO</Text>
            <Text className="text-2xl">Jordan Rivera</Text>
            <Text className="text-xl">1200 Market St, Suite 4</Text>
            <Text className="text-xl">San Francisco, CA 94103</Text>
          </Box>
          <QRCode value={`https://parcelco.example/t/${tracking}`} moduleSize="3dots" />
        </Box>
        <Box className="bg-black flex justify-between items-center px-4 py-2">
          <Text className="text-white text-2xl">PRIORITY 2-DAY</Text>
          <Text className="text-white text-xl">3.2 LB</Text>
        </Box>
        <Box className="flex-1 items-center justify-center gap-2 px-4">
          <Text className="text-sm">TRACKING #</Text>
          <Barcode value={tracking} height="0.9in" moduleWidth="2dots" textSize={18} />
        </Box>
        <Line />
        <Box className="flex justify-between px-4 py-2">
          <Text className="text-xs">REF: ORD-20431</Text>
          <Text className="text-xs">1 of 1</Text>
        </Box>
      </Box>
    </Label>
  );
}
