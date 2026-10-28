import { Box, Label, Text } from '@caddy-industries/react-zpl';

export const title = 'Three columns';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x2', '4x3', '3x1'];

export default function Columns() {
  return (
    <Label width="4in" height="1.5in" className="p-3">
      <Box className="flex gap-3 h-full">
        {['ZONE', 'AISLE', 'SHELF'].map((name, i) => (
          <Box key={name} className="flex-1 border-2 rounded items-center justify-center">
            <Text className="text-xs">{name}</Text>
            <Text className="text-5xl">{['B', '07', 'C'][i]}</Text>
          </Box>
        ))}
      </Box>
    </Label>
  );
}
