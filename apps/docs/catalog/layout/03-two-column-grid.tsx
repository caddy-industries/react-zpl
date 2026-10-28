import { Box, Label, Text } from '@caddy-industries/react-zpl';

export const title = 'Key and value grid';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x3', '4x2'];

const rows = [
  ['Lot', 'L-2026-1027'],
  ['Expires', '2027-04-30'],
  ['Net weight', '12.5 kg'],
  ['Origin', 'Reno, NV'],
];

export default function Grid() {
  return (
    <Label width="3in" height="2in" className="p-4 gap-2">
      {rows.map(([key, value]) => (
        <Box key={key} className="flex">
          <Text className="w-1/2 text-sm uppercase">{key}</Text>
          <Text className="w-1/2 text-lg">{value}</Text>
        </Box>
      ))}
    </Label>
  );
}
