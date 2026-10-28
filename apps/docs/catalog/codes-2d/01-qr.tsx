import { Box, Label, QRCode, Text } from '@caddy-industries/react-zpl';

export const title = 'QR code with a link';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x2', '2.25x1.25'];

export default function Qr() {
  return (
    <Label width="3in" height="1.5in" className="flex items-center gap-4 p-4">
      <QRCode value="https://parcelco.example/t/1Z999AA10123456784" moduleSize="4dots" />
      <Box className="flex-1 gap-1">
        <Text className="text-xl">Track your parcel</Text>
        <Text className="text-xs">Scan with your phone camera</Text>
      </Box>
    </Label>
  );
}
