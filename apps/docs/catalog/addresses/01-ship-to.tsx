import { Box, Label, Text } from '@caddy-industries/react-zpl';

export const title = 'Ship to';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x3', '4x4'];

export default function ShipTo() {
  return (
    <Label width="4in" height="2in" className="p-4">
      <Box className="gap-1">
        <Text className="text-xs uppercase">Ship to</Text>
        <Text className="text-2xl">Jordan Rivera</Text>
        <Text className="text-xl">Rivera Design Studio</Text>
        <Text className="text-xl">1200 Market St, Suite 4</Text>
        <Text className="text-xl">San Francisco, CA 94103</Text>
      </Box>
    </Label>
  );
}
