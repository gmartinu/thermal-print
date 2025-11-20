# @thermal-print/escpos

ESC/POS command generation and thermal printer control.

## 📦 Installation

```bash
pnpm add @thermal-print/escpos
```

## 🎯 Purpose

Converts `PrintNode` trees (universal IR) to ESC/POS command buffers for thermal printers.

**Architecture:**

```
PrintNode → ESCPOSGenerator → Buffer (ESC/POS commands)
```

## 🚀 Quick Start

```typescript
import { printNodesToESCPOS } from "@thermal-print/escpos";
import { PrintNode } from "@thermal-print/core";

const printNode: PrintNode = {
  type: "document",
  props: {},
  children: [
    {
      type: "text",
      props: { children: "Hello World" },
      children: [],
      style: { textAlign: "center", fontSize: 20 },
    },
  ],
  style: {},
};

// Convert to ESC/POS buffer
const buffer = await printNodesToESCPOS(printNode, {
  paperWidth: 48,
  cut: "full",
});

// Send to printer
await printer.write(buffer);
```

## 📖 API

### printNodesToESCPOS(printNode, options)

Main conversion function.

**Parameters:**

- `printNode: PrintNode` - Root node of the tree to convert
- `options?: PrintNodeToESCPOSOptions` - Conversion options

**Options:**

```typescript
interface PrintNodeToESCPOSOptions {
  paperWidth?: number; // Characters per line (default: 48)
  encoding?: string; // Character encoding (default: 'utf-8')
  debug?: boolean; // Enable debug output
  cut?: boolean | "full" | "partial"; // Paper cut (default: 'full')
  feedBeforeCut?: number; // Lines to feed before cut (default: 3)
  commandAdapter?: "escpos" | "escbematech"; // Protocol (default: 'escpos')
}
```

**Returns:** `Promise<Buffer>` - ESC/POS command buffer

## 🎛 Command Adapters

### ESC/POS (Default)

Standard ESC/POS protocol compatible with most thermal printers.

```typescript
const buffer = await printNodesToESCPOS(printNode, {
  commandAdapter: "escpos",
});
```

### ESC/Bematech

Bematech MP-4200 TH specific protocol.

```typescript
const buffer = await printNodesToESCPOS(printNode, {
  commandAdapter: "escbematech",
});
```

## 🔧 Advanced Usage

### Custom Command Adapter

```typescript
import { CommandAdapter, ESCPOSGenerator } from "@thermal-print/escpos";

class CustomAdapter implements CommandAdapter {
  getName(): string {
    return "custom";
  }

  getInitCommand(): number[] {
    return [0x1b, 0x40]; // ESC @
  }

  // ... implement other methods
}

const buffer = await printNodesToESCPOS(printNode, {
  commandAdapter: new CustomAdapter(),
});
```

### Direct Generator Usage

```typescript
import { ESCPOSGenerator, TreeTraverser } from "@thermal-print/escpos";

const generator = new ESCPOSGenerator(48, "utf-8");
generator.initialize();

const traverser = new TreeTraverser(generator);
await traverser.traverse(printNode);

generator.cutFullWithFeed(3);
const buffer = generator.getBuffer();
```

## 🎨 Styling Support

### Text Styles

- **fontSize**: Maps to character sizes (1x1, 1x2, 2x1, 2x2)
- **fontWeight**: 'bold' or numeric ≥700
- **textAlign**: 'left', 'center', 'right'

### Layout Styles

- **flexDirection**: 'row' (side-by-side), 'column' (stacked)
- **justifyContent**: 'space-between', 'center', etc.
- **padding/margin**: Top and bottom spacing (converted to line feeds)
- **borderTop/borderBottom**: Divider lines (solid or dashed)
- **width**: Column width (percentage or fixed characters)

## 🌍 Character Encoding

### CP860 (Default)

Brazilian Portuguese support with special characters: ç, á, é, í, ó, ú, ã, õ

```typescript
const buffer = await printNodesToESCPOS(printNode, {
  encoding: "cp860",
});
```

## 📏 Paper Widths

Common thermal printer paper widths:

- **58mm** = 32 characters
- **80mm** = 48 characters (default)
- **112mm** = 64 characters

```typescript
const buffer = await printNodesToESCPOS(printNode, {
  paperWidth: 48, // 80mm paper
});
```

## 🖼 Image Support

Images are automatically:

- Resized to fit paper width
- Converted to grayscale
- Converted to monochrome (1-bit)
- Printed using ESC/POS raster graphics

Requires `jimp` for image processing (optional dependency).

## 📄 License

MIT © Gabriel Martinusso
