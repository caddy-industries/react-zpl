import { Box, Label, Text } from '@caddy-industries/react-zpl';

export const title = '4 × 6 in shipping size';

export default function FourBySix() {
  return (
    <Label width="4in" height="6in" className="p-4">
      <Box className="border-4 rounded-lg h-full items-center justify-center gap-2">
        <Text className="text-6xl">4 × 6 in</Text>
        <Text className="text-xl">812 × 1218 dots at 203 dpi</Text>
      </Box>
    </Label>
  );
}
