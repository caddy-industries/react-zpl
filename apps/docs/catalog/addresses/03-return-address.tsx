import { Box, Label, Text } from '@caddy-industries/react-zpl';

export const title = 'Return address strip';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x1', '3x1'];

export default function ReturnAddress() {
  return (
    <Label width="4in" height="0.75in" className="flex items-center gap-3 px-4">
      <Box className="border-2 px-2 py-1"><Text className="text-xs">RETURN</Text></Box>
      <Text className="flex-1 text-sm">Acme Warehouse · 500 Industrial Pkwy · Reno, NV 89502</Text>
    </Label>
  );
}
