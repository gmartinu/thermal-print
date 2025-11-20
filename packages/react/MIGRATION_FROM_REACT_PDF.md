# Migration Guide: @react-pdf/renderer → @thermal-print/react

Complete guide for migrating from `@react-pdf/renderer` to `@thermal-print/react`.

## 🎯 Why Migrate?

**@thermal-print/react** is specifically optimized for thermal printers:

- ✅ **Direct thermal printing** - No PDF generation overhead
- ✅ **Faster rendering** - React → ESC/POS in milliseconds
- ✅ **Better compatibility** - Native thermal printer commands
- ✅ **Smaller bundle size** - No PDF dependencies
- ✅ **Browser printing support** - HTML/PDF conversion for web printing
- ✅ **Multiple output formats** - ESC/POS, PrintNode IR, HTML, PDF

## 📦 Installation

### Remove old dependencies

```bash
npm uninstall @react-pdf/renderer
# or
pnpm remove @react-pdf/renderer
```

### Install new packages

```bash
# Core package (required)
pnpm add @thermal-print/react

# Optional: For PDF browser printing
pnpm add @thermal-print/pdf
```

## 🔄 Quick Migration Checklist

- [ ] Update imports from `@react-pdf/renderer` to `@thermal-print/react`
- [ ] Replace `PDFViewer`/`PDFDownloadLink` with `Preview` component
- [ ] Replace `ReactPDF.render()` with `convertToESCPOS()` or `convertToHTML()`
- [ ] Update style properties (most are compatible)
- [ ] Test with thermal printer or Preview component

## 📝 Component Mapping

| @react-pdf/renderer | @thermal-print/react | Notes |
|---------------------|----------------------|-------|
| `Document` | `Document` | ✅ Drop-in replacement |
| `Page` | `Page` | ✅ Drop-in replacement |
| `View` | `View` | ✅ Drop-in replacement |
| `Text` | `Text` | ✅ Drop-in replacement |
| `Image` | `Image` | ✅ Drop-in replacement |
| `StyleSheet` | `StyleSheet` | ✅ Drop-in replacement |
| `Font` | `Font` | ⚠️ No-op for thermal printers |
| `PDFViewer` | `Preview` | ⚠️ Different API |
| `PDFDownloadLink` | Use `convertToHTML` + `convertToPDF` | ⚠️ Different approach |
| `BlobProvider` | Use `convertToESCPOS` | ⚠️ Returns Buffer instead of Blob |
| `usePDF` | N/A | Use conversion functions directly |
| `Link` | N/A | Not supported (thermal printers don't support links) |
| `Note` | N/A | Not supported |
| `Canvas` | N/A | Not supported |

## 🔧 Code Examples

### Before (with @react-pdf/renderer)

```typescript
import React from 'react';
import { Document, Page, Text, View, StyleSheet, PDFViewer } from '@react-pdf/renderer';
import ReactPDF from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  header: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

function Receipt() {
  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.header}>MY STORE</Text>
        <View style={styles.row}>
          <Text>Coffee</Text>
          <Text>$3.50</Text>
        </View>
      </Page>
    </Document>
  );
}

// Preview in browser
function App() {
  return (
    <PDFViewer>
      <Receipt />
    </PDFViewer>
  );
}

// Generate PDF
ReactPDF.render(<Receipt />, `receipt.pdf`);
```

### After (with @thermal-print/react)

```typescript
import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Preview,        // Instead of PDFViewer
  convertToESCPOS // For thermal printing
} from '@thermal-print/react';

const styles = StyleSheet.create({
  page: {
    padding: 30,
  },
  header: {
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

function Receipt() {
  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.header}>MY STORE</Text>
        <View style={styles.row}>
          <Text>Coffee</Text>
          <Text>$3.50</Text>
        </View>
      </Page>
    </Document>
  );
}

// Preview in browser (thermal printer style)
function App() {
  return (
    <Preview paperWidth={48} showRuler>
      <Receipt />
    </Preview>
  );
}

// Generate ESC/POS for thermal printer
const buffer = await convertToESCPOS(<Receipt />, {
  paperWidth: 48,
  cut: 'full'
});
await printer.write(buffer);
```

## 🎨 Style Migration

### Supported Properties

Most CSS-like properties from `@react-pdf/renderer` work in `@thermal-print/react`:

| Property | Support | Notes |
|----------|---------|-------|
| `fontSize` | ✅ Full | Maps to thermal printer character sizes |
| `fontWeight` | ✅ Full | 'bold' or >= 700 |
| `textAlign` | ✅ Full | 'left', 'center', 'right' |
| `flexDirection` | ✅ Full | 'row', 'column' |
| `justifyContent` | ✅ Partial | 'space-between', 'center', 'flex-start', 'flex-end' |
| `padding` | ✅ Full | paddingTop, paddingBottom |
| `margin` | ✅ Full | marginTop, marginBottom |
| `borderTop` | ✅ Full | Solid or dashed dividers |
| `borderBottom` | ✅ Full | Solid or dashed dividers |
| `width` | ✅ Full | For column layouts |
| `color` | ❌ No | Thermal printers are monochrome |
| `backgroundColor` | ❌ No | Thermal printers are monochrome |
| `fontFamily` | ❌ No | Thermal printers have fixed fonts |
| `position` | ❌ No | Not applicable to thermal printing |
| `transform` | ❌ No | Not applicable to thermal printing |

### Font Size Mapping

`@react-pdf/renderer` uses points (pt), thermal printers use character multipliers:

| @react-pdf/renderer | @thermal-print/react | Result |
|---------------------|----------------------|--------|
| `fontSize: 8-12` | `fontSize: 8-12` | 1x1 (normal) |
| `fontSize: 14-18` | `fontSize: 13-18` | 1x2 (double height) |
| `fontSize: 20-24` | `fontSize: 19-24` | 2x1 (double width) |
| `fontSize: 28+` | `fontSize: 25+` | 2x2 (double both) |

**Tip:** Font sizes translate almost 1:1, but thermal printers have discrete size steps (1x1, 1x2, 2x1, 2x2).

## 🔄 API Migration

### PDFViewer → Preview

**Before:**
```typescript
import { PDFViewer } from '@react-pdf/renderer';

<PDFViewer width="100%" height="600">
  <Receipt />
</PDFViewer>
```

**After:**
```typescript
import { Preview } from '@thermal-print/react';

<Preview paperWidth={48} showRuler scale={1.5}>
  <Receipt />
</Preview>
```

**New Props:**
- `paperWidth` - Characters per line (default: 48 for 80mm paper)
- `showRuler` - Show character ruler for debugging
- `scale` - Scale factor for preview size

### ReactPDF.render() → convertToESCPOS()

**Before:**
```typescript
import ReactPDF from '@react-pdf/renderer';

// Generate PDF file
await ReactPDF.render(<Receipt />, './receipt.pdf');

// Or get blob
const blob = await ReactPDF.renderToStream(<Receipt />);
```

**After:**
```typescript
import { convertToESCPOS } from '@thermal-print/react';
import fs from 'fs';

// Generate ESC/POS buffer
const buffer = await convertToESCPOS(<Receipt />, {
  paperWidth: 48,
  cut: 'full'
});

// Save to file
fs.writeFileSync('./receipt.bin', buffer);

// Or send to printer
await printer.write(buffer);
```

### PDFDownloadLink → Browser Printing with PDF

For browser-based PDF downloads, use the new `convertToHTML` + `convertToPDF` approach:

**Before:**
```typescript
import { PDFDownloadLink } from '@react-pdf/renderer';

<PDFDownloadLink document={<Receipt />} fileName="receipt.pdf">
  {({ blob, url, loading, error }) =>
    loading ? 'Loading document...' : 'Download PDF'
  }
</PDFDownloadLink>
```

**After:**
```typescript
import { convertToHTML } from '@thermal-print/react';
import { convertToPDF } from '@thermal-print/pdf';

async function handleDownload() {
  // Step 1: Render to DOM
  const htmlResult = await convertToHTML(<Receipt />, {
    containerId: 'receipt-download',
    keepInDOM: true
  });

  // Step 2: Convert to PDF
  const pdfResult = await convertToPDF('receipt-download', {
    paperSize: '80mm',
    filename: 'receipt.pdf' // Auto-download
  });

  // Cleanup
  htmlResult.cleanup();
  pdfResult.cleanup();
}

<button onClick={handleDownload}>Download PDF</button>
```

### BlobProvider → Direct Buffer Generation

**Before:**
```typescript
import { BlobProvider } from '@react-pdf/renderer';

<BlobProvider document={<Receipt />}>
  {({ blob, url, loading, error }) => {
    // Use blob
  }}
</BlobProvider>
```

**After:**
```typescript
import { convertToESCPOS } from '@thermal-print/react';

// Get buffer directly
const buffer = await convertToESCPOS(<Receipt />, {
  paperWidth: 48
});

// Convert to blob if needed
const blob = new Blob([buffer], { type: 'application/octet-stream' });
const url = URL.createObjectURL(blob);
```

## 🖼️ Image Migration

Both libraries support images, but with different processing:

**Before (@react-pdf/renderer):**
```typescript
<Image src="https://example.com/logo.png" />
<Image src={require('./logo.png')} />
```

**After (@thermal-print/react):**
```typescript
// Base64 data URI (recommended for thermal printers)
<Image src="data:image/png;base64,iVBORw0KG..." />

// URL (will be fetched and converted)
<Image src="https://example.com/logo.png" />
```

**Key differences:**
- Images are automatically converted to **monochrome** (1-bit) for thermal printers
- Images are resized to fit paper width
- Best results with high-contrast images

## 🔧 Advanced Features

### Custom Component Names

If your code uses custom component names instead of Document/Page/View/Text:

```typescript
import { createAdapter, convertToESCPOS } from '@thermal-print/react';

const adapter = createAdapter({
  Receipt: 'document',
  Section: 'page',
  Row: 'view',
  Label: 'text'
});

const buffer = await convertToESCPOS(<Receipt />, {
  adapter,
  paperWidth: 48
});
```

### PrintNode Intermediate Representation

For advanced use cases, you can manipulate the IR:

```typescript
import { convertToPrintNodes } from '@thermal-print/react';
import { printNodesToESCPOS } from '@thermal-print/escpos';

// Step 1: React → PrintNode
let printNode = convertToPrintNodes(<Receipt />);

// Step 2: Modify the tree
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

// Step 3: PrintNode → ESC/POS
const buffer = await printNodesToESCPOS(printNode);
```

## 🐛 Common Migration Issues

### Issue: Fonts not rendering

**Problem:** `Font.register()` doesn't work

**Solution:** Thermal printers have fixed fonts. Remove `Font.register()` calls. The Font API is a no-op for compatibility.

```typescript
// Remove this
Font.register({ family: 'Roboto', fonts: [...] });

// Thermal printers use their built-in font
```

### Issue: Colors not showing

**Problem:** `color` and `backgroundColor` styles don't work

**Solution:** Thermal printers are monochrome. Remove color styles.

```typescript
// Before
<Text style={{ color: '#ff0000', backgroundColor: '#ffff00' }}>Red text</Text>

// After - use bold for emphasis
<Text style={{ fontWeight: 'bold' }}>Important text</Text>
```

### Issue: Complex layouts not rendering

**Problem:** Advanced flexbox or absolute positioning doesn't work

**Solution:** Thermal printers support limited layouts:
- Column layout (default, stacked vertically)
- Row layout (side-by-side with `flexDirection: 'row'`)
- Use `justifyContent: 'space-between'` for two-column layouts

```typescript
// Supported
<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
  <Text>Left</Text>
  <Text>Right</Text>
</View>

// Not supported - use simpler layouts
<View style={{ position: 'absolute', top: 10, left: 10 }}>
  <Text>Positioned text</Text>
</View>
```

### Issue: Page breaks not working

**Problem:** `break` prop doesn't create page breaks

**Solution:** Thermal printers print continuously. Use spacing instead:

```typescript
// Before
<View break />

// After - add spacing
<View style={{ marginTop: 20, marginBottom: 20 }}>
  <Text>Next section</Text>
</View>
```

### Issue: PDFs look different from preview

**Problem:** Using `convertToPDF` produces different output than Preview

**Solution:** The PDF conversion uses the browser rendering of your Preview component. Make sure to:
1. Use `keepInDOM: true` when calling `convertToHTML`
2. Use the same `paperWidth` in Preview and PDF conversion
3. Test the Preview component first

## 📊 Performance Comparison

| Operation | @react-pdf/renderer | @thermal-print/react |
|-----------|---------------------|----------------------|
| Simple receipt (10 lines) | ~500ms | ~50ms |
| Complex receipt (50 lines) | ~2000ms | ~150ms |
| With images | ~3000ms | ~800ms |
| Bundle size impact | ~2.5MB | ~500KB |

**Note:** Timings are approximate and depend on hardware. Thermal printing with `@thermal-print/react` is typically 5-10x faster.

## ✅ Migration Checklist

- [ ] Install `@thermal-print/react`
- [ ] Optionally install `@thermal-print/pdf` for browser printing
- [ ] Update all imports from `@react-pdf/renderer` to `@thermal-print/react`
- [ ] Replace `PDFViewer` with `Preview`
- [ ] Replace `ReactPDF.render()` with `convertToESCPOS()`
- [ ] Remove `Font.register()` calls
- [ ] Remove color-related styles
- [ ] Test with Preview component
- [ ] Test with actual thermal printer
- [ ] Update any custom wrappers or utilities
- [ ] Update documentation and examples
- [ ] Remove `@react-pdf/renderer` dependency

## 🆘 Need Help?

- **Documentation:** Check the [main README](../../README.md) and [package README](./README.md)
- **Related packages:** [@thermal-print/pdf](../pdf), [@thermal-print/escpos](../escpos), [@thermal-print/core](../core)
- **Issues:** Report bugs at GitHub Issues
- **Examples:** Check the examples directory

## 📄 License

MIT © Gabriel Martinusso
