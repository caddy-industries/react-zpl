import { Label, Line, Text } from '@caddy-industries/react-zpl';

export const title = 'Wrapping and line limits';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x3', '4x2'];

const description =
  'Organic cold brew coffee concentrate, made from single-origin beans and steeped for twenty hours. Dilute one part concentrate with two parts water or milk.';

export default function Wrapping() {
  return (
    <Label width="3in" height="2.25in" className="p-4 gap-2">
      <Text className="text-sm">{description}</Text>
      <Line />
      <Text className="text-sm" maxLines={2} ellipsis>
        {description}
      </Text>
    </Label>
  );
}
