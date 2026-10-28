import { Barcode, Label } from '@caddy-industries/react-zpl';

export const title = 'Code 39';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['3x1', '4x2'];

export default function Code39() {
  return (
    <Label width="4in" height="1.5in" className="items-center justify-center">
      <Barcode type="code39" value="PART-4471" height="0.8in" moduleWidth="2dots" />
    </Label>
  );
}
