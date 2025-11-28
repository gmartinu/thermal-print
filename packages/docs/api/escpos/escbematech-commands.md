# ESC/Bematech Commands Reference

Comprehensive reference for ESC/Bematech (ESC/Bema) thermal printer commands.

## Overview

ESC/Bematech is a Bematech-specific command set used by Bematech thermal printers (e.g., MP-4200 TH). While similar to ESC/POS, it includes Bematech-specific features and some command differences.

**Import:**

```typescript
import * as ESCBEMA from '@thermal-print/escpos/commands/escbematech';
```

**Key Differences from ESC/POS:**
- Additional mode selection commands
- Extended code page support
- Dual drawer control
- Buzzer control
- Network configuration commands
- Additional barcode types (ISBN, MSI, PLESSEY)
- Italic text support

---

## Control Characters

| Constant | Hex | Decimal | Description |
|----------|-----|---------|-------------|
| `NUL` | `0x00` | 0 | Null |
| `SOH` | `0x01` | 1 | Start of Heading |
| `STX` | `0x02` | 2 | Start of Text / Clear buffer |
| `ETX` | `0x03` | 3 | End of Text / End buffer |
| `EOT` | `0x04` | 4 | End of Transmission |
| `ENQ` | `0x05` | 5 | Enquiry / Printer status |
| `ACK` | `0x06` | 6 | Acknowledge |
| `BEL` | `0x07` | 7 | Bell |
| `BS` | `0x08` | 8 | Backspace |
| `HT` | `0x09` | 9 | Horizontal Tab |
| `LF` | `0x0A` | 10 | Line Feed |
| `FF` | `0x0C` | 12 | Form Feed |
| `CR` | `0x0D` | 13 | Carriage Return |
| `SO` | `0x0E` | 14 | Shift Out / Enable expanded |
| `SI` | `0x0F` | 15 | Shift In / Enable condensed |
| `DC2` | `0x12` | 18 | Disable condensed mode |
| `DC4` | `0x14` | 20 | Disable expanded print |
| `NAK` | `0x15` | 21 | Negative Acknowledge |
| `SYN` | `0x16` | 22 | Synchronous Idle |
| `ETB` | `0x17` | 23 | End of Transmission Block |
| `CAN` | `0x18` | 24 | Cancel / Cancel last line |
| `ESC` | `0x1B` | 27 | Escape |
| `FS` | `0x1C` | 28 | File Separator |
| `GS` | `0x1D` | 29 | Group Separator |
| `DEL` | `0x7F` | 127 | Delete / Cancel last character |

---

## Mode Selection

ESC/Bematech printers can operate in two modes: ESC/Bema and ESC/POS.

### selectESCBemaMode() / selectESCPOSMode()

**Byte Sequence:** `[GS, 0xF9, 0x35, n]`

**Description:** Select printer operating mode (permanent, saved to memory).

```typescript
function selectESCBemaMode(): number[]  // n = 0x00
function selectESCPOSMode(): number[]   // n = 0x01
```

**Example:**

```typescript
import { selectESCBemaMode, selectESCPOSMode } from '@thermal-print/escpos/commands/escbematech';

// Switch to ESC/Bema mode (permanent)
generator.addRawCommand(Buffer.from(selectESCBemaMode()));

// Switch to ESC/POS mode (permanent)
generator.addRawCommand(Buffer.from(selectESCPOSMode()));
```

### selectESCBemaModeTemp() / selectESCPOSModeTemp()

**Byte Sequence:** `[GS, 0xF9, 0x20, n]`

**Description:** Select printer operating mode temporarily (not saved to memory).

```typescript
function selectESCBemaModeTemp(): number[]  // n = 0x00
function selectESCPOSModeTemp(): number[]   // n = 0x01
```

### returnToPreviousMode()

**Byte Sequence:** `[GS, 0xF9, 0x1F, 0x31]`

**Description:** Return to previously set mode.

### GET_CURRENT_MODE

**Byte Sequence:** `[GS, 0xF9, 0x43, 0x00]`

**Description:** Query current command set mode. Returns 0 = ESC/Bema, 1 = ESC/POS.

---

## Initialization

### INIT

**Byte Sequence:** `[ESC, 0x40]` or `ESC @`

**Description:** Initialize printer to default settings. Cancels all printer settings including character font, line spacing, and margins.

```typescript
import { INIT } from '@thermal-print/escpos/commands/escbematech';

generator.addRawCommand(Buffer.from(INIT));
```

---

## Code Pages & Encoding

### CodePage Enum

```typescript
enum CodePage {
  CP850 = 2,      // CODEPAGE 850 (default)
  CP437 = 3,      // CODEPAGE 437
  CP860 = 4,      // CODEPAGE 860 (Portuguese)
  CP858 = 5,      // CODEPAGE 858
  CP866 = 6,      // CODEPAGE 866
  CP864 = 7,      // CODEPAGE 864
  UTF8 = 8,       // UTF8 (Unicode)
  BIG5E = 9,      // Big-5E
  JIS = 10,       // JIS
  SHIFT_JIS = 11, // SHIFT JIS
  GB2312 = 12,    // GB2312
  EUC_CN = 14,    // EUC-CN
  CP862 = 21      // CODEPAGE 862
}
```

### setCodePage()

**Byte Sequence:** `[ESC, 0x74, n]` or `ESC t n`

**Description:** Select code page.

```typescript
function setCodePage(codePage: CodePage): number[]
```

**Example:**

```typescript
import { setCodePage, CodePage } from '@thermal-print/escpos/commands/escbematech';

// Set Portuguese code page
generator.addRawCommand(Buffer.from(setCodePage(CodePage.CP860)));
```

### setDefaultCodePage()

**Byte Sequence:** `[GS, 0xF9, 0x37, n]`

**Description:** Set and save default code page to non-volatile memory.

```typescript
function setDefaultCodePage(codePage: CodePage): number[]
```

### setIdeogramMode()

**Byte Sequence:** `[GS, 0xF9, 0x38, n]`

**Description:** Set ideogram mode for Asian languages.

```typescript
function setIdeogramMode(mode: 0 | 1 | 2 | 3): number[]
```

| Mode | Description |
|------|-------------|
| 0 | UTF8 (Unicode) |
| 1 | ESC/POS Japanese |
| 2 | ESC/POS Simplified Chinese |
| 3 | ESC/POS Traditional Chinese |

### setInternationalCharset()

**Byte Sequence:** `[ESC, 0x52, n]` or `ESC R n`

**Description:** Select international character set.

```typescript
function setInternationalCharset(n: number): number[]
```

| n | Character Set |
|---|---------------|
| 0 | CODEPAGE 437 |
| 1-11 | CODEPAGE 858 |
| 12 | CODEPAGE 850 (default) |

### PRINT_UNICODE_SETS

**Byte Sequence:** `[ESC, 0x5A]` or `ESC Z`

**Description:** Print supported Unicode character sets chart.

### printUnicodeSet()

**Byte Sequence:** `[ESC, 0x5B, n]` or `ESC [ n`

**Description:** Print specific Unicode set.

```typescript
function printUnicodeSet(n: number): number[]
```

---

## Paper Configuration

### PaperWidth Enum

```typescript
enum PaperWidth {
  WIDTH_58_48 = 0x00,   // 58mm paper, 48mm print width
  WIDTH_76_72 = 0x01,   // 76mm paper, 72mm print width
  WIDTH_80_72 = 0x02,   // 80mm paper, 72mm print width
  WIDTH_80_76 = 0x03,   // 80mm paper, 76mm print width (default)
  WIDTH_82_72 = 0x04,   // 82.5mm paper, 72mm print width
  WIDTH_82_76 = 0x05,   // 82.5mm paper, 76mm print width
  WIDTH_82_80 = 0x06    // 82.5mm paper, 80mm print width
}
```

### setPaperWidth()

**Byte Sequence:** `[GS, 0xF9, 0x21, n]`

**Description:** Set and save paper width. Only effective in ESC/Bema mode.

```typescript
function setPaperWidth(width: PaperWidth): number[]
```

**Example:**

```typescript
import { setPaperWidth, PaperWidth } from '@thermal-print/escpos/commands/escbematech';

// Set 80mm paper with 76mm print width
generator.addRawCommand(Buffer.from(setPaperWidth(PaperWidth.WIDTH_80_76)));
```

### Paper Near-End Sensor

```typescript
function enablePaperNearEndSensor(): number[]   // [GS, 0xF9, 0x2C, 0x01]
function disablePaperNearEndSensor(): number[]  // [GS, 0xF9, 0x2C, 0x00]
```

### Paper/Drawer Sensor Selection

```typescript
function selectPaperSensor(): number[]  // [ESC, 0x62, 0x00] - PE reflects paper sensor
function selectDrawerSensor(): number[] // [ESC, 0x62, 0x01] - PE reflects drawer sensor
```

---

## Printer Settings

### PrinterMode Enum

```typescript
enum PrinterMode {
  NORMAL = 0x00,       // Normal mode (default)
  HIGH_QUALITY = 0x01, // High quality mode
  HIGH_SPEED = 0x02    // High speed mode
}
```

### setPrinterMode()

**Byte Sequence:** `[GS, 0xF9, 0x2D, n]`

**Description:** Set and save printer mode (quality vs speed).

```typescript
function setPrinterMode(mode: PrinterMode): number[]
```

### PrinterLanguage Enum

```typescript
enum PrinterLanguage {
  ENGLISH = 0,
  PORTUGUESE = 1,
  SPANISH = 2,
  GERMAN = 3
}
```

### setPrinterLanguage()

**Byte Sequence:** `[GS, 0xFA, n]`

**Description:** Set and save printer language.

```typescript
function setPrinterLanguage(lang: PrinterLanguage): number[]
```

---

## Printer Information

### getPrinterInfo()

**Byte Sequence:** `[GS, 0xF9, 0x27, n]`

**Description:** Get printer information.

```typescript
function getPrinterInfo(infoType: 0 | 1 | 2 | 3 | 5 | 8): number[]
```

| n | Information | Response Length |
|---|-------------|-----------------|
| 0 | Product code | 10 bytes |
| 1 | Serial number | 20 bytes |
| 2 | Manufacturing date | 4 bytes |
| 3 | Firmware version | 3 bytes |
| 5 | Manufacturing timestamp | 17 bytes |
| 8 | Interface type | 1 byte |

### Configuration Commands

| Constant/Function | Description |
|-------------------|-------------|
| `LOAD_DEFAULT_CONFIG` | Load default user configuration |
| `PRINT_CONFIG` | Print current user configuration |
| `RESET_PRINTER` | Hardware reset |

---

## Panel Control

### enablePanelKeys() / disablePanelKeys()

**Byte Sequence:** `[ESC, 0x79, n]` or `ESC y n`

**Description:** Enable/disable front panel keys.

```typescript
function enablePanelKeys(): number[]   // n = 0x01
function disablePanelKeys(): number[]  // n = 0x00
```

### ENABLE_DUMP_MODE

**Byte Sequence:** `[ESC, 0x78]` or `ESC x`

**Description:** Enable dump mode (hexadecimal debug output).

::: warning
The only way to exit dump mode is to power off the printer.
:::

---

## Drawer Control

ESC/Bematech supports two cash drawers.

### activateDrawer1()

**Byte Sequence:** `[ESC, 0x76, n]` or `ESC v n`

**Description:** Activate drawer #1 for n milliseconds.

```typescript
function activateDrawer1(milliseconds: number): number[]
```

**Parameters:**

| Parameter | Type | Range | Description |
|-----------|------|-------|-------------|
| `milliseconds` | `number` | 50-250 | Pulse duration (actual: 50-200ms) |

### activateDrawer2()

**Byte Sequence:** `[ESC, 0x80, n]`

**Description:** Activate drawer #2 for n milliseconds.

```typescript
function activateDrawer2(milliseconds: number): number[]
```

**Example:**

```typescript
import { activateDrawer1, activateDrawer2 } from '@thermal-print/escpos/commands/escbematech';

// Open drawer 1 for 100ms
generator.addRawCommand(Buffer.from(activateDrawer1(100)));

// Open drawer 2 for 150ms
generator.addRawCommand(Buffer.from(activateDrawer2(150)));
```

---

## Paper Cutting

### CUT_FULL / CUT_FULL_ALT

**Byte Sequence:** `[ESC, 0x69]` or `[ESC, 0x77]`

**Description:** Perform full paper cut.

```typescript
import { CUT_FULL, CUT_FULL_ALT } from '@thermal-print/escpos/commands/escbematech';

generator.addRawCommand(Buffer.from(CUT_FULL));
```

### Buzzer on Cut

```typescript
function setBuzzerOnCut(buzzer: 0 | 1 | 2, time: number): number[]
function disableBuzzerOnCut(): number[]
```

**Parameters:**

| Parameter | Value | Description |
|-----------|-------|-------------|
| `buzzer` | 0 | No buzzer |
| | 1 | Internal buzzer |
| | 2 | External buzzer |
| `time` | 0-255 | Duration (n × 100ms) |

**Example:**

```typescript
import { setBuzzerOnCut, CUT_FULL } from '@thermal-print/escpos/commands/escbematech';

// Enable internal buzzer for 500ms on cut
generator.addRawCommand(Buffer.from(setBuzzerOnCut(1, 5)));
generator.addRawCommand(Buffer.from(CUT_FULL));
```

---

## Buzzer Control

### activateBuzzer()

**Byte Sequence:** `[ESC, 0x28, 0x41, 0x04, 0x00, 0x01, n1, n2, 0x00]`

**Description:** Activate buzzer for specified duration.

```typescript
function activateBuzzer(milliseconds: number): number[]
```

**Example:**

```typescript
import { activateBuzzer } from '@thermal-print/escpos/commands/escbematech';

// Buzz for 1000ms
generator.addRawCommand(Buffer.from(activateBuzzer(1000)));
```

---

## Paper Feeding

### Basic Feeding

| Constant | Description |
|----------|-------------|
| `FEED_LINE` | Feed one line (`[LF]`) |
| `FEED_PAGE` | Feed one page (`[FF]`) |

### fineFeed()

**Byte Sequence:** `[ESC, 0x4A, n]` or `ESC J n`

**Description:** Fine line feed.

```typescript
function fineFeed(n: number): number[]
```

**Parameters:**

| Parameter | Type | Range | Description |
|-----------|------|-------|-------------|
| `n` | `number` | 48-255 | Feed = (n - 48) × 0.125mm |

### feedPaper()

**Byte Sequence:** `[ESC, 0x41, n]` or `ESC A n`

**Description:** Feed paper by n × 0.375mm.

```typescript
function feedPaper(n: number): number[]
```

### setLineSpacing()

**Byte Sequence:** `[ESC, 0x33, n]` or `ESC 3 n`

**Description:** Set line spacing.

```typescript
function setLineSpacing(n: number): number[]
```

**Parameters:**

| Parameter | Type | Range | Description |
|-----------|------|-------|-------------|
| `n` | `number` | 18-255 | Spacing = n/144 inches |

### SET_LINE_HEIGHT_DEFAULT

**Byte Sequence:** `[ESC, 0x32]` or `ESC 2`

**Description:** Set line height to default (1/6 inch).

### verticalSkip() / horizontalSkip()

```typescript
function verticalSkip(n: number): number[]    // [ESC, 0x66, 0x31, n]
function horizontalSkip(n: number): number[]  // [ESC, 0x66, 0x30, n]
```

---

## Page Configuration

### setPageSizeLines()

**Byte Sequence:** `[ESC, 0x43, n]` or `ESC C n`

**Description:** Set page size in lines.

```typescript
function setPageSizeLines(lines: number): number[]
```

**Parameters:**

| Parameter | Type | Range | Default |
|-----------|------|-------|---------|
| `lines` | `number` | 1-255 | 12 |

### setPageSizeMM()

**Byte Sequence:** `[ESC, 0x63, n1, n2]` or `ESC c n1 n2`

**Description:** Set page size in millimeters.

```typescript
function setPageSizeMM(n1: number, n2: number): number[]
```

**Formula:** Page size = 0.125mm × (n1 + 256 × n2)

### Automatic Line Feed

```typescript
function enableAutoLineFeed(): number[]   // [ESC, 0x7A, 0x01]
function disableAutoLineFeed(): number[]  // [ESC, 0x7A, 0x00]
```

When enabled, printer performs LF after receiving CR.

---

## Margins & Tabs

### setRightMargin()

**Byte Sequence:** `[ESC, 0x51, n]` or `ESC Q n`

**Description:** Set right margin in characters.

```typescript
function setRightMargin(chars: number): number[]
```

### setLeftMargin()

**Byte Sequence:** `[ESC, 0x6C, n]` or `ESC l n`

**Description:** Set left margin in characters.

```typescript
function setLeftMargin(chars: number): number[]
```

### setTabPositions()

**Byte Sequence:** `[ESC, 0x44, n1, ..., nk, NUL]` or `ESC D n1...nk NUL`

**Description:** Set horizontal tab positions.

```typescript
function setTabPositions(positions: number[]): number[]
```

**Parameters:**

| Parameter | Type | Range | Description |
|-----------|------|-------|-------------|
| `positions` | `number[]` | 1-255 each, up to 32 | Positions in ascending order |

### TAB / CLEAR_TABS

```typescript
const TAB = [HT];          // Move to next tab position
const CLEAR_TABS = [ESC, 0x44, NUL];  // Clear all tab positions
```

---

## Text Alignment

### ALIGN_LEFT / ALIGN_CENTER / ALIGN_RIGHT

**Byte Sequence:** `[ESC, 0x61, n]` or `ESC a n`

| Constant | n | Alignment |
|----------|---|-----------|
| `ALIGN_LEFT` | `0x00` | Left justified |
| `ALIGN_CENTER` | `0x01` | Center justified |
| `ALIGN_RIGHT` | `0x02` | Right justified |

---

## Text Formatting

### Bold (Emphasized)

```typescript
const BOLD_ON = [ESC, 0x45];   // ESC E - Enable bold
const BOLD_OFF = [ESC, 0x46];  // ESC F - Disable bold
```

**Note:** ESC/Bematech uses different commands than ESC/POS for bold.

### Underline

```typescript
const UNDERLINE_ON = [ESC, 0x2D, 0x01];   // ESC - 1
const UNDERLINE_OFF = [ESC, 0x2D, 0x00];  // ESC - 0
```

### Italic

**Byte Sequence:** `[ESC, 0x34]` / `[ESC, 0x35]`

**Description:** ESC/Bematech supports italic mode (not available in standard ESC/POS).

```typescript
const ITALIC_ON = [ESC, 0x34];   // ESC 4 - Enable italic
const ITALIC_OFF = [ESC, 0x35];  // ESC 5 - Disable italic
```

**Example:**

```typescript
import { ITALIC_ON, ITALIC_OFF } from '@thermal-print/escpos/commands/escbematech';

generator.addRawCommand(Buffer.from(ITALIC_ON));
generator.addText('Italic text');
generator.addRawCommand(Buffer.from(ITALIC_OFF));
```

### Upside Down

```typescript
const UPSIDE_DOWN_ON = [ESC, 0x7D, 0x01];   // ESC } 1
const UPSIDE_DOWN_OFF = [ESC, 0x7D, 0x00];  // ESC } 0
```

### Superscript / Subscript

```typescript
const SUPERSCRIPT_ON = [ESC, 0x53, 0x00];  // ESC S 0 - Upper side
const SUBSCRIPT_ON = [ESC, 0x53, 0x01];    // ESC S 1 - Bottom side
const SCRIPT_OFF = [ESC, 0x54];            // ESC T - Disable both
```

### calculatePrintMode()

**Byte Sequence:** `[ESC, 0x21, n]` or `ESC ! n`

**Description:** Combined text formatting control.

```typescript
function calculatePrintMode(options: {
  emphasized?: boolean;
  doubleHeight?: boolean;
  doubleWidth?: boolean;
  underline?: boolean;
}): number[]
```

**Bit Layout:**
- Bit 0: Font B (set by default)
- Bit 3: Emphasized (bold)
- Bit 4: Double height
- Bit 5: Double width
- Bit 7: Underline

**Example:**

```typescript
import { calculatePrintMode } from '@thermal-print/escpos/commands/escbematech';

// Bold + double size
generator.addRawCommand(Buffer.from(calculatePrintMode({
  emphasized: true,
  doubleWidth: true,
  doubleHeight: true
})));
```

---

## Character Sizing

### Double Height

```typescript
const DOUBLE_HEIGHT_ON = [ESC, 0x64, 0x01];   // ESC d 1
const DOUBLE_HEIGHT_OFF = [ESC, 0x64, 0x00];  // ESC d 0
const DOUBLE_HEIGHT_ONLINE = [ESC, 0x56];     // ESC V - Online mode
```

::: warning
ESC/Bematech uses `ESC d` for double height, unlike ESC/POS where `ESC d` is used for line feed.
:::

### Double Width (Expanded)

```typescript
const DOUBLE_WIDTH_ON = [ESC, 0x57, 0x01];    // ESC W 1
const DOUBLE_WIDTH_OFF = [ESC, 0x57, 0x00];   // ESC W 0
const EXPANDED_ONLINE = [ESC, SO];            // ESC SO - Online expanded
const EXPANDED_ONLINE_ALT = [SO];             // SO alone
const EXPANDED_OFF = [DC4];                   // DC4 - Disable expanded
```

### Condensed Mode

```typescript
const CONDENSED_ON = [ESC, SI];        // ESC SI - Enable
const CONDENSED_ON_ALT = [SI];         // SI alone
const CONDENSED_OFF = [ESC, 0x48];     // ESC H
const CONDENSED_OFF_ALT = [ESC, 0x50]; // ESC P
const CONDENSED_OFF_DC2 = [DC2];       // DC2 alone
```

---

## Graphics

### Bit Images

#### fillBlankColumns()

**Byte Sequence:** `[ESC, 0x24, n1, n2]` or `ESC $ n1 n2`

**Description:** Fill blank bit columns.

```typescript
function fillBlankColumns(columns: number): number[]
```

#### print24BitGraphics()

**Byte Sequence:** `[ESC, 0x2A, 0x21, n1, n2, d1...dn]` or `ESC * ! n1 n2 data`

**Description:** Print 24-bit graphics. Each column = 3 bytes (24 bits height).

```typescript
function print24BitGraphics(columns: number, data: number[]): number[]
```

#### print8BitGraphics()

**Byte Sequence:** `[ESC, 0x4B, n1, n2, d1...dn]` or `ESC K n1 n2 data`

**Description:** Print 8-bit graphics (dot-matrix compatible).

```typescript
function print8BitGraphics(columns: number, data: number[]): number[]
```

### Raster Bitmap

#### RasterMode Enum

```typescript
enum RasterMode {
  NORMAL = 0,          // 203 × 203 dpi
  DOUBLE_WIDTH = 1,    // 203 × 101 dpi
  DOUBLE_HEIGHT = 2,   // 101 × 203 dpi
  QUADRUPLE = 3        // 101 × 101 dpi
}
```

#### printRasterBitmap()

**Byte Sequence:** `[GS, 0x76, 0x30, m, xL, xH, yL, yH, d1...dk]`

**Description:** Print raster bitmap.

```typescript
function printRasterBitmap(
  mode: RasterMode,
  width: number,
  height: number,
  data: number[]
): number[]
```

### Downloaded Bit Image

```typescript
function defineDownloadedBitImage(x: number, y: number, data: number[]): number[]
function printDownloadedBitImage(mode: RasterMode): number[]
```

**Parameters for define:**

| Parameter | Type | Range | Description |
|-----------|------|-------|-------------|
| `x` | `number` | 1-255 | Horizontal bytes (x × 8 dots) |
| `y` | `number` | 1-64 | Vertical bytes (y × 8 dots) |

### NV Bit Image

```typescript
function defineNVBitImage(images: Array<{
  width: number;
  height: number;
  data: number[]
}>): number[]

function printNVBitImage(imageNumber: number, mode: RasterMode): number[]
```

---

## Barcodes

### Configuration

#### setBarcodeHeight()

**Byte Sequence:** `[GS, 0x68, n]` or `GS h n`

**Description:** Set barcode height.

```typescript
function setBarcodeHeight(n: number): number[]
```

**Parameters:**

| Parameter | Type | Range | Default | Description |
|-----------|------|-------|---------|-------------|
| `n` | `number` | 1-255 | 162 | Height = n × 0.125mm |

#### setBarcodeWidth()

**Byte Sequence:** `[GS, 0x77, n]` or `GS w n`

**Description:** Set barcode width.

```typescript
function setBarcodeWidth(width: 2 | 3 | 4): number[]
```

| Width | Description |
|-------|-------------|
| 2 | Normal width |
| 3 | Double width (default) |
| 4 | Quadruple width |

#### setBarcodeHRI()

**Byte Sequence:** `[GS, 0x48, n]` or `GS H n`

**Description:** Set HRI position.

```typescript
enum BarcodeHRIPosition {
  NONE = 0,
  TOP = 1,      // Default
  BOTTOM = 2,
  BOTH = 3
}

function setBarcodeHRI(position: BarcodeHRIPosition): number[]
```

#### setBarcodeHRIFont()

**Byte Sequence:** `[GS, 0x66, n]` or `GS f n`

**Description:** Set HRI font.

```typescript
function setBarcodeHRIFont(condensed: boolean): number[]
```

#### setBarcodeLeftMargin()

**Byte Sequence:** `[GS, 0x6B, 0x84, n1, n2]`

**Description:** Set barcode left margin.

```typescript
function setBarcodeLeftMargin(position: number): number[]
```

### Standard Barcodes

Each function returns the complete barcode command sequence.

#### UPC-A

```typescript
function printBarcodeUPCA(data: string): number[]
function printBarcodeUPCAAlt(data: string): number[]
```

**Requirements:** Exactly 11 digits (checksum auto-generated)

#### UPC-E

```typescript
function printBarcodeUPCE(data: string): number[]
function printBarcodeUPCEAlt(data: string): number[]
```

**Requirements:** Exactly 6 digits

#### EAN-13

```typescript
function printBarcodeEAN13(data: string): number[]
function printBarcodeEAN13Alt(data: string): number[]
```

**Requirements:** Exactly 12 digits (13th auto-generated)

#### EAN-8

```typescript
function printBarcodeEAN8(data: string): number[]
function printBarcodeEAN8Alt(data: string): number[]
```

**Requirements:** Exactly 7 digits

#### CODE 39

```typescript
function printBarcodeCODE39(data: string): number[]
function printBarcodeCODE39Alt(data: string): number[]
```

**Valid characters:** space, $, %, *, +, -, ., /, 0-9, A-Z

#### ITF (Interleaved 2 of 5)

```typescript
function printBarcodeITF(data: string): number[]
function printBarcodeITFAlt(data: string): number[]
```

**Requirements:** Digits only

#### CODABAR

```typescript
function printBarcodeCODABAR(data: string): number[]
function printBarcodeCODABARAlt(data: string): number[]
```

**Valid characters:** $, +, -, ., /, 0-9, A-D (uppercase or lowercase, not mixed)

#### CODE 93

```typescript
function printBarcodeCODE93(data: string): number[]
```

**Valid characters:** ASCII 0-127

#### CODE 128

```typescript
function printBarcodeCODE128(data: string): number[]
```

**Valid characters:** ASCII 0-127

### Extended Barcodes

These barcode types are specific to ESC/Bematech.

#### PDF-417

```typescript
function printBarcodePDF417(
  eccLevel: number,      // 0-8
  pitchHeight: number,   // n × 0.125mm (1-8)
  pitchWidth: number,    // n × 0.125mm (1-4)
  codewordsPerRow: number,
  data: string           // < 900 bytes
): number[]
```

**Example:**

```typescript
import { printBarcodePDF417 } from '@thermal-print/escpos/commands/escbematech';

const pdf417 = printBarcodePDF417(
  2,     // ECC level
  3,     // Pitch height
  2,     // Pitch width
  0,     // Auto codewords per row
  'Hello World'
);
generator.addRawCommand(Buffer.from(pdf417));
```

#### ISBN

```typescript
function printBarcodeISBN(data: string): number[]
```

**Format:** X-XXXXX-XXX-X [XXXXX] (hyphens optional)

#### MSI

```typescript
function printBarcodeMSI(data: string): number[]
function printBarcodeMSIAlt(data: string): number[]
```

**Requirements:** Digits only

#### PLESSEY

```typescript
function printBarcodePLESSEY(data: string): number[]
function printBarcodePLESSEYAlt(data: string): number[]
```

**Valid characters:** 0-9, A-F (or a-f, not mixed)

---

## Status & Buffer Control

### Status Queries

#### STATUS_ENQUIRY

**Byte Sequence:** `[ENQ]` or `0x05`

**Description:** Printer status enquiry. Returns 1 byte with status bits:

| Bit | 0 | 1 |
|-----|---|---|
| 0 | Offline | Online |
| 1 | Paper present | Paper out |
| 2 | Drawer/paper status (depends on ESC b) |
| 3 | Head raised | Head down |
| 4 | Paper full | Paper near end |
| 5 | Command not executed | Command executed |

#### EXTENDED_STATUS

**Byte Sequence:** `[GS, 0xF8, 0x31]`

**Description:** Extended status enquiry. Returns 5 status bytes.

### Buffer Control

| Constant | Sequence | Description |
|----------|----------|-------------|
| `CLEAR_BUFFER` | `[STX]` | Clear print buffer (keep settings) |
| `END_BUFFER` | `[ETX]` | End buffer (wait for empty) |
| `CANCEL_LINE` | `[CAN]` | Cancel last line |
| `CANCEL_CHAR` | `[DEL]` | Cancel last character |

---

## Network Configuration

### IP Address

#### setIPAddress()

**Byte Sequence:** `[GS, 0xF7, 0x08, 0x00, 0x22, i1, i2, i3, i4, s1, s2, s3, s4]`

**Description:** Set IP address and subnet mask.

```typescript
function setIPAddress(
  ip: [number, number, number, number],
  subnet: [number, number, number, number]
): number[]
```

**Example:**

```typescript
import { setIPAddress } from '@thermal-print/escpos/commands/escbematech';

// Set IP 192.168.1.100 with subnet 255.255.255.0
generator.addRawCommand(Buffer.from(setIPAddress(
  [192, 168, 1, 100],
  [255, 255, 255, 0]
)));
```

#### setGateway()

**Byte Sequence:** `[GS, 0xF7, 0x04, 0x00, 0x27, g1, g2, g3, g4]`

**Description:** Set default gateway.

```typescript
function setGateway(gateway: [number, number, number, number]): number[]
```

### DHCP

```typescript
function enableDHCP(): number[]   // [GS, 0xF9, 0x45, 0x01]
function disableDHCP(): number[]  // [GS, 0xF9, 0x45, 0x00]
```

### SNMP

```typescript
function setSNMP(
  enabled: boolean,
  ip: [number, number, number, number],
  community: string  // 0-64 chars
): number[]
```

### Wi-Fi

```typescript
function setWiFi(
  accessMode: 0 | 1,      // 0=Access Point, 1=Ad-hoc
  securityMode: 0 | 1 | 2 | 3 | 4,
  channel: number,        // 0-13
  essid: string,          // 0-32 chars
  passphrase: string      // 0-63 chars
): number[]
```

**Security Modes:**

| Mode | Description |
|------|-------------|
| 0 | None |
| 1 | WEP 64-bit |
| 2 | WEP 128-bit |
| 3 | WPA-TKIP |
| 4 | WPA2-AES |

**Example:**

```typescript
import { setWiFi } from '@thermal-print/escpos/commands/escbematech';

// Connect to WPA2 network
generator.addRawCommand(Buffer.from(setWiFi(
  0,              // Access Point mode
  4,              // WPA2-AES
  0,              // Auto channel
  'MyNetwork',    // SSID
  'MyPassword123' // Passphrase
)));
```

---

## Utility Functions

### encodeText()

**Description:** Convert text to code page bytes.

```typescript
function encodeText(text: string, codePage?: CodePage): number[]
```

### validateBarcodeData()

**Description:** Validate barcode data format.

```typescript
function validateBarcodeData(
  data: string,
  type: 'numeric' | 'alphanumeric' | 'all'
): boolean
```
