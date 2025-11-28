# API Reference

Complete API reference for all `@thermal-print` packages.

## @thermal-print/react

### Components

#### Document

Root wrapper for thermal printer documents.

```tsx
<Document>
  <Page>...</Page>
</Document>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Page components |

---

#### Page

Semantic page wrapper for content organization.

```tsx
<Page size={{ width: 227, height: 300 }} style={{ padding: 10 }}>
  <Text>Content</Text>
</Page>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Page content |
| `style` | `ViewStyle` | - | Page styling |
| `size` | `{ width: number; height?: number }` | - | Page dimensions in points (for PDF) |
| `wrap` | `boolean` | `undefined` | Enable dynamic height (for PDF) |

---

#### View

Layout container with flexbox support.

```tsx
// Column layout (default)
<View style={{ padding: 10 }}>
  <Text>Item 1</Text>
  <Text>Item 2</Text>
</View>

// Row layout
<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
  <Text>Left</Text>
  <Text>Right</Text>
</View>

// Divider
<View style={{ borderBottom: '1px solid black' }} />
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | View content |
| `style` | `ViewStyle` | View styling |

---

#### Text

Text content with styling.

```tsx
<Text style={{ fontSize: 20, textAlign: 'center', fontWeight: 'bold' }}>
  Hello World
</Text>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `children` | `string` | Text content |
| `style` | `TextStyle` | Text styling |

---

#### Image

Images converted to monochrome for thermal printing.

```tsx
<Image
  src="data:image/png;base64,..."
  style={{ textAlign: 'center' }}
/>
```

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `src` | `string` | Image source (URL or base64 data URI) |
| `style` | `ImageStyle` | Image styling |

---

#### Preview

Browser preview component for development and testing.

```tsx
<Preview paperWidth={48} showRuler scale={1.5}>
  <Document>
    <Page>
      <Text>Preview content</Text>
    </Page>
  </Document>
</Preview>
```

**Props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Document to preview |
| `id` | `string` | - | Container ID (for PDF conversion) |
| `paperWidth` | `number` | `48` | Paper width in characters |
| `showRuler` | `boolean` | `false` | Show character ruler |
| `scale` | `number` | `1` | Scale factor for preview |
| `style` | `CSSProperties` | - | Additional CSS styling |

---

#### StyleSheet

Utility for organizing styles (pass-through function).

```tsx
const styles = StyleSheet.create({
  header: { fontSize: 20, fontWeight: 'bold' },
  text: { fontSize: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
});

<Text style={styles.header}>Title</Text>
```

---

#### Font

Reserved for future use. Currently a no-op for thermal printers.

```tsx
Font.register({
  family: 'Roboto',
  fonts: [{ src: 'https://...' }],
});
```

---

### Functions

#### convertToESCPOS()

Converts React component directly to ESC/POS buffer.

```tsx
import { convertToESCPOS } from '@thermal-print/react';

const buffer = await convertToESCPOS(<Receipt />, {
  paperWidth: 48,
  cut: 'full',
  feedBeforeCut: 3,
  encoding: 'utf-8',
  commandAdapter: 'escpos',
});

// Send to printer
await printer.write(buffer);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `component` | `ReactElement` | React component to convert |
| `options` | `ConversionOptions` | Conversion options (optional) |

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `paperWidth` | `number` | `48` | Characters per line |
| `encoding` | `string` | `'utf-8'` | Character encoding |
| `debug` | `boolean` | `false` | Enable debug output |
| `cut` | `boolean \| 'full' \| 'partial'` | `'full'` | Paper cut after printing |
| `feedBeforeCut` | `number` | `3` | Lines to feed before cut |
| `commandAdapter` | `'escpos' \| 'escbematech' \| CommandAdapter` | `'escpos'` | Protocol adapter |
| `adapter` | `ComponentMapping \| RendererAdapter` | - | Custom component mapping |

**Returns:** `Promise<Buffer>` - ESC/POS command buffer

---

#### convertToPrintNodes()

Converts React component to PrintNode intermediate representation.

```tsx
import { convertToPrintNodes } from '@thermal-print/react';

const printNode = convertToPrintNodes(<Receipt />);

// Manipulate the tree
printNode.children.push({
  type: 'text',
  props: { children: 'COPY' },
  children: [],
  style: { textAlign: 'center' }
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `component` | `ReactElement` | React component to convert |
| `adapter` | `RendererAdapter` | Custom adapter (optional) |

**Returns:** `PrintNode | null` - PrintNode tree

---

#### convertToHTML()

Converts React component to HTML/DOM for browser-based workflows.

```tsx
import { convertToHTML } from '@thermal-print/react';

const result = await convertToHTML(<Receipt />, {
  containerId: 'thermal-receipt',
  keepInDOM: true,
  width: 400,
  format: 'element',
});

// Use the result
const element = result.content as HTMLElement;

// Cleanup when done
result.cleanup();
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `component` | `ReactElement` | React component to convert |
| `options` | `ConvertToHTMLOptions` | Conversion options (optional) |

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `width` | `number` | `400` | Container width in pixels |
| `applyThermalStyles` | `boolean` | `true` | Apply thermal styling |
| `format` | `'html' \| 'element'` | `'element'` | Return format |
| `containerId` | `string` | auto-generated | Custom container ID |
| `keepInDOM` | `boolean` | `false` | Keep in DOM after render |

**Returns:** `Promise<ConvertToHTMLResult>`

```tsx
interface ConvertToHTMLResult {
  content: string | HTMLElement;  // Rendered content
  container: HTMLElement;         // Container element
  containerId: string;            // Container ID
  cleanup: () => void;            // Cleanup function
}
```

---

#### createAdapter()

Creates a custom component adapter for mapping component names.

```tsx
import { createAdapter, convertToESCPOS } from '@thermal-print/react';

const adapter = createAdapter({
  Receipt: 'document',
  Section: 'page',
  Row: 'view',
  Label: 'text',
  Logo: 'image'
});

const buffer = await convertToESCPOS(<Receipt />, { adapter });
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `mapping` | `ComponentMapping` | Object mapping component names to standard types |

**Returns:** `RendererAdapter`

---

### Types

#### ViewStyle

```tsx
interface ViewStyle {
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  alignItems?: 'flex-start' | 'center' | 'flex-end';
  padding?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;   // Not supported in ESC/POS
  paddingRight?: number;  // Not supported in ESC/POS
  margin?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;    // Not supported in ESC/POS
  marginRight?: number;   // Not supported in ESC/POS
  borderTop?: string;     // e.g., '1px solid black'
  borderBottom?: string;  // e.g., '1px dashed black'
  width?: number | string; // For columns (e.g., '50%' or 24)
}
```

#### TextStyle

```tsx
interface TextStyle {
  fontSize?: number;                        // Maps to ESC/POS sizes
  fontWeight?: 'normal' | 'bold' | number;  // 700+ = bold
  textAlign?: 'left' | 'center' | 'right';
}
```

#### PrintNode

```tsx
interface PrintNode {
  type: string;           // 'document', 'page', 'view', 'text', 'image', 'textnode'
  props: any;             // Component props
  children: PrintNode[];  // Child nodes
  style?: any;            // Computed styles
}
```

---

## @thermal-print/escpos

### Functions

#### printNodesToESCPOS()

Converts PrintNode tree to ESC/POS buffer.

```tsx
import { printNodesToESCPOS } from '@thermal-print/escpos';

const buffer = await printNodesToESCPOS(printNode, {
  paperWidth: 48,
  encoding: 'utf-8',
  cut: 'full',
  feedBeforeCut: 3,
  commandAdapter: 'escpos',
});
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `printNode` | `PrintNode` | Root PrintNode of the tree |
| `options` | `PrintNodeToESCPOSOptions` | Conversion options (optional) |

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `paperWidth` | `number` | `48` | Width in characters |
| `encoding` | `string` | `'utf-8'` | Character encoding |
| `debug` | `boolean` | `false` | Enable debug output |
| `cut` | `boolean \| 'full' \| 'partial'` | `'full'` | Cut paper after printing |
| `feedBeforeCut` | `number` | `3` | Lines to feed before cutting |
| `commandAdapter` | `'escpos' \| 'escbematech' \| CommandAdapter` | `'escpos'` | Protocol adapter |

**Returns:** `Promise<Buffer>` - ESC/POS command buffer

---

### Classes

#### ESCPOSGenerator

Low-level ESC/POS command generator for advanced usage.

```tsx
import { ESCPOSGenerator } from '@thermal-print/escpos';

const generator = new ESCPOSGenerator(48, 'utf-8', false);

generator.initialize();
generator.setAlign('center');
generator.setBold(true);
generator.setCharacterSize(2, 2);
generator.addText('HELLO WORLD');
generator.addNewline();
generator.cutFullWithFeed(3);

const buffer = generator.getBuffer();
```

**Constructor:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `paperWidth` | `number` | `48` | Paper width in characters |
| `encoding` | `string` | `'utf-8'` | Character encoding |
| `debug` | `boolean` | `false` | Enable debug output |
| `commandAdapter` | `CommandAdapter` | `ESCPOSCommandAdapter` | Protocol adapter |

**Methods:**

| Method | Description |
|--------|-------------|
| `initialize()` | Initialize printer |
| `setAlign(align)` | Set text alignment ('left', 'center', 'right') |
| `setBold(enabled)` | Enable/disable bold |
| `setCharacterSize(width, height)` | Set character size (1-2) |
| `addText(text)` | Add text content |
| `addNewline()` | Add line feed |
| `addLineFeed(lines)` | Add multiple line feeds |
| `cutFullWithFeed(lines)` | Full cut with line feed |
| `cutPartialWithFeed(lines)` | Partial cut with line feed |
| `addImage(imageData, width, height)` | Add raster image |
| `getBuffer()` | Get final ESC/POS buffer |

---

#### TreeTraverser

Traverses PrintNode tree and generates ESC/POS commands.

```tsx
import { ESCPOSGenerator, TreeTraverser } from '@thermal-print/escpos';

const generator = new ESCPOSGenerator(48);
const traverser = new TreeTraverser(generator);

await traverser.traverse(printNode);
const buffer = generator.getBuffer();
```

---

### Command Adapters

#### ESCPOSCommandAdapter

Standard ESC/POS protocol adapter (default).

```tsx
import { ESCPOSCommandAdapter } from '@thermal-print/escpos';

const adapter = new ESCPOSCommandAdapter();
```

#### ESCBematechCommandAdapter

Bematech-specific protocol adapter.

```tsx
import { ESCBematechCommandAdapter } from '@thermal-print/escpos';

const adapter = new ESCBematechCommandAdapter();
```

---

### Style Utilities

```tsx
import {
  extractTextStyle,
  extractViewStyle,
  isBold,
  mapFontSizeToESCPOS,
  mapTextAlign,
  isDashedBorder,
  generateDividerLine,
  parseWidth,
  wrapText,
} from '@thermal-print/escpos';
```

| Function | Description |
|----------|-------------|
| `extractTextStyle(props)` | Extract TextStyle from props |
| `extractViewStyle(props)` | Extract ViewStyle from props |
| `isBold(style)` | Check if style is bold |
| `mapFontSizeToESCPOS(fontSize)` | Map font size to ESC/POS size |
| `mapTextAlign(align)` | Map text alignment to ESC/POS |
| `isDashedBorder(border)` | Check if border is dashed |
| `generateDividerLine(width, dashed)` | Generate divider line string |
| `parseWidth(width, totalWidth)` | Parse width to characters |
| `wrapText(text, maxWidth)` | Wrap text to fit width |

---

### Encodings

```tsx
import { encodeCP860 } from '@thermal-print/escpos';

const encoded = encodeCP860('Olá Mundo'); // Portuguese encoding
```

---

## @thermal-print/pdf

### Functions

#### printNodesToPDF()

Converts PrintNode tree to PDF using vector rendering.

```tsx
import { printNodesToPDF } from '@thermal-print/pdf';

const pdfBytes = await printNodesToPDF(printNode, {
  paperWidth: 227,    // 80mm in points
  paperHeight: 'auto', // Dynamic height
  debug: false,
});

// Save or send PDF
fs.writeFileSync('receipt.pdf', pdfBytes);
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `printNode` | `PrintNode` | Root PrintNode of the tree |
| `options` | `PrintNodesToPDFOptions` | PDF options (optional) |

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `paperWidth` | `number` | `227` | Paper width in points (80mm) |
| `paperHeight` | `number \| 'auto'` | `'auto'` | Paper height in points or dynamic |
| `debug` | `boolean` | `false` | Enable debug output |

**Returns:** `Promise<Uint8Array>` - PDF bytes

---

#### convertToPDF()

Converts DOM element to PDF (browser-based).

```tsx
import { convertToPDF } from '@thermal-print/pdf';

const result = await convertToPDF('receipt-container', {
  paperSize: '80mm',
  scale: 2,
  filename: 'receipt.pdf', // Auto-download
});

// Or open in new tab
window.open(result.url);

// Cleanup
result.cleanup();
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `containerId` | `string` | DOM element ID to convert |
| `options` | `ConvertToPDFOptions` | PDF options (optional) |

**Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `paperSize` | `'58mm' \| '80mm' \| '112mm'` | `'80mm'` | Paper size preset |
| `scale` | `number` | `2` | Scale factor for quality |
| `filename` | `string` | - | Filename for auto-download |

**Returns:** `Promise<ConvertToPDFResult>`

```tsx
interface ConvertToPDFResult {
  url: string;          // Blob URL of PDF
  blob: Blob;           // PDF blob
  cleanup: () => void;  // Revoke blob URL
}
```

---

### Classes

#### PDFGenerator

Low-level PDF generation using jsPDF.

```tsx
import { PDFGenerator } from '@thermal-print/pdf';

const pdf = new PDFGenerator({
  paperWidth: 227,
  paperHeight: 500,
});

pdf.addText('Hello World', { x: 10, y: 20, fontSize: 12 });
pdf.addLine(10, 30, 200, 30);

const bytes = pdf.getOutput();
```

---

## @thermal-print/core

### Types

#### PrintNode

Universal intermediate representation for printer documents.

```tsx
interface PrintNode {
  type: string;           // Element type
  props: any;             // Component props
  children: PrintNode[];  // Child nodes
  style?: any;            // Computed styles
}
```

#### StandardElementType

Standard element type constants.

```tsx
import { StandardElementType } from '@thermal-print/core';

const types = {
  DOCUMENT: 'document',
  PAGE: 'page',
  VIEW: 'view',
  TEXT: 'text',
  IMAGE: 'image',
  TEXTNODE: 'textnode',
};
```

#### TextStyle

```tsx
interface TextStyle {
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | number;
  textAlign?: 'left' | 'center' | 'right';
}
```

#### ViewStyle

```tsx
interface ViewStyle {
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  alignItems?: 'flex-start' | 'center' | 'flex-end';
  padding?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  margin?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  borderTop?: string;
  borderBottom?: string;
  width?: number | string;
}
```

---

## Constants

### Paper Width Reference

| Paper Size | Width (mm) | Width (points) | Characters |
|------------|------------|----------------|------------|
| 58mm | 58 | 164 | 32 |
| 80mm | 80 | 227 | 48 |
| 112mm | 112 | 318 | 64 |

### Font Size Mapping

| fontSize (px) | ESC/POS Size | Description |
|---------------|--------------|-------------|
| 8-12 | 1x1 | Normal |
| 13-18 | 1x2 | Double height |
| 19-24 | 2x1 | Double width |
| 25+ | 2x2 | Double both (max) |

### ESC/POS Commands Reference

| Command | Bytes | Description |
|---------|-------|-------------|
| Initialize | `0x1B 0x40` | Reset printer |
| Align Left | `0x1B 0x61 0x00` | Left alignment |
| Align Center | `0x1B 0x61 0x01` | Center alignment |
| Align Right | `0x1B 0x61 0x02` | Right alignment |
| Bold On | `0x1B 0x45 0x01` | Enable bold |
| Bold Off | `0x1B 0x45 0x00` | Disable bold |
| Full Cut | `0x1B 0x69` | Full paper cut |
| Partial Cut | `0x1B 0x6D` | Partial paper cut |
| Line Feed | `0x0A` | New line |
