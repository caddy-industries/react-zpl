import { Box, Label, Text } from '@caddy-industries/react-zpl';

export const title = 'Metric size at 300 dpi';

export default function Metric() {
  return (
    <Label width="100mm" height="50mm" dpi={300} className="p-3">
      <Box className="border-2 h-full items-center justify-center gap-1">
        <Text className="text-4xl">100 × 50 mm</Text>
        <Text className="text-base">Sizes in mm, in, px or dots</Text>
      </Box>
    </Label>
  );
}
