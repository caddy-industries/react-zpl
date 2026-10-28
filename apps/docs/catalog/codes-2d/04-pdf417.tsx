import { Barcode, Label } from '@caddy-industries/react-zpl';

export const title = 'PDF417';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x2', '4x3'];

export default function Pdf417() {
  return (
    <Label width="4in" height="1.5in" className="items-center justify-center">
      <Barcode type="pdf417" value="ORD-20431|SHIP 2026-10-27|3 PKG|3.2 LB" columns={6} height="6dots" moduleWidth="2dots" />
    </Label>
  );
}
