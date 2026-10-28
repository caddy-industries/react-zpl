import { readFileSync } from 'node:fs';
import { Barcode, Box, Image, Label, Line, QRCode, Text } from '@caddy-industries/react-zpl';

const logo = readFileSync(new URL('./assets/logo.png', import.meta.url));

interface Address {
  name: string;
  company?: string;
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface ShippingLabelProps {
  from: Address;
  to: Address;
  service: string;
  weight: string;
  tracking: string;
  reference: string;
}

function AddressBlock({ title, address, large }: { title: string; address: Address; large?: boolean }) {
  return (
    <Box className="gap-1">
      <Text className="text-xs uppercase">{title}</Text>
      <Text className={large ? 'text-2xl' : 'text-base'}>{address.name}</Text>
      {address.company && <Text className={large ? 'text-xl' : 'text-sm'}>{address.company}</Text>}
      <Text className={large ? 'text-xl' : 'text-sm'}>{address.street}</Text>
      <Text className={large ? 'text-xl' : 'text-sm'}>
        {address.city}, {address.state} {address.zip}
      </Text>
    </Box>
  );
}

export default function ShippingLabel({ from, to, service, weight, tracking, reference }: ShippingLabelProps) {
  return (
    <Label width="4in" height="6in" className="p-3">
      <Box className="border-4 rounded-lg h-full">
        {/* Header */}
        <Box className="flex items-center justify-between px-4 py-3">
          <Box className="flex items-center gap-3">
            <Image src={logo} className="w-12" />
            <Box>
              <Text className="text-2xl">PARCEL CO.</Text>
              <Text className="text-xs">parcelco.example</Text>
            </Box>
          </Box>
          <Box className="bg-black rounded px-3 py-2 items-center">
            <Text className="text-white text-4xl leading-none">P</Text>
            <Text className="text-white text-xs">PRIORITY</Text>
          </Box>
        </Box>
        <Line thickness={4} />

        {/* Addresses */}
        <Box className="px-4 py-3">
          <AddressBlock title="From" address={from} />
        </Box>
        <Line />
        <Box className="flex px-4 py-3 gap-4 items-center">
          <Box className="flex-1">
            <AddressBlock title="Ship to" address={to} large />
          </Box>
          <QRCode value={`https://parcelco.example/t/${tracking}`} moduleSize="3dots" />
        </Box>
        <Line thickness={4} />

        {/* Service band */}
        <Box className="bg-black flex justify-between items-center px-4 py-2">
          <Text className="text-white text-2xl uppercase">{service}</Text>
          <Text className="text-white text-xl">{weight}</Text>
        </Box>

        {/* Tracking barcode */}
        <Box className="flex-1 items-center justify-center gap-2 px-4">
          <Text className="text-sm">TRACKING #</Text>
          <Barcode value={tracking} height="0.9in" moduleWidth="2dots" textSize={18} />
        </Box>
        <Line />
        <Box className="flex justify-between px-4 py-2">
          <Text className="text-xs">REF: {reference}</Text>
          <Text className="text-xs">1 of 1</Text>
        </Box>
      </Box>
    </Label>
  );
}

ShippingLabel.PreviewProps = {
  from: { name: 'Acme Warehouse', street: '500 Industrial Pkwy', city: 'Reno', state: 'NV', zip: '89502' },
  to: {
    name: 'Jordan Rivera',
    company: 'Rivera Design Studio',
    street: '1200 Market St, Suite 4',
    city: 'San Francisco',
    state: 'CA',
    zip: '94103',
  },
  service: 'Priority 2-Day',
  weight: '3.2 LB',
  tracking: '1Z999AA10123456784',
  reference: 'ORD-20431',
} satisfies ShippingLabelProps;

// Extra examples for the viewer's Data menu. Each one is merged over PreviewProps.
ShippingLabel.PreviewVariants = {
  'Long address': {
    to: {
      name: 'Maximilian Alexander Featherstonehaugh',
      company: 'International Consolidated Logistics & Freight Forwarding',
      street: '98765 North Commerce Center Boulevard, Building 12, Dock 4',
      city: 'Salt Lake City',
      zip: '84101',
      state: 'UT',
    },
  },
  'No company': {
    to: { name: 'Sam Lee', company: undefined, street: '42 Elm St', city: 'Portland', state: 'OR', zip: '97205' },
  },
  Overnight: { service: 'Overnight', weight: '0.8 LB' },
} satisfies Record<string, Partial<ShippingLabelProps>>;
