# @thermal-print/react

React components and conversion utilities for thermal printing.

The `@thermal-print/react` package provides:
- React components optimized for thermal printers (drop-in replacements for `@react-pdf/renderer`)
- Conversion utilities for ESC/POS, PrintNode IR, and HTML output
- Adapter system for custom component mapping

---

## Main API

### convertToESCPOS()

Converts a React component directly to an ESC/POS buffer.

```typescript
function convertToESCPOS(
  component: ReactElement,
  options?: ConversionOptions
): Promise<Buffer>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `component` | `ReactElement` | React component to convert |
| `options` | `ConversionOptions` | Conversion and ESC/POS options |

**Returns:** `Promise<Buffer>` - ESC/POS command buffer ready for the printer

**Example:**

```typescript
import { Document, Page, Text, convertToESCPOS } from '@thermal-print/react';

const buffer = await convertToESCPOS(
  <Document>
    <Page>
      <Text>Hello World</Text>
    </Page>
  </Document>,
  { paperWidth: 48, cut: 'full' }
);

// Send buffer to printer
await printer.write(buffer);
```

---

### convertToPrintNodes()

Converts a React component to PrintNode intermediate representation.

```typescript
function convertToPrintNodes(
  component: ReactElement,
  adapter?: RendererAdapter
): PrintNode | null
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `component` | `ReactElement` | React component to convert |
| `adapter` | `RendererAdapter` | Custom adapter (default: ReactPDFAdapter) |

**Returns:** `PrintNode | null` - PrintNode tree or null if rendering fails

**Example:**

```typescript
import { convertToPrintNodes } from '@thermal-print/react';
import { printNodesToESCPOS } from '@thermal-print/escpos';

// Step 1: React → PrintNode
const printNode = convertToPrintNodes(<Receipt />);

// Step 2: Manipulate if needed
printNode.children.push({
  type: 'text',
  props: { children: 'COPY' },
  children: [],
  style: { textAlign: 'center' }
});

// Step 3: PrintNode → ESC/POS
const buffer = await printNodesToESCPOS(printNode);
```

---

### convertToHTML()

Converts a React component to HTML/DOM for browser-based workflows.

```typescript
function convertToHTML(
  component: ReactElement,
  options?: ConvertToHTMLOptions
): Promise<ConvertToHTMLResult>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `component` | `ReactElement` | React component to convert |
| `options` | `ConvertToHTMLOptions` | HTML conversion options |

**Returns:** `Promise<ConvertToHTMLResult>` - HTML result with content and cleanup function

**Example:**

```typescript
import { convertToHTML } from '@thermal-print/react';
import { convertToPDF } from '@thermal-print/pdf';

// Step 1: Render to DOM
const htmlResult = await convertToHTML(<Receipt />, {
  containerId: 'thermal-receipt',
  keepInDOM: true,
  width: 400
});

// Step 2: Convert to PDF (optional)
const pdfResult = await convertToPDF('thermal-receipt', {
  paperSize: '80mm',
  scale: 2
});

// Step 3: Open print dialog
window.open(pdfResult.url);

// Cleanup
htmlResult.cleanup();
pdfResult.cleanup();
```

---

## Types

### ConversionOptions

Options for `convertToESCPOS()`. Extends `PrintNodeToESCPOSOptions` from `@thermal-print/escpos`.

```typescript
interface ConversionOptions extends PrintNodeToESCPOSOptions {
  adapter?: RendererAdapter | ComponentMapping;
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `adapter` | `RendererAdapter \| ComponentMapping` | ReactPDFAdapter | Custom component adapter |
| `paperWidth` | `number` | `48` | Characters per line |
| `encoding` | `string` | `'utf-8'` | Character encoding |
| `debug` | `boolean` | `false` | Enable debug output |
| `cut` | `boolean \| 'full' \| 'partial'` | `'full'` | Paper cut after printing |
| `feedBeforeCut` | `number` | `3` | Lines to feed before cut |
| `commandAdapter` | `'escpos' \| 'escbematech'` | `'escpos'` | Protocol adapter |

---

### ConvertToHTMLOptions

Options for `convertToHTML()`.

```typescript
interface ConvertToHTMLOptions {
  width?: number;
  applyThermalStyles?: boolean;
  format?: 'html' | 'element';
  containerId?: string;
  keepInDOM?: boolean;
  waitTime?: number;
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `width` | `number` | `400` | Container width in pixels |
| `applyThermalStyles` | `boolean` | `true` | Apply thermal printer styling |
| `format` | `'html' \| 'element'` | `'element'` | Return format |
| `containerId` | `string` | auto-generated | Custom container ID |
| `keepInDOM` | `boolean` | `false` | Keep container in DOM after render |
| `waitTime` | `number` | `0` | Wait time (ms) after rendering |

---

### ConvertToHTMLResult

Result returned by `convertToHTML()`.

```typescript
interface ConvertToHTMLResult {
  content: string | HTMLElement;
  container: HTMLElement;
  containerId: string;
  cleanup: () => void;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `content` | `string \| HTMLElement` | Rendered content (HTML string or element) |
| `container` | `HTMLElement` | Container element |
| `containerId` | `string` | Container ID |
| `cleanup` | `() => void` | Removes container from DOM |

---

## Components

### Document

Root wrapper for thermal printer documents.

```typescript
interface DocumentProps {
  children: ReactNode;
  style?: ViewStyle;
}
```

**Example:**

```tsx
<Document>
  <Page>
    <Text>Content</Text>
  </Page>
</Document>
```

---

### Page

Semantic page wrapper. Thermal printers print continuously, so this is mainly for logical organization and PDF compatibility.

```typescript
interface PageProps {
  children: ReactNode;
  style?: ViewStyle;
  size?: string | { width: number; height?: number | 'auto' };
  wrap?: boolean;
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Page content |
| `style` | `ViewStyle` | - | Page styling |
| `size` | `string \| object` | - | Page dimensions in points (for PDF) |
| `wrap` | `boolean` | - | Enable dynamic height (PDF only) |

**`wrap` prop behavior:**

| Value | ESC/POS | PDF |
|-------|---------|-----|
| `undefined` | Ignored | Fixed height from size.height |
| `true` | Ignored | Dynamic height, no page breaks |
| `false` | Ignored | Prevents page breaks |

**Example:**

```tsx
// Fixed size for PDF
<Page size={{ width: 227, height: 300 }}>
  <Text>Fixed size receipt</Text>
</Page>

// Dynamic height for PDF
<Page wrap={true}>
  <Text>Content flows naturally</Text>
</Page>
```

---

### View

Layout container with flexbox support.

```typescript
interface ViewProps {
  children?: ReactNode;
  style?: ViewStyle;
}
```

**Example:**

```tsx
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

// Divider line
<View style={{ borderBottom: '1px solid black' }} />
```

---

### Text

Text content with styling.

```typescript
interface TextProps {
  children?: ReactNode;
  style?: TextStyle;
}
```

**Example:**

```tsx
<Text style={{ fontSize: 20, textAlign: 'center', fontWeight: 'bold' }}>
  Hello World
</Text>
```

---

### Image

Images are converted to monochrome for thermal printing.

```typescript
interface ImageProps {
  src: string;
  style?: ViewStyle & TextStyle;
  height?: string | number;
}
```

| Prop | Type | Description |
|------|------|-------------|
| `src` | `string` | Image source (URL or base64 data URI) |
| `style` | `ViewStyle & TextStyle` | Styling (textAlign for alignment) |
| `height` | `string \| number` | Fixed height (PDF only, ignored for ESC/POS) |

**Example:**

```tsx
// Base64 image
<Image src="data:image/png;base64,..." />

// With alignment
<Image
  src="data:image/png;base64,..."
  style={{ textAlign: 'center' }}
/>

// With fixed height (PDF only)
<Image
  src="data:image/png;base64,..."
  height={100}
/>
```

::: tip Image Best Practices
- Use high-contrast images
- Prefer base64 data URIs
- Keep images small (auto-resized to fit paper width)
- Test with monochrome images first
:::

---

### Preview

Visual preview component for development and testing.

```typescript
interface PreviewProps {
  children: ReactElement;
  paperWidth?: number;
  showRuler?: boolean;
  scale?: number;
  style?: CSSProperties;
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactElement` | - | Document to preview |
| `paperWidth` | `number` | `48` | Characters per line |
| `showRuler` | `boolean` | `false` | Show character ruler at top |
| `scale` | `number` | `1` | Scale factor for preview size |
| `style` | `CSSProperties` | - | Additional CSS styling |

**Example:**

```tsx
<Preview paperWidth={48} showRuler scale={1.5}>
  <Document>
    <Page>
      <Text>Preview content</Text>
    </Page>
  </Document>
</Preview>
```

---

## StyleSheet

Utility for organizing styles (pass-through function for `@react-pdf/renderer` compatibility).

```typescript
const StyleSheet = {
  create<T extends Styles>(styles: T): T;
  flatten(styles: any[]): any;
  compose(...styles: any[]): any;
}
```

### StyleSheet.create()

Creates a stylesheet object.

```typescript
const styles = StyleSheet.create({
  header: { fontSize: 20, textAlign: 'center' },
  text: { fontSize: 12 },
  bold: { fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between' }
});

<Text style={styles.header}>Title</Text>
```

### StyleSheet.flatten()

Flattens an array of style objects into a single object.

```typescript
const combined = StyleSheet.flatten([styles.header, styles.bold]);
```

### StyleSheet.compose()

Composes multiple styles (alias for flatten).

```typescript
const combined = StyleSheet.compose(styles.header, styles.bold);
```

---

## Font

Reserved for future use. Currently a no-op for thermal printers (which use built-in fonts only).

```typescript
const Font = {
  register(options: FontOptions): void;
  registerHyphenationCallback(callback: (word: string) => string[]): void;
  registerEmojiSource(options: { format: string; url: string }): void;
  getRegisteredFonts(): Map<string, FontOptions>;
  clear(): void;
}
```

**Example:**

```typescript
// This is a no-op for thermal printers
Font.register({
  family: 'Roboto',
  fonts: [{ src: 'https://...' }]
});
```

::: warning
Thermal printers use built-in fonts only. Font registration is stored but not used for ESC/POS output. It may be used for future PDF export features.
:::

---

## Adapters

The adapter system allows mapping custom component names to standard element types.

### createAdapter()

Creates a custom adapter from a component mapping.

```typescript
function createAdapter(mapping: ComponentMapping): RendererAdapter
```

**Example:**

```typescript
import { createAdapter, convertToESCPOS } from '@thermal-print/react';

const adapter = createAdapter({
  Receipt: 'document',
  Section: 'page',
  Row: 'view',
  Label: 'text',
  Logo: 'image'
});

const buffer = await convertToESCPOS(<Receipt />, {
  adapter,
  paperWidth: 48
});
```

---

### ComponentMapping

Type for custom component mappings.

```typescript
type ComponentMapping = Record<string, StandardElementType | string>;
```

**Standard element types:**
- `'document'` - Root document container
- `'page'` - Page element
- `'view'` - Container/layout element
- `'text'` - Text element
- `'image'` - Image element
- `'textnode'` - Raw text node

---

### RendererAdapter

Interface for custom adapters.

```typescript
interface RendererAdapter {
  renderToTree(component: ReactElement): ElementNode | null;
  normalizeElementType(type: string): string;
}
```

---

### Built-in Adapters

| Adapter | Description |
|---------|-------------|
| `ReactPDFAdapter` | Default adapter for `@react-pdf/renderer` components |
| `CustomAdapter` | Adapter created from ComponentMapping |

---

## Style Reference

### TextStyle

| Property | Type | ESC/POS | PDF | Description |
|----------|------|---------|-----|-------------|
| `fontSize` | `number` | Mapped to 4 sizes | Direct | Font size in pixels |
| `fontWeight` | `'bold' \| 'normal' \| number` | Yes | Yes | Bold (700+ = bold) |
| `textAlign` | `'left' \| 'center' \| 'right'` | Yes | Yes | Text alignment |
| `fontFamily` | `string` | No | Partial | Font family |
| `paddingLeft` | `number` | No | Yes | Left padding |
| `paddingRight` | `number` | No | Yes | Right padding |

### Font Size Mapping (ESC/POS)

| fontSize | ESC/POS Size | Description |
|----------|--------------|-------------|
| 8-12px | 1x1 | Normal size |
| 13-18px | 1x2 | Double height |
| 19-24px | 2x1 | Double width |
| 25+px | 2x2 | Double both (maximum) |

---

### ViewStyle

**Layout Properties:**

| Property | Type | ESC/POS | PDF | Description |
|----------|------|---------|-----|-------------|
| `flexDirection` | `'row' \| 'column'` | Yes | Yes | Layout direction |
| `justifyContent` | `string` | Partial | Partial | Main axis alignment |
| `alignItems` | `string` | Partial | Partial | Cross axis alignment |
| `width` | `string \| number` | Yes | Yes | Column width (e.g., '50%') |
| `height` | `string \| number` | No | Yes | Fixed height |

**Spacing Properties:**

| Property | Type | ESC/POS | PDF | Description |
|----------|------|---------|-----|-------------|
| `padding` | `number` | Top/bottom | Yes | All sides padding |
| `paddingTop` | `number` | Yes | Yes | Top padding |
| `paddingBottom` | `number` | Yes | Yes | Bottom padding |
| `paddingLeft` | `number` | No | Yes | Left padding |
| `paddingRight` | `number` | No | Yes | Right padding |
| `margin` | `number` | Top/bottom | Yes | All sides margin |
| `marginTop` | `number` | Yes | Yes | Top margin |
| `marginBottom` | `number` | Yes | Yes | Bottom margin |

**Border Properties:**

| Property | Type | ESC/POS | PDF | Description |
|----------|------|---------|-----|-------------|
| `borderTop` | `string` | Yes | Yes | Top divider line |
| `borderBottom` | `string` | Yes | Yes | Bottom divider line |

::: info Spacing Conversion
For ESC/POS: ~20 pixels = 1 line feed
:::

---

## Re-exports

The package re-exports types and functions from other `@thermal-print` packages for convenience:

### From @thermal-print/core

```typescript
export type { PrintNode, ElementNode, TextStyle, ViewStyle };
export { StandardElementType };
```

### From @thermal-print/escpos

```typescript
export { printNodesToESCPOS };
export type { PrintNodeToESCPOSOptions };
```

---

## Deprecated Exports

| Export | Replacement | Notes |
|--------|-------------|-------|
| `renderToElementTree()` | `convertToPrintNodes()` | Will be removed in v1.0 |
| `ElementNode` | `PrintNode` | Type alias, will be removed in v1.0 |
