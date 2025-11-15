# ESC/POS Styling and Initialization Guide

This document provides comprehensive information about ESC/POS commands that can be customized in the `initialize()` method and throughout the conversion process.

## Table of Contents
- [Initialization Commands](#initialization-commands)
- [Line Spacing Control](#line-spacing-control)
- [Margin Control](#margin-control)
- [Character Spacing](#character-spacing)
- [Buffer Methods](#buffer-methods)
- [Customizing the Generator](#customizing-the-generator)
- [Common Use Cases](#common-use-cases)

---

## Initialization Commands

### ESC @ - Initialize Printer
**Command**: `0x1B 0x40` (hex) or `\x1b\x40` (string)
**Description**: Clears data in buffer and resets all printer modes to defaults.

**Effect**:
- Clears buffer
- Resets all formatting (bold, italic, underline, size)
- Resets alignment to left
- Resets line spacing to default (1/6 inch or 30/180 inch)
- Resets margins to default
- Does **NOT** affect DIP switch settings or printer configuration

**Usage in code**:
```javascript
this.printer.buffer.write(Buffer.from([0x1B, 0x40]));
// or
this.printer.hardware('init');
```

---

## Line Spacing Control

Line spacing controls the vertical distance between lines of text. This is **critical** for output quality.

### ESC 3 n - Set Line Spacing (Custom)
**Command**: `0x1B 0x33 n` (hex)
**Parameter**: `n` = spacing in dots (0-255)
**Default**: 34 dots (approximately 1/6 inch)

**This is the command that made spacing PERFECT!**

**Common Values**:
- `n = 1`: Minimal spacing (1 dot) - **Currently used, produces perfect spacing**
- `n = 30`: Default spacing (1/6 inch = 30/180 inch)
- `n = 34`: Alternative default on some printers
- `n = 60`: Double spacing (1/3 inch)

**Formula**: Line spacing = n × (vertical motion unit) inches
- Standard vertical motion unit: 1/180 inch
- So `n = 1` means 1/180 inch spacing
- And `n = 30` means 30/180 = 1/6 inch spacing

**Usage in code**:
```javascript
// Minimal spacing (current implementation - PERFECT!)
this.printer.buffer.write(Buffer.from([0x1B, 0x33, 0x01]));

// Default spacing (1/6 inch)
this.printer.buffer.write(Buffer.from([0x1B, 0x33, 0x1E])); // 0x1E = 30

// Custom spacing (e.g., 20 dots)
this.printer.buffer.write(Buffer.from([0x1B, 0x33, 0x14])); // 0x14 = 20

// or using the library method
this.printer.lineSpace(1); // minimal
this.printer.lineSpace(30); // default
this.printer.lineSpace(); // reset to default
```

### ESC 2 - Set Default Line Spacing
**Command**: `0x1B 0x32` (hex)
**Description**: Resets line spacing to default (1/6 inch = 30 dots)

**Usage in code**:
```javascript
this.printer.buffer.write(Buffer.from([0x1B, 0x32]));
// or
this.printer.lineSpace(); // no parameter = default
```

### ESC 0 - Set 1/8 Inch Line Spacing
**Command**: `0x1B 0x30` (hex)
**Description**: Sets line spacing to 1/8 inch (22.5 dots)

**Usage in code**:
```javascript
this.printer.buffer.write(Buffer.from([0x1B, 0x30]));
```

---

## Margin Control

Margins control the printable area on the paper.

### Left Margin

#### ESC l n - Set Left Margin (Basic)
**Command**: `0x1B 0x6C n` (hex)
**Parameter**: `n` = margin in character width units (0-255)

**Usage**:
```javascript
this.printer.buffer.write(Buffer.from([0x1B, 0x6C, 0x00])); // no left margin
this.printer.buffer.write(Buffer.from([0x1B, 0x6C, 0x05])); // 5 characters margin
// or
this.printer.marginLeft(0); // no margin
this.printer.marginLeft(5); // 5 characters margin
```

#### GS L nL nH - Set Left Margin (Advanced)
**Command**: `0x1D 0x4C nL nH` (hex)
**Parameters**:
- `nL` = low byte
- `nH` = high byte
- Margin = `(nL + nH × 256) × horizontal_motion_unit` inches

**Currently used in initialize() to attempt removing top margin:**
```javascript
// Set left margin to 0 (nL=0, nH=0)
this.printer.buffer.write(Buffer.from([0x1D, 0x4C, 0x00, 0x00]));
```

**Note**: This command sets the **left** margin, not the top margin. It may not affect top spacing.

### Right Margin

#### ESC Q n - Set Right Margin
**Command**: `0x1B 0x51 n` (hex)
**Parameter**: `n` = margin in character width units (0-255)

**Usage**:
```javascript
this.printer.buffer.write(Buffer.from([0x1B, 0x51, 0x00])); // no right margin
this.printer.buffer.write(Buffer.from([0x1B, 0x51, 0x05])); // 5 characters margin
// or
this.printer.marginRight(0);
this.printer.marginRight(5);
```

### Print Area Width

#### GS W nL nH - Set Print Area Width
**Command**: `0x1D 0x57 nL nH` (hex)
**Parameters**:
- `nL` = low byte
- `nH` = high byte
- Width = `(nL + nH × 256) × horizontal_motion_unit` inches
- **Default**: nL = 64 (0x40), nH = 2 (0x02)

**Usage**:
```javascript
// Set print width to default (64 + 2×256 = 576 units)
this.printer.buffer.write(Buffer.from([0x1D, 0x57, 0x40, 0x02]));

// Set narrow print width (300 units = 0x012C = nL=0x2C, nH=0x01)
this.printer.buffer.write(Buffer.from([0x1D, 0x57, 0x2C, 0x01]));
```

### Bottom Margin

#### ESC O - Set Bottom Margin
**Command**: `0x1B 0x4F n` (hex)
**Parameter**: `n` = margin size

**Usage**:
```javascript
this.printer.buffer.write(Buffer.from([0x1B, 0x4F, 0x00])); // minimal bottom margin
// or
this.printer.marginBottom(0);
```

---

## Character Spacing

Controls horizontal spacing between characters.

### ESC SP n - Set Character Spacing
**Command**: `0x1B 0x20 n` (hex)
**Parameter**: `n` = spacing in horizontal motion unit (0-255)
**Default**: 0 (no extra spacing)

**Usage**:
```javascript
// No extra spacing (default)
this.printer.buffer.write(Buffer.from([0x1B, 0x20, 0x00]));

// Add 2 units of spacing
this.printer.buffer.write(Buffer.from([0x1B, 0x20, 0x02]));

// or using library method
this.printer.spacing(); // reset to default (0)
this.printer.spacing(2); // 2 units
```

---

## Motion Unit Control

Controls the precision of spacing and margin measurements.

### GS P x y - Set Horizontal and Vertical Motion Units
**Command**: `0x1D 0x50 x y` (hex)
**Parameters**:
- `x` = horizontal motion unit (0-204)
- `y` = vertical motion unit (0-204)
- Unit value represents **1/unit inches**
- **Default**: Usually x=180, y=180 (1/180 inch precision)

**Formula**:
- Horizontal motion unit = 1/x inch
- Vertical motion unit = 1/y inch

**Example**:
```javascript
// Set to default precision (1/180 inch)
this.printer.buffer.write(Buffer.from([0x1D, 0x50, 0xB4, 0xB4])); // 0xB4 = 180

// Set to lower precision (1/90 inch)
this.printer.buffer.write(Buffer.from([0x1D, 0x50, 0x5A, 0x5A])); // 0x5A = 90

// Set to higher precision (1/203 inch - common for 203 DPI printers)
this.printer.buffer.write(Buffer.from([0x1D, 0x50, 0xCB, 0xCB])); // 0xCB = 203
```

---

## Buffer Methods

The `escpos` library provides these methods through the `printer` instance:

### Direct Buffer Writing
```javascript
// Write raw bytes to buffer
this.printer.buffer.write(Buffer.from([0x1B, 0x40]));
this.printer.buffer.writeUInt8(value); // write single byte
this.printer.buffer.writeUInt16LE(value); // write 16-bit little-endian
```

### High-Level Methods
```javascript
// Hardware control
this.printer.hardware('init');   // ESC @
this.printer.hardware('select'); // ESC =
this.printer.hardware('reset');  // ESC ?

// Line spacing
this.printer.lineSpace();   // reset to default (ESC 2)
this.printer.lineSpace(n);  // set to n dots (ESC 3 n)

// Character spacing
this.printer.spacing();     // reset to default
this.printer.spacing(n);    // set to n units

// Margins
this.printer.marginLeft(n);
this.printer.marginRight(n);
this.printer.marginBottom(n);

// Text formatting
this.printer.align('lt');    // left (LT), center (CT), right (RT)
this.printer.font('a');      // font A or B
this.printer.style('b');     // bold (B), italic (I), underline (U), normal
this.printer.size(w, h);     // width and height (1-8)

// Paper control
this.printer.feed(n);        // feed n lines
this.printer.control('LF');  // line feed
this.printer.control('FF');  // form feed
this.printer.control('CR');  // carriage return

// Output
this.printer.text('text');   // print text with encoding
this.printer.print('raw');   // print raw content
this.printer.newLine();      // print newline

// Buffer operations
this.printer.buffer.flush(); // get buffer and clear
```

---

## Customizing the Generator

The `initialize()` method in `generator.ts` is where you customize printer startup behavior.

### Current Implementation (generator.ts:43-54)

```javascript
initialize(): void {
  // 1. Initialize printer - clears buffer and resets all modes
  this.printer.buffer.write(Buffer.from([0x1B, 0x40]));

  // 2. Set MINIMAL line spacing (1 dot) - THIS MADE SPACING PERFECT!
  this.printer.buffer.write(Buffer.from([0x1B, 0x33, 0x01]));

  // 3. Attempt to set left margin to 0 (doesn't affect top margin)
  this.printer.buffer.write(Buffer.from([0x1D, 0x4C, 0x00, 0x00]));
}
```

### Alternative Configurations

#### Configuration 1: Default Spacing
```javascript
initialize(): void {
  // Initialize printer
  this.printer.buffer.write(Buffer.from([0x1B, 0x40]));

  // Use default line spacing (1/6 inch = 30 dots)
  this.printer.buffer.write(Buffer.from([0x1B, 0x32]));

  // Set left margin to 0
  this.printer.buffer.write(Buffer.from([0x1D, 0x4C, 0x00, 0x00]));
}
```

#### Configuration 2: Custom Spacing
```javascript
initialize(): void {
  // Initialize printer
  this.printer.buffer.write(Buffer.from([0x1B, 0x40]));

  // Custom line spacing (e.g., 15 dots = halfway between minimal and default)
  this.printer.buffer.write(Buffer.from([0x1B, 0x33, 0x0F])); // 0x0F = 15

  // Set margins
  this.printer.buffer.write(Buffer.from([0x1D, 0x4C, 0x00, 0x00])); // left = 0
}
```

#### Configuration 3: High-Level Methods
```javascript
initialize(): void {
  // Initialize using library method
  this.printer.hardware('init');

  // Set line spacing using library method
  this.printer.lineSpace(1); // minimal spacing

  // Set margins using library methods
  this.printer.marginLeft(0);
  this.printer.marginRight(0);
  this.printer.marginBottom(0);
}
```

#### Configuration 4: Attempting to Remove Top Margin
```javascript
initialize(): void {
  // Initialize printer
  this.printer.buffer.write(Buffer.from([0x1B, 0x40]));

  // Minimal line spacing
  this.printer.buffer.write(Buffer.from([0x1B, 0x33, 0x01]));

  // Set all margins to 0
  this.printer.buffer.write(Buffer.from([0x1D, 0x4C, 0x00, 0x00])); // left
  this.printer.buffer.write(Buffer.from([0x1B, 0x6C, 0x00]));       // left (alt)
  this.printer.buffer.write(Buffer.from([0x1B, 0x51, 0x00]));       // right
  this.printer.buffer.write(Buffer.from([0x1B, 0x4F, 0x00]));       // bottom

  // Try setting print area to full width
  // For 80mm paper with 203 DPI: width ≈ 576 units
  this.printer.buffer.write(Buffer.from([0x1D, 0x57, 0x40, 0x02])); // 576 = 0x0240
}
```

#### Configuration 5: Motion Unit Control
```javascript
initialize(): void {
  // Initialize printer
  this.printer.buffer.write(Buffer.from([0x1B, 0x40]));

  // Set motion units to higher precision (203 DPI)
  this.printer.buffer.write(Buffer.from([0x1D, 0x50, 0xCB, 0xCB])); // 203 = 0xCB

  // Now spacing is measured in 1/203 inch units
  // Set minimal line spacing (1 unit = 1/203 inch)
  this.printer.buffer.write(Buffer.from([0x1B, 0x33, 0x01]));
}
```

---

## Common Use Cases

### Removing Top Margin (Hardware Limitation)

**Problem**: Large blank space at top of printout.

**Attempted Solutions**:
1. ✅ Remove leading newlines from buffer (implemented in `getBuffer()`)
2. ❌ Set left margin to 0 with `GS L` (doesn't affect top margin)
3. ❌ Set bottom margin to 0 (doesn't affect top margin)
4. ⚠️ **Likely cause**: Hardware limitation of thermal printer

**Why it's likely hardware**:
- ESC/POS has **NO command for top margin**
- Top margin is usually controlled by:
  - Printer DIP switches
  - Printer configuration menu
  - Printer driver settings (Windows/Linux)
  - Physical paper sensor position

**Potential Solutions**:
1. **Check printer manual** for DIP switch settings (usually marked as "Top margin" or "Feed margin")
2. **Access printer configuration** (usually: Hold FEED button while powering on)
3. **Test on actual hardware** - the top margin visible in `.bin` file preview may not appear on physical print
4. **Try printer-specific commands** (e.g., MP-4200 TH may have custom commands)

### Adjusting Line Spacing

**Use Case**: Text lines too close or too far apart.

**Solution**:
```javascript
// In initialize()
// Increase spacing: use higher n value
this.printer.buffer.write(Buffer.from([0x1B, 0x33, 0x0A])); // 10 dots

// Decrease spacing: use lower n value
this.printer.buffer.write(Buffer.from([0x1B, 0x33, 0x01])); // 1 dot (current - PERFECT!)

// Reset to default
this.printer.buffer.write(Buffer.from([0x1B, 0x32])); // 1/6 inch
```

### Adjusting Paper Width

**Use Case**: Need to print on different paper sizes.

**Solution**:
```javascript
// For 58mm paper (usually 32 characters wide)
const generator = new ESCPOSGenerator(32, "cp850", true);

// For 80mm paper (usually 48 characters wide) - CURRENT
const generator = new ESCPOSGenerator(48, "cp850", true);

// For custom width
const generator = new ESCPOSGenerator(42, "cp850", true);
```

### Character Encoding Issues

**Use Case**: Special characters displaying incorrectly.

**Solution**:
```javascript
// Portuguese/Spanish: CP850 (Western Europe) - CURRENT
const generator = new ESCPOSGenerator(48, "cp850", true);

// Chinese: GB18030 (default in escpos)
const generator = new ESCPOSGenerator(48, "GB18030", true);

// Japanese: Shift-JIS
const generator = new ESCPOSGenerator(48, "Shift-JIS", true);

// Korean: EUC-KR
const generator = new ESCPOSGenerator(48, "EUC-KR", true);

// See: https://github.com/ashtuchkin/iconv-lite/wiki/Supported-Encodings
```

---

## ESC/POS Command Reference

### Quick Reference Table

| Command | Hex | Description | Parameter Range |
|---------|-----|-------------|-----------------|
| ESC @ | `1B 40` | Initialize printer | - |
| ESC 2 | `1B 32` | Default line spacing (1/6") | - |
| ESC 3 n | `1B 33 n` | Set line spacing | n: 0-255 dots |
| ESC SP n | `1B 20 n` | Character spacing | n: 0-255 units |
| ESC l n | `1B 6C n` | Left margin | n: 0-255 chars |
| ESC Q n | `1B 51 n` | Right margin | n: 0-255 chars |
| ESC O n | `1B 4F n` | Bottom margin | n: varies |
| GS L nL nH | `1D 4C nL nH` | Left margin (advanced) | nL,nH: 0-255 |
| GS W nL nH | `1D 57 nL nH` | Print area width | nL,nH: 0-255 |
| GS P x y | `1D 50 x y` | Motion units | x,y: 0-204 |

### Constants from commands.js

```javascript
// Feed control
LF: '\x0a'      // Line feed
FF: '\x0c'      // Form feed
CR: '\x0d'      // Carriage return
HT: '\x09'      // Horizontal tab
VT: '\x0b'      // Vertical tab

// Hardware
HW_INIT: '\x1b\x40'           // ESC @ - Initialize
HW_SELECT: '\x1b\x3d\x01'     // ESC = - Select
HW_RESET: '\x1b\x3f\x0a\x00'  // ESC ? - Reset

// Line spacing
LS_DEFAULT: '\x1b\x32'  // ESC 2 - Default (1/6")
LS_SET: '\x1b\x33'      // ESC 3 - Custom

// Character spacing
CS_DEFAULT: '\x1b\x20\x00'  // ESC SP 0 - Default
CS_SET: '\x1b\x20'          // ESC SP - Custom

// Margins
MARGINS.LEFT: '\x1b\x6c'    // ESC l
MARGINS.RIGHT: '\x1b\x51'   // ESC Q
MARGINS.BOTTOM: '\x1b\x4f'  // ESC O
```

---

## Additional Resources

### Official Documentation
- **Epson ESC/POS Reference**: https://support.epson.net/publist/reference_en/?ref=escpos
- **ESC/POS Command Specification**: Look for your printer's command manual

### Libraries
- **escpos (npm)**: https://www.npmjs.com/package/escpos
- **iconv-lite (encoding)**: https://github.com/ashtuchkin/iconv-lite/wiki/Supported-Encodings

### Printer-Specific
- **MP-4200 TH Manual**: Check manufacturer documentation for:
  - DIP switch settings
  - Configuration menu access
  - Custom ESC/POS extensions
  - Top margin configuration

---

## Troubleshooting

### Issue: Line spacing too large
**Solution**: Decrease `n` value in `ESC 3 n` command
```javascript
this.printer.buffer.write(Buffer.from([0x1B, 0x33, 0x01])); // minimal
```

### Issue: Line spacing too small (text overlapping)
**Solution**: Increase `n` value in `ESC 3 n` command
```javascript
this.printer.buffer.write(Buffer.from([0x1B, 0x33, 0x14])); // 20 dots
```

### Issue: Top margin too large
**Solution**: Hardware configuration required - see printer manual

### Issue: Characters displaying incorrectly
**Solution**: Change encoding in constructor
```javascript
const generator = new ESCPOSGenerator(48, "cp850", true); // Portuguese
```

### Issue: Commands not working
**Solution**:
1. Ensure printer supports the command (check manual)
2. Send ESC @ first to reset printer state
3. Use correct byte values (hex)
4. Check command order (some commands must come before others)

---

## Version History

- **v1.0** (2025-01-13): Initial documentation based on react-pdf-to-escpos implementation
  - Documented ESC 3 n command that achieved perfect spacing
  - Added margin control commands
  - Added motion unit control
  - Added common use cases and troubleshooting
