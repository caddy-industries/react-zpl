import { Label, Text } from '@caddy-industries/react-zpl';

export const title = 'Type scale';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x3', '4x6'];

const textSizes = ['text-xs', 'text-sm', 'text-base', 'text-xl', 'text-3xl', 'text-5xl'];

export default function Sizes() {
  return (
    <Label width="4in" height="2.5in" className="p-4 gap-1">
      {textSizes.map((size) => (
        <Text key={size} className={size}>
          {size} Printer font 0
        </Text>
      ))}
    </Label>
  );
}
