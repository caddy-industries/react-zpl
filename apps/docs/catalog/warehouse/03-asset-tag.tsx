import { Box, Label, QRCode, Text } from '@caddy-industries/react-zpl';

export const title = 'Asset tag';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['2.25x1.25', '3x1'];

export default function AssetTag() {
  return (
    <Label width="2in" height="1in" className="flex items-center gap-2 p-2 border-2 rounded-lg">
      <QRCode value="https://it.example/a/000981" moduleSize="3dots" />
      <Box className="flex-1 gap-1">
        <Text className="text-xs">PROPERTY OF ACME</Text>
        <Text className="text-xl">A-000981</Text>
        <Text className="text-xs">it.example</Text>
      </Box>
    </Label>
  );
}
