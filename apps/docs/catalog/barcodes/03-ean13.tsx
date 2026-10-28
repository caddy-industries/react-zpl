import { Barcode, Label } from '@caddy-industries/react-zpl';

export const title = 'EAN-13';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['3x2', '4x2'];

export default function Ean13() {
  return (
    <Label width="2.5in" height="1.5in" className="items-center justify-center">
      <Barcode type="ean13" value="400638133393" height="0.9in" moduleWidth="2dots" />
    </Label>
  );
}
