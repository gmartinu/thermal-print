# React-PDF to ESC/POS - File Structure

## Core Library Files

### `index.ts` - Main Entry Point
- **Exports:** `convertPDFtoESCPOS()` function (primary API)
- **Purpose:** Main conversion function that orchestrates the entire process
- **Usage:** Import this to use the library
```typescript
import { convertPDFtoESCPOS } from 'src/libs/react-pdf-to-escpos';
```

### `types.ts` - Type Definitions
- **Contains:** TypeScript interfaces and types
- **Key Types:**
  - `ConversionOptions` - Configuration options
  - `ElementNode` - Internal tree representation
  - `TextStyle`, `ViewStyle` - Style interfaces
  - `ConversionContext` - Internal state tracking

### `renderer.ts` - React Component Renderer
- **Purpose:** Converts React components to element tree
- **Key Functions:**
  - `renderComponent()` - Uses react-test-renderer
  - `convertToElementNode()` - Converts renderer output to our tree format
  - `renderToElementTree()` - Main rendering function
- **Technology:** Uses `react-test-renderer` package

### `traverser.ts` - Tree Traverser
- **Purpose:** Walks the element tree and generates commands
- **Class:** `TreeTraverser`
- **Key Methods:**
  - `traverse()` - Main traversal entry point
  - `handleDocument()`, `handlePage()` - Container handlers
  - `handleView()` - Layout and spacing handler
  - `handleText()`, `handleTextNode()` - Text content handlers
  - `handleImage()` - Image/QR code handler
  - `handleRowLayout()` - Side-by-side column layout
  - `collectTextContent()` - Recursively gathers text

### `generator.ts` - ESC/POS Generator
- **Purpose:** Generates ESC/POS printer commands
- **Class:** `ESCPOSGenerator`
- **Key Methods:**
  - `initialize()` - Initializes printer
  - `setAlign()`, `setBold()`, `setSize()` - Text formatting
  - `addText()`, `addNewline()`, `addLineFeed()` - Content output
  - `addDivider()` - Draws divider lines
  - `addQRCode()`, `addImage()` - Graphics
  - `applyTextStyle()`, `applyViewSpacing()` - Style application
  - `getBuffer()` - Returns final ESC/POS buffer
- **Technology:** Uses `escpos` npm package

### `styles.ts` - Style Processing Utilities
- **Purpose:** Utilities for extracting and converting styles
- **Key Functions:**
  - `extractTextStyle()`, `extractViewStyle()` - Extract styles from objects
  - `isBold()` - Determines if text should be bold
  - `mapFontSizeToESCPOS()` - Maps fontSize to ESC/POS sizes
  - `mapTextAlign()` - Maps alignment
  - `calculateSpacing()` - Converts pixels to line feeds
  - `isDashedBorder()`, `generateDividerLine()` - Border handling
  - `parseWidth()` - Parses width percentages
  - `mergeStyles()` - Merges style objects

## Documentation Files

### `README.md` - Library Overview
- Architecture diagram
- Quick start guide
- Feature overview
- Design patterns reference

### `USAGE.md` - Comprehensive Usage Guide
- Detailed usage examples
- Configuration options
- Styling guide
- Integration examples
- Troubleshooting
- Advanced usage patterns

### `FILE_STRUCTURE.md` - This File
- File-by-file breakdown
- Purpose and responsibilities
- Quick reference

## Example Files

### `example.tsx` - Example Usage
- `convertCupomToESCPOS()` - Example conversion function
- `testConversion()` - Simple test runner
- Demonstrates how to use the library with Cupom component
- Shows how to save output to file

## Configuration Files

### `.gitignore`
- Ignores generated `.bin` files
- Ignores log files
- Ignores test-output directory

## Data Flow

```
User Code
   ↓
index.ts (convertPDFtoESCPOS)
   ↓
renderer.ts (renderToElementTree)
   ↓ [ElementNode tree]
traverser.ts (TreeTraverser.traverse)
   ↓ [Calls generator for each element]
generator.ts (ESCPOSGenerator)
   ↓ [Uses styles.ts utilities]
   ↓
Buffer (ESC/POS commands)
   ↓
Printer / File
```

## Dependencies

### External Packages
- `escpos` - ESC/POS command generation
- `react-test-renderer` - React component rendering
- `@react-pdf/renderer` - Peer dependency (your components use this)

### Internal Dependencies
- `src/utils` - For `writeFile()` in examples
- `src/components/Reports/Cupom` - Example component

## Total Files

- **6 core TypeScript files** (index, types, renderer, traverser, generator, styles)
- **3 documentation files** (README, USAGE, FILE_STRUCTURE)
- **1 example file** (example.tsx)
- **1 config file** (.gitignore)

**Total: 11 files**

## Quick Reference - Which File Does What?

| Task | File |
|------|------|
| Convert component to ESC/POS | `index.ts` → `convertPDFtoESCPOS()` |
| Render React to tree | `renderer.ts` |
| Walk the tree | `traverser.ts` |
| Generate ESC/POS commands | `generator.ts` |
| Process styles | `styles.ts` |
| Type definitions | `types.ts` |
| See usage examples | `example.tsx` or `USAGE.md` |
| Understand architecture | `README.md` |
| Troubleshooting | `USAGE.md` → Troubleshooting section |

## Extension Points

### To Add New Element Types
1. Add case in `traverser.ts` → `traverse()` switch
2. Implement `handleNewElement()` method
3. Use `generator.ts` methods to output commands

### To Add New Styles
1. Add style properties to `types.ts` interfaces
2. Add extraction in `styles.ts` → `extract*Style()` functions
3. Add processing in `generator.ts` → `apply*Style()` methods

### To Add New ESC/POS Commands
1. Add method to `generator.ts` → `ESCPOSGenerator` class
2. Use `this.printer.*` to access escpos API
3. Call from `traverser.ts` when needed

### To Change Paper Sizes
1. Pass different `paperWidth` in options:
   - 32 = 58mm thermal
   - 48 = 80mm thermal (default)
   - 64 = 110mm thermal
2. No code changes needed

## Testing Strategy

1. **Unit Testing**: Test individual functions in `styles.ts`
2. **Integration Testing**: Test `convertPDFtoESCPOS()` with sample components
3. **Manual Testing**: Generate `.bin` files and test with:
   - ESC/POS decoder tools (online)
   - Thermal printer simulators
   - Real thermal printers

See `example.tsx` for test harness.
