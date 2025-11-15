# React-PDF to ESC/POS - Usage Guide

## Quick Start

### Basic Usage

```typescript
import { convertPDFtoESCPOS } from 'src/libs/react-pdf-to-escpos';
import Cupom from 'src/components/Reports/Cupom';

// Convert Cupom component to ESC/POS commands
const buffer = await convertPDFtoESCPOS(
  <Cupom
    cupom={cupomData}
    products={products}
    formas={formas}
    loja={loja}
    _print={true}
  />,
  {
    paperWidth: 48, // 80mm thermal printer (48 chars wide)
    encoding: 'utf-8',
    debug: true
  }
);

// buffer is now ready to be sent to the printer
```

### Saving Output for Testing

```typescript
import fs from 'fs';
import { convertPDFtoESCPOS } from 'src/libs/react-pdf-to-escpos';

const buffer = await convertPDFtoESCPOS(<YourComponent />, { debug: true });

// Save to file
fs.writeFileSync('C:\\temp\\output.bin', buffer);

// Or use the app's writeFile utility
import { writeFile } from 'src/utils';
await writeFile('C:\\temp', 'output.bin', buffer);
```

### Testing with ESC/POS Tools

You can test the generated `.bin` file with:

1. **Online ESC/POS Decoder**: Upload to tools like:
   - https://escpos-decoder.appspot.com/
   - Decode the commands to see what would be printed

2. **ESC/POS Virtual Printer**: Use software like:
   - `node-escpos` examples
   - Virtual thermal printer simulators

3. **Send to Real Printer**: Use utilities like:
   ```bash
   # On Windows
   copy /b output.bin \\.\LPT1

   # Or via Node.js
   const printer = require('@grandchef/node-printer');
   printer.printDirect({
     data: buffer,
     printer: 'PrinterName',
     type: 'RAW',
     success: () => console.log('Printed!'),
     error: (err) => console.error(err)
   });
   ```

## Configuration Options

### ConversionOptions

```typescript
interface ConversionOptions {
  paperWidth?: number;  // Width in characters (default: 48)
                       // Common values:
                       // - 48 chars = 80mm thermal
                       // - 32 chars = 58mm thermal

  encoding?: string;    // Character encoding (default: 'utf-8')
                       // Options: 'utf-8', 'iso-8859-1', 'gb18030'

  debug?: boolean;      // Enable debug logging (default: false)
                       // Logs conversion steps to console
}
```

### Example with Different Paper Sizes

```typescript
// 58mm thermal printer (32 chars)
const buffer58mm = await convertPDFtoESCPOS(<Cupom />, {
  paperWidth: 32,
});

// 80mm thermal printer (48 chars) - DEFAULT
const buffer80mm = await convertPDFtoESCPOS(<Cupom />, {
  paperWidth: 48,
});
```

## Supported React-PDF Elements

### Text Elements

```tsx
<Text style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center' }}>
  Bold Centered Text
</Text>
```

**Supported Styles:**
- `fontSize`: Mapped to ESC/POS sizes (normal, double-width, double-height, quad)
- `fontWeight`: 'bold' or 700 → ESC/POS bold
- `textAlign`: 'left' | 'center' | 'right'
- `fontFamily`: 'Helvetica-Bold' → treated as bold

### View Elements (Containers)

```tsx
<View style={{
  borderBottom: '1px dashed #333',
  paddingTop: 10,
  marginBottom: 20
}}>
  <Text>Content</Text>
</View>
```

**Supported Styles:**
- `flexDirection`: 'row' (side-by-side) | 'column' (default, stacked)
- `borderBottom`: Renders as divider line (dashed or solid)
- `borderTop`: Renders as divider line
- `padding/margin`: Converted to line feeds (~20px = 1 line)
- `width`: Used for column layouts in rows

### Row Layouts (Side-by-Side Columns)

```tsx
<View style={{ flexDirection: 'row' }}>
  <View style={{ width: '33%' }}>
    <Text>Column 1</Text>
  </View>
  <View style={{ width: '33%' }}>
    <Text>Column 2</Text>
  </View>
  <View style={{ width: '33%' }}>
    <Text>Column 3</Text>
  </View>
</View>
```

### Images and QR Codes

```tsx
<Image source={{ uri: qrcodeDataUri }} />
```

**Note:** Image support is basic. QR codes work best when provided as data URIs.

## Styling Guide

### Font Sizes

Font sizes are mapped to ESC/POS text sizes:

| fontSize (px) | ESC/POS Size | Description |
|--------------|--------------|-------------|
| < 18 | Normal (1x1) | Regular text |
| 18-19 | Double-width (2x1) | Wide text |
| 20-23 | Double-height (1x2) | Tall text |
| ≥ 24 | Quad (2x2) | Large text |

### Borders

Borders create divider lines:

```tsx
// Dashed line
<View style={{ borderBottom: '1px dashed #333' }} />

// Solid line
<View style={{ borderBottom: '1px solid #333' }} />
```

Both render as full-width dividers (dashed uses `-`, solid uses `─`).

### Spacing

Padding and margins are converted to line feeds:

```tsx
<View style={{
  paddingTop: 20,     // ~1 line feed before
  paddingBottom: 40,  // ~2 line feeds after
  marginTop: 10,      // ~0.5 line feeds
  marginBottom: 10
}}>
  <Text>Content</Text>
</View>
```

Approximation: ~20 pixels ≈ 1 line feed

## Integration Examples

### Direct Printing Integration

```typescript
import { convertPDFtoESCPOS } from 'src/libs/react-pdf-to-escpos';
import { ipcRenderer } from 'src/utils';

async function printCupomDirect(cupomData: any) {
  // Convert to ESC/POS
  const buffer = await convertPDFtoESCPOS(
    <Cupom {...cupomData} _print={true} />,
    { paperWidth: 48 }
  );

  // Send to printer via IPC
  if (isElectron()) {
    ipcRenderer.send('print-escpos', {
      printerName: 'ThermalPrinter',
      data: buffer
    });
  }
}
```

### With Venda (Sales) Flow

```typescript
import { finalizarVenda } from 'src/data/controllers/venda';
import { convertPDFtoESCPOS } from 'src/libs/react-pdf-to-escpos';

async function finalizarEImprimir(vendaId: number) {
  // Finalize sale
  const cupom = await finalizarVenda(vendaId);

  // Generate ESC/POS
  const buffer = await convertPDFtoESCPOS(
    <Cupom
      cupom={cupom}
      products={cupom.produtos}
      formas={cupom.formas}
      loja={emitente}
    />
  );

  // Print directly to thermal printer
  await sendToThermalPrinter(buffer);
}
```

## Troubleshooting

### Issue: Buffer is empty

**Solution:** Enable debug mode to see where conversion fails:

```typescript
const buffer = await convertPDFtoESCPOS(<Component />, { debug: true });
```

Check console for error messages.

### Issue: Text is cut off

**Solution:** Adjust `paperWidth` to match your printer:

```typescript
// Try different widths
{ paperWidth: 32 }  // 58mm
{ paperWidth: 48 }  // 80mm (default)
{ paperWidth: 64 }  // 110mm
```

### Issue: Encoding problems (garbled text)

**Solution:** Try different encodings:

```typescript
{ encoding: 'gb18030' }     // Chinese
{ encoding: 'iso-8859-1' }  // Latin
{ encoding: 'utf-8' }       // Unicode (default)
```

### Issue: Images don't print

**Note:** Image support is limited. For best results:
1. Use QR codes via `qrcode()` method
2. Ensure images are in base64 data URI format
3. Keep images small (thermal printers have limited resolution)

## Advanced Usage

### Custom ESC/POS Commands

```typescript
import { ESCPOSGenerator } from 'src/libs/react-pdf-to-escpos';

const generator = new ESCPOSGenerator(48, 'utf-8', true);
generator.initialize();
generator.setBold(true);
generator.setAlign('center');
generator.addText('Custom ESC/POS');
generator.addNewline();
generator.cut();

const buffer = generator.getBuffer();
```

### Manual Tree Traversal

```typescript
import { renderToElementTree, TreeTraverser, ESCPOSGenerator } from 'src/libs/react-pdf-to-escpos';

const tree = renderToElementTree(<YourComponent />);
const generator = new ESCPOSGenerator();
const traverser = new TreeTraverser(generator);

await traverser.traverse(tree);
const buffer = generator.getBuffer();
```

## Performance

- Conversion is fast (~10-50ms for typical receipts)
- No PDF generation overhead
- Direct ESC/POS generation
- Suitable for real-time printing scenarios

## Limitations

1. **Layout Complexity**: Complex flexbox layouts may not translate perfectly
2. **Image Quality**: Thermal printers have limited resolution
3. **Fonts**: Only basic font styling (bold, size, alignment)
4. **Colors**: Not supported (thermal printers are monochrome)
5. **Nested Rows**: Deeply nested row layouts may not render correctly

## Next Steps

1. Test with your actual printer
2. Adjust `paperWidth` for your printer model
3. Fine-tune styles in your React-PDF components
4. Integrate with your printing workflow

For issues or questions, check the implementation in `src/libs/react-pdf-to-escpos/`.
