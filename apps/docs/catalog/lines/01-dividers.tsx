import { Fragment } from 'react';
import { Label, Line, Text } from '@caddy-industries/react-zpl';

export const title = 'Dividers';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x2', '4x3'];

export default function Dividers() {
  return (
    <Label width="3in" height="2in" className="p-4 gap-2">
      {[1, 2, 4, 8].map((thickness) => (
        <Fragment key={thickness}>
          <Text className="text-xs">{`thickness={${thickness}}`}</Text>
          <Line thickness={thickness} />
        </Fragment>
      ))}
    </Label>
  );
}
