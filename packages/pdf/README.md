# @thermal-print/pdf

PDF generation for thermal printers with two modes of operation:
1. **Vector PDF (recommended)**: `printNodesToPDF()` - converts PrintNode IR to vector PDF with real text
2. **Raster PDF (legacy)**: `convertToPDF()` - captures DOM as image (lower quality)

## Features

- 🎯 **Two rendering modes** - Vector (recommended) or raster (legacy)
- 📄 **Simple API** - Works with PrintNode tree or DOM elements
- 🖨️ **Real text** - Vector mode produces crisp, searchable text
- 📥 **Auto-download** - Optional automatic file download
- 🎨 **Flexible sizing** - Supports standard paper sizes and thermal paper widths
- 🔄 **Dynamic height** - `wrap=true` creates single-page continuous receipts
- 🎯 **Style inheritance** - Respects `alignItems: "center"` from parent Views

## Installation

```bash
npm install @thermal-print/pdf
# or
pnpm add @thermal-print/pdf
# or
yarn add @thermal-print/pdf
```

## Usage

### Vector PDF (Recommended)

```typescript
import { convertToPrintNodes } from '@thermal-print/react';
import { printNodesToPDF } from '@thermal-print/pdf';

// Convert React component to PrintNode tree
const printNode = convertToPrintNodes(<MyReceipt />);

// Generate vector PDF (styles are read from the component)
const result = await printNodesToPDF(printNode);

// Open in new window for printing
window.open(result.url);

// Or send to printer
const buffer = result.arrayBuffer;
ipcRenderer.send('print-pdf', buffer);

// Clean up when done
result.cleanup();
```

### With Dynamic Height (Single Page Receipt)

```tsx
import { Document, Page, View, Text } from '@thermal-print/react';

// Use wrap=true for dynamic height (no page breaks)
<Document>
  <Page size={{ width: 205, height: 300 }} wrap={true}>
    <View style={{ alignItems: 'center' }}>
      <Text>RECEIPT</Text>  {/* Automatically centered */}
    </View>
    {/* Content flows continuously without page breaks */}
  </Page>
</Document>
```

### Raster PDF (Legacy)

```typescript
import { convertToPDF } from '@thermal-print/pdf';

// Your HTML element with thermal printer content
<div id="thermal-receipt">
  <!-- Thermal printer content here -->
</div>

// Convert to PDF
const result = await convertToPDF('thermal-receipt');

// Open in new window for printing
window.open(result.url);

// Clean up when done
result.cleanup();
```

### With React Components

```tsx
import { Preview, Document, Page, Text } from '@thermal-print/react';
import { convertToPDF } from '@thermal-print/pdf';

function ReceiptApp() {
  const handlePrint = async () => {
    const result = await convertToPDF('my-receipt', {
      paperSize: '80mm',
      scale: 2
    });

    // Open print dialog
    window.open(result.url);
  };

  return (
    <>
      <Preview id="my-receipt" paperWidth={48}>
        <Document>
          <Page>
            <Text>My Receipt Content</Text>
          </Page>
        </Document>
      </Preview>

      <button onClick={handlePrint}>Print as PDF</button>
    </>
  );
}
```

### Using HTMLElement Reference

```typescript
const element = document.getElementById('my-receipt');

if (element) {
  const result = await convertToPDF(element, {
    paperSize: 'A4',
    orientation: 'portrait'
  });

  window.open(result.url);
  result.cleanup();
}
```

### Auto-Download PDF

```typescript
// Automatically download the PDF
await convertToPDF('thermal-receipt', {
  filename: 'receipt.pdf'
});
```

## API Reference

### `printNodesToPDF(printNode, options?)` (Recommended)

Converts a PrintNode tree to a vector PDF with real text.

#### Parameters

- **`printNode`** (`PrintNode`) - The PrintNode tree from `convertToPrintNodes()`
- **`options`** (`VectorPDFOptions`) - Optional configuration (usually read from Page component)

#### Returns

`Promise<VectorPDFResult>` - Object containing:
- `blob`: The generated PDF as a Blob
- `arrayBuffer`: The PDF as ArrayBuffer (for sending to printers)
- `url`: Object URL for the blob
- `cleanup()`: Function to revoke the object URL
- `save(filename)`: Function to download the PDF

### VectorPDFOptions

```typescript
interface VectorPDFOptions {
  paperWidth?: number;      // Width in points (default: from Page.size or 205pt)
  paperHeight?: number | 'auto'; // Height in points or 'auto' for dynamic
  defaultFontSize?: number; // Default font size in points (default: 10)
  lineHeight?: number;      // Line height multiplier (default: 1.2)
  fontFamily?: string;      // Font family (default: "Helvetica")
}
```

**Note**: When `Page` has `wrap={true}`, the PDF uses dynamic height (no page breaks).

---

### `convertToPDF(elementOrId, options?)` (Legacy)

Converts a DOM element to a raster PDF blob.

#### Parameters

- **`elementOrId`** (`string | HTMLElement`) - Element ID or HTMLElement reference
- **`options`** (`PDFOptions`) - Optional configuration object

#### Returns

`Promise<PDFResult>` - Object containing:
- `blob`: The generated PDF as a Blob
- `url`: Object URL for the blob (usable with `window.open`)
- `cleanup()`: Function to revoke the object URL

### PDFOptions

```typescript
interface PDFOptions {
  /**
   * Paper size for the PDF
   * @default 'A4'
   */
  paperSize?: 'A4' | 'Letter' | '80mm' | '58mm' | { width: number; height: number };

  /**
   * Page orientation
   * @default 'portrait'
   */
  orientation?: 'portrait' | 'landscape';

  /**
   * Scale factor for rendering quality (higher = better quality)
   * @default 2
   */
  scale?: number;

  /**
   * PDF margins in mm
   * @default 10
   */
  margin?: number;

  /**
   * JPEG quality for images (0-1)
   * @default 0.95
   */
  imageQuality?: number;

  /**
   * Background color for transparent areas
   * @default '#ffffff'
   */
  backgroundColor?: string;

  /**
   * Optional filename for automatic download
   */
  filename?: string;
}
```

## Paper Sizes

### Standard Sizes
- **A4**: 210mm × 297mm
- **Letter**: 215.9mm × 279.4mm

### Thermal Paper Sizes
- **80mm**: 80mm width (common for receipts)
- **58mm**: 58mm width (common for small receipts)

### Custom Size
```typescript
await convertToPDF('my-element', {
  paperSize: { width: 100, height: 200 } // mm
});
```

## Examples

### High-Quality PDF for Archival

```typescript
const result = await convertToPDF('receipt', {
  paperSize: 'A4',
  scale: 3, // Higher quality
  imageQuality: 1.0, // Maximum quality
  margin: 15
});
```

### Thermal Receipt PDF

```typescript
const result = await convertToPDF('thermal-preview', {
  paperSize: '80mm',
  scale: 2,
  margin: 5
});
```

### Landscape PDF

```typescript
const result = await convertToPDF('wide-content', {
  paperSize: 'A4',
  orientation: 'landscape'
});
```

## How It Works

1. Captures the DOM element using **html2canvas**
2. Converts the canvas to a high-quality image
3. Generates a PDF using **jsPDF**
4. Returns a Blob ready for printing or download

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- Blob URLs
- ES2020+

## Integration with @thermal-print/react

This package is designed to work seamlessly with `@thermal-print/react` but can be used independently with any HTML content.

```tsx
import { Preview } from '@thermal-print/react';
import { convertToPDF } from '@thermal-print/pdf';

// Render thermal content
<Preview id="receipt">
  {/* Your thermal content */}
</Preview>

// Convert to PDF
await convertToPDF('receipt');
```

## Style Inheritance

The vector PDF renderer supports style inheritance from parent Views:

### Alignment (`alignItems`)

```tsx
// Parent View's alignItems centers children
<View style={{ alignItems: 'center' }}>
  <Text>This text is centered</Text>
  <Image source={qrCode} />  {/* Image is also centered */}
</View>
```

### Width Constraints

```tsx
// Parent View's width constrains child Image
<View style={{ width: '30%' }}>
  <Image source={qrCode} />  {/* Image respects 30% width */}
</View>
```

## How It Works

### Vector PDF (`printNodesToPDF`)

1. Traverses the PrintNode tree (from `@thermal-print/react`)
2. Reads styles from each node (fontSize, textAlign, padding, etc.)
3. Uses jsPDF's native text APIs for crisp vector output
4. Supports dynamic height with `wrap={true}` (no page breaks)

### Raster PDF (`convertToPDF`)

1. Captures the DOM element using **html2canvas**
2. Converts the canvas to a high-quality image
3. Generates a PDF using **jsPDF**
4. Returns a Blob ready for printing or download

## License

MIT © Gabriel Martinusso
