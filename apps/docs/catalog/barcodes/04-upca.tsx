import { Barcode, Label } from '@caddy-industries/react-zpl';

export const title = 'UPC-A';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['3x2', '4x2'];

export default function UpcA() {
  return (
    <Label width="2.5in" height="1.5in" className="items-center justify-center">
      <Barcode type="upca" value="03600029145" height="0.9in" moduleWidth="2dots" />
    </Label>
  );
}
