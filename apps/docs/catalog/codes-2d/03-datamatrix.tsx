import { Barcode, Box, Label, Text } from '@caddy-industries/react-zpl';

export const title = 'Data Matrix';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['3x1', '2.25x1.25'];

export default function DataMatrix() {
  return (
    <Label width="2in" height="1in" className="flex items-center gap-3 px-3">
      <Barcode type="datamatrix" value="SN 8842-AX-0091" moduleWidth="5dots" />
      <Box className="gap-1">
        <Text className="text-xs">SERIAL</Text>
        <Text className="text-sm">8842-AX-0091</Text>
      </Box>
    </Label>
  );
}
