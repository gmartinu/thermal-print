# @thermal-print/pdf

PDF generation for thermal printers from PrintNode trees.

The `@thermal-print/pdf` package provides two modes of PDF generation:
- **Vector PDF** (recommended): Native PDF text rendering for crisp, high-quality output
- **Raster PDF** (legacy): DOM capture as image for HTML compatibility

---

## Main API

### printNodesToPDF()

The recommended method for high-quality PDF output. Uses jsPDF's native text rendering for crisp, vector-based text.

```typescript
function printNodesToPDF(
  printNode: PrintNode,
  options?: VectorPDFOptions
): Promise<VectorPDFResult>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `printNode` | `PrintNode` | Root PrintNode of the tree (from `convertToPrintNodes`) |
| `options` | `VectorPDFOptions` | Optional PDF generation options |

**Returns:** `Promise<VectorPDFResult>` - PDF result with blob, arrayBuffer, and utilities

**Example:**

```typescript
import { convertToPrintNodes } from '@thermal-print/react';
import { printNodesToPDF } from '@thermal-print/pdf';

// Convert React component to PrintNode
const printNode = convertToPrintNodes(<Receipt />);

// Generate vector PDF
const result = await printNodesToPDF(printNode);

// Open in new window for printing
window.open(result.url);

// Or save to file
result.save('receipt.pdf');

// Clean up when done
result.cleanup();
```

---

### convertToPDF()

Legacy method that captures a DOM element as an image and embeds it in a PDF.

```typescript
function convertToPDF(
  elementOrId: string | HTMLElement,
  options?: PDFOptions
): Promise<PDFResult>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `elementOrId` | `string \| HTMLElement` | Element ID or HTMLElement reference |
| `options` | `PDFOptions` | Optional PDF generation options |

**Returns:** `Promise<PDFResult>` - PDF result with blob and utilities

**Example:**

```typescript
import { convertToHTML } from '@thermal-print/react';
import { convertToPDF } from '@thermal-print/pdf';

// Step 1: Render React to DOM
const htmlResult = await convertToHTML(<Receipt />, {
  containerId: 'thermal-receipt',
  keepInDOM: true
});

// Step 2: Convert DOM to PDF
const pdfResult = await convertToPDF('thermal-receipt', {
  paperSize: '80mm',
  scale: 2
});

// Step 3: Open print dialog
window.open(pdfResult.url);

// Step 4: Cleanup
htmlResult.cleanup();
pdfResult.cleanup();
```

---

## Types

### VectorPDFOptions

Configuration options for vector PDF generation (`printNodesToPDF`).

```typescript
interface VectorPDFOptions {
  paperWidth?: number;
  paperHeight?: number | 'auto';
  defaultFontSize?: number;
  lineHeight?: number;
  fontFamily?: string;
  pxToMm?: number;
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `paperWidth` | `number` | From Page or 205pt | Paper width in points |
| `paperHeight` | `number \| 'auto'` | `'auto'` | Paper height in points, or 'auto' for dynamic |
| `defaultFontSize` | `number` | `10` | Default font size in points |
| `lineHeight` | `number` | `1.2` | Line height multiplier |
| `fontFamily` | `string` | `'Helvetica'` | Font family (must be available in jsPDF) |
| `pxToMm` | `number` | `0.264583` | Pixel to mm conversion factor |

::: info Page Component Override
Paper dimensions are typically read from the `Page` component's `size` prop. Options here override those values.
:::

---

### VectorPDFResult

Result returned by `printNodesToPDF()`.

```typescript
interface VectorPDFResult {
  blob: Blob;
  arrayBuffer: ArrayBuffer;
  url: string;
  cleanup: () => void;
  save: (filename: string) => void;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `blob` | `Blob` | Generated PDF as a Blob |
| `arrayBuffer` | `ArrayBuffer` | Generated PDF as ArrayBuffer (for IPC transfer) |
| `url` | `string` | Object URL for the blob (use with `window.open`) |
| `cleanup` | `() => void` | Revokes the object URL (call when done) |
| `save` | `(filename: string) => void` | Triggers download in browser |

---

### PDFOptions

Configuration options for raster PDF generation (`convertToPDF`).

```typescript
interface PDFOptions {
  paperSize?: PaperSize;
  orientation?: Orientation;
  scale?: number;
  margin?: number;
  filename?: string;
  imageQuality?: number;
  backgroundColor?: string;
  waitTime?: number;
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `paperSize` | `PaperSize` | `'A4'` | Paper size (see PaperSize type) |
| `orientation` | `Orientation` | `'portrait'` | Page orientation |
| `scale` | `number` | `2` | html2canvas rendering scale (higher = better quality) |
| `margin` | `number` | `10` | PDF margins in mm |
| `filename` | `string` | - | If provided, auto-downloads the PDF |
| `imageQuality` | `number` | `0.95` | JPEG quality (0-1) |
| `backgroundColor` | `string` | `'#ffffff'` | Background color for transparent areas |
| `waitTime` | `number` | `0` | Wait time (ms) before capturing element |

---

### PDFResult

Result returned by `convertToPDF()`.

```typescript
interface PDFResult {
  blob: Blob;
  url: string;
  cleanup: () => void;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `blob` | `Blob` | Generated PDF as a Blob |
| `url` | `string` | Object URL for the blob |
| `cleanup` | `() => void` | Revokes the object URL |

---

### PaperSize

Paper size options for PDF generation.

```typescript
type PaperSize =
  | 'A4'
  | 'Letter'
  | '80mm'
  | '58mm'
  | { width: number; height: number }; // Custom size in mm
```

**Predefined Sizes:**

| Size | Dimensions | Usage |
|------|------------|-------|
| `'A4'` | 210mm × 297mm | Standard documents |
| `'Letter'` | 215.9mm × 279.4mm | US Letter |
| `'80mm'` | 80mm × 297mm | Standard thermal receipts |
| `'58mm'` | 58mm × 297mm | Compact thermal receipts |

**Custom Size:**

```typescript
const result = await convertToPDF(element, {
  paperSize: { width: 100, height: 200 } // mm
});
```

---

### Orientation

Page orientation for PDF.

```typescript
type Orientation = 'portrait' | 'landscape';
```

---

## PDFGenerator

Low-level PDF generation class using jsPDF's native text APIs. Use this for fine-grained control over PDF generation.

### Constructor

```typescript
constructor(options?: PDFGeneratorOptions)
```

```typescript
interface PDFGeneratorOptions {
  paperWidth?: number;      // Default: 80pt
  paperHeight?: number | 'auto'; // Default: 'auto'
  defaultFontSize?: number; // Default: 10pt
  lineHeight?: number;      // Default: 1.2
  fontFamily?: string;      // Default: 'Helvetica'
  pxToMm?: number;          // Default: 0.264583
}
```

### Methods

#### Initialization

| Method | Signature | Description |
|--------|-----------|-------------|
| `initialize()` | `void` | Reset generator to initial state |
| `setPageMargins(left, right, top)` | `(number, number, number): void` | Set page margins in points |

#### Text & Formatting

| Method | Signature | Description |
|--------|-----------|-------------|
| `addText(text)` | `text: string` | Add text at current position |
| `addWrappedText(text)` | `text: string` | Add text with automatic word wrapping |
| `addTextAtPosition(text, position)` | `text: string, position: 'left' \| 'center' \| 'right'` | Add text at specific alignment without advancing Y |
| `addTextAtX(text, xOffset)` | `text: string, xOffset: number` | Add text at specific X offset |
| `setAlign(align)` | `align: 'left' \| 'center' \| 'right'` | Set text alignment |
| `setFontSize(size)` | `size: number` | Set font size in points |
| `setBold(bold)` | `bold: boolean` | Enable/disable bold |
| `resetFormatting()` | `void` | Reset to default formatting |

**Example:**

```typescript
import { PDFGenerator } from '@thermal-print/pdf';

const generator = new PDFGenerator({ paperWidth: 227 }); // 80mm
generator.initialize();

generator.setAlign('center');
generator.setBold(true);
generator.setFontSize(16);
generator.addText('RECEIPT');
generator.setBold(false);
generator.addNewline(2);

generator.setAlign('left');
generator.setFontSize(10);
generator.addText('Item 1');
generator.addTextAtPosition('$10.00', 'right');
generator.addNewline();
```

#### Layout & Spacing

| Method | Signature | Description |
|--------|-----------|-------------|
| `addNewline(count?)` | `count?: number` | Add newline(s) (default: 1) |
| `addSpacing(pt)` | `pt: number` | Add vertical spacing in points |
| `addPadding(left, top)` | `(number, number): void` | Add padding to current position |
| `pushHorizontalPadding(left, right)` | `(number, number): void` | Push horizontal padding (reduces content width) |
| `popHorizontalPadding(left, right)` | `(number, number): void` | Restore previous horizontal padding |
| `addDivider(style?)` | `style?: 'solid' \| 'dashed'` | Add horizontal divider line |

#### Graphics

| Method | Signature | Description |
|--------|-----------|-------------|
| `addImage(source, width?, height?)` | `source: string, width?: number, height?: number` | Add image from data URI |

#### Measurement

| Method | Signature | Description |
|--------|-----------|-------------|
| `getTextWidth(text)` | `text: string` → `number` | Get text width in points using font metrics |
| `getContentWidth()` | `number` | Get current content width in points |
| `getPaperWidth()` | `number` | Get paper width in points |
| `getCharsPerLine()` | `number` | Get approximate characters per line |
| `getCurrentY()` | `number` | Get current Y position |
| `getCurrentX()` | `number` | Get current X position (left margin) |
| `getCurrentFontSize()` | `number` | Get current font size in points |

#### Conversion

| Method | Signature | Description |
|--------|-----------|-------------|
| `pxToPt(px)` | `px: number` → `number` | Convert CSS pixels to points |
| `pxToPoints(px)` | `px: number` → `number` | Convert CSS pixels to points (alias) |

#### Output

| Method | Signature | Description |
|--------|-----------|-------------|
| `getBlob()` | `Blob` | Get generated PDF as Blob |
| `getArrayBuffer()` | `ArrayBuffer` | Get generated PDF as ArrayBuffer |
| `getDataUrl()` | `string` | Get generated PDF as data URL |
| `save(filename)` | `filename: string` | Download the PDF |
| `finalizePageHeight(margin?)` | `margin?: number` | Finalize page height for dynamic mode |

---

## PDFTraverser

Walks through the PrintNode tree and generates vector PDF using PDFGenerator.

```typescript
class PDFTraverser {
  constructor(generator: PDFGenerator)
  traverse(node: PrintNode | null): Promise<void>
}
```

**Handles element types:**

| Type | Description |
|------|-------------|
| `document` | Root document container |
| `page` | Page element with margins |
| `view` | Container with CSS box model layout |
| `text` | Text element with styling |
| `textnode` | Raw text node |
| `image` | Image element |

**Example:**

```typescript
import { PDFGenerator, PDFTraverser } from '@thermal-print/pdf';

const generator = new PDFGenerator({ paperWidth: 227 });
const traverser = new PDFTraverser(generator);

await traverser.traverse(printNode);
generator.finalizePageHeight();

const blob = generator.getBlob();
```

---

## Style Support

### TextStyle Properties

| Property | Type | Support | Description |
|----------|------|---------|-------------|
| `fontSize` | `number` | Yes | Font size in points |
| `fontWeight` | `string \| number` | Yes | Bold detection ('bold' or ≥700) |
| `fontFamily` | `string` | Partial | Only bold detection from name |
| `textAlign` | `'left' \| 'center' \| 'right'` | Yes | Text alignment |

### ViewStyle Properties

**Layout Properties:**

| Property | Type | Support | Description |
|----------|------|---------|-------------|
| `flexDirection` | `'row' \| 'column'` | Yes | Layout direction |
| `justifyContent` | `string` | Partial | 'space-between', 'center' supported |
| `alignItems` | `string` | Partial | Text/image alignment fallback |
| `width` | `string \| number` | Yes | Percentage widths for columns |
| `height` | `string \| number` | Yes | Explicit height for empty views |

**Spacing Properties (in points):**

| Property | Type | Support | Description |
|----------|------|---------|-------------|
| `padding` | `number` | Yes | All sides padding |
| `paddingTop` | `number` | Yes | Top padding |
| `paddingBottom` | `number` | Yes | Bottom padding |
| `paddingLeft` | `number` | Yes | Left padding |
| `paddingRight` | `number` | Yes | Right padding |
| `margin` | `number` | Yes | All sides margin |
| `marginTop` | `number` | Yes | Top margin |
| `marginBottom` | `number` | Yes | Bottom margin |

**Border Properties:**

| Property | Type | Support | Description |
|----------|------|---------|-------------|
| `borderTop` | `string` | Yes | Top divider line (solid/dashed) |
| `borderBottom` | `string` | Yes | Bottom divider line |

---

## Dynamic Height

For receipts that grow with content, use `wrap={true}` on the Page component:

```tsx
<Document>
  <Page wrap={true}>
    <Text>Content flows naturally without page breaks</Text>
  </Page>
</Document>
```

When `wrap={true}`:
- Initial height is set to 5000pt
- Content flows without page breaks
- Height is finalized after content is rendered

::: warning Known Limitation
jsPDF stores absolute Y coordinates. The page cannot be resized after content is rendered, so there may be blank space at the bottom of dynamic-height PDFs.
:::

---

## Units

The PDF package uses **points (pt)** as the primary unit, matching `@react-pdf/renderer`:

| Conversion | Formula |
|------------|---------|
| CSS px → pt | `px * 0.75` (at 96dpi) |
| mm → pt | `mm * 2.83465` |
| pt → mm | `pt * 0.352778` |

**Paper Size Reference (points):**

| Size | Points | Millimeters |
|------|--------|-------------|
| 58mm | 165pt | 58mm |
| 80mm | 227pt | 80mm |
| A4 | 595pt × 842pt | 210mm × 297mm |

---

## CSS Box Model

Views follow the standard CSS box model order:

1. **Margin top** - Space before element's border box
2. **Border top** - Top divider line
3. **Padding top** - Inside element, before content
4. **Content** - Children rendered here
5. **Padding bottom** - Inside element, after content
6. **Border bottom** - Bottom divider line
7. **Margin bottom** - Space after element's border box

```tsx
<View style={{
  marginTop: 10,
  borderTop: '1px solid black',
  paddingTop: 5,
  paddingBottom: 5,
  borderBottom: '1px solid black',
  marginBottom: 10
}}>
  <Text>Content here</Text>
</View>
```
