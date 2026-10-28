import { Box, Label, Text } from '@caddy-industries/react-zpl';

export const title = '2 × 1 in small label';

export default function TwoByOne() {
  return (
    <Label width="2in" height="1in" className="p-2">
      <Box className="border-2 rounded h-full items-center justify-center">
        <Text className="text-3xl">2 × 1 in</Text>
        <Text className="text-xs">406 × 203 dots</Text>
      </Box>
    </Label>
  );
}
