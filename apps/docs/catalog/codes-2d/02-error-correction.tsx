import { Box, Label, QRCode, Text } from '@caddy-industries/react-zpl';

export const title = 'Error correction levels';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x2', '4x3'];

export default function ErrorCorrection() {
  return (
    <Label width="4in" height="1.75in" className="flex justify-around items-center">
      {(['L', 'M', 'Q', 'H'] as const).map((level) => (
        <Box key={level} className="items-center gap-2">
          <QRCode value="ASSET-000981" errorCorrection={level} moduleSize="4dots" />
          <Text className="text-xs">LEVEL {level}</Text>
        </Box>
      ))}
    </Label>
  );
}
