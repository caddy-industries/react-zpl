import { Label, Text } from '@caddy-industries/react-zpl';

export const title = 'Alignment';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x2', '4x3'];

export default function Alignment() {
  return (
    <Label width="3in" height="1.5in" className="p-4 gap-2 border-2">
      <Text className="text-xl text-left">Left aligned</Text>
      <Text className="text-xl text-center">Centered</Text>
      <Text className="text-xl text-right">Right aligned</Text>
    </Label>
  );
}
