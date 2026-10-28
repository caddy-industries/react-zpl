import { Barcode, Box, Label, QRCode, Text } from '@caddy-industries/react-zpl';

interface InventoryBinProps {
  location: string;
  zone: string;
  aisle: string;
  shelf: string;
  bin: string;
}

/** A 3 x 2 inch warehouse bin label with rotated text and a DataMatrix. */
export default function InventoryBin({ location, zone, aisle, shelf, bin }: InventoryBinProps) {
  const cells = [
    ['ZONE', zone],
    ['AISLE', aisle],
    ['SHELF', shelf],
    ['BIN', bin],
  ];
  return (
    <Label width="3in" height="2in" className="flex">
      <Box className="bg-black justify-center items-center px-1">
        <Text rotate={270} className="text-white text-lg">
          WAREHOUSE A
        </Text>
      </Box>
      <Box className="flex-1 p-2 gap-2">
        <Box className="flex">
          {cells.map(([title, value], i) => (
            <Box key={title} className={`flex-1 items-center py-1 border-2 ${i > 0 ? 'border-l-0' : ''}`}>
              <Text className="text-[9px]">{title}</Text>
              <Text className="text-3xl leading-none">{value}</Text>
            </Box>
          ))}
        </Box>
        <Box className="flex flex-1 items-center gap-3">
          <Box className="flex-1 gap-1">
            <Barcode type="code39" value={location} height={42} moduleWidth="1dot" showText={false} />
            <Text className="text-xl">{location}</Text>
          </Box>
          <QRCode value={location} moduleSize="3dots" errorCorrection="H" />
        </Box>
      </Box>
    </Label>
  );
}

InventoryBin.PreviewProps = {
  location: 'A-04-C-12',
  zone: 'A',
  aisle: '04',
  shelf: 'C',
  bin: '12',
} satisfies InventoryBinProps;
