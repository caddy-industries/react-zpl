import { Box, Label, Text } from '@caddy-industries/react-zpl';

export const title = 'Borders and rounded corners';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x2', '3x1'];

export default function Borders() {
  return (
    <Label width="4in" height="1.25in" className="flex p-3 gap-3">
      <Box className="flex-1 border items-center justify-center"><Text>border</Text></Box>
      <Box className="flex-1 border-4 items-center justify-center"><Text>border-4</Text></Box>
      <Box className="flex-1 border-4 rounded-xl items-center justify-center"><Text>rounded-xl</Text></Box>
    </Label>
  );
}
