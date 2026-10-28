import { readFileSync } from 'node:fs';
import { Image, Label } from '@caddy-industries/react-zpl';

export const title = 'Logo';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['3x2', '4x2'];

const logo = readFileSync(new URL('../assets/logo.png', import.meta.url));

export default function Logo() {
  return (
    <Label width="2in" height="1in" className="items-center justify-center">
      <Image src={logo} className="w-20" />
    </Label>
  );
}
