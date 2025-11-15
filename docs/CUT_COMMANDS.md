# ESC/POS Cut Commands Reference

This document provides a complete reference for paper cutting commands in the react-pdf-to-escpos library.

## ⚠️ Important: Command Compatibility

This library uses **ESC i** and **ESC m** cut commands instead of the standard GS V commands, as these work on a wider range of thermal printers including Bematech MP-4200 TH and similar models.

- **ESC i** (0x1B 0x69) - Full cut
- **ESC m** (0x1B 0x6D) - Partial cut

## Available Cut Methods

### 1. High-Level API (Using escpos library)

```typescript
import { ESCPOSGenerator } from './generator';

const generator = new ESCPOSGenerator(48, 'cp850', true);

// Basic cut (full cut)
generator.cut();

// Partial cut
generator.cut(true);

// Full cut with 3 lines feed before cutting
generator.cut(false, 3);

// Partial cut with 5 lines feed before cutting
generator.cut(true, 5);
```

### 2. Raw Command Methods (Direct ESC/POS)

These methods send direct ESC/POS commands for maximum compatibility:

```typescript
// Full cut - GS V 0
generator.cutFull();

// Partial cut - GS V 1
generator.cutPartial();

// Full cut with feed (default 3 lines)
generator.cutFullWithFeed();

// Full cut with custom feed
generator.cutFullWithFeed(5); // Feed 5 lines then cut

// Partial cut with feed (default 3 lines)
generator.cutPartialWithFeed();

// Partial cut with custom feed
generator.cutPartialWithFeed(4); // Feed 4 lines then cut
```

### 3. Using Command Constants

You can also use the command constants directly:

```typescript
import { CUT } from './commands';

// Send full cut command
generator.printer.raw(CUT.FULL);

// Send partial cut command
generator.printer.raw(CUT.PARTIAL);

// Send full cut with 3 lines feed
generator.printer.raw(CUT.FULL_WITH_FEED(3));

// Send partial cut with 5 lines feed
generator.printer.raw(CUT.PARTIAL_WITH_FEED(5));
```

## ESC/POS Command Details

### GS V - Paper Cut Commands

| Command | Hex | Description |
|---------|-----|-------------|
| GS V 0 | `1D 56 00` | Full cut (cuts through entire paper) |
| GS V 1 | `1D 56 01` | Partial cut (leaves small connection) |
| GS V 65 n | `1D 56 41 n` | Feed n lines then full cut |
| GS V 66 n | `1D 56 42 n` | Feed n lines then partial cut |

**Parameter `n`:**
- Range: 1-255
- Unit: Lines (using current line spacing)
- Common values: 3-5 lines for standard receipts

## Usage Examples

### Example 1: Simple Receipt End

```typescript
// Add some spacing and cut
generator.addNewline(3);
generator.cutPartial();
```

### Example 2: Full Receipt with Feed and Cut

```typescript
// Print receipt content
generator.addText('Thank you for your purchase!');
generator.addNewline(2);

// Feed 4 lines and perform full cut
generator.cutFullWithFeed(4);

// Get buffer
const buffer = generator.getBuffer();
```

### Example 3: Using Raw Commands for Maximum Control

```typescript
import { CUT, LINE_SPACING } from './commands';

// Set line spacing to 0
generator.printer.raw(LINE_SPACING.CUSTOM(0));

// Print content
generator.addText('Receipt content here');

// Feed exactly 3 lines
generator.addLineFeed(3);

// Execute partial cut
generator.printer.raw(CUT.PARTIAL);
```

### Example 4: Conditional Cutting

```typescript
function finishReceipt(fullCut: boolean = false, feedLines: number = 3) {
  if (fullCut) {
    generator.cutFullWithFeed(feedLines);
  } else {
    generator.cutPartialWithFeed(feedLines);
  }
}

// Usage
finishReceipt(false, 4); // Partial cut with 4 lines
finishReceipt(true, 5);  // Full cut with 5 lines
```

## Best Practices

### 1. **Always Feed Before Cutting**
```typescript
// ❌ BAD: Cut without feeding
generator.cutFull();

// ✅ GOOD: Feed then cut
generator.cutFullWithFeed(3);
```

### 2. **Use Partial Cut for Most Cases**
Partial cut is recommended for:
- Thermal printers with cutter mechanism
- Continuous paper (easier to tear)
- Printers that may jam on full cuts

```typescript
// Recommended for most thermal printers
generator.cutPartialWithFeed(3);
```

### 3. **Adjust Feed Based on Line Spacing**
```typescript
// If using minimal line spacing
generator.lineSpace(0);
generator.cutPartialWithFeed(5); // Need more lines

// If using default spacing
generator.lineSpace(); // Default
generator.cutPartialWithFeed(3); // Standard amount
```

### 4. **Test on Your Printer**
Different printer models may behave differently:
```typescript
// Enable debug mode to see what commands are being sent
const generator = new ESCPOSGenerator(48, 'cp850', true);

// Test different cut commands
generator.cutFull();           // Test 1
generator.cutPartial();        // Test 2
generator.cutFullWithFeed(3);  // Test 3
generator.cutPartialWithFeed(3); // Test 4 (usually best)
```

## Troubleshooting

### Paper Doesn't Cut
1. Check if printer supports cutting (some thermal printers don't have cutters)
2. Try increasing feed lines: `cutPartialWithFeed(5)` instead of `cutPartialWithFeed(3)`
3. Ensure printer has power and cutter mechanism is working

### Paper Jams When Cutting
1. Use partial cut instead of full cut: `cutPartial()` instead of `cutFull()`
2. Increase feed before cut: `cutPartialWithFeed(5)`
3. Check paper quality and cutter blade condition

### Cut Happens Too Early
1. Increase feed lines in cut command
2. Add manual feed before cutting:
```typescript
generator.addLineFeed(3);
generator.cutPartial();
```

### Cut Doesn't Happen at All
1. Verify printer supports GS V commands (check manual)
2. Some printers use alternative cut commands - try high-level API:
```typescript
generator.cut(true, 3); // Let escpos library handle it
```

## Compatibility Notes

- **GS V commands** are supported by most ESC/POS compatible printers
- Some printers only support `GS V 0` and `GS V 1` (without feed)
- Older printers may not support cutting at all
- Check your printer manual for specific cut command support

## See Also

- `generator.ts` - ESCPOSGenerator class implementation
- `commands.ts` - All ESC/POS command constants
- `escpos.d.ts` - TypeScript definitions for escpos library
