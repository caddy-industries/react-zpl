import { Box, Label, Line, Text } from '@caddy-industries/react-zpl';

export const title = 'From and to';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x4', '4x6'];

function Address({ title, lines, large }: { title: string; lines: string[]; large?: boolean }) {
  return (
    <Box className="gap-1">
      <Text className="text-xs uppercase">{title}</Text>
      {lines.map((line, i) => (
        <Text key={line} className={large ? (i === 0 ? 'text-2xl' : 'text-xl') : 'text-sm'}>
          {line}
        </Text>
      ))}
    </Box>
  );
}

export default function FromAndTo() {
  return (
    <Label width="4in" height="3in" className="p-4 gap-3">
      <Address title="From" lines={['Acme Warehouse', '500 Industrial Pkwy', 'Reno, NV 89502']} />
      <Line />
      <Address title="Ship to" large lines={['Jordan Rivera', '1200 Market St, Suite 4', 'San Francisco, CA 94103']} />
    </Label>
  );
}
