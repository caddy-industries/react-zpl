/** Catalog sections, in page order. Each folder of the same name holds its examples. */
export const categories = [
  { slug: 'label', title: 'Label', kind: 'Components', description: 'The root of every label: page size, resolution and the printer margin.' },
  { slug: 'layout', title: 'Box', kind: 'Components', description: 'Flexbox rows and columns, spacing and absolute positioning.' },
  { slug: 'text', title: 'Text', kind: 'Components', description: 'Printer font 0 at any size, aligned, wrapped, rotated or reversed out of black.' },
  { slug: 'lines', title: 'Lines & borders', kind: 'Components', description: 'Dividers, vertical rules and boxed or rounded frames.' },
  { slug: 'barcodes', title: 'Barcode', kind: 'Components', description: 'Linear barcodes drawn by the printer: Code 128, Code 39, EAN-13 and UPC-A.' },
  { slug: 'codes-2d', title: 'QR & 2D codes', kind: 'Components', description: 'QR codes, Data Matrix and PDF417 for links, serials and dense data.' },
  { slug: 'images', title: 'Image', kind: 'Components', description: 'PNG logos and icons, converted to 1-bit graphics for the printer.' },
  { slug: 'headers', title: 'Headers', kind: 'Patterns', description: 'Top-of-label blocks with a logo, a carrier name and a service badge.' },
  { slug: 'addresses', title: 'Addresses', kind: 'Patterns', description: 'Sender and recipient blocks sized for sorting at a glance.' },
  { slug: 'shipping', title: 'Shipping labels', kind: 'Templates', description: 'Complete 4 × 6 in parcel labels with routing, tracking and references.' },
  { slug: 'retail', title: 'Retail tags', kind: 'Templates', description: 'Price tags and shelf labels with UPC and EAN barcodes.' },
  { slug: 'warehouse', title: 'Warehouse', kind: 'Templates', description: 'Bin locations, pallet labels and asset tags.' },
] as const;

/** Common thermal label stock sizes, in inches, and what they're usually for. */
export const stockNames: Record<string, string> = {
  '4x6': 'Shipping',
  '4x8': 'Freight',
  '4x4': 'Square',
  '4x3': 'Carton',
  '4x2': 'Wide',
  '3x2': 'Product',
  '3x1': 'Barcode',
  '2.25x1.25': 'Retail',
  '2x1': 'Small',
};
