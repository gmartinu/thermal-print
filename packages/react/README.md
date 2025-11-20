# @thermal-print/react

React components and integration for thermal printers with browser printing support.

## 📦 Installation

```bash
pnpm add @thermal-print/react
# or
npm install @thermal-print/react
# or
yarn add @thermal-print/react
```

## 🔄 Migrating from @react-pdf/renderer?

If you're currently using `@react-pdf/renderer`, check out our comprehensive **[Migration Guide](./MIGRATION_FROM_REACT_PDF.md)**. Most components are drop-in replacements, and migration is usually straightforward!

## 🎯 Purpose

This package provides React components optimized for thermal printers, along with conversion utilities for both direct thermal printing (ESC/POS) and browser printing (HTML/PDF).

**Three conversion paths:**

1. **React → ESC/POS** - Direct thermal printer output via `convertToESCPOS()`
2. **React → PrintNode IR** - Intermediate representation via `convertToPrintNodes()`
3. **React → HTML/DOM** - Browser rendering via `convertToHTML()`

## 🚀 Quick Start

### Basic Receipt for Thermal Printer

```typescript
import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  convertToESCPOS,
} from "@thermal-print/react";

const styles = StyleSheet.create({
  header: {
    fontSize: 20,
    textAlign: "center",
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

function Receipt() {
  return (
    <Document>
      <Page>
        <Text style={styles.header}>MY STORE</Text>

        <View style={{ borderBottom: "1px solid black" }} />

        <View style={styles.row}>
          <Text>Coffee</Text>
          <Text>$3.50</Text>
        </View>

        <View style={styles.row}>
          <Text style={{ fontWeight: "bold" }}>Total</Text>
          <Text style={{ fontWeight: "bold" }}>$3.50</Text>
        </View>
      </Page>
    </Document>
  );
}

// Convert to ESC/POS and print
const buffer = await convertToESCPOS(<Receipt />, {
  paperWidth: 48,
  cut: "full",
});

await printer.write(buffer);
```

### Browser Preview

```typescript
import { Preview } from "@thermal-print/react";

function App() {
  return (
    <Preview id="receipt-preview" paperWidth={48} showRuler>
      <Document>
        <Page>
          <Text>This is how it will print!</Text>
        </Page>
      </Document>
    </Preview>
  );
}
```

### Browser Printing with PDF

```typescript
import { convertToHTML } from "@thermal-print/react";
import { convertToPDF } from "@thermal-print/pdf";

async function handlePrint() {
  // Step 1: Render to DOM
  const htmlResult = await convertToHTML(
    <Receipt />,
    {
      containerId: "thermal-receipt",
      keepInDOM: true,
    }
  );

  // Step 2: Convert to PDF
  const pdfResult = await convertToPDF("thermal-receipt", {
    paperSize: "80mm",
    scale: 2,
  });

  // Step 3: Open print dialog
  window.open(pdfResult.url);

  // Cleanup
  htmlResult.cleanup();
  pdfResult.cleanup();
}
```

## 📖 Components

### Document

Root wrapper for thermal printer documents.

```typescript
<Document>
  <Page>...</Page>
</Document>
```

**Props:** None

### Page

Semantic page wrapper. Thermal printers print continuously, so this is mainly for logical grouping.

```typescript
<Page style={{ padding: 20 }}>
  <Text>Content</Text>
</Page>
```

**Props:**
- `style?: ViewStyle` - Layout styling

### View

Layout container with flexbox support.

```typescript
// Column layout (default)
<View style={{ padding: 10 }}>
  <Text>Item 1</Text>
  <Text>Item 2</Text>
</View>

// Row layout (side-by-side)
<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
  <Text>Left</Text>
  <Text>Right</Text>
</View>

// With borders
<View style={{ borderTop: '1px solid black' }}>
  <Text>Content</Text>
</View>
```

**Props:**
- `style?: ViewStyle` - Layout styling
- `children?: ReactNode` - Child elements

**Supported styles:**
- `flexDirection?: 'row' | 'column'`
- `justifyContent?: 'space-between' | 'center' | 'flex-start' | 'flex-end'`
- `padding?: number`
- `paddingTop?: number`
- `paddingBottom?: number`
- `margin?: number`
- `marginTop?: number`
- `marginBottom?: number`
- `borderTop?: string` - e.g., '1px solid black' or '1px dashed black'
- `borderBottom?: string`
- `width?: string | number` - For columns, e.g., '50%' or 24

### Text

Text content with styling support.

```typescript
<Text style={{ fontSize: 20, textAlign: "center", fontWeight: "bold" }}>
  Hello World
</Text>
```

**Props:**
- `style?: TextStyle` - Text styling
- `children?: ReactNode` - Text content

**Supported styles:**
- `fontSize?: number` - Maps to thermal printer character sizes
- `fontWeight?: 'bold' | 'normal' | number` - Bold emphasis
- `textAlign?: 'left' | 'center' | 'right'` - Text alignment

**Font size mapping:**
- 8-12px → 1x1 (normal)
- 13-18px → 1x2 (double height)
- 19-24px → 2x1 (double width)
- 25+px → 2x2 (double both)

### Image

Display images on thermal printers (converted to monochrome).

```typescript
<Image
  src="data:image/png;base64,..."
  style={{ textAlign: "center" }}
/>
```

**Props:**
- `src: string` - Image source (data URI or URL)
- `style?: { textAlign?: 'left' | 'center' | 'right' }` - Alignment

**Note:** Images are automatically:
- Resized to fit paper width
- Converted to grayscale
- Converted to monochrome (1-bit)
- Printed using ESC/POS raster graphics

### Preview

Visual preview component for development and testing.

```typescript
<Preview
  id="receipt-preview"
  paperWidth={48}
  showRuler
  scale={1.5}
>
  <Document>
    <Page>
      <Text>Preview content</Text>
    </Page>
  </Document>
</Preview>
```

**Props:**
- `id?: string` - Container ID (useful for PDF conversion)
- `paperWidth?: number` - Characters per line (default: 48)
- `showRuler?: boolean` - Show character ruler at top
- `scale?: number` - Scale factor (default: 1)
- `style?: CSSProperties` - Additional CSS styling

### StyleSheet

Utility for organizing styles (pass-through, no actual processing).

```typescript
const styles = StyleSheet.create({
  header: { fontSize: 20, textAlign: 'center' },
  text: { fontSize: 12 },
  bold: { fontWeight: 'bold' }
});

<Text style={styles.header}>Title</Text>
```

### Font

No-op for thermal printers. Reserved for future PDF export compatibility.

```typescript
Font.register({
  family: "Roboto",
  fonts: [{ src: "https://..." }],
});
```

## 📖 API Functions

### convertToESCPOS(component, options?)

Converts React component directly to ESC/POS buffer. This is a convenience wrapper that combines `convertToPrintNodes()` + `printNodesToESCPOS()`.

**Parameters:**
- `component: ReactElement` - React component to convert
- `options?: ConversionOptions` - Conversion options

**Options:**
```typescript
interface ConversionOptions {
  paperWidth?: number;              // Characters per line (default: 48)
  encoding?: string;                // Character encoding (default: 'utf-8')
  debug?: boolean;                  // Enable debug output
  cut?: boolean | 'full' | 'partial'; // Paper cut (default: 'full')
  feedBeforeCut?: number;           // Lines to feed before cut (default: 3)
  commandAdapter?: 'escpos' | 'escbematech'; // Protocol (default: 'escpos')
  adapter?: ComponentMapping | RendererAdapter; // Custom component mapping
}
```

**Returns:** `Promise<Buffer>` - ESC/POS command buffer

**Example:**
```typescript
const buffer = await convertToESCPOS(<Receipt />, {
  paperWidth: 48,
  cut: 'full',
  commandAdapter: 'escpos'
});
```

### convertToPrintNodes(component, adapter?)

Converts React component to PrintNode intermediate representation (IR).

**Parameters:**
- `component: ReactElement` - React component to convert
- `adapter?: RendererAdapter` - Optional custom adapter

**Returns:** `PrintNode | null` - PrintNode tree

**Example:**
```typescript
import { convertToPrintNodes } from '@thermal-print/react';
import { printNodesToESCPOS } from '@thermal-print/escpos';

// Step 1: React → PrintNode
const printNode = convertToPrintNodes(<Receipt />);

// Step 2: Manipulate PrintNode if needed
// ... modify printNode ...

// Step 3: PrintNode → ESC/POS
const buffer = await printNodesToESCPOS(printNode, {
  paperWidth: 48
});
```

### convertToHTML(component, options?)

Converts React component to HTML/DOM using ReactDOM. Useful for browser-based workflows.

**Parameters:**
- `component: ReactElement` - React component to convert
- `options?: ConvertToHTMLOptions` - Conversion options

**Options:**
```typescript
interface ConvertToHTMLOptions {
  width?: number;                   // Container width in pixels (default: 400)
  applyThermalStyles?: boolean;     // Apply thermal styling (default: true)
  format?: 'html' | 'element';      // Return format (default: 'element')
  containerId?: string;             // Custom container ID
  keepInDOM?: boolean;              // Keep in DOM (default: false)
}
```

**Returns:** `Promise<ConvertToHTMLResult>`

```typescript
interface ConvertToHTMLResult {
  content: string | HTMLElement;    // Rendered content
  container: HTMLElement;           // Container element
  containerId: string;              // Container ID
  cleanup: () => void;              // Cleanup function
}
```

**Examples:**

Return HTMLElement:
```typescript
const result = await convertToHTML(<Receipt />, {
  format: 'element'
});
const element = result.content as HTMLElement;
result.cleanup();
```

Return HTML string:
```typescript
const result = await convertToHTML(<Receipt />, {
  format: 'html'
});
const html = result.content as string;
```

Keep in DOM with custom ID:
```typescript
const result = await convertToHTML(<Receipt />, {
  containerId: 'my-receipt',
  keepInDOM: true,
  width: 600
});
// Container stays in DOM, accessible via document.getElementById('my-receipt')
```

## 🎨 Styling Guide

### Text Alignment

```typescript
<Text style={{ textAlign: 'center' }}>Centered</Text>
<Text style={{ textAlign: 'left' }}>Left aligned</Text>
<Text style={{ textAlign: 'right' }}>Right aligned</Text>
```

### Font Sizes

```typescript
<Text style={{ fontSize: 12 }}>Normal (1x1)</Text>
<Text style={{ fontSize: 16 }}>Tall (1x2)</Text>
<Text style={{ fontSize: 20 }}>Wide (2x1)</Text>
<Text style={{ fontSize: 28 }}>Large (2x2)</Text>
```

### Bold Text

```typescript
<Text style={{ fontWeight: 'bold' }}>Bold text</Text>
<Text style={{ fontWeight: 700 }}>Also bold</Text>
```

### Dividers

```typescript
<View style={{ borderTop: '1px solid black' }} />
<View style={{ borderBottom: '1px dashed black' }} />
```

### Spacing

```typescript
<View style={{ marginTop: 10, marginBottom: 10 }}>
  <Text>Content with margin</Text>
</View>

<View style={{ paddingTop: 5, paddingBottom: 5 }}>
  <Text>Content with padding</Text>
</View>
```

### Row Layouts

```typescript
// Two-column layout
<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
  <Text>Item</Text>
  <Text>$10.00</Text>
</View>

// Three-column layout with fixed widths
<View style={{ flexDirection: 'row' }}>
  <Text style={{ width: '40%' }}>Product</Text>
  <Text style={{ width: '30%' }}>Qty</Text>
  <Text style={{ width: '30%' }}>Price</Text>
</View>
```

## 🔧 Advanced Usage

### Custom Component Adapter

```typescript
import { createAdapter, convertToESCPOS } from '@thermal-print/react';

const customAdapter = createAdapter({
  Receipt: 'document',
  ReceiptItem: 'text',
  Logo: 'image'
});

const buffer = await convertToESCPOS(<Receipt />, {
  adapter: customAdapter
});
```

### Manipulate PrintNode IR

```typescript
import { convertToPrintNodes } from '@thermal-print/react';
import { printNodesToESCPOS } from '@thermal-print/escpos';

let printNode = convertToPrintNodes(<Receipt />);

// Add watermark
printNode = {
  ...printNode,
  children: [
    ...printNode.children,
    {
      type: 'text',
      props: { children: 'COPY - NOT ORIGINAL' },
      children: [],
      style: { textAlign: 'center' }
    }
  ]
};

const buffer = await printNodesToESCPOS(printNode);
```

## 📄 License

MIT © Gabriel Martinusso

## 🔗 Related Resources

### Packages
- [@thermal-print/core](../core) - Core types and PrintNode IR
- [@thermal-print/escpos](../escpos) - ESC/POS converter
- [@thermal-print/pdf](../pdf) - PDF generation from DOM

### Documentation
- [Migration from @react-pdf/renderer](./MIGRATION_FROM_REACT_PDF.md) - Complete migration guide
- [Main README](../../README.md) - Project overview and quick start
