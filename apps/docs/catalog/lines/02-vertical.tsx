import { Fragment } from 'react';
import { Box, Label, Line, Text } from '@caddy-industries/react-zpl';

export const title = 'Vertical rules';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['3x1', '4x2'];

export default function Vertical() {
  return (
    <Label width="4in" height="1.25in" className="flex border-2 items-stretch">
      {[['QTY', '24'], ['UNIT', 'EA'], ['WEIGHT', '3.2 LB']].map(([key, value], i) => (
        <Fragment key={key}>
          {i > 0 && <Line vertical />}
          <Box className="flex-1 items-center justify-center">
            <Text className="text-xs">{key}</Text>
            <Text className="text-3xl">{value}</Text>
          </Box>
        </Fragment>
      ))}
    </Label>
  );
}
