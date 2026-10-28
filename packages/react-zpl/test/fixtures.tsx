import { Barcode, Box, Label, Line, QRCode, Text } from '../src';

/** Labels used by snapshot tests and the Labelary comparison script. */
export const fixtures = {
  text: (
    <Label width="4in" height="3in">
      <Box className="p-4 gap-2">
        <Text className="text-3xl">Hello World</Text>
        <Text className="text-sm">
          The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs. 0123456789
        </Text>
        <Box className="flex gap-2 items-center">
          <Text className="bg-black text-white px-2 py-1 text-xl">FRAGILE</Text>
          <Text className="text-xl uppercase">handle with care</Text>
        </Box>
        <Text className="text-center text-2xl border-2 p-2">Centered</Text>
      </Box>
    </Label>
  ),
  shapes: (
    <Label width="4in" height="2in">
      <Box className="p-4 flex gap-4 h-full">
        <Box className="border-4 rounded-xl flex-1" />
        <Box className="bg-black rounded-full w-24 h-24" />
        <Line vertical thickness={4} />
        <Box className="flex-1 border-t-8 border-l-2" />
      </Box>
    </Label>
  ),
  barcodes: (
    <Label width="4in" height="6in">
      <Box className="p-4 gap-4">
        <Barcode value="ABC-12345" />
        <Barcode type="code39" value="CODE39" height={30} />
        <Box className="flex gap-6">
          <Barcode type="ean13" value="400638133393" />
          <Barcode type="upca" value="03600029145" />
        </Box>
        <Box className="flex gap-6 items-end">
          <QRCode value="https://example.com/track/1Z999AA10123456784" />
          <Barcode type="datamatrix" value="ABC123456789" />
          <Barcode type="pdf417" value="PDF417 SAMPLE DATA" columns={3} />
        </Box>
      </Box>
    </Label>
  ),
  rotation: (
    <Label width="3in" height="3in">
      <Box className="p-4 flex gap-4 h-full items-start">
        <Text rotate={90} className="text-2xl">Rotated 90</Text>
        <Text rotate={180} className="text-2xl">Rotated 180</Text>
        <Text rotate={270} className="text-2xl">Rotated 270</Text>
      </Box>
    </Label>
  ),
};
