import { Barcode, Box, Label, Text } from '@caddy-industries/react-zpl';

interface ProductTagProps {
  name: string;
  variant: string;
  price: string;
  sku: string;
  ean: string;
}

/** A 2 x 1 inch shelf tag. */
export default function ProductTag({ name, variant, price, sku, ean }: ProductTagProps) {
  return (
    <Label width="2in" height="1in" className="px-2 py-1 flex gap-2">
      <Box className="flex-1 justify-between">
        <Box>
          <Text className="text-sm" maxLines={2}>
            {name}
          </Text>
          <Text className="text-xs truncate">{variant}</Text>
        </Box>
        <Text className="text-3xl leading-none">{price}</Text>
        <Text className="text-[9px]">SKU {sku}</Text>
      </Box>
      <Box className="justify-center">
        <Barcode type="ean13" value={ean} height={34} moduleWidth="1dot" textSize={11} />
      </Box>
    </Label>
  );
}

ProductTag.PreviewProps = {
  name: 'Organic Cold Brew Coffee Concentrate',
  variant: '32 fl oz · Medium',
  price: '$14.99',
  sku: 'CB-32-MED',
  ean: '400638133393',
} satisfies ProductTagProps;

ProductTag.PreviewVariants = {
  'Short name': { name: 'Green Tea', variant: '20 bags' },
  'Sale price': { price: '$9.99' },
} satisfies Record<string, Partial<ProductTagProps>>;
