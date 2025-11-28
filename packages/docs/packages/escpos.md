# @thermal-print/escpos

Converts PrintNode trees to ESC/POS commands for thermal printers.

::: tip API Reference
For detailed API documentation, see the [@thermal-print/escpos API Reference](/api/escpos/).

For low-level command documentation:
- [ESC/POS Commands Reference](/api/escpos/escpos-commands) - Standard ESC/POS commands
- [ESC/Bematech Commands Reference](/api/escpos/escbematech-commands) - Bematech-specific commands
:::

## Installation

```bash
pnpm add @thermal-print/escpos
```

## Exports

- `printNodesToESCPOS()` - Convert PrintNode IR to ESC/POS buffer

## Basic Usage

```mermaid
graph LR
    A[React Component] -->|convertToPrintNodes| B[PrintNode IR]
    B -->|printNodesToESCPOS| C[ESC/POS Buffer]
    C -->|printer.write| D[Thermal Printer]
```

```tsx
import { convertToPrintNodes } from '@thermal-print/react';
import { printNodesToESCPOS } from '@thermal-print/escpos';

// Step 1: React → PrintNode IR
const printNode = convertToPrintNodes(<Receipt />);

// Step 2: PrintNode → ESC/POS
const buffer = await printNodesToESCPOS(printNode, {
  paperWidth: 48,
  cut: 'full'
});

// Step 3: Send to printer
await printer.write(buffer);
```

## Options

```tsx
interface PrintNodeToESCPOSOptions {
  // Paper width in characters (default: 48 for 80mm)
  paperWidth?: number;

  // Paper cut mode
  cut?: boolean | 'full' | 'partial';

  // Command adapter: 'escpos' or 'escbematech'
  commandAdapter?: string;
}
```

## Paper Widths

| Paper Size | Characters |
|------------|------------|
| 58mm       | 32 chars   |
| 80mm       | 48 chars   |
| 112mm      | 64 chars   |

## Command Adapters

### escpos (default)

Standard ESC/POS commands compatible with most thermal printers.

### escbematech

Optimized for Bematech printers with specific command sequences.

```tsx
const buffer = await printNodesToESCPOS(printNode, {
  commandAdapter: 'escbematech'
});
```

## Advanced: Manipulate PrintNode IR

```tsx
import { convertToPrintNodes } from '@thermal-print/react';
import { printNodesToESCPOS } from '@thermal-print/escpos';

// Get the IR
let printNode = convertToPrintNodes(<Receipt />);

// Manipulate the tree (add watermark, filter, etc.)
printNode = {
  ...printNode,
  children: [
    ...printNode.children,
    {
      type: 'text',
      props: { children: 'COPY - NOT ORIGINAL' },
      children: [],
      style: { textAlign: 'center', fontSize: 12 }
    }
  ]
};

// Convert to ESC/POS
const buffer = await printNodesToESCPOS(printNode);
```

## Character Encoding

The library uses CP860 (Code Page 860) by default, which supports Brazilian Portuguese characters (ç, á, é, etc.).

## Learn More

- [API Reference](/api/escpos/) - Complete API documentation
- [ESC/POS Commands](/api/escpos/escpos-commands) - 130+ standard ESC/POS commands
- [ESC/Bematech Commands](/api/escpos/escbematech-commands) - 150+ Bematech-specific commands
