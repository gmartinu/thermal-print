/**
 * ESC/POS Command Set
 *
 * Comprehensive ESC/POS thermal printer command bytes for MP-4200 TH.
 * Reference: ESC/POS Command Manual
 *
 * This file contains all documented ESC/POS commands organized by category.
 * Commands are compatible with standard ESC/POS thermal printers.
 */

import { encodeCP860 } from "../encodings/cp860";

// ============================================================================
// CONTROL CHARACTERS
// ============================================================================

export const HT = 0x09;  // Horizontal Tab
export const LF = 0x0a;  // Line Feed
export const FF = 0x0c;  // Form Feed
export const CR = 0x0d;  // Carriage Return
export const DLE = 0x10; // Data Link Escape
export const CAN = 0x18; // Cancel
export const ESC = 0x1b; // Escape
export const FS = 0x1c;  // File Separator
export const GS = 0x1d;  // Group Separator

// Initialize printer
// ESC @ - Reset printer to default state
export const INIT = [ESC, 0x40];

// Text alignment
// ESC a n - Set text alignment (n: 0=left, 1=center, 2=right)
export const ALIGN_LEFT = [ESC, 0x61, 0x00];
export const ALIGN_CENTER = [ESC, 0x61, 0x01];
export const ALIGN_RIGHT = [ESC, 0x61, 0x02];

// Text emphasis
// ESC E n - Turn bold on/off (n: 0=off, 1=on)
export const BOLD_ON = [ESC, 0x45, 0x01];
export const BOLD_OFF = [ESC, 0x45, 0x00];

// ESC - n - Turn underline on/off (n: 0=off, 1=on, 2=double)
export const UNDERLINE_ON = [ESC, 0x2d, 0x01];
export const UNDERLINE_OFF = [ESC, 0x2d, 0x00];

/**
 * Calculate character size using ESC ! command (compatible with more printers)
 * ESC ! only supports up to 2x2 character size
 * @param width - Width multiplier (1 or 2)
 * @param height - Height multiplier (1 or 2)
 * @param bold - Whether text should be bold (optional, default: false)
 * @returns ESC/POS ESC ! n command bytes
 */
export const calculateCharacterSize = (
  width: number,
  height: number,
  bold: boolean = false
): number[] => {
  // ESC ! command format:
  // Bit 0: Character font (0=Font A, 1=Font B)
  // Bit 3: Emphasis (bold)
  // Bit 4: Double-height
  // Bit 5: Double-width
  // Bit 7: Underline

  let n = 0;

  // Set double-height bit (bit 4 = 0x10)
  if (height >= 2) {
    n |= 0x10;
  }

  // Set double-width bit (bit 5 = 0x20)
  if (width >= 2) {
    n |= 0x20;
  }

  // Set bold/emphasis bit (bit 3 = 0x08)
  if (bold) {
    n |= 0x08;
  }

  return [ESC, 0x21, n];
};

// Line spacing
// ESC 3 n - Set line spacing to n dots
export const setLineSpacing = (dots: number): number[] => [ESC, 0x33, dots];

// Default line spacing (30 dots = ~3.75mm)
export const LINE_SPACING_DEFAULT = [ESC, 0x33, 30];

// Paper control
// LF - Line feed (move paper up one line)
export const LINE_FEED = [LF];

// ESC d n - Print and feed n lines
export const feedLines = (lines: number): number[] => [ESC, 0x64, lines];

// GS V m - Paper cut
// m: 0=full cut, 1=partial cut
export const CUT_FULL = [GS, 0x56, 0x00];
export const CUT_PARTIAL = [GS, 0x56, 0x01];
// Alternative: GS V m n - Cut with feed
export const cutWithFeed = (lines: number): number[] => [GS, 0x56, 0x41, lines];

// Character code table
// ESC t n - Select character code table
// Common tables: 0=CP437, 3=CP860 (Portuguese), 16=WPC1252
export const CODEPAGE_CP437 = [ESC, 0x74, 0x00]; // USA
export const CODEPAGE_CP860 = [ESC, 0x74, 0x03]; // Portuguese
export const CODEPAGE_WPC1252 = [ESC, 0x74, 0x10]; // Windows Latin-1

// Barcode and QR Code
// QR Code: GS ( k pL pH cn fn n1 n2 [data]
// This is a complex command, implemented as a function

/**
 * Generate QR Code command
 * @param data - QR code data (URL or text)
 * @param size - QR code module size (1-16, default 6)
 * @returns ESC/POS command bytes
 */
export const generateQRCode = (data: string, size = 6): number[] => {
  const commands: number[] = [];

  // QR Code model (function 165, cn=49, fn=65, n=48/49/50)
  // Model 2 (most common)
  commands.push(GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);

  // QR Code size (function 167, cn=49, fn=67, n=size)
  commands.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, size);

  // QR Code error correction (function 169, cn=49, fn=69, n=48-51)
  // 48=L(7%), 49=M(15%), 50=Q(25%), 51=H(30%)
  commands.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31);

  // Store QR code data (function 180, cn=49, fn=80)
  const dataBytes = new TextEncoder().encode(data);
  const pL = (dataBytes.length + 3) % 256;
  const pH = Math.floor((dataBytes.length + 3) / 256);
  commands.push(GS, 0x28, 0x6b, pL, pH, 0x31, 0x50, 0x30);
  commands.push(...Array.from(dataBytes));

  // Print QR code (function 181, cn=49, fn=81)
  commands.push(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);

  return commands;
};

/**
 * Generate raster image command (GS v 0)
 * @param imageData - Monochrome bitmap data (1 bit per pixel, 1=black, 0=white)
 * @param width - Image width in pixels
 * @param height - Image height in pixels
 * @returns ESC/POS command bytes
 */
export const generateRasterImage = (
  imageData: number[],
  width: number,
  height: number
): number[] => {
  const commands: number[] = [];

  // Calculate bytes per line (width in bytes, rounded up to nearest byte)
  const bytesPerLine = Math.ceil(width / 8);

  // GS v 0 m xL xH yL yH d1...dk
  // m = 0 (normal), 1 (double width), 2 (double height), 3 (quadruple)
  // xL xH = width in bytes (little endian)
  // yL yH = height in dots (little endian)
  // d1...dk = raster image data

  commands.push(GS, 0x76, 0x30, 0x00); // GS v 0 m (m=0: normal)

  // Width in bytes (little endian)
  commands.push(bytesPerLine & 0xff);
  commands.push((bytesPerLine >> 8) & 0xff);

  // Height in dots (little endian)
  commands.push(height & 0xff);
  commands.push((height >> 8) & 0xff);

  // Add image data
  commands.push(...imageData);

  return commands;
};

/**
 * Text encoding helper
 * Converts string to CP860 byte array for Brazilian Portuguese thermal printers
 */
export const encodeText = (text: string): number[] => {
  // CP860 is the standard codepage for Portuguese thermal printers
  // Supports: ç Ç á é í ó ú à ã õ â ê ô and other Portuguese characters
  return encodeCP860(text);
};

// ============================================================================
// REAL-TIME COMMANDS
// ============================================================================

/**
 * DLE EOT n - Transmit real-time status
 * n = 1: Transmit printer status
 * n = 2: Transmit offline status
 * n = 3: Transmit error status
 * n = 4: Transmit paper roll sensor status
 */
export const transmitRealtimeStatus = (n: 1 | 2 | 3 | 4): number[] => [DLE, 0x04, n];

/**
 * DLE ENQ n - Real-time request to printer
 * n = 1: Recover from error and restart printing
 * n = 2: Clear buffer
 */
export const realtimeRequest = (n: 1 | 2): number[] => [DLE, 0x05, n];

/**
 * DLE DC4 fn a b - Generate pulse in real-time
 * fn = 1: Generate pulse
 * a = drawer (0 or 1)
 * b = pulse time
 */
export const realtimePulse = (drawer: 0 | 1, pulseTime: number): number[] =>
  [DLE, 0x14, 0x01, drawer, pulseTime];

// ============================================================================
// TEXT POSITION & LAYOUT
// ============================================================================

/**
 * ESC $ nL nH - Set absolute print position
 * Position = ((nH × 256) + nL) × (horizontal motion unit)
 */
export const setAbsolutePosition = (position: number): number[] => {
  const nL = position & 0xFF;
  const nH = (position >> 8) & 0xFF;
  return [ESC, 0x24, nL, nH];
};

/**
 * ESC \ nL nH - Set relative print position
 * Relative position = ((nH × 256) + nL) × (horizontal motion unit)
 * Supports negative values (two's complement)
 */
export const setRelativePosition = (position: number): number[] => {
  const nL = position & 0xFF;
  const nH = (position >> 8) & 0xFF;
  return [ESC, 0x5C, nL, nH];
};

/**
 * ESC SP n - Set right-side character spacing
 * Range: 0 ≤ n ≤ 255
 * Spacing = n × (horizontal motion unit)
 */
export const setCharacterSpacing = (dots: number): number[] =>
  [ESC, 0x20, Math.max(0, Math.min(255, dots))];

/**
 * ESC D n1...nk NUL - Set horizontal tab positions
 * n1-nk: Tab positions (1-255), up to 32 positions
 * Must be in ascending order, terminated with NUL
 */
export const setTabPositions = (positions: number[]): number[] => {
  const validPositions = positions
    .filter(p => p >= 1 && p <= 255)
    .slice(0, 32)
    .sort((a, b) => a - b);
  return [ESC, 0x44, ...validPositions, 0x00];
};

/**
 * ESC D NUL - Cancel all horizontal tab positions
 */
export const CLEAR_TABS = [ESC, 0x44, 0x00];

// ============================================================================
// TEXT EMPHASIS & STYLES
// ============================================================================

/**
 * ESC G n - Turn double-strike mode on/off
 * n = 0 or 48: Turn off double-strike mode
 * n = 1 or 49: Turn on double-strike mode
 */
export const DOUBLE_STRIKE_ON = [ESC, 0x47, 0x01];
export const DOUBLE_STRIKE_OFF = [ESC, 0x47, 0x00];

/**
 * Character font selection
 */
export enum CharacterFont {
  FONT_A = 0,  // 12×24 dots (default)
  FONT_B = 1,  // 9×17 dots
  FONT_C = 2   // Printer dependent
}

/**
 * ESC M n - Select character font
 * n = 0 or 48: Font A (12×24)
 * n = 1 or 49: Font B (9×17)
 * n = 2 or 50: Font C (printer dependent)
 */
export const selectFont = (font: CharacterFont): number[] => [ESC, 0x4D, font];

/**
 * ESC V n - Turn 90° clockwise rotation mode on/off
 * n = 0 or 48: Turn off 90° clockwise rotation mode
 * n = 1 or 49: Turn on 90° clockwise rotation mode
 */
export const ROTATE_90_ON = [ESC, 0x56, 0x01];
export const ROTATE_90_OFF = [ESC, 0x56, 0x00];

/**
 * ESC { n - Turn upside-down printing mode on/off
 * n = 0 or 48: Turn off upside-down printing mode
 * n = 1 or 49: Turn on upside-down printing mode
 */
export const UPSIDE_DOWN_ON = [ESC, 0x7B, 0x01];
export const UPSIDE_DOWN_OFF = [ESC, 0x7B, 0x00];

/**
 * ESC - n - Turn underline mode on/off with thickness selection
 * n = 0 or 48: Turn off underline mode
 * n = 1 or 49: Turn on underline mode (1-dot thick)
 * n = 2 or 50: Turn on underline mode (2-dots thick)
 */
export const UNDERLINE_1DOT = [ESC, 0x2D, 0x01];
export const UNDERLINE_2DOT = [ESC, 0x2D, 0x02];

// ============================================================================
// LINE SPACING & PAPER CONTROL (ADDITIONAL)
// ============================================================================

/**
 * ESC 2 - Select default line spacing
 * Sets line spacing to approximately 4.23mm (1/6 inch)
 */
export const LINE_SPACING_DEFAULT_ALT = [ESC, 0x32];

/**
 * ESC J n - Print and feed paper
 * Range: 0 ≤ n ≤ 255
 * Feed amount = n × (vertical motion unit)
 */
export const printAndFeed = (dots: number): number[] =>
  [ESC, 0x4A, Math.max(0, Math.min(255, dots))];

/**
 * ESC K n - Print and reverse feed
 * Range: 0 ≤ n ≤ 255
 * Reverse feed amount = n × (vertical motion unit)
 */
export const printAndReverseFeed = (dots: number): number[] =>
  [ESC, 0x4B, Math.max(0, Math.min(255, dots))];

// ============================================================================
// PAPER CUTTING (ADDITIONAL)
// ============================================================================

/**
 * ESC i - Full cut
 * Executes a full cut (cuts paper completely)
 */
export const CUT_FULL_ESC = [ESC, 0x69];

/**
 * ESC m - Partial cut
 * Executes a partial cut (leaves connection point)
 */
export const CUT_PARTIAL_ESC = [ESC, 0x6D];

/**
 * GS V m n - Cut paper and feed
 * m = 65 (0x41): Feed then full cut
 * m = 66 (0x42): Feed then partial cut
 * n = feed amount before cut
 */
export const cutAndFeedFull = (dots: number): number[] =>
  [GS, 0x56, 0x41, Math.max(0, Math.min(255, dots))];

export const cutAndFeedPartial = (dots: number): number[] =>
  [GS, 0x56, 0x42, Math.max(0, Math.min(255, dots))];

// ============================================================================
// PERIPHERAL DEVICE CONTROL
// ============================================================================

/**
 * ESC = n - Select peripheral device
 * n = 0: Disabled
 * n = 1: Enabled
 */
export const selectPeripheral = (enabled: boolean): number[] =>
  [ESC, 0x3D, enabled ? 0x01 : 0x00];

/**
 * ESC p m t1 t2 - Generate pulse
 * m = 0 or 48: Drawer kick-out connector pin 2
 * m = 1 or 49: Drawer kick-out connector pin 5
 * t1 = ON time (0-255, units of 100ms)
 * t2 = OFF time (0-255, units of 100ms)
 */
export const generatePulse = (connector: 0 | 1, onTime: number, offTime: number): number[] =>
  [ESC, 0x70, connector, Math.max(0, Math.min(255, onTime)), Math.max(0, Math.min(255, offTime))];

/**
 * ESC c 3 n - Select paper sensor(s) to output paper-end signals
 * n is a bitmask for sensor selection
 */
export const selectPaperSensorOutput = (sensorMask: number): number[] =>
  [ESC, 0x63, 0x33, sensorMask];

/**
 * ESC c 4 n - Select paper sensor(s) to stop printing
 * n is a bitmask for sensor selection
 */
export const selectPaperSensorStop = (sensorMask: number): number[] =>
  [ESC, 0x63, 0x34, sensorMask];

/**
 * ESC c 5 n - Enable/disable panel buttons
 * n = 0: Enable panel buttons
 * n = 1: Disable panel buttons
 */
export const enablePanelButtons = (): number[] => [ESC, 0x63, 0x35, 0x00];
export const disablePanelButtons = (): number[] => [ESC, 0x63, 0x35, 0x01];

// ============================================================================
// CHARACTER CODE TABLES
// ============================================================================

/**
 * International character set selection
 */
export enum InternationalCharset {
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

/**
 * ESC R n - Select international character set
 */
export const selectInternationalCharset = (charset: InternationalCharset): number[] =>
  [ESC, 0x52, charset];

/**
 * Extended code page enumeration
 */
export enum CodePage {
  CP437 = 0,      // USA, Standard Europe
  CP850 = 2,      // Multilingual
  CP860 = 3,      // Portuguese
  CP863 = 4,      // Canadian-French
  CP865 = 5,      // Nordic
  CP851 = 11,     // Greek
  CP853 = 12,     // Turkish
  CP857 = 13,     // Turkish
  CP737 = 14,     // Greek
  CP928 = 16,     // Greek
  CP866 = 17,     // Cyrillic #2
  CP852 = 18,     // Latin 2
  CP858 = 19,     // Euro
  WPC1252 = 16    // Windows Latin-1
}

/**
 * ESC t n - Select character code table
 */
export const setCodePage = (page: CodePage): number[] => [ESC, 0x74, page];

// ============================================================================
// GRAPHICS - BIT IMAGE
// ============================================================================

/**
 * Bit image modes for ESC *
 */
export enum BitImageMode {
  MODE_8_SINGLE = 0,      // 8-dot single-density (67 DPI)
  MODE_8_DOUBLE = 1,      // 8-dot double-density (100 DPI)
  MODE_24_SINGLE = 32,    // 24-dot single-density (203 DPI)
  MODE_24_DOUBLE = 33     // 24-dot double-density (203 DPI)
}

/**
 * ESC * m nL nH d1...dk - Print bit image
 * m: Bit image mode
 * nL, nH: Number of data columns (nL + nH × 256)
 * d1...dk: Bit image data
 */
export const printBitImage = (mode: BitImageMode, width: number, data: number[]): number[] => {
  const nL = width & 0xFF;
  const nH = (width >> 8) & 0xFF;
  return [ESC, 0x2A, mode, nL, nH, ...data];
};

// ============================================================================
// GRAPHICS - DOWNLOADED BIT IMAGE
// ============================================================================

/**
 * GS * x y d1...dk - Define downloaded bit image
 * x: Number of bytes in horizontal direction (1 ≤ x ≤ 255)
 * y: Number of bytes in vertical direction (1 ≤ y ≤ 48)
 * Horizontal dots = x × 8
 * Vertical dots = y × 8
 */
export const defineDownloadedBitImage = (x: number, y: number, data: number[]): number[] => {
  const xVal = Math.max(1, Math.min(255, x));
  const yVal = Math.max(1, Math.min(48, y));
  return [GS, 0x2A, xVal, yVal, ...data];
};

/**
 * Downloaded image print modes
 */
export enum DownloadedImageMode {
  NORMAL = 0,          // Normal (100% × 100%)
  DOUBLE_WIDTH = 1,    // Double width (200% × 100%)
  DOUBLE_HEIGHT = 2,   // Double height (100% × 200%)
  QUADRUPLE = 3        // Quadruple (200% × 200%)
}

/**
 * GS / m - Print downloaded bit image
 * m: Print mode (0-3)
 */
export const printDownloadedBitImage = (mode: DownloadedImageMode): number[] =>
  [GS, 0x2F, mode];

// ============================================================================
// GRAPHICS - NV BIT IMAGE
// ============================================================================

/**
 * FS p n m - Print NV bit image
 * n: NV bit image number (1-255)
 * m: Print mode (0-3, same as DownloadedImageMode)
 */
export const printNVBitImage = (imageNumber: number, mode: DownloadedImageMode): number[] =>
  [FS, 0x70, Math.max(1, Math.min(255, imageNumber)), mode];

/**
 * FS q n [xL xH yL yH d1...dk]1...n - Define NV bit image
 * n: Number of NV bit images to define (1-255)
 * For each image:
 *   xL, xH: Width in bytes ((xH × 256 + xL) × 8 dots)
 *   yL, yH: Height in bytes ((yH × 256 + yL) × 8 dots)
 *   d1...dk: Bit image data
 */
export const defineNVBitImage = (images: Array<{ width: number; height: number; data: number[] }>): number[] => {
  const result: number[] = [FS, 0x71, Math.min(images.length, 255)];

  for (const img of images.slice(0, 255)) {
    const xL = img.width & 0xFF;
    const xH = (img.width >> 8) & 0xFF;
    const yL = img.height & 0xFF;
    const yH = (img.height >> 8) & 0xFF;
    result.push(xL, xH, yL, yH, ...img.data);
  }

  return result;
};

// ============================================================================
// BARCODE CONFIGURATION
// ============================================================================

/**
 * Barcode HRI (Human Readable Interpretation) position
 */
export enum BarcodeHRIPosition {
  NOT_PRINTED = 0,  // HRI not printed
  ABOVE = 1,        // HRI above barcode
  BELOW = 2,        // HRI below barcode
  BOTH = 3          // HRI both above and below
}

/**
 * GS H n - Select HRI character print position
 */
export const setBarcodeHRI = (position: BarcodeHRIPosition): number[] =>
  [GS, 0x48, position];

/**
 * GS f n - Select font for HRI characters
 * n = 0 or 48: Font A
 * n = 1 or 49: Font B
 */
export const setBarcodeFont = (fontB: boolean): number[] =>
  [GS, 0x66, fontB ? 0x01 : 0x00];

/**
 * GS h n - Set barcode height
 * Range: 1 ≤ n ≤ 255 (in dots)
 * Default: 162
 */
export const setBarcodeHeight = (height: number): number[] =>
  [GS, 0x68, Math.max(1, Math.min(255, height))];

/**
 * GS w n - Set barcode width
 * Range: 2 ≤ n ≤ 6 (module width in dots)
 * Default: 3
 */
export const setBarcodeWidth = (width: number): number[] =>
  [GS, 0x77, Math.max(2, Math.min(6, width))];

// ============================================================================
// BARCODE PRINTING
// ============================================================================

/**
 * Barcode symbologies
 */
export enum BarcodeType {
  UPC_A = 0,      // UPC-A (11-12 digits)
  UPC_E = 1,      // UPC-E (6-8 digits)
  EAN13 = 2,      // EAN-13 (12-13 digits)
  EAN8 = 3,       // EAN-8 (7-8 digits)
  CODE39 = 4,     // CODE39 (variable length)
  ITF = 5,        // ITF (Interleaved 2 of 5, variable even length)
  CODABAR = 6,    // CODABAR (variable length)
  CODE93 = 72,    // CODE93 (variable length)
  CODE128 = 73    // CODE128 (variable length)
}

/**
 * GS k m d1...dk NUL - Print barcode (NUL-terminated)
 * For barcode types 0-6 (UPC-A, UPC-E, EAN-13, EAN-8, CODE39, ITF, CODABAR)
 */
export const printBarcode = (type: BarcodeType, data: string): number[] => {
  const bytes = data.split('').map(c => c.charCodeAt(0));
  return [GS, 0x6B, type, ...bytes, 0x00];
};

/**
 * GS k m n d1...dn - Print barcode (length-specified)
 * For barcode types 65-73 (with length prefix)
 */
export const printBarcodeWithLength = (type: number, data: string): number[] => {
  const bytes = data.split('').map(c => c.charCodeAt(0));
  return [GS, 0x6B, type, bytes.length, ...bytes];
};

/**
 * Print UPC-A barcode
 * Requires 11-12 digits
 */
export const printBarcodeUPCA = (data: string): number[] => {
  if (!/^\d{11,12}$/.test(data)) {
    throw new Error('UPC-A requires 11-12 digits');
  }
  return printBarcode(BarcodeType.UPC_A, data.slice(0, 12));
};

/**
 * Print UPC-E barcode
 * Requires 6-8 digits
 */
export const printBarcodeUPCE = (data: string): number[] => {
  if (!/^\d{6,8}$/.test(data)) {
    throw new Error('UPC-E requires 6-8 digits');
  }
  return printBarcode(BarcodeType.UPC_E, data);
};

/**
 * Print EAN-13 barcode
 * Requires 12-13 digits
 */
export const printBarcodeEAN13 = (data: string): number[] => {
  if (!/^\d{12,13}$/.test(data)) {
    throw new Error('EAN-13 requires 12-13 digits');
  }
  return printBarcode(BarcodeType.EAN13, data.slice(0, 13));
};

/**
 * Print EAN-8 barcode
 * Requires 7-8 digits
 */
export const printBarcodeEAN8 = (data: string): number[] => {
  if (!/^\d{7,8}$/.test(data)) {
    throw new Error('EAN-8 requires 7-8 digits');
  }
  return printBarcode(BarcodeType.EAN8, data);
};

/**
 * Print CODE39 barcode
 * Supports: 0-9, A-Z, space, and symbols ($ % + - . /)
 */
export const printBarcodeCODE39 = (data: string): number[] => {
  if (!/^[0-9A-Z $%+\-.\/]+$/.test(data)) {
    throw new Error('CODE39 supports: 0-9, A-Z, space, $%+-./ only');
  }
  return printBarcode(BarcodeType.CODE39, data);
};

/**
 * Print ITF barcode (Interleaved 2 of 5)
 * Requires even number of digits
 */
export const printBarcodeITF = (data: string): number[] => {
  if (!/^\d+$/.test(data) || data.length % 2 !== 0) {
    throw new Error('ITF requires even number of digits');
  }
  return printBarcode(BarcodeType.ITF, data);
};

/**
 * Print CODABAR barcode
 * Supports: 0-9, A-D, and symbols ($ + - . / :)
 */
export const printBarcodeCODABAR = (data: string): number[] => {
  if (!/^[A-D][0-9A-D $+\-.\/:]*[A-D]$/.test(data)) {
    throw new Error('CODABAR must start and end with A-D, and contain 0-9, A-D, $+-./:');
  }
  return printBarcode(BarcodeType.CODABAR, data);
};

/**
 * Print CODE93 barcode
 * Supports all ASCII characters (0-127)
 */
export const printBarcodeCODE93 = (data: string): number[] => {
  return printBarcodeWithLength(BarcodeType.CODE93, data);
};

/**
 * Print CODE128 barcode
 * Supports all ASCII characters (0-127)
 */
export const printBarcodeCODE128 = (data: string): number[] => {
  return printBarcodeWithLength(BarcodeType.CODE128, data);
};

// ============================================================================
// 2D CODES - PDF417
// ============================================================================

/**
 * GS ( k pL pH cn fn [parameters] - PDF417 commands
 * cn = 0x30 (function code 48 for PDF417)
 */

/**
 * Set PDF417 number of columns
 * fn = 0x41, n = number of columns (0 or 1-30)
 */
export const setPDF417Columns = (columns: number): number[] => {
  const col = Math.max(0, Math.min(30, columns));
  return [GS, 0x28, 0x6B, 0x03, 0x00, 0x30, 0x41, col];
};

/**
 * Set PDF417 number of rows
 * fn = 0x42, n = number of rows (0 or 3-90)
 */
export const setPDF417Rows = (rows: number): number[] => {
  const row = rows === 0 ? 0 : Math.max(3, Math.min(90, rows));
  return [GS, 0x28, 0x6B, 0x03, 0x00, 0x30, 0x42, row];
};

/**
 * Set PDF417 module width
 * fn = 0x43, n = module width (2-8 dots)
 */
export const setPDF417Width = (width: number): number[] => {
  const w = Math.max(2, Math.min(8, width));
  return [GS, 0x28, 0x6B, 0x03, 0x00, 0x30, 0x43, w];
};

/**
 * Set PDF417 row height
 * fn = 0x44, n = row height (2-8 dots)
 */
export const setPDF417RowHeight = (height: number): number[] => {
  const h = Math.max(2, Math.min(8, height));
  return [GS, 0x28, 0x6B, 0x03, 0x00, 0x30, 0x44, h];
};

/**
 * Set PDF417 error correction level
 * fn = 0x45, m = 48 (standard mode), n = level (0-8)
 */
export const setPDF417ErrorCorrection = (level: number): number[] => {
  const lvl = Math.max(0, Math.min(8, level));
  return [GS, 0x28, 0x6B, 0x04, 0x00, 0x30, 0x45, 0x30, lvl];
};

/**
 * Store PDF417 data
 * fn = 0x50, m = 48 (standard mode), followed by data
 */
export const storePDF417Data = (data: string): number[] => {
  const bytes = new TextEncoder().encode(data);
  const pL = (bytes.length + 3) & 0xFF;
  const pH = ((bytes.length + 3) >> 8) & 0xFF;
  return [GS, 0x28, 0x6B, pL, pH, 0x30, 0x50, 0x30, ...Array.from(bytes)];
};

/**
 * Print PDF417 symbol
 * fn = 0x51, m = 48 (standard mode)
 */
export const printPDF417 = (): number[] =>
  [GS, 0x28, 0x6B, 0x03, 0x00, 0x30, 0x51, 0x30];

/**
 * Generate complete PDF417 barcode
 * Convenience function that combines all PDF417 commands
 */
export const generatePDF417 = (data: string, options?: {
  columns?: number;
  rows?: number;
  width?: number;
  rowHeight?: number;
  errorCorrection?: number;
}): number[] => {
  const commands: number[] = [];

  if (options?.columns !== undefined) {
    commands.push(...setPDF417Columns(options.columns));
  }
  if (options?.rows !== undefined) {
    commands.push(...setPDF417Rows(options.rows));
  }
  if (options?.width !== undefined) {
    commands.push(...setPDF417Width(options.width));
  }
  if (options?.rowHeight !== undefined) {
    commands.push(...setPDF417RowHeight(options.rowHeight));
  }
  if (options?.errorCorrection !== undefined) {
    commands.push(...setPDF417ErrorCorrection(options.errorCorrection));
  }

  commands.push(...storePDF417Data(data));
  commands.push(...printPDF417());

  return commands;
};

// ============================================================================
// CHARACTER EFFECTS (ADVANCED)
// ============================================================================

/**
 * GS ! n - Select character size
 * Supports 1-8x width and height multipliers
 * Bits 0-2: Width (0-7 for 1x-8x)
 * Bits 4-6: Height (0-7 for 1x-8x)
 */
export const selectCharacterSize = (widthMultiplier: number, heightMultiplier: number): number[] => {
  const w = Math.max(0, Math.min(7, widthMultiplier - 1));
  const h = Math.max(0, Math.min(7, heightMultiplier - 1));
  const n = (w & 0x07) | ((h & 0x07) << 4);
  return [GS, 0x21, n];
};

/**
 * GS B n - Turn white/black reverse printing mode on/off
 * n = 0 or 48: Turn off white/black reverse mode
 * n = 1 or 49: Turn on white/black reverse mode
 */
export const REVERSE_PRINT_ON = [GS, 0x42, 0x01];
export const REVERSE_PRINT_OFF = [GS, 0x42, 0x00];

/**
 * GS ( N pL pH fn n - Select character effects
 * fn = 48: Set character color
 * fn = 49: Set character smoothing
 */
export const setCharacterColor = (color: 1 | 2): number[] =>
  [GS, 0x28, 0x4E, 0x02, 0x00, 0x30, color];

export const setCharacterSmoothing = (enabled: boolean): number[] =>
  [GS, 0x28, 0x4E, 0x02, 0x00, 0x31, enabled ? 0x01 : 0x00];

// ============================================================================
// STATUS COMMANDS
// ============================================================================

/**
 * GS a n - Enable/disable Automatic Status Back (ASB)
 * n is a bitmask for status types to enable
 */
export const enableASB = (statusBits: number): number[] =>
  [GS, 0x61, statusBits];

export const disableASB = (): number[] => [GS, 0x61, 0x00];

/**
 * Printer ID types for GS I command
 */
export enum PrinterIDType {
  PRINTER_MODEL = 1,      // Printer model ID
  TYPE_ID = 2,            // Type ID
  ROM_VERSION = 65,       // ROM version ID
  FONT_TYPE = 66,         // Font type ID (Japanese)
  MANUFACTURER = 67       // Manufacturer ID
}

/**
 * GS I n - Transmit printer ID
 */
export const requestPrinterID = (type: PrinterIDType): number[] =>
  [GS, 0x49, type];

/**
 * Status types for GS r command
 */
export enum StatusType {
  PAPER_SENSOR = 1,        // Paper sensor status
  DRAWER_SENSOR = 2,       // Drawer kick-out connector status
  INK_SENSOR = 4,          // Ink status (for special models)
  PAPER_ROLL_SENSOR = 18   // Paper roll sensor status
}

/**
 * GS r n - Transmit status
 */
export const requestStatus = (type: StatusType): number[] =>
  [GS, 0x72, type];

// ============================================================================
// MARGINS & PRINT AREA
// ============================================================================

/**
 * GS L nL nH - Set left margin
 * Left margin = ((nH × 256) + nL) × (horizontal motion unit)
 */
export const setLeftMargin = (dots: number): number[] => {
  const nL = dots & 0xFF;
  const nH = (dots >> 8) & 0xFF;
  return [GS, 0x4C, nL, nH];
};

/**
 * GS W nL nH - Set printing area width
 * Width = ((nH × 256) + nL) × (horizontal motion unit)
 */
export const setPrintingAreaWidth = (dots: number): number[] => {
  const nL = dots & 0xFF;
  const nH = (dots >> 8) & 0xFF;
  return [GS, 0x57, nL, nH];
};

// ============================================================================
// MACRO FUNCTIONS
// ============================================================================

/**
 * GS : - Start/end macro definition
 * First call starts macro definition
 * Second call ends macro definition
 */
export const START_MACRO = [GS, 0x3A];
export const END_MACRO = [GS, 0x3A];

/**
 * GS ^ r t m - Execute macro
 * r: Number of times to execute macro (0-255)
 * t: Waiting time between executions (0-255, units of 100ms)
 * m: Macro execution mode (0 or 1)
 */
export const executeMacro = (repeatCount: number, waitTime: number, mode: 0 | 1): number[] =>
  [GS, 0x5E, Math.max(0, Math.min(255, repeatCount)), Math.max(0, Math.min(255, waitTime)), mode];

// ============================================================================
// MISCELLANEOUS
// ============================================================================

/**
 * ESC U n - Turn unidirectional printing mode on/off
 * n = 0 or 48: Turn off unidirectional printing
 * n = 1 or 49: Turn on unidirectional printing
 */
export const UNIDIRECTIONAL_ON = [ESC, 0x55, 0x01];
export const UNIDIRECTIONAL_OFF = [ESC, 0x55, 0x00];

/**
 * CAN - Cancel print data in page mode
 * Deletes all print data in the current printable area
 */
export const CANCEL = [CAN];

/**
 * ESC ( A pL pH n m r t - Execute test print
 * pL pH = 2 (fixed)
 * n = paper pattern (1-3)
 * m = mode (0-2)
 * r = number of times to repeat
 * t = interval time
 */
export const executeTestPrint = (pattern: number, mode: number, repeat: number): number[] =>
  [ESC, 0x28, 0x41, 0x02, 0x00, Math.max(1, Math.min(3, pattern)), Math.max(0, Math.min(2, mode)), repeat, 0x00];
