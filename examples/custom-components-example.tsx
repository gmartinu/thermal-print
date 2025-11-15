/**
 * Custom Components Example
 *
 * This example demonstrates how to use the adapter system to create
 * thermal printer-specific React components with custom naming.
 *
 * Benefits:
 * - Semantic component names (Receipt, Item, etc.)
 * - No dependency on @react-pdf/renderer
 * - Thermal printer-focused API
 */

import React from 'react';
import { convertToESCPOS } from '../src/index';
import fs from 'fs';

// ============================================================================
// 1. Define Custom Thermal Printer Components
// ============================================================================

// Top-level receipt container
const Receipt = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
);

// Store header component
const StoreHeader = ({
  name,
  address,
  phone,
}: {
  name: string;
  address?: string;
  phone?: string;
}) => (
  <div>
    <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 20 }}>
      {name}
    </div>
    {address && <div style={{ textAlign: 'center' }}>{address}</div>}
    {phone && <div style={{ textAlign: 'center' }}>{phone}</div>}
  </div>
);

// Divider line
const Divider = ({ type = 'solid' }: { type?: 'solid' | 'dashed' }) => (
  <div style={{ borderBottom: type === 'solid' ? '1px solid black' : '1px dashed black' }} />
);

// Item row with label and price
const ItemRow = ({
  label,
  price,
  quantity,
}: {
  label: string;
  price: number;
  quantity?: number;
}) => (
  <div style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    <span>
      {quantity && `${quantity}x `}
      {label}
    </span>
    <span>${price.toFixed(2)}</span>
  </div>
);

// Total row
const TotalRow = ({ label, amount }: { label: string; amount: number }) => (
  <div style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    <span style={{ fontWeight: 'bold' }}>{label}</span>
    <span style={{ fontWeight: 'bold' }}>${amount.toFixed(2)}</span>
  </div>
);

// Section spacer
const Spacer = ({ lines = 1 }: { lines?: number }) => (
  <div style={{ marginTop: lines, marginBottom: lines }} />
);

// Info text
const InfoText = ({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}) => (
  <div style={{ textAlign: align }}>
    <span>{children}</span>
  </div>
);

// ============================================================================
// 2. Build Receipt Using Custom Components
// ============================================================================

const CoffeeShopReceipt = ({
  orderNumber,
  items,
  subtotal,
  tax,
  total,
}: {
  orderNumber: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  subtotal: number;
  tax: number;
  total: number;
}) => (
  <Receipt>
    <StoreHeader
      name="COFFEE HOUSE"
      address="123 Main Street, Suite 100"
      phone="(555) 123-4567"
    />

    <Spacer lines={1} />
    <Divider type="solid" />

    <InfoText align="center">Order #{orderNumber}</InfoText>
    <InfoText align="center">{new Date().toLocaleString()}</InfoText>

    <Divider type="solid" />
    <Spacer lines={1} />

    {items.map((item, index) => (
      <ItemRow
        key={index}
        label={item.name}
        price={item.price * item.quantity}
        quantity={item.quantity}
      />
    ))}

    <Spacer lines={1} />
    <Divider type="dashed" />

    <ItemRow label="Subtotal" price={subtotal} />
    <ItemRow label="Tax" price={tax} />

    <Divider type="solid" />
    <TotalRow label="TOTAL" amount={total} />
    <Divider type="solid" />

    <Spacer lines={2} />
    <InfoText align="center">Thank you for your order!</InfoText>
    <InfoText align="center">Visit us again soon</InfoText>
  </Receipt>
);

// ============================================================================
// 3. Define Component Mapping
// ============================================================================

const thermalPrinterAdapter = {
  // Custom components
  Receipt: 'document',
  StoreHeader: 'view',
  Divider: 'view',
  ItemRow: 'view',
  TotalRow: 'view',
  Spacer: 'view',
  InfoText: 'view',

  // Standard HTML elements used by our components
  div: 'view',
  span: 'text',
};

// ============================================================================
// 4. Convert and Save
// ============================================================================

async function generateReceipt() {
  const sampleData = {
    orderNumber: '12345',
    items: [
      { name: 'Espresso', price: 3.5, quantity: 2 },
      { name: 'Cappuccino', price: 4.5, quantity: 1 },
      { name: 'Croissant', price: 3.0, quantity: 1 },
      { name: 'Blueberry Muffin', price: 3.5, quantity: 1 },
    ],
    subtotal: 18.0,
    tax: 1.44,
    total: 19.44,
  };

  try {
    // Convert using custom adapter
    const buffer = await convertToESCPOS(<CoffeeShopReceipt {...sampleData} />, {
      paperWidth: 48, // 80mm thermal printer
      encoding: 'utf-8',
      cut: 'full',
      feedBeforeCut: 3,
      adapter: thermalPrinterAdapter, // Use our custom component mapping
    });

    // Save to file
    fs.writeFileSync('custom-receipt.bin', buffer);

    console.log('✅ Custom component receipt generated successfully!');
    console.log('📄 Saved to: custom-receipt.bin');
    console.log(`📦 Buffer size: ${buffer.length} bytes`);
    console.log('\nCustom components used:');
    console.log('  - Receipt (top-level container)');
    console.log('  - StoreHeader (store information)');
    console.log('  - Divider (separator lines)');
    console.log('  - ItemRow (product line items)');
    console.log('  - TotalRow (total amount)');
    console.log('  - Spacer (vertical spacing)');
    console.log('  - InfoText (informational text)');
  } catch (error) {
    console.error('❌ Failed to generate receipt:', error);
    throw error;
  }
}

// Run the example
if (require.main === module) {
  generateReceipt().catch(console.error);
}

export { CoffeeShopReceipt, thermalPrinterAdapter };
