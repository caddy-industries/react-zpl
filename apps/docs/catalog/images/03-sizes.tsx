import { readFileSync } from 'node:fs';
import { Image, Label } from '@caddy-industries/react-zpl';

export const title = 'Image sizes';
/** Other stock sizes (inches) shown in the docs. */
export const sizes = ['4x2', '4x1'];

const logo = readFileSync(new URL('../assets/logo.png', import.meta.url));

export default function ImageSizes() {
  return (
    <Label width="3in" height="1.25in" className="flex items-center justify-around">
      <Image src={logo} className="w-8" />
      <Image src={logo} className="w-14" />
      <Image src={logo} className="w-20" />
    </Label>
  );
}
