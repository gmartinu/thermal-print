# ESC/POS Conversion - Usage Examples

## Basic Usage (with default partial cut)

```typescript
import { convertPDFtoESCPOS } from './index';
import { Cupom } from './components/Cupom';

const buffer = await convertPDFtoESCPOS(
  <Cupom cupom={data} products={products} />,
  {
    paperWidth: 48,
    encoding: 'utf-8',
  }
);
// Default behavior: Partial cut with 3 lines feed
```

## Disable Cutting

```typescript
const buffer = await convertPDFtoESCPOS(
  <Cupom cupom={data} products={products} />,
  {
    paperWidth: 48,
    cut: false, // No cutting
  }
);
```

## Full Cut with Custom Feed

```typescript
const buffer = await convertPDFtoESCPOS(
  <Cupom cupom={data} products={products} />,
  {
    paperWidth: 48,
    cut: 'full', // Full cut instead of partial
    feedBeforeCut: 5, // Feed 5 lines before cutting
  }
);
```

## Partial Cut with Custom Feed

```typescript
const buffer = await convertPDFtoESCPOS(
  <Cupom cupom={data} products={products} />,
  {
    paperWidth: 48,
    cut: 'partial', // Explicitly specify partial cut
    feedBeforeCut: 4, // Feed 4 lines before cutting
  }
);
```

## Boolean Cut Option

```typescript
const buffer = await convertPDFtoESCPOS(
  <Cupom cupom={data} products={products} />,
  {
    paperWidth: 48,
    cut: true, // Same as 'partial'
    feedBeforeCut: 3,
  }
);
```

## Complete Configuration

```typescript
const buffer = await convertPDFtoESCPOS(
  <Cupom cupom={data} products={products} />,
  {
    paperWidth: 48,         // 48 chars for 80mm, 32 for 58mm
    encoding: 'cp850',      // Portuguese encoding
    debug: true,            // Enable debug logging
    cut: 'partial',         // Cut type: false, true, 'partial', or 'full'
    feedBeforeCut: 3,       // Lines to feed before cut (1-255)
  }
);
```

## Sending to Printer

### Serial Port (Thermal Printer)

```typescript
import { SerialPort } from 'serialport';

const buffer = await convertPDFtoESCPOS(<Cupom />, {
  paperWidth: 48,
  cut: 'partial',
  feedBeforeCut: 4,
});

const port = new SerialPort({
  path: 'COM3',
  baudRate: 9600,
});

port.write(buffer, (err) => {
  if (err) {
    console.error('Print failed:', err);
  } else {
    console.log('Printed successfully!');
  }
});
```

### Using Electron IPC (PDV App)

```typescript
import { writeFile } from 'src/utils';

const buffer = await convertPDFtoESCPOS(<Cupom />, {
  paperWidth: 48,
  cut: 'partial',
  feedBeforeCut: 3,
});

// Save to temp file
const filePath = 'C:\\temp\\cupom.bin';
await writeFile('temp', 'cupom.bin', buffer);

// Then print using @grandchef/node-printer or other method
```

## Cut Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `cut` | `false \| true \| 'partial' \| 'full'` | `'partial'` | Cut mode after printing |
| `feedBeforeCut` | `number` | `3` | Lines to feed before cutting (1-255) |

### Cut Option Values

- `false`: No cutting (manual tear)
- `true`: Partial cut (same as `'partial'`)
- `'partial'`: Partial cut - leaves small connection (recommended)
- `'full'`: Full cut - cuts through entire paper

## Recommendations

### For Most Thermal Printers
```typescript
{
  cut: 'partial',
  feedBeforeCut: 3
}
```

### For Printers with Auto-Tear
```typescript
{
  cut: false  // Let user tear manually
}
```

### For High-Volume Printing
```typescript
{
  cut: 'full',
  feedBeforeCut: 5  // More space for clean cut
}
```

### For Testing/Development
```typescript
{
  cut: false,  // Don't waste paper during testing
  debug: true
}
```

## Troubleshooting

### Paper doesn't cut
- Increase `feedBeforeCut` to 5 or more
- Check if printer supports cutting (some don't)
- Try switching from `'full'` to `'partial'`

### Paper jams when cutting
- Use `'partial'` instead of `'full'`
- Check paper quality and cutter blade
- Increase `feedBeforeCut` for more clearance

### Too much white space after content
- Reduce `feedBeforeCut` to 2 or 1
- Check line spacing in your content
- Use `cut: false` and let user tear

### Cut happens too early
- Content might be rendering smaller than expected
- Check if all content is actually being rendered
- Add manual feed in your React component before end

## Advanced: Manual Cut Control

If you need more control, you can disable auto-cut and use the generator directly:

```typescript
import { ESCPOSGenerator, convertPDFtoESCPOS } from './index';

const buffer = await convertPDFtoESCPOS(<Cupom />, {
  cut: false, // Disable auto-cut
});

// Manually add commands
const generator = new ESCPOSGenerator(48, 'cp850');
generator.printer.raw(buffer);
generator.addLineFeed(5);
generator.cutPartialWithFeed(2);
const finalBuffer = generator.getBuffer();
```

## See Also

- `CUT_COMMANDS.md` - Complete cut command reference
- `commands.ts` - All ESC/POS command constants
- `types.ts` - TypeScript interfaces
