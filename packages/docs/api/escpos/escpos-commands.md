# ESC/POS Commands Reference

Comprehensive reference for standard ESC/POS thermal printer commands.

## Overview

ESC/POS is an Epson standard for controlling thermal receipt printers. This library implements the most commonly used commands compatible with a wide range of thermal printers.

**Import:**

```typescript
import * as ESCPOS from '@thermal-print/escpos/commands/escpos';
```

---

## Control Characters

Basic control codes used in ESC/POS commands.

| Constant | Hex | Decimal | Description |
|----------|-----|---------|-------------|
| `HT` | `0x09` | 9 | Horizontal Tab |
| `LF` | `0x0A` | 10 | Line Feed |
| `FF` | `0x0C` | 12 | Form Feed |
| `CR` | `0x0D` | 13 | Carriage Return |
| `DLE` | `0x10` | 16 | Data Link Escape |
| `CAN` | `0x18` | 24 | Cancel |
| `ESC` | `0x1B` | 27 | Escape |
| `FS` | `0x1C` | 28 | File Separator |
| `GS` | `0x1D` | 29 | Group Separator |

---

## Initialization

### INIT

**Byte Sequence:** `[ESC, 0x40]` or `ESC @`

**Description:** Resets the printer to its default state. Clears print buffer, resets formatting, and restores default settings.

**Returns:** `number[]` - `[0x1B, 0x40]`

**Example:**

```typescript
import { INIT } from '@thermal-print/escpos/commands/escpos';

// Reset printer to defaults
generator.addRawCommand(Buffer.from(INIT));
```

**Notes:** Always send this command at the beginning of a print job to ensure consistent state.

---

## Text Alignment

### ALIGN_LEFT

**Byte Sequence:** `[ESC, 0x61, 0x00]` or `ESC a 0`

**Description:** Sets text alignment to left justified.

**Example:**

```typescript
import { ALIGN_LEFT } from '@thermal-print/escpos/commands/escpos';

generator.addRawCommand(Buffer.from(ALIGN_LEFT));
generator.addText('Left aligned text');
```

### ALIGN_CENTER

**Byte Sequence:** `[ESC, 0x61, 0x01]` or `ESC a 1`

**Description:** Sets text alignment to center justified.

**Example:**

```typescript
import { ALIGN_CENTER } from '@thermal-print/escpos/commands/escpos';

generator.addRawCommand(Buffer.from(ALIGN_CENTER));
generator.addText('Centered text');
```

### ALIGN_RIGHT

**Byte Sequence:** `[ESC, 0x61, 0x02]` or `ESC a 2`

**Description:** Sets text alignment to right justified.

**Example:**

```typescript
import { ALIGN_RIGHT } from '@thermal-print/escpos/commands/escpos';

generator.addRawCommand(Buffer.from(ALIGN_RIGHT));
generator.addText('Right aligned text');
```

---

## Text Emphasis

### BOLD_ON / BOLD_OFF

**Byte Sequence:** `[ESC, 0x45, n]` or `ESC E n`

**Description:** Turns bold (emphasized) mode on or off.

| Constant | n | Effect |
|----------|---|--------|
| `BOLD_ON` | `0x01` | Enable bold |
| `BOLD_OFF` | `0x00` | Disable bold |

**Example:**

```typescript
import { BOLD_ON, BOLD_OFF } from '@thermal-print/escpos/commands/escpos';

generator.addRawCommand(Buffer.from(BOLD_ON));
generator.addText('Bold text');
generator.addRawCommand(Buffer.from(BOLD_OFF));
generator.addText('Normal text');
```

### UNDERLINE_ON / UNDERLINE_OFF

**Byte Sequence:** `[ESC, 0x2D, n]` or `ESC - n`

**Description:** Turns underline mode on or off.

| Constant | n | Effect |
|----------|---|--------|
| `UNDERLINE_OFF` | `0x00` | Disable underline |
| `UNDERLINE_ON` | `0x01` | 1-dot underline |
| `UNDERLINE_1DOT` | `0x01` | 1-dot underline |
| `UNDERLINE_2DOT` | `0x02` | 2-dot underline |

**Example:**

```typescript
import { UNDERLINE_ON, UNDERLINE_OFF, UNDERLINE_2DOT } from '@thermal-print/escpos/commands/escpos';

generator.addRawCommand(Buffer.from(UNDERLINE_ON));
generator.addText('Underlined text');
generator.addRawCommand(Buffer.from(UNDERLINE_2DOT));
generator.addText('Thick underline');
generator.addRawCommand(Buffer.from(UNDERLINE_OFF));
```

### DOUBLE_STRIKE_ON / DOUBLE_STRIKE_OFF

**Byte Sequence:** `[ESC, 0x47, n]` or `ESC G n`

**Description:** Turns double-strike mode on or off. Double-strike prints each line twice for darker output.

**Example:**

```typescript
import { DOUBLE_STRIKE_ON, DOUBLE_STRIKE_OFF } from '@thermal-print/escpos/commands/escpos';

generator.addRawCommand(Buffer.from(DOUBLE_STRIKE_ON));
generator.addText('Double-strike text');
generator.addRawCommand(Buffer.from(DOUBLE_STRIKE_OFF));
```

---

## Character Sizing & Fonts

### calculateCharacterSize()

**Byte Sequence:** `[ESC, 0x21, n]` or `ESC ! n`

**Description:** Sets character size and style using the ESC ! command. This is the recommended method for character sizing as it has better printer compatibility than GS !.

```typescript
function calculateCharacterSize(
  width: number,
  height: number,
  bold?: boolean
): number[]
```

**Parameters:**

| Parameter | Type | Range | Description |
|-----------|------|-------|-------------|
| `width` | `number` | 1-2 | Width multiplier |
| `height` | `number` | 1-2 | Height multiplier |
| `bold` | `boolean` | - | Enable bold emphasis |

**Returns:** `number[]` - `[ESC, 0x21, n]` where n encodes size and style

**Bit Layout of n:**
- Bit 0: Font selection (0=Font A, 1=Font B)
- Bit 3: Bold/emphasis
- Bit 4: Double-height
- Bit 5: Double-width
- Bit 7: Underline

**Example:**

```typescript
import { calculateCharacterSize } from '@thermal-print/escpos/commands/escpos';

// Normal size
generator.addRawCommand(Buffer.from(calculateCharacterSize(1, 1)));
generator.addText('Normal');

// Double width
generator.addRawCommand(Buffer.from(calculateCharacterSize(2, 1)));
generator.addText('Wide');

// Double height
generator.addRawCommand(Buffer.from(calculateCharacterSize(1, 2)));
generator.addText('Tall');

// Double size + bold
generator.addRawCommand(Buffer.from(calculateCharacterSize(2, 2, true)));
generator.addText('Large Bold');
```

**Notes:**
- Uses Font B (9x17 dots) by default for better character fit on 48-char receipts
- Maximum size is 2x2 with ESC ! command
- For larger sizes (up to 8x8), use `selectCharacterSize()` with GS ! command

### selectCharacterSize()

**Byte Sequence:** `[GS, 0x21, n]` or `GS ! n`

**Description:** Select character size with larger multipliers (1-8x).

```typescript
function selectCharacterSize(
  widthMultiplier: number,
  heightMultiplier: number
): number[]
```

**Parameters:**

| Parameter | Type | Range | Description |
|-----------|------|-------|-------------|
| `widthMultiplier` | `number` | 1-8 | Width multiplier |
| `heightMultiplier` | `number` | 1-8 | Height multiplier |

**Example:**

```typescript
import { selectCharacterSize } from '@thermal-print/escpos/commands/escpos';

// 4x normal size
generator.addRawCommand(Buffer.from(selectCharacterSize(4, 4)));
generator.addText('HUGE');

// Reset to normal
generator.addRawCommand(Buffer.from(selectCharacterSize(1, 1)));
```

**Notes:** Not all printers support GS ! command. Use `calculateCharacterSize()` for better compatibility.

### selectFont()

**Byte Sequence:** `[ESC, 0x4D, n]` or `ESC M n`

**Description:** Select character font.

```typescript
enum CharacterFont {
  FONT_A = 0,  // 12x24 dots (default)
  FONT_B = 1,  // 9x17 dots (narrower)
  FONT_C = 2   // Printer dependent
}

function selectFont(font: CharacterFont): number[]
```

**Example:**

```typescript
import { selectFont, CharacterFont } from '@thermal-print/escpos/commands/escpos';

// Use narrow font for more characters per line
generator.addRawCommand(Buffer.from(selectFont(CharacterFont.FONT_B)));
generator.addText('Narrow font text');
```

### ROTATE_90_ON / ROTATE_90_OFF

**Byte Sequence:** `[ESC, 0x56, n]` or `ESC V n`

**Description:** Enable/disable 90-degree clockwise rotation.

**Example:**

```typescript
import { ROTATE_90_ON, ROTATE_90_OFF } from '@thermal-print/escpos/commands/escpos';

generator.addRawCommand(Buffer.from(ROTATE_90_ON));
generator.addText('Rotated text');
generator.addRawCommand(Buffer.from(ROTATE_90_OFF));
```

### UPSIDE_DOWN_ON / UPSIDE_DOWN_OFF

**Byte Sequence:** `[ESC, 0x7B, n]` or `ESC { n`

**Description:** Enable/disable upside-down printing.

**Example:**

```typescript
import { UPSIDE_DOWN_ON, UPSIDE_DOWN_OFF } from '@thermal-print/escpos/commands/escpos';

generator.addRawCommand(Buffer.from(UPSIDE_DOWN_ON));
generator.addText('Upside down');
generator.addRawCommand(Buffer.from(UPSIDE_DOWN_OFF));
```

### REVERSE_PRINT_ON / REVERSE_PRINT_OFF

**Byte Sequence:** `[GS, 0x42, n]` or `GS B n`

**Description:** Enable/disable white-on-black reverse printing.

**Example:**

```typescript
import { REVERSE_PRINT_ON, REVERSE_PRINT_OFF } from '@thermal-print/escpos/commands/escpos';

generator.addRawCommand(Buffer.from(REVERSE_PRINT_ON));
generator.addText('Inverted colors');
generator.addRawCommand(Buffer.from(REVERSE_PRINT_OFF));
```

---

## Line Spacing & Paper Control

### setLineSpacing()

**Byte Sequence:** `[ESC, 0x33, n]` or `ESC 3 n`

**Description:** Set line spacing in dots.

```typescript
function setLineSpacing(dots: number): number[]
```

**Parameters:**

| Parameter | Type | Range | Description |
|-----------|------|-------|-------------|
| `dots` | `number` | 18-255 | Line spacing in dots |

**Notes:** Minimum enforced is 18 dots for consistency with ESC/Bematech protocol.

**Example:**

```typescript
import { setLineSpacing, LINE_SPACING_DEFAULT } from '@thermal-print/escpos/commands/escpos';

// Compact spacing
generator.addRawCommand(Buffer.from(setLineSpacing(18)));

// Normal spacing (30 dots)
generator.addRawCommand(Buffer.from(LINE_SPACING_DEFAULT));

// Wide spacing
generator.addRawCommand(Buffer.from(setLineSpacing(50)));
```

### LINE_FEED

**Byte Sequence:** `[0x0A]` or `LF`

**Description:** Advances paper by one line.

### feedLines()

**Byte Sequence:** `[ESC, 0x64, n]` or `ESC d n`

**Description:** Print buffer contents and feed paper by n lines.

```typescript
function feedLines(lines: number): number[]
```

**Example:**

```typescript
import { feedLines } from '@thermal-print/escpos/commands/escpos';

generator.addText('Text here');
generator.addRawCommand(Buffer.from(feedLines(3))); // Feed 3 lines
```

### printAndFeed()

**Byte Sequence:** `[ESC, 0x4A, n]` or `ESC J n`

**Description:** Print and feed paper by n dots.

```typescript
function printAndFeed(dots: number): number[]
```

### printAndReverseFeed()

**Byte Sequence:** `[ESC, 0x4B, n]` or `ESC K n`

**Description:** Print and reverse feed paper by n dots.

```typescript
function printAndReverseFeed(dots: number): number[]
```

---

## Paper Cutting

### CUT_FULL / CUT_PARTIAL

**Byte Sequence:** `[GS, 0x56, m]` or `GS V m`

**Description:** Cut paper.

| Constant | m | Effect |
|----------|---|--------|
| `CUT_FULL` | `0x00` | Full cut (complete separation) |
| `CUT_PARTIAL` | `0x01` | Partial cut (leaves connection) |

**Alternative commands:**

| Constant | Sequence | Description |
|----------|----------|-------------|
| `CUT_FULL_ESC` | `[ESC, 0x69]` | Full cut via ESC i |
| `CUT_PARTIAL_ESC` | `[ESC, 0x6D]` | Partial cut via ESC m |

### cutWithFeed()

**Byte Sequence:** `[GS, 0x56, 0x41, n]` or `GS V A n`

**Description:** Feed paper by n lines then perform full cut.

```typescript
function cutWithFeed(lines: number): number[]
```

### cutAndFeedFull() / cutAndFeedPartial()

**Byte Sequence:** `[GS, 0x56, m, n]` or `GS V m n`

**Description:** Feed paper by n dots then cut.

```typescript
function cutAndFeedFull(dots: number): number[]
function cutAndFeedPartial(dots: number): number[]
```

**Example:**

```typescript
import { cutAndFeedFull, cutAndFeedPartial } from '@thermal-print/escpos/commands/escpos';

// Feed 30 dots and full cut
generator.addRawCommand(Buffer.from(cutAndFeedFull(30)));

// Feed 50 dots and partial cut
generator.addRawCommand(Buffer.from(cutAndFeedPartial(50)));
```

---

## Character Encoding & Code Pages

### Code Page Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `CODEPAGE_CP437` | `[ESC, 0x74, 0x00]` | USA |
| `CODEPAGE_CP860` | `[ESC, 0x74, 0x03]` | Portuguese |
| `CODEPAGE_WPC1252` | `[ESC, 0x74, 0x10]` | Windows Latin-1 |

### setCodePage()

**Byte Sequence:** `[ESC, 0x74, n]` or `ESC t n`

**Description:** Select character code table.

```typescript
enum CodePage {
  CP437 = 0,   // USA, Standard Europe
  CP850 = 2,   // Multilingual
  CP860 = 3,   // Portuguese
  CP863 = 4,   // Canadian-French
  CP865 = 5,   // Nordic
  // ... more
}

function setCodePage(page: CodePage): number[]
```

### selectInternationalCharset()

**Byte Sequence:** `[ESC, 0x52, n]` or `ESC R n`

**Description:** Select international character set for special characters.

```typescript
enum InternationalCharset {
  USA = 0,
  FRANCE = 1,
  GERMANY = 2,
  UK = 3,
  DENMARK_I = 4,
  SWEDEN = 5,
  ITALY = 6,
  SPAIN_I = 7,
  JAPAN = 8,
  NORWAY = 9,
  DENMARK_II = 10,
  SPAIN_II = 11,
  LATIN_AMERICA = 12,
  KOREA = 13
}

function selectInternationalCharset(charset: InternationalCharset): number[]
```

### encodeText()

**Description:** Convert text to CP860 byte array for thermal printers.

```typescript
function encodeText(text: string): number[]
```

**Example:**

```typescript
import { encodeText, setCodePage, CodePage } from '@thermal-print/escpos/commands/escpos';

// Set Portuguese code page
generator.addRawCommand(Buffer.from(setCodePage(CodePage.CP860)));

// Encode Portuguese text
const bytes = encodeText('Café, Ação, São Paulo');
generator.addRawCommand(Buffer.from(bytes));
```

---

## Text Position & Layout

### setAbsolutePosition()

**Byte Sequence:** `[ESC, 0x24, nL, nH]` or `ESC $ nL nH`

**Description:** Set absolute horizontal print position.

```typescript
function setAbsolutePosition(position: number): number[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `position` | `number` | Position = (nH × 256 + nL) × motion unit |

### setRelativePosition()

**Byte Sequence:** `[ESC, 0x5C, nL, nH]` or `ESC \ nL nH`

**Description:** Set relative horizontal print position. Supports negative values.

```typescript
function setRelativePosition(position: number): number[]
```

### setCharacterSpacing()

**Byte Sequence:** `[ESC, 0x20, n]` or `ESC SP n`

**Description:** Set right-side character spacing.

```typescript
function setCharacterSpacing(dots: number): number[]
```

**Parameters:**

| Parameter | Type | Range | Description |
|-----------|------|-------|-------------|
| `dots` | `number` | 0-255 | Spacing in dots |

### setTabPositions()

**Byte Sequence:** `[ESC, 0x44, n1, ..., nk, 0x00]` or `ESC D n1...nk NUL`

**Description:** Set horizontal tab positions.

```typescript
function setTabPositions(positions: number[]): number[]
```

**Parameters:**

| Parameter | Type | Range | Description |
|-----------|------|-------|-------------|
| `positions` | `number[]` | 1-255 each, up to 32 | Tab positions in ascending order |

**Example:**

```typescript
import { setTabPositions, CLEAR_TABS, HT } from '@thermal-print/escpos/commands/escpos';

// Set tabs at columns 10, 25, 40
generator.addRawCommand(Buffer.from(setTabPositions([10, 25, 40])));
generator.addText('Col1');
generator.addRawCommand(Buffer.from([HT])); // Tab to position 10
generator.addText('Col2');
generator.addRawCommand(Buffer.from([HT])); // Tab to position 25
generator.addText('Col3');

// Clear all tabs
generator.addRawCommand(Buffer.from(CLEAR_TABS));
```

---

## Graphics - Bit Images

### BitImageMode Enum

```typescript
enum BitImageMode {
  MODE_8_SINGLE = 0,   // 8-dot single-density (67 DPI)
  MODE_8_DOUBLE = 1,   // 8-dot double-density (100 DPI)
  MODE_24_SINGLE = 32, // 24-dot single-density (203 DPI)
  MODE_24_DOUBLE = 33  // 24-dot double-density (203 DPI)
}
```

### printBitImage()

**Byte Sequence:** `[ESC, 0x2A, m, nL, nH, d1...dk]` or `ESC * m nL nH data`

**Description:** Print bit image.

```typescript
function printBitImage(
  mode: BitImageMode,
  width: number,
  data: number[]
): number[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `mode` | `BitImageMode` | Image mode/density |
| `width` | `number` | Number of data columns |
| `data` | `number[]` | Bit image data |

---

## Graphics - Raster Images

### generateRasterImage()

**Byte Sequence:** `[GS, 0x76, 0x30, m, xL, xH, yL, yH, d1...dk]` or `GS v 0`

**Description:** Print raster bitmap image.

```typescript
function generateRasterImage(
  imageData: number[],
  width: number,
  height: number
): number[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `imageData` | `number[]` | Monochrome bitmap (1 bit per pixel, 1=black) |
| `width` | `number` | Image width in pixels |
| `height` | `number` | Image height in pixels |

**Example:**

```typescript
import { generateRasterImage } from '@thermal-print/escpos/commands/escpos';

// Generate image command from bitmap data
const imageBytes = generateRasterImage(bitmapData, 384, 100);
generator.addRawCommand(Buffer.from(imageBytes));
```

---

## Graphics - Downloaded Bit Images

### defineDownloadedBitImage()

**Byte Sequence:** `[GS, 0x2A, x, y, d1...dk]` or `GS * x y data`

**Description:** Define a bit image in volatile memory for later printing.

```typescript
function defineDownloadedBitImage(
  x: number,
  y: number,
  data: number[]
): number[]
```

**Parameters:**

| Parameter | Type | Range | Description |
|-----------|------|-------|-------------|
| `x` | `number` | 1-255 | Horizontal bytes (x × 8 dots) |
| `y` | `number` | 1-48 | Vertical bytes (y × 8 dots) |
| `data` | `number[]` | - | Bit image data |

### printDownloadedBitImage()

**Byte Sequence:** `[GS, 0x2F, m]` or `GS / m`

**Description:** Print the previously defined downloaded bit image.

```typescript
enum DownloadedImageMode {
  NORMAL = 0,        // 100% × 100%
  DOUBLE_WIDTH = 1,  // 200% × 100%
  DOUBLE_HEIGHT = 2, // 100% × 200%
  QUADRUPLE = 3      // 200% × 200%
}

function printDownloadedBitImage(mode: DownloadedImageMode): number[]
```

---

## Graphics - NV (Non-Volatile) Bit Images

### defineNVBitImage()

**Byte Sequence:** `[FS, 0x71, n, ...]` or `FS q n`

**Description:** Define bit images in non-volatile memory.

```typescript
function defineNVBitImage(
  images: Array<{ width: number; height: number; data: number[] }>
): number[]
```

### printNVBitImage()

**Byte Sequence:** `[FS, 0x70, n, m]` or `FS p n m`

**Description:** Print NV bit image.

```typescript
function printNVBitImage(
  imageNumber: number,
  mode: DownloadedImageMode
): number[]
```

---

## QR Codes

### generateQRCode()

**Description:** Generate complete QR code command sequence.

```typescript
function generateQRCode(data: string, size?: number): number[]
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `data` | `string` | - | QR code data (URL or text) |
| `size` | `number` | 6 | Module size (1-16) |

**Returns:** Complete QR code command sequence including:
1. Model selection (Model 2)
2. Size setting
3. Error correction (M = 15%)
4. Data storage
5. Print command

**Example:**

```typescript
import { generateQRCode, ALIGN_CENTER } from '@thermal-print/escpos/commands/escpos';

generator.addRawCommand(Buffer.from(ALIGN_CENTER));
generator.addRawCommand(Buffer.from(generateQRCode('https://example.com', 8)));
```

---

## Barcodes - Configuration

### setBarcodeHRI()

**Byte Sequence:** `[GS, 0x48, n]` or `GS H n`

**Description:** Set HRI (Human Readable Interpretation) position.

```typescript
enum BarcodeHRIPosition {
  NOT_PRINTED = 0,
  ABOVE = 1,
  BELOW = 2,
  BOTH = 3
}

function setBarcodeHRI(position: BarcodeHRIPosition): number[]
```

### setBarcodeFont()

**Byte Sequence:** `[GS, 0x66, n]` or `GS f n`

**Description:** Set font for HRI characters.

```typescript
function setBarcodeFont(fontB: boolean): number[]
```

### setBarcodeHeight()

**Byte Sequence:** `[GS, 0x68, n]` or `GS h n`

**Description:** Set barcode height in dots.

```typescript
function setBarcodeHeight(height: number): number[]
```

**Parameters:**

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `height` | `number` | 1-255 | 162 | Height in dots |

### setBarcodeWidth()

**Byte Sequence:** `[GS, 0x77, n]` or `GS w n`

**Description:** Set barcode module width.

```typescript
function setBarcodeWidth(width: number): number[]
```

**Parameters:**

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `width` | `number` | 2-6 | 3 | Module width in dots |

---

## Barcodes - Printing

### BarcodeType Enum

```typescript
enum BarcodeType {
  UPC_A = 0,    // UPC-A (11-12 digits)
  UPC_E = 1,    // UPC-E (6-8 digits)
  EAN13 = 2,    // EAN-13 (12-13 digits)
  EAN8 = 3,     // EAN-8 (7-8 digits)
  CODE39 = 4,   // CODE39 (variable length)
  ITF = 5,      // ITF (even digit count)
  CODABAR = 6,  // CODABAR (variable)
  CODE93 = 72,  // CODE93 (all ASCII)
  CODE128 = 73  // CODE128 (all ASCII)
}
```

### printBarcodeUPCA()

**Description:** Print UPC-A barcode.

```typescript
function printBarcodeUPCA(data: string): number[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `string` | 11-12 digits |

**Example:**

```typescript
import {
  setBarcodeHRI,
  setBarcodeHeight,
  printBarcodeUPCA,
  BarcodeHRIPosition
} from '@thermal-print/escpos/commands/escpos';

generator.addRawCommand(Buffer.from(setBarcodeHRI(BarcodeHRIPosition.BELOW)));
generator.addRawCommand(Buffer.from(setBarcodeHeight(100)));
generator.addRawCommand(Buffer.from(printBarcodeUPCA('01234567890')));
```

### printBarcodeEAN13()

**Description:** Print EAN-13 barcode.

```typescript
function printBarcodeEAN13(data: string): number[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `string` | 12-13 digits |

### printBarcodeEAN8()

**Description:** Print EAN-8 barcode.

```typescript
function printBarcodeEAN8(data: string): number[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `string` | 7-8 digits |

### printBarcodeCODE39()

**Description:** Print CODE39 barcode.

```typescript
function printBarcodeCODE39(data: string): number[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `string` | 0-9, A-Z, space, $%+-./ |

### printBarcodeCODE128()

**Description:** Print CODE128 barcode.

```typescript
function printBarcodeCODE128(data: string): number[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `string` | All ASCII (0-127) |

**Example:**

```typescript
import {
  setBarcodeHRI,
  setBarcodeHeight,
  setBarcodeWidth,
  printBarcodeCODE128,
  BarcodeHRIPosition
} from '@thermal-print/escpos/commands/escpos';

generator.addRawCommand(Buffer.from(setBarcodeHRI(BarcodeHRIPosition.BELOW)));
generator.addRawCommand(Buffer.from(setBarcodeHeight(80)));
generator.addRawCommand(Buffer.from(setBarcodeWidth(3)));
generator.addRawCommand(Buffer.from(printBarcodeCODE128('ABC-12345')));
```

---

## PDF417 (2D Barcode)

### generatePDF417()

**Description:** Generate complete PDF417 barcode command sequence.

```typescript
function generatePDF417(
  data: string,
  options?: {
    columns?: number;
    rows?: number;
    width?: number;
    rowHeight?: number;
    errorCorrection?: number;
  }
): number[]
```

**Parameters:**

| Parameter | Type | Range | Description |
|-----------|------|-------|-------------|
| `columns` | `number` | 0, 1-30 | Number of columns (0=auto) |
| `rows` | `number` | 0, 3-90 | Number of rows (0=auto) |
| `width` | `number` | 2-8 | Module width in dots |
| `rowHeight` | `number` | 2-8 | Row height in dots |
| `errorCorrection` | `number` | 0-8 | Error correction level |

**Example:**

```typescript
import { generatePDF417 } from '@thermal-print/escpos/commands/escpos';

const pdf417 = generatePDF417('Hello World', {
  columns: 3,
  width: 3,
  rowHeight: 3,
  errorCorrection: 2
});
generator.addRawCommand(Buffer.from(pdf417));
```

### Individual PDF417 Commands

| Function | Description |
|----------|-------------|
| `setPDF417Columns(columns)` | Set number of columns |
| `setPDF417Rows(rows)` | Set number of rows |
| `setPDF417Width(width)` | Set module width |
| `setPDF417RowHeight(height)` | Set row height |
| `setPDF417ErrorCorrection(level)` | Set error correction level |
| `storePDF417Data(data)` | Store PDF417 data |
| `printPDF417()` | Print the stored PDF417 |

---

## Peripheral Control

### generatePulse()

**Byte Sequence:** `[ESC, 0x70, m, t1, t2]` or `ESC p m t1 t2`

**Description:** Generate pulse to open cash drawer.

```typescript
function generatePulse(
  connector: 0 | 1,
  onTime: number,
  offTime: number
): number[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `connector` | `0 \| 1` | 0=pin 2, 1=pin 5 |
| `onTime` | `number` | ON time (units of 100ms) |
| `offTime` | `number` | OFF time (units of 100ms) |

**Example:**

```typescript
import { generatePulse } from '@thermal-print/escpos/commands/escpos';

// Open cash drawer: 200ms pulse on pin 2
generator.addRawCommand(Buffer.from(generatePulse(0, 2, 2)));
```

### selectPeripheral()

**Byte Sequence:** `[ESC, 0x3D, n]` or `ESC = n`

**Description:** Enable/disable peripheral device communication.

```typescript
function selectPeripheral(enabled: boolean): number[]
```

### Panel Button Control

| Function | Description |
|----------|-------------|
| `enablePanelButtons()` | Enable front panel buttons |
| `disablePanelButtons()` | Disable front panel buttons |

### Paper Sensor Control

| Function | Description |
|----------|-------------|
| `selectPaperSensorOutput(mask)` | Select paper sensors for paper-end signals |
| `selectPaperSensorStop(mask)` | Select paper sensors to stop printing |

---

## Status & Information

### Real-Time Status

```typescript
function transmitRealtimeStatus(n: 1 | 2 | 3 | 4): number[]
```

| n | Status Type |
|---|-------------|
| 1 | Printer status |
| 2 | Offline status |
| 3 | Error status |
| 4 | Paper roll sensor status |

### realtimeRequest()

```typescript
function realtimeRequest(n: 1 | 2): number[]
```

| n | Action |
|---|--------|
| 1 | Recover from error |
| 2 | Clear buffer |

### Automatic Status Back (ASB)

```typescript
function enableASB(statusBits: number): number[]
function disableASB(): number[]
```

### Printer ID

```typescript
enum PrinterIDType {
  PRINTER_MODEL = 1,
  TYPE_ID = 2,
  ROM_VERSION = 65,
  FONT_TYPE = 66,
  MANUFACTURER = 67
}

function requestPrinterID(type: PrinterIDType): number[]
```

### Status Types

```typescript
enum StatusType {
  PAPER_SENSOR = 1,
  DRAWER_SENSOR = 2,
  INK_SENSOR = 4,
  PAPER_ROLL_SENSOR = 18
}

function requestStatus(type: StatusType): number[]
```

---

## Margins & Print Area

### setLeftMargin()

**Byte Sequence:** `[GS, 0x4C, nL, nH]` or `GS L nL nH`

**Description:** Set left margin.

```typescript
function setLeftMargin(dots: number): number[]
```

### setPrintingAreaWidth()

**Byte Sequence:** `[GS, 0x57, nL, nH]` or `GS W nL nH`

**Description:** Set printing area width.

```typescript
function setPrintingAreaWidth(dots: number): number[]
```

---

## Macros

### START_MACRO / END_MACRO

**Byte Sequence:** `[GS, 0x3A]` or `GS :`

**Description:** Start/end macro definition.

### executeMacro()

**Byte Sequence:** `[GS, 0x5E, r, t, m]` or `GS ^ r t m`

**Description:** Execute a defined macro.

```typescript
function executeMacro(
  repeatCount: number,
  waitTime: number,
  mode: 0 | 1
): number[]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `repeatCount` | `number` | Number of times to execute (0-255) |
| `waitTime` | `number` | Wait between executions (units of 100ms) |
| `mode` | `0 \| 1` | Execution mode |

**Example:**

```typescript
import { START_MACRO, END_MACRO, executeMacro } from '@thermal-print/escpos/commands/escpos';

// Define macro
generator.addRawCommand(Buffer.from(START_MACRO));
generator.addText('Repeated text');
generator.addNewline();
generator.addRawCommand(Buffer.from(END_MACRO));

// Execute macro 5 times with 500ms delay
generator.addRawCommand(Buffer.from(executeMacro(5, 5, 0)));
```

---

## Miscellaneous

### UNIDIRECTIONAL_ON / UNIDIRECTIONAL_OFF

**Byte Sequence:** `[ESC, 0x55, n]` or `ESC U n`

**Description:** Enable/disable unidirectional printing for higher quality.

### CANCEL

**Byte Sequence:** `[0x18]` or `CAN`

**Description:** Cancel print data in page mode.

### executeTestPrint()

**Byte Sequence:** `[ESC, 0x28, 0x41, ...]` or `ESC ( A`

**Description:** Execute test print pattern.

```typescript
function executeTestPrint(
  pattern: number,
  mode: number,
  repeat: number
): number[]
```

---

## Character Effects (Advanced)

### setCharacterColor()

**Byte Sequence:** `[GS, 0x28, 0x4E, ...]`

**Description:** Set character color (for color-capable printers).

```typescript
function setCharacterColor(color: 1 | 2): number[]
```

### setCharacterSmoothing()

**Byte Sequence:** `[GS, 0x28, 0x4E, ...]`

**Description:** Enable/disable character smoothing.

```typescript
function setCharacterSmoothing(enabled: boolean): number[]
```
