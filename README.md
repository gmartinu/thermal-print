# @thermal-print

A modular TypeScript library suite for thermal printing with clean, standalone architecture.

## 🎯 Architecture Overview

```
React Components → PrintNode (IR) → ESC/POS Buffer → Thermal Printer
                ↓
              HTML/DOM → PDF (Browser Printing)
```

**Clean separation of concerns:**

- **@thermal-print/core** - Universal `PrintNode` intermediate representation (IR)
- **@thermal-print/react** - React components + PrintNode converter + HTML converter
- **@thermal-print/escpos** - PrintNode → ESC/POS buffer converter
- **@thermal-print/pdf** - DOM → PDF converter (framework-agnostic)

## 📦 Packages

### [@thermal-print/react](./packages/react) - React Components

The main package you'll use. Provides React components optimized for thermal printers.

```bash
pnpm add @thermal-print/react
```

**Exports:**

- Components: `Document`, `Page`, `View`, `Text`, `Image`, `Preview`
- Utilities: `StyleSheet`, `Font`
- Functions: `convertToESCPOS()`, `convertToPrintNodes()`, `convertToHTML()`

### [@thermal-print/pdf](./packages/pdf) - PDF Generation

Framework-agnostic PDF generation from DOM elements. Perfect for browser printing.

```bash
pnpm add @thermal-print/pdf
```

**Exports:**

- Function: `convertToPDF(elementOrId, options)`
- Supports standard and thermal paper sizes (A4, Letter, 80mm, 58mm)

### [@thermal-print/escpos](./packages/escpos) - ESC/POS Converter

Converts PrintNode trees to ESC/POS commands for thermal printers.

```bash
pnpm add @thermal-print/escpos
```

### [@thermal-print/core](./packages/core) - Core Types

Shared type definitions (PrintNode, styles).

```bash
pnpm add @thermal-print/core
```

## 🚀 Quick Start

### Basic Receipt

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
          <Text>\$3.50</Text>
        </View>

        <View style={styles.row}>
          <Text style={{ fontWeight: "bold" }}>Total</Text>
          <Text style={{ fontWeight: "bold" }}>\$3.50</Text>
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

### With Preview Component

```typescript
import { Preview } from "@thermal-print/react";

function App() {
  return (
    <div>
      <h1>Receipt Preview</h1>

      <Preview paperWidth={48} showRuler>
        <Document>
          <Page>
            <Text>This is how it will print!</Text>
          </Page>
        </Document>
      </Preview>
    </div>
  );
}
```

### Browser Printing with PDF

```typescript
import { convertToHTML } from "@thermal-print/react";
import { convertToPDF } from "@thermal-print/pdf";

async function printReceipt() {
  // Step 1: Render React component to DOM
  const htmlResult = await convertToHTML(
    <Document>
      <Page>
        <Text>Receipt Content</Text>
      </Page>
    </Document>,
    {
      containerId: "thermal-receipt",
      keepInDOM: true,
      width: 600,
    }
  );

  // Step 2: Convert DOM to PDF
  const pdfResult = await convertToPDF("thermal-receipt", {
    paperSize: "80mm",
    scale: 2,
  });

  // Step 3: Open print dialog
  window.open(pdfResult.url);

  // Step 4: Cleanup
  htmlResult.cleanup();
  pdfResult.cleanup();
}
```

### Advanced: Manipulate PrintNode IR

```typescript
import { convertToPrintNodes } from "@thermal-print/react";
import { printNodesToESCPOS } from "@thermal-print/escpos";

// Step 1: React → PrintNode IR
let printNode = convertToPrintNodes(<Receipt />);

// Step 2: Manipulate IR (add watermark, filter, etc.)
printNode = {
  ...printNode,
  children: [
    ...printNode.children,
    {
      type: "text",
      props: { children: "COPY - NOT ORIGINAL" },
      children: [],
      style: { textAlign: "center", fontSize: 12 },
    },
  ],
};

// Step 3: PrintNode → ESC/POS
const buffer = await printNodesToESCPOS(printNode, {
  paperWidth: 48,
  commandAdapter: "escbematech", // or 'escpos'
});
```

## 📖 Component API

### Document

Root wrapper for thermal printer documents.

```typescript
<Document>
  <Page>...</Page>
</Document>
```

### Page

Semantic page wrapper (thermal printers print continuously).

```typescript
<Page style={{ padding: 20 }}>
  <Text>Content</Text>
</Page>
```

### View

Layout container with flexbox support.

```typescript
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
```

### Text

Text content with styling.

```typescript
<Text style={{ fontSize: 20, textAlign: "center", fontWeight: "bold" }}>
  Hello World
</Text>
```

**Font size mapping:**

- 8-12px → 1x1 (normal)
- 13-18px → 1x2 (double height)
- 19-24px → 2x1 (double width)
- 25+px → 2x2 (double both)

### Image

Images (converted to monochrome).

```typescript
<Image src="data:image/png;base64,..." style={{ textAlign: "center" }} />
```

### StyleSheet

Pass-through utility for style organization.

```typescript
const styles = StyleSheet.create({
  header: { fontSize: 20 },
  text: { fontSize: 12 },
});
```

### Font

No-op for thermal printers (reserved for future PDF export).

```typescript
Font.register({
  family: "Roboto",
  fonts: [{ src: "https://..." }],
});
```

## 🔮 Future Printer Support

The clean architecture makes it easy to add new formats:

- **@thermal-print/star** - Star Micronics printers
- **@thermal-print/zpl** - Zebra label printers
- **@thermal-print/epson** - Epson TM-series

All will consume the same `PrintNode` IR! 🎉

## 🛠 Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm run build

# Build specific packages
pnpm run build:core
pnpm run build:escpos
pnpm run build:react
pnpm run build:pdf

# Watch mode
pnpm run dev

# Clean build artifacts
pnpm run clean
```

## 📦 Publishing

```bash
# Publish individual packages
pnpm run publish:core
pnpm run publish:escpos
pnpm run publish:react
pnpm run publish:pdf

# Publish all packages at once
pnpm run publish:all

# Version bumps
pnpm run version:patch  # 0.1.0 → 0.1.1
pnpm run version:minor  # 0.1.0 → 0.2.0
pnpm run version:major  # 0.1.0 → 1.0.0
```

## 📝 Migrating from @react-pdf/renderer

This library is now **fully standalone** with no dependency on `@react-pdf/renderer`.

**Quick migration:**

```typescript
// Before
import { Document, Page, Text } from "@react-pdf/renderer";

// After - Just change the import!
import { Document, Page, Text, convertToESCPOS } from "@thermal-print/react";
```

**Need more help?** See the comprehensive [Migration Guide](./packages/react/MIGRATION_FROM_REACT_PDF.md) for detailed instructions, API changes, and troubleshooting.

## 📄 License

MIT © Gabriel Martinusso

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.
