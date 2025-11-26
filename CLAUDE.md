# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

react-escpos is a TypeScript library that converts React components (especially `@react-pdf/renderer` components) directly to ESC/POS thermal printer commands. It bypasses PDF generation for faster, more efficient thermal printing with better printer compatibility.

**Key value proposition**: React → ESC/POS → Thermal Printer (instead of React → PDF → Thermal Printer)

## Build & Development Commands

```bash
# Build the TypeScript library
npm run build

# Watch mode for development
npm run build:watch

# Prepare for publishing (runs build automatically)
npm run prepublishOnly
```

**Note**: There are no tests configured yet (`npm test` will fail). The library is tested through manual integration testing with thermal printers.

## Publishing Commands

```bash
# Version bump and publish (automated via Git tags)
npm run release:patch   # 1.0.0 → 1.0.1
npm run release:minor   # 1.0.0 → 1.1.0
npm run release:major   # 1.0.0 → 2.0.0
```

These commands automatically:

1. Bump version in package.json
2. Create Git tag
3. Push to remote with tags
4. Publish to npm

## Architecture Overview

### Core Processing Pipeline

The conversion happens in 4 main steps (see `src/index.ts:36-76`):

1. **Adapter Creation** (`createAdapter()`) - Creates adapter for component normalization (ReactPDFAdapter by default)
2. **Rendering** (`renderToElementTree()`) - Converts React component to normalized ElementNode tree using react-test-renderer
3. **Tree Traversal** (`TreeTraverser`) - Walks the element tree and generates ESC/POS commands
4. **Buffer Generation** (`ESCPOSGenerator.getBuffer()`) - Returns final ESC/POS command buffer

### Key Modules

#### 1. Adapter System (`src/adapters/`)

**Purpose**: Allows flexibility in component naming - supports both `@react-pdf/renderer` components (Document, Page, View, Text) and custom thermal-printer-specific components (Receipt, Item, etc.)

- `ReactPDFAdapter` (default) - Maps @react-pdf/renderer components to standard types
- `CustomAdapter` - Maps custom component names via ComponentMapping object
- All components normalize to: `document`, `page`, `view`, `text`, `image`

**Example**:

```typescript
// Custom adapter maps Receipt → document, Item → text
adapter: { Receipt: 'document', Item: 'text' }
```

#### 2. ESCPOSGenerator (`src/generator.ts`)

**Purpose**: Low-level ESC/POS command generation and buffer management

**Key responsibilities**:

- Maintains printer state (alignment, bold, size, encoding)
- Generates raw ESC/POS byte sequences
- Handles paper width calculations (characters per line)
- Supports CP860 encoding for Portuguese characters
- Manages paper cutting commands (full/partial)

**Important**: Uses ESC ! command (0x1B 0x21) for character sizing instead of GS ! command for better printer compatibility. The ESC ! command combines both size (up to 2x2) and bold emphasis in a single command. This avoids issues with printers like Bematech MP-4200 TH that don't support GS ! properly.

#### 3. TreeTraverser (`src/traverser.ts`)

**Purpose**: Walks the ElementNode tree and orchestrates ESC/POS generation

**Key layout modes**:

- **Column layout** (default): Stacks elements vertically
- **Row layout** (`flexDirection: 'row'`): Side-by-side columns with width calculations
  - Special handling for `justifyContent: 'space-between'` (receipt payment-style layout)
  - Fixed-width columns for table layouts

**Critical behavior**:

- Text alignment is inherited from child Text nodes, not View containers (lines 140-155)
- Row layouts with single child render normally to prevent flattening nested layouts

#### 4. ESC/POS Commands (`src/commands/escpos.ts`)

Raw ESC/POS byte sequences and encoding utilities:

- Text alignment (ESC a n)
- Bold (ESC E n)
- Paper cutting (ESC i for full cut, ESC m for partial cut)
- Line spacing (ESC 3 n)
- CP860 character encoding for Portuguese support

#### 5. Style Processing (`src/styles.ts`)

Converts React/CSS-like styles to ESC/POS commands:

- `fontSize` → ESC ! text sizes (1x1, 1x2, 2x1, 2x2 max)
- `fontWeight: 'bold'` → ESC ! with emphasis bit set
- `textAlign` → ESC a 0/1/2
- `flexDirection: 'row'` → Row layout processing
- `borderTop/borderBottom` → Divider lines (solid/dashed)
- `width` → Column width calculations (percentage or fixed)

### Critical Design Decisions

1. **Line Spacing**: Set to 5 dots by default in `generator.ts:91`, but enforced to minimum 18 dots for compatibility
   - Both ESC/POS and ESC/Bematech enforce 18-dot minimum (src/commands/escpos.ts:90, src/commands/escbematech.ts:424)
   - This ensures consistent formatting across both protocols
   - ESC/Bematech manual specifies 18 ≤ n ≤ 255 for ESC 3 command
2. **Font Size Command**: Uses ESC ! (0x1B 0x21) instead of GS ! (0x1D 0x21) for better printer compatibility
   - Limited to 2x2 maximum character size (1x1, 1x2, 2x1, 2x2)
   - Combines size and bold/emphasis in a single command
   - Avoids text rendering issues on printers like Bematech MP-4200 TH
   - **Uses Font B (bit 0 = 1) by default** - Narrower font (9×17 dots) fits more characters per line
   - Font B prevents line wrapping on 48-character receipts (80mm thermal printers)
3. **CP860 Encoding**: Default encoding supports Brazilian Portuguese characters (ç, á, é, etc.)
4. **Paper Width**: Default 48 characters (80mm thermal printers). Common values:
   - 58mm = 32 chars
   - 80mm = 48 chars (default)
   - 112mm = 64 chars

## TypeScript Configuration

- **Target**: ES2020, CommonJS modules
- **Strict mode**: Enabled
- **JSX**: React (for component type definitions)
- **Output**: `dist/` directory with declaration files (.d.ts)
- **Source**: `src/` directory only

## Character Encoding Notes

The library uses **CP860** (Code Page 860) by default for Brazilian Portuguese support. When adding new encoding features:

- Character mapping is in `src/encodings/cp860.ts`
- Unsupported characters are replaced with '?' (0x3F)
- UTF-8 is accepted as input but converted to CP860 for printer compatibility

## Common Maintenance Tasks

### Adding New ESC/POS Commands

1. Add raw byte sequence to `src/commands/escpos.ts`
2. Add method to `ESCPOSGenerator` in `src/generator.ts`
3. Expose via exports in `src/index.ts`

### Supporting New Style Properties

1. Add style type to `TextStyle` or `ViewStyle` in `src/types.ts`
2. Add extraction logic to `src/styles.ts` (extractTextStyle/extractViewStyle)
3. Add ESC/POS mapping function to `src/styles.ts`
4. Use in `TreeTraverser` handlers (`src/traverser.ts`)

### Testing with Real Printers

No automated tests exist. Manual testing workflow:

1. Run `npm run build`
2. Create test script importing from `dist/`
3. Generate ESC/POS buffer with `convertToESCPOS()`
4. Write buffer to file: `fs.writeFileSync('receipt.bin', buffer)`
5. Send to printer via USB, serial, or network

## File Organization

```
src/
├── index.ts              # Main API: convertToESCPOS()
├── generator.ts          # ESC/POS command generator (low-level)
├── traverser.ts          # Tree traversal and layout logic
├── renderer.ts           # React component → ElementNode tree
├── types.ts              # TypeScript type definitions
├── styles.ts             # Style extraction and mapping
├── adapters/             # Component normalization system
│   ├── index.ts
│   ├── types.ts
│   ├── base-adapter.ts
│   ├── react-pdf-adapter.ts
│   └── custom-adapter.ts
├── commands/
│   └── escpos.ts         # Raw ESC/POS byte sequences
└── encodings/
    └── cp860.ts          # CP860 character encoding
```

## Dependencies

- **Peer dependencies**: `react` (16.8+, 17, or 18), `@react-pdf/renderer` (3.0+)
- **Runtime dependency**: `react-test-renderer` - used to render React components to intermediate tree
- **No printer-specific libraries**: Pure ESC/POS command generation

## Publishing Notes

- Published to both **npm** and **GitHub Packages**
- Automated via GitHub Actions when pushing to `main` branch
- Version bumps create Git tags automatically
- See `PUBLISHING.md` for detailed publishing setup instructions

## PDF Package (`packages/pdf`)

The `@thermal-print/pdf` package provides vector PDF generation from PrintNode trees.

### Architecture

**Key files:**
- `src/index.ts` - Entry point: `printNodesToPDF()` (vector) and `convertToPDF()` (raster)
- `src/pdf-generator.ts` - Low-level jsPDF wrapper for text, images, and layout
- `src/pdf-traverser.ts` - Walks PrintNode tree and calls PDFGenerator methods

### Processing Pipeline

1. **Entry** (`printNodesToPDF`) - Reads Page props (size, wrap) to configure paper
2. **Generator** (`PDFGenerator`) - Manages jsPDF instance, coordinates, fonts
3. **Traverser** (`PDFTraverser`) - Walks tree, handles View/Text/Image nodes

### Key Design Decisions

1. **Dynamic Height** (`wrap=true`): Uses 5000pt initial height, content flows without page breaks
   - `DYNAMIC_HEIGHT_INITIAL = 5000` in pdf-generator.ts
   - jsPDF stores absolute Y coordinates, so page cannot be resized after content is rendered

2. **Style Inheritance**: Parent View's styles affect children
   - `alignItems: "center"` → children Text/Image are centered
   - `width: "30%"` → constrains child Image width
   - Tracked via `alignmentContext` and `widthConstraint` in PDFTraverser

3. **Units**: Uses points (pt) like @react-pdf/renderer
   - Page.size values are in points directly
   - No mm-to-pt conversion needed

4. **CSS Box Model**: Views follow margin → border → padding → content order
   - Implemented in `handleView()` in pdf-traverser.ts

### Common Issues

- **Page breaks with `wrap=true`**: Check that `wrap` prop is being read (index.ts lines 255-272)
- **Image not centered**: Check `alignmentContext` inheritance in handleImage()
- **Image too large**: Check `widthConstraint` from parent View's width percentage

## PDF Processing

## NEVER use the Read tool to open PDF files directly

## ALWAYS extract PDFs to text first using pdftotext via Bash before processing
