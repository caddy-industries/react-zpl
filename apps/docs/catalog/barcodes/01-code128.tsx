import { Barcode, Label } from '@caddy-industries/react-zpl';

export const title = 'Code 128';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x2', '4x3'];

export default function Code128() {
  return (
    <Label width="4in" height="1.5in" className="items-center justify-center">
      <Barcode value="1Z999AA10123456784" height="0.8in" moduleWidth="2dots" />
    </Label>
  );
}
