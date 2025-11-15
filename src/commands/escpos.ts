/**
 * ESC/POS Command Constants
 *
 * Standard thermal printer command bytes for ESC/POS protocol.
 * These are the raw byte codes sent to thermal printers to control formatting.
 */

import { encodeCP860 } from "../encodings/cp860";

// Control characters
export const ESC = 0x1b; // Escape
export const GS = 0x1d; // Group Separator
export const LF = 0x0a; // Line Feed
export const CR = 0x0d; // Carriage Return
export const HT = 0x09; // Horizontal Tab
export const FF = 0x0c; // Form Feed

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

// Character size
// GS ! n - Set character size (width and height)
// n = (width-1) + (height-1) * 16
// Examples: 0x00=normal, 0x11=double, 0x22=triple, 0x33=quadruple
export const SIZE_NORMAL = [GS, 0x21, 0x00]; // 1x1
export const SIZE_DOUBLE = [GS, 0x21, 0x11]; // 2x2
export const SIZE_DOUBLE_WIDTH = [GS, 0x21, 0x10]; // 2x1
export const SIZE_DOUBLE_HEIGHT = [GS, 0x21, 0x01]; // 1x2

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
 * Text encoding helper
 * Converts string to CP860 byte array for Brazilian Portuguese thermal printers
 */
export const encodeText = (text: string): number[] => {
  // CP860 is the standard codepage for Portuguese thermal printers
  // Supports: ç Ç á é í ó ú à ã õ â ê ô and other Portuguese characters
  return encodeCP860(text);
};
