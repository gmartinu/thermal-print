# @thermal-print/escpos

Convert PrintNode trees to ESC/POS thermal printer commands.

The `@thermal-print/escpos` package provides low-level ESC/POS command generation for thermal printers. It converts the intermediate PrintNode representation from `@thermal-print/react` into raw ESC/POS byte sequences ready to be sent to a thermal printer.

## Main API

### printNodesToESCPOS()

The main entry point for converting PrintNode trees to ESC/POS commands.

```typescript
function printNodesToESCPOS(
  printNode: PrintNode,
  options?: PrintNodeToESCPOSOptions
): Promise<Buffer>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `printNode` | `PrintNode` | Root PrintNode of the tree to convert |
| `options` | `PrintNodeToESCPOSOptions` | Optional conversion options |

**Returns:** `Promise<Buffer>` - ESC/POS command buffer ready for the printer

**Example:**

```typescript
import { printNodesToESCPOS } from '@thermal-print/escpos';

const buffer = await printNodesToESCPOS(printTree, {
  paperWidth: 48,
  cut: 'full',
  commandAdapter: 'escpos'
});
```

---

### PrintNodeToESCPOSOptions

Configuration options for ESC/POS conversion.

```typescript
interface PrintNodeToESCPOSOptions {
  paperWidth?: number;
  encoding?: string;
  debug?: boolean;
  cut?: boolean | 'full' | 'partial';
  feedBeforeCut?: number;
  commandAdapter?: CommandAdapter | 'escpos' | 'escbematech';
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `paperWidth` | `number` | `48` | Width in characters. Common values: 32 (58mm), 48 (80mm), 64 (112mm) |
| `encoding` | `string` | `'utf-8'` | Input character encoding |
| `debug` | `boolean` | `false` | Enable debug output |
| `cut` | `boolean \| 'full' \| 'partial'` | `'full'` | Paper cutting after printing |
| `feedBeforeCut` | `number` | `3` | Lines to feed before cutting |
| `commandAdapter` | `string \| CommandAdapter` | `'escpos'` | Command protocol adapter |

**Paper Width Reference:**

| Paper Size | Characters | Usage |
|------------|------------|-------|
| 58mm | 32 | Small receipt printers |
| 80mm | 48 | Standard receipt printers |
| 112mm | 64 | Wide receipt printers |

---

## ESCPOSGenerator

Low-level ESC/POS command generator class. Use this for fine-grained control over command generation.

### Constructor

```typescript
constructor(
  paperWidth?: number,
  encoding?: string,
  debug?: boolean,
  commandAdapter?: CommandAdapter
)
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `paperWidth` | `number` | `48` | Paper width in characters |
| `encoding` | `string` | `'cp860'` | Output character encoding |
| `debug` | `boolean` | `false` | Enable debug output |
| `commandAdapter` | `CommandAdapter` | ESCPOSCommandAdapter | Command protocol adapter |

### Methods

#### Text & Formatting

| Method | Signature | Description |
|--------|-----------|-------------|
| `initialize()` | `void` | Initialize printer with default settings |
| `addText(text)` | `text: string` | Add text with current formatting |
| `addNewline(count?)` | `count?: number` | Add newline(s) (default: 1) |
| `setAlign(align)` | `align: 'left' \| 'center' \| 'right'` | Set text alignment |
| `setBold(bold)` | `bold: boolean` | Enable/disable bold |
| `setSize(size)` | `size: {width: number; height: number}` | Set character size (max 2x2) |
| `resetFormatting()` | `void` | Reset text formatting to defaults |

**Example:**

```typescript
import { ESCPOSGenerator } from '@thermal-print/escpos';

const generator = new ESCPOSGenerator(48);
generator.initialize();
generator.setAlign('center');
generator.setBold(true);
generator.addText('RECEIPT');
generator.setBold(false);
generator.addNewline(2);
generator.setAlign('left');
generator.addText('Item 1');
```

#### Graphics & Codes

| Method | Signature | Description |
|--------|-----------|-------------|
| `addQRCode(data, size?)` | `data: string, size?: number` | Add QR code (size default: 6) |
| `addImage(source)` | `source: string \| {uri: string}` | Add image from base64/data URI |
| `addDivider(dashed?)` | `dashed?: boolean` | Add divider line |

**Example:**

```typescript
generator.addQRCode('https://example.com', 6);
generator.addDivider(true); // Dashed divider
await generator.addImage({ uri: 'data:image/png;base64,...' });
```

#### Paper Control

| Method | Signature | Description |
|--------|-----------|-------------|
| `cutFull()` | `void` | Full paper cut |
| `cutPartial()` | `void` | Partial paper cut |
| `cutFullWithFeed(lines?)` | `lines?: number` | Feed then full cut |
| `cutPartialWithFeed(lines?)` | `lines?: number` | Feed then partial cut |
| `setLineSpacing(dots?)` | `dots?: number` | Set line spacing (18-255 dots) |

#### Output

| Method | Signature | Description |
|--------|-----------|-------------|
| `getBuffer()` | `Buffer` | Get final ESC/POS command buffer |
| `getPaperWidth()` | `number` | Get configured paper width |
| `addRawCommand(data)` | `data: Buffer` | Add raw ESC/POS command bytes |

**Complete Example:**

```typescript
import { ESCPOSGenerator } from '@thermal-print/escpos';

const generator = new ESCPOSGenerator(48);
generator.initialize();

// Header
generator.setAlign('center');
generator.setBold(true);
generator.setSize({ width: 2, height: 2 });
generator.addText('ACME STORE');
generator.setSize({ width: 1, height: 1 });
generator.setBold(false);
generator.addNewline(2);

// Content
generator.setAlign('left');
generator.addText('Item 1                    $10.00');
generator.addNewline();
generator.addDivider();
generator.addText('Total                     $10.00');
generator.addNewline(2);

// QR Code
generator.setAlign('center');
generator.addQRCode('https://receipt.example.com/12345');
generator.addNewline(2);

// Cut
generator.cutFullWithFeed(3);

// Get buffer
const buffer = generator.getBuffer();
```

---

## TreeTraverser

Walks the PrintNode tree and generates ESC/POS commands using the generator.

```typescript
class TreeTraverser {
  constructor(generator: ESCPOSGenerator)
  traverse(node: ElementNode | null): Promise<void>
}
```

**Handles element types:**
- `document` - Root document container
- `page` - Page element
- `view` - Container with layout (column or row flexDirection)
- `text` - Text element
- `textnode` - Text node (string children)
- `image` - Image element

---

## Command Adapters

The library uses a command adapter pattern to support different ESC/POS protocol variants.

### CommandAdapter Interface

```typescript
interface CommandAdapter {
  getName(): string;
  getMaxCharacterSize(): { width: number; height: number };
  getInitCommand(): number[];
  getAlignCommand(align: 'left' | 'center' | 'right'): number[];
  getCharacterSizeCommand(width: number, height: number, bold: boolean): number[];
  getLineSpacingCommand(dots?: number): number[];
  getCutCommand(type: 'full' | 'partial', feedLines?: number): number[];
  getQRCodeCommand(data: string, size: number): number[];
  getRasterImageCommand(imageData: number[], width: number, height: number): number[];
  getLineFeedCommand(lines?: number): number[];
  getFeedLinesCommand(lines: number): number[];
}
```

### Available Adapters

| Adapter | Description |
|---------|-------------|
| `ESCPOSCommandAdapter` | Standard ESC/POS commands (default) |
| `ESCBematechCommandAdapter` | ESC/Bematech protocol for Bematech printers |

**Usage:**

```typescript
// Use ESC/POS (default)
const buffer = await printNodesToESCPOS(printTree, {
  commandAdapter: 'escpos'
});

// Use ESC/Bematech
const buffer = await printNodesToESCPOS(printTree, {
  commandAdapter: 'escbematech'
});
```

---

## Style Utilities

Functions for processing React styles into ESC/POS commands.

### Style Extraction

```typescript
function extractTextStyle(style: any): TextStyle
function extractViewStyle(style: any): ViewStyle
```

### Style Processing

| Function | Description |
|----------|-------------|
| `isBold(style)` | Check if text should be bold |
| `mapFontSizeToESCPOS(fontSize?)` | Map font size to character size (max 2x2) |
| `mapTextAlign(textAlign?)` | Map CSS textAlign to ESC/POS alignment |
| `calculateSpacing(value?)` | Calculate spacing in line feeds (~20px = 1 line) |
| `isDashedBorder(border?)` | Check if border is dashed |

### Layout Utilities

| Function | Description |
|----------|-------------|
| `generateDividerLine(width, dashed?)` | Generate divider line string |
| `parseWidth(width, totalWidth)` | Parse percentage width to characters |
| `alignTextInColumn(text, width, align)` | Align text within column width |
| `wrapText(text, width)` | Wrap text to fit width |

---

## Character Encoding

The library uses **CP860** (Code Page 860) by default for Brazilian Portuguese support.

### encodeCP860()

```typescript
function encodeCP860(text: string): number[]
```

Converts UTF-16 text to CP860 byte array for thermal printers.

**Supported characters:**
- Standard ASCII (0x00-0x7F)
- Portuguese diacritics: ç, Ç, á, é, í, ó, ú, à, ã, õ, â, ê, ô
- Box drawing characters
- Math symbols
- Greek letters

Unsupported characters are replaced with `?` (0x3F).

---

## Command References

For detailed ESC/POS and ESC/Bematech command documentation, see:

- [ESC/POS Commands](./escpos-commands) - Standard ESC/POS command reference
- [ESC/Bematech Commands](./escbematech-commands) - Bematech-specific command reference
