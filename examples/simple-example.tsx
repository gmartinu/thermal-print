/**
 * Simple Receipt Example
 *
 * This example shows how to create a basic receipt with react-escpos
 */

import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { convertToESCPOS } from 'react-escpos';
import fs from 'fs';

// Define receipt data interface
interface ReceiptData {
  storeName: string;
  storeAddress: string;
  date: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
}

// Receipt component
const SimpleReceipt: React.FC<{ data: ReceiptData }> = ({ data }) => (
  <Document>
    <Page>
      <View>
        {/* Header */}
        <Text style={{ textAlign: 'center', fontWeight: 'bold', fontSize: 20 }}>
          {data.storeName}
        </Text>
        <Text style={{ textAlign: 'center' }}>
          {data.storeAddress}
        </Text>
        <Text style={{ textAlign: 'center' }}>
          {data.date}
        </Text>

        <View style={{ borderBottom: '1px solid black' }} />

        {/* Items */}
        {data.items.map((item, index) => (
          <View key={index}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text>{item.name}</Text>
              <Text>${item.price.toFixed(2)}</Text>
            </View>
            <Text>  Qty: {item.quantity}</Text>
          </View>
        ))}

        <View style={{ borderTop: '1px dashed black' }} />

        {/* Totals */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text>Subtotal:</Text>
          <Text>${data.subtotal.toFixed(2)}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text>Tax:</Text>
          <Text>${data.tax.toFixed(2)}</Text>
        </View>

        <View style={{ borderTop: '1px solid black' }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18 }}>TOTAL:</Text>
          <Text style={{ fontWeight: 'bold', fontSize: 18 }}>${data.total.toFixed(2)}</Text>
        </View>

        {/* Footer */}
        <Text style={{ textAlign: 'center', fontSize: 12 }}>
          Thank you for your purchase!
        </Text>
      </View>
    </Page>
  </Document>
);

// Usage example
async function printReceipt() {
  const receiptData: ReceiptData = {
    storeName: 'My Awesome Store',
    storeAddress: '123 Main St, City, State 12345',
    date: new Date().toLocaleString(),
    items: [
      { name: 'Product A', quantity: 2, price: 19.99 },
      { name: 'Product B', quantity: 1, price: 29.99 },
      { name: 'Product C', quantity: 3, price: 9.99 },
    ],
    subtotal: 89.96,
    tax: 7.20,
    total: 97.16,
  };

  try {
    // Convert to ESC/POS
    const buffer = await convertToESCPOS(
      <SimpleReceipt data={receiptData} />,
      {
        paperWidth: 48,      // 80mm thermal printer
        encoding: 'utf-8',
        cut: 'full',         // Full cut
        feedBeforeCut: 3,    // Feed 3 lines before cut
        debug: false,
      }
    );

    // Save to file for testing
    fs.writeFileSync('receipt.bin', buffer);
    console.log('✅ Receipt generated successfully! Saved to receipt.bin');
    console.log(`📄 Buffer size: ${buffer.length} bytes`);

    // In production, you would send this buffer to your printer
    // Example: await sendToPrinter(buffer);

  } catch (error) {
    console.error('❌ Error generating receipt:', error);
  }
}

// Run the example
printReceipt();
