import { Box, Label, Text } from '@caddy-industries/react-zpl';

export const title = 'Printer margin';

// Most printers can't print to the very edge. printMargin lays the label out
// inside the printable area, so a full-size border still prints in full.
export default function PrintMargin() {
  return (
    <Label width="3in" height="2in" printMargin="2mm">
      <Box className="border-4 h-full items-center justify-center gap-1">
        <Text className="text-3xl">printMargin="2mm"</Text>
        <Text className="text-sm">The border stays inside the printable area</Text>
      </Box>
    </Label>
  );
}
