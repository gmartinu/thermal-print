/**
 * ESC/Bematech Command Set
 *
 * Command bytes for Bematech MP-4200 TH thermal printer using ESC/Bematech protocol.
 * Reference: Bematech MP-4200 TH Programmer's Manual - Revision 1.0, Chapter 3
 *
 * This file contains all documented ESC/Bematech commands organized by category.
 * Commands follow the Bematech-specific implementation which differs from standard ESC/POS.
 */

// ============================================================================
// CONTROL CHARACTERS
// ============================================================================

export const NUL = 0x00;   // Null
export const SOH = 0x01;   // Start of Heading
export const STX = 0x02;   // Start of Text - Clear buffer
export const ETX = 0x03;   // End of Text - End buffer
export const EOT = 0x04;   // End of Transmission
export const ENQ = 0x05;   // Enquiry - Printer status
export const ACK = 0x06;   // Acknowledge
export const BEL = 0x07;   // Bell
export const BS = 0x08;    // Backspace
export const HT = 0x09;    // Horizontal Tab
export const LF = 0x0a;    // Line Feed
export const FF = 0x0c;    // Form Feed
export const CR = 0x0d;    // Carriage Return
export const SO = 0x0e;    // Shift Out - Enable on-line expanded mode
export const SI = 0x0f;    // Shift In - Enable condensed mode
export const DC2 = 0x12;   // Device Control 2 - Disable condensed mode
export const DC4 = 0x14;   // Device Control 4 - Disable on-line expanded print
export const NAK = 0x15;   // Negative Acknowledge
export const SYN = 0x16;   // Synchronous Idle
export const ETB = 0x17;   // End of Transmission Block
export const CAN = 0x18;   // Cancel - Cancel last line
export const ESC = 0x1b;   // Escape
export const FS = 0x1c;    // File Separator
export const GS = 0x1d;    // Group Separator
export const DEL = 0x7f;   // Delete - Cancel last character

// ============================================================================
// INITIALIZATION & CONFIGURATION
// ============================================================================

/**
 * ESC @ - Initialize printer to default settings
 * Hexadecimal: 1B 40
 * Decimal: 27 64
 *
 * Cancels all printer settings including character font, line spacing,
 * margins, and returns printer to initial state.
 */
export const INIT = [ESC, 0x40];

// ============================================================================
// MODE SELECTION
// ============================================================================

/**
 * GS F9h 5 n - Select printer operating mode (permanent)
 * Saves to non-volatile memory
 * n = 0 or 48: ESC/Bema mode
 * n = 1 or 49: ESC/POS mode
 */
export const selectESCBemaMode = (): number[] => [GS, 0xF9, 0x35, 0x00];
export const selectESCPOSMode = (): number[] => [GS, 0xF9, 0x35, 0x01];

/**
 * GS F9h SP n - Select printer operating mode temporarily
 * Does NOT save to memory
 * n = 0 or 48: ESC/Bema mode
 * n = 1 or 49: ESC/POS mode
 */
export const selectESCBemaModeTemp = (): number[] => [GS, 0xF9, 0x20, 0x00];
export const selectESCPOSModeTemp = (): number[] => [GS, 0xF9, 0x20, 0x01];

/**
 * GS F9h 1Fh 1 - Return to previously set mode
 * Hexadecimal: 1D F9 1F 31
 */
export const returnToPreviousMode = (): number[] => [GS, 0xF9, 0x1F, 0x31];

/**
 * GS F9h C 00h - Get printer current command set
 * Returns: 0 = ESC/Bema, 1 = ESC/POS
 */
export const GET_CURRENT_MODE = [GS, 0xF9, 0x43, 0x00];

// ============================================================================
// CODE PAGES & CHARACTER ENCODING
// ============================================================================

/**
 * Code page identifiers
 */
export enum CodePage {
  CP850 = 2,      // CODEPAGE 850 (default)
  CP437 = 3,      // CODEPAGE 437
  CP860 = 4,      // CODEPAGE 860 (Portuguese)
  CP858 = 5,      // CODEPAGE 858
  CP866 = 6,      // CODEPAGE 866
  CP864 = 7,      // CODEPAGE 864
  UTF8 = 8,       // UTF8 (Unicode)
  BIG5E = 9,      // Big-5E
  JIS = 10,       // JIS (0Ah)
  SHIFT_JIS = 11, // SHIFT JIS (0Bh)
  GB2312 = 12,    // GB2312 (0Ch)
  EUC_CN = 14,    // EUC-CN (0Eh)
  CP862 = 21      // CODEPAGE 862 (15h)
}

/**
 * ESC t n - Select code page
 * Hexadecimal: 1B 74 n
 * Default: CP850
 */
export const setCodePage = (codePage: CodePage): number[] => [ESC, 0x74, codePage];

/**
 * GS F9h 7 n - Set and save printer default code page
 * Saves to non-volatile memory
 */
export const setDefaultCodePage = (codePage: CodePage): number[] => [GS, 0xF9, 0x37, codePage];

/**
 * GS F9h 8 n - Set and save ESC/POS ideogram mode
 * n = 0: UTF8 (Unicode)
 * n = 1: ESC/POS Japanese
 * n = 2: ESC/POS Simplified Chinese
 * n = 3: ESC/POS Traditional Chinese
 */
export const setIdeogramMode = (mode: 0 | 1 | 2 | 3): number[] => [GS, 0xF9, 0x38, mode];

/**
 * ESC R n - Select international character set
 * n = 0: CODEPAGE 437
 * n = 1-11: CODEPAGE 858
 * n = 12: CODEPAGE 850 (default)
 */
export const setInternationalCharset = (n: number): number[] => {
  if (n < 0 || n > 12) n = 12;
  return [ESC, 0x52, n];
};

/**
 * ESC Z - Print supported Unicode sets
 * Prints a chart showing all supported Unicode character sets
 */
export const PRINT_UNICODE_SETS = [ESC, 0x5A];

/**
 * ESC [ n - Print specific Unicode set
 * Range: 0 ≤ n ≤ 255
 */
export const printUnicodeSet = (n: number): number[] => [ESC, 0x5B, Math.max(0, Math.min(255, n))];

// ============================================================================
// PAPER CONFIGURATION
// ============================================================================

/**
 * Paper width presets (ESC/Bema mode only)
 * Format: [paper width in mm, printing width in mm]
 */
export enum PaperWidth {
  WIDTH_58_48 = 0x00,   // 58mm paper, 48mm print width
  WIDTH_76_72 = 0x01,   // 76mm paper, 72mm print width
  WIDTH_80_72 = 0x02,   // 80mm paper, 72mm print width
  WIDTH_80_76 = 0x03,   // 80mm paper, 76mm print width (default)
  WIDTH_82_72 = 0x04,   // 82.5mm paper, 72mm print width
  WIDTH_82_76 = 0x05,   // 82.5mm paper, 76mm print width
  WIDTH_82_80 = 0x06    // 82.5mm paper, 80mm print width
}

/**
 * GS F9h ! n - Set and save paper width
 * Only effective in ESC/Bema mode
 * In ESC/POS mode, paper width is always 80mm/73.5mm
 */
export const setPaperWidth = (width: PaperWidth): number[] => [GS, 0xF9, 0x21, width];

/**
 * GS F9h , n - Enable/disable paper near-end sensor (PNES)
 * n = 0 or 48: Disable PNES
 * n = 1 or 49: Enable PNES (default)
 * Saves to non-volatile memory
 */
export const enablePaperNearEndSensor = (): number[] => [GS, 0xF9, 0x2C, 0x01];
export const disablePaperNearEndSensor = (): number[] => [GS, 0xF9, 0x2C, 0x00];

/**
 * ESC b n - Select paper sensor to output paper-end signal
 * n = 0 or 48: PE reflects paper sensor (default)
 * n = 1 or 49: PE reflects drawer sensor
 */
export const selectPaperSensor = (): number[] => [ESC, 0x62, 0x00];
export const selectDrawerSensor = (): number[] => [ESC, 0x62, 0x01];

// ============================================================================
// PRINTER QUALITY & MODE
// ============================================================================

/**
 * Printer quality modes
 */
export enum PrinterMode {
  NORMAL = 0x00,       // Normal mode (default)
  HIGH_QUALITY = 0x01, // High quality mode
  HIGH_SPEED = 0x02    // High speed mode
}

/**
 * GS F9h - n - Set and save printer mode
 * Sets printing priority to high quality or high speed
 */
export const setPrinterMode = (mode: PrinterMode): number[] => [GS, 0xF9, 0x2D, mode];

/**
 * ESC N n - Select printing intensity (OBSOLETE)
 * Kept for compatibility with earlier Bematech products
 * Command is ignored by MP-4200 TH
 */
export const setPrintingIntensity = (n: number): number[] => [ESC, 0x4E, Math.max(0, Math.min(4, n))];

/**
 * GS F9h + n - Set and save printing intensity (OBSOLETE)
 * Kept for compatibility with earlier Bematech products
 * Command is ignored by MP-4200 TH
 */
export const setPrintingIntensityAlt = (n: number): number[] => [GS, 0xF9, 0x2B, n];

// ============================================================================
// PRINTER LANGUAGE
// ============================================================================

/**
 * GS FAh n - Set and save printer language
 * n = 0 or 48: English
 * n = 1 or 49: Portuguese
 * n = 2 or 50: Spanish
 * n = 3 or 51: German
 */
export enum PrinterLanguage {
  ENGLISH = 0,
  PORTUGUESE = 1,
  SPANISH = 2,
  GERMAN = 3
}

export const setPrinterLanguage = (lang: PrinterLanguage): number[] => [GS, 0xFA, lang];

// ============================================================================
// PRINTER INFORMATION & CONFIGURATION
// ============================================================================

/**
 * GS F9h ' n - Get printer information
 * Returns different information based on n value:
 * n = 0 or 48: Product code (10 bytes)
 * n = 1 or 49: Serial number (20 bytes)
 * n = 2 or 50: Manufacturing date (4 bytes)
 * n = 3 or 51: Firmware version (3 bytes)
 * n = 5 or 53: Manufacturing timestamp (17 bytes, "dd/mm/yy hh:mm:ss")
 * n = 8 or 56: Interface type (1 byte: 0=None, 1=Serial DB-9, 2=Serial DB-25, 3=Ethernet, -1=Unknown)
 */
export const getPrinterInfo = (infoType: 0 | 1 | 2 | 3 | 5 | 8): number[] => [GS, 0xF9, 0x27, infoType];

/**
 * GS F9h ( 0 - Load default user configuration
 * Reloads all configurations from non-volatile memory and dipswitches
 */
export const LOAD_DEFAULT_CONFIG = [GS, 0xF9, 0x28, 0x30];

/**
 * GS F9h ) 0 - Print user configuration
 * Prints current user configuration on paper
 */
export const PRINT_CONFIG = [GS, 0xF9, 0x29, 0x30];

/**
 * GS F8h F - Printer reset
 * Forces a hardware reset
 */
export const RESET_PRINTER = [GS, 0xF8, 0x46];

// ============================================================================
// PANEL CONTROL
// ============================================================================

/**
 * ESC y n - Enable/disable panel keys
 * n = 0 or 48: Disable panel keys
 * n = 1 or 49: Enable panel keys (default)
 */
export const enablePanelKeys = (): number[] => [ESC, 0x79, 0x01];
export const disablePanelKeys = (): number[] => [ESC, 0x79, 0x00];

/**
 * ESC x - Enable dump mode
 * Prints data in hexadecimal for debugging
 * WARNING: Only way to exit dump mode is to turn off printer
 */
export const ENABLE_DUMP_MODE = [ESC, 0x78];

// ============================================================================
// DRAWER CONTROL
// ============================================================================

/**
 * ESC v n - Activate drawer #1 for n milliseconds
 * Range: 50 ≤ n ≤ 250 (actual: 50ms ≤ n ≤ 200ms)
 */
export const activateDrawer1 = (milliseconds: number): number[] => {
  const n = Math.max(50, Math.min(250, milliseconds));
  return [ESC, 0x76, n];
};

/**
 * ESC 80h n - Activate drawer #2 for n milliseconds
 * Range: 50 ≤ n ≤ 250 (actual: 50ms ≤ n ≤ 200ms)
 */
export const activateDrawer2 = (milliseconds: number): number[] => {
  const n = Math.max(50, Math.min(250, milliseconds));
  return [ESC, 0x80, n];
};

// ============================================================================
// PAPER CUTTING
// ============================================================================

/**
 * ESC i - Perform full paper cut
 * Hexadecimal: 1B 69
 */
export const CUT_FULL = [ESC, 0x69];

/**
 * ESC w - Perform full paper cut (alternate command)
 * Hexadecimal: 1B 77
 */
export const CUT_FULL_ALT = [ESC, 0x77];

/**
 * GS F9h D m n - Activate buzzer on cut
 * m: Buzzer selection (0=none, 1=internal, 2=external)
 * n: Activation time (n × 100ms)
 * Default: m=0, n=200
 */
export const setBuzzerOnCut = (buzzer: 0 | 1 | 2, time: number): number[] => {
  const n = Math.max(0, Math.min(255, time));
  return [GS, 0xF9, 0x44, buzzer, n];
};

export const disableBuzzerOnCut = (): number[] => [GS, 0xF9, 0x44, 0x00, 0x00];

// ============================================================================
// BUZZER CONTROL
// ============================================================================

/**
 * ESC ( A pL pH fn n1 n2 vol - Activate/deactivate buzzer
 * pL + pH × 256 = 4 (always: pL=4, pH=0)
 * fn = 1 or 49: Activate buzzer
 * fn = 0 or 48: Deactivate buzzer (deprecated)
 * n = (n1 + n2 × 256): Time in milliseconds
 * vol = 0, 1, 48, or 49: Volume (unused)
 */
export const activateBuzzer = (milliseconds: number): number[] => {
  const n1 = milliseconds & 0xFF;
  const n2 = (milliseconds >> 8) & 0xFF;
  return [ESC, 0x28, 0x41, 0x04, 0x00, 0x01, n1, n2, 0x00];
};

// ============================================================================
// PAPER FEEDING
// ============================================================================

/**
 * LF - Feed one line
 * Prints buffer contents and feeds one line according to default line spacing
 */
export const FEED_LINE = [LF];

/**
 * FF - Feed one page
 * Moves from current position to top of next page
 * Can be disabled by setting page size to zero
 */
export const FEED_PAGE = [FF];

/**
 * ESC J n - Perform fine line feed
 * Range: 48 ≤ n ≤ 255
 * Feed: (n - 48) × 0.125mm
 * Widely used for graphics printing
 */
export const fineFeed = (n: number): number[] => {
  const value = Math.max(48, Math.min(255, n));
  return [ESC, 0x4A, value];
};

/**
 * ESC A n - Feed paper by [n × 0.375]mm
 * Range: 0 ≤ n ≤ 255
 * Notes: n < 17 → 0mm, n > 85 → 32mm, else n × 0.375mm
 */
export const feedPaper = (n: number): number[] => {
  const value = Math.max(0, Math.min(255, n));
  return [ESC, 0x41, value];
};

/**
 * ESC 2 - Set text line height to 1/6 inches (default)
 * Hexadecimal: 1B 32
 */
export const SET_LINE_HEIGHT_DEFAULT = [ESC, 0x32];

/**
 * ESC 3 n - Set line feed to n/144 inches
 * Range: 18 ≤ n ≤ 255
 * Takes effect immediately
 */
export const setLineSpacing = (n: number): number[] => {
  const value = Math.max(18, Math.min(255, n));
  return [ESC, 0x33, value];
};

/**
 * ESC f 1 n - Vertical skipping
 * Range: 0 ≤ n ≤ 255
 * Performs vertical skipping of n characters
 * Alternate: 1B 66 01 n (same effect)
 */
export const verticalSkip = (n: number): number[] => {
  const value = Math.max(0, Math.min(255, n));
  return [ESC, 0x66, 0x31, value];
};

/**
 * ESC f 0 n - Horizontal skipping
 * Range: 0 ≤ n ≤ 255
 * Performs horizontal skipping of n characters
 * Alternate: 1B 66 00 n (same effect)
 */
export const horizontalSkip = (n: number): number[] => {
  const value = Math.max(0, Math.min(255, n));
  return [ESC, 0x66, 0x30, value];
};

// ============================================================================
// PAGE CONFIGURATION
// ============================================================================

/**
 * ESC C n - Set page size in lines
 * Range: 0 < n < 256
 * Default: n = 12
 * n represents number of single-height lines
 */
export const setPageSizeLines = (lines: number): number[] => {
  const n = Math.max(1, Math.min(255, lines));
  return [ESC, 0x43, n];
};

/**
 * ESC c n1 n2 - Set page size in millimeters
 * Range: 0 ≤ n1 ≤ 255, 0 ≤ n2 ≤ 255
 * Page size = 0.125mm × [n1 + (256 × n2)]
 */
export const setPageSizeMM = (n1: number, n2: number): number[] => {
  const v1 = Math.max(0, Math.min(255, n1));
  const v2 = Math.max(0, Math.min(255, n2));
  return [ESC, 0x63, v1, v2];
};

// ============================================================================
// AUTOMATIC LINE FEED
// ============================================================================

/**
 * ESC z n - Enable/disable automatic line feed
 * n = 0 or 48: Disable (default)
 * n = 1 or 49: Enable
 * When enabled, printer performs LF after receiving CR
 */
export const enableAutoLineFeed = (): number[] => [ESC, 0x7A, 0x01];
export const disableAutoLineFeed = (): number[] => [ESC, 0x7A, 0x00];

// ============================================================================
// MARGINS & TABS
// ============================================================================

/**
 * ESC Q n - Set right margin
 * Range: 0 ≤ n ≤ 255
 * Sets right margin in number of characters from default left margin
 * New margin becomes valid only on next line if on right side of current position
 */
export const setRightMargin = (chars: number): number[] => {
  const n = Math.max(0, Math.min(255, chars));
  return [ESC, 0x51, n];
};

/**
 * ESC l n - Set left margin
 * Range: 0 ≤ n ≤ 255
 * Sets left margin in number of characters from default left margin
 * New margin becomes valid only on next line if on left side of current position
 */
export const setLeftMargin = (chars: number): number[] => {
  const n = Math.max(0, Math.min(255, chars));
  return [ESC, 0x6C, n];
};

/**
 * HT - Horizontal tab
 * Moves print position to next tab mark
 * Default: tabs at every 8 character columns (9, 17, 25, ...)
 */
export const TAB = [HT];

/**
 * ESC D n1 ... nk NUL - Set horizontal tab marks
 * Range: 1 ≤ n ≤ 255, 0 ≤ k ≤ 32
 * Default: intervals of 8 characters for font 12x24
 *
 * Example: setTabPositions([8, 16, 24]) sets tabs at columns 9, 17, 25
 * Must be in ascending order and terminated with NUL
 */
export const setTabPositions = (positions: number[]): number[] => {
  const validPositions = positions
    .filter(p => p >= 1 && p <= 255)
    .slice(0, 32)
    .sort((a, b) => a - b);

  return [ESC, 0x44, ...validPositions, NUL];
};

/**
 * ESC D NUL - Cancel all horizontal tab marks
 */
export const CLEAR_TABS = [ESC, 0x44, NUL];

// ============================================================================
// TEXT ALIGNMENT
// ============================================================================

/**
 * ESC a n - Character alignment
 * n = 0 or 48: Left justified (default)
 * n = 1 or 49: Center justified
 * n = 2 or 50: Right justified
 */
export const ALIGN_LEFT = [ESC, 0x61, 0x00];
export const ALIGN_CENTER = [ESC, 0x61, 0x01];
export const ALIGN_RIGHT = [ESC, 0x61, 0x02];

// ============================================================================
// TEXT FORMATTING - BOLD/EMPHASIZED
// ============================================================================

/**
 * ESC E - Enable emphasized print mode (bold)
 * Hexadecimal: 1B 45
 * Emphasized mode is bolder than normal print
 */
export const BOLD_ON = [ESC, 0x45];

/**
 * ESC F - Disable emphasized print mode (bold)
 * Hexadecimal: 1B 46
 */
export const BOLD_OFF = [ESC, 0x46];

// ============================================================================
// TEXT FORMATTING - UNDERLINE
// ============================================================================

/**
 * ESC - n - Enable/disable underline print mode
 * n = 0 or 48: Disable (default)
 * n = 1 or 49: Enable
 * Underlines every character and space
 */
export const UNDERLINE_ON = [ESC, 0x2D, 0x01];
export const UNDERLINE_OFF = [ESC, 0x2D, 0x00];

// ============================================================================
// TEXT FORMATTING - ITALIC
// ============================================================================

/**
 * ESC 4 - Enable italic print mode
 * Hexadecimal: 1B 34
 * Available in all other print modes
 */
export const ITALIC_ON = [ESC, 0x34];

/**
 * ESC 5 - Disable italic print mode
 * Hexadecimal: 1B 35
 */
export const ITALIC_OFF = [ESC, 0x35];

// ============================================================================
// TEXT FORMATTING - UPSIDE DOWN
// ============================================================================

/**
 * ESC } n - Turn upside-down printing mode on/off
 * n = 0 or 48: Disable (default)
 * n = 1 or 49: Enable
 */
export const UPSIDE_DOWN_ON = [ESC, 0x7D, 0x01];
export const UPSIDE_DOWN_OFF = [ESC, 0x7D, 0x00];

// ============================================================================
// TEXT FORMATTING - SUPERSCRIPT/SUBSCRIPT
// ============================================================================

/**
 * ESC S n - Enable superscript or subscript print mode
 * n = 0 or 48: Superscript (print on upper side of line)
 * n = 1 or 49: Subscript (print on bottom side of line)
 */
export const SUPERSCRIPT_ON = [ESC, 0x53, 0x00];
export const SUBSCRIPT_ON = [ESC, 0x53, 0x01];

/**
 * ESC T - Disable superscript and subscript print modes
 * Hexadecimal: 1B 54
 */
export const SCRIPT_OFF = [ESC, 0x54];

// ============================================================================
// TEXT FORMATTING - COMBINED MODE (ESC !)
// ============================================================================

/**
 * ESC ! n - Select print mode (combined control)
 * Bits:
 *   0-2: Undefined
 *   3: Emphasized (0=clear, 1=set)
 *   4: Double height (0=clear, 1=set)
 *   5: Double width (0=clear, 1=set)
 *   6: Undefined
 *   7: Underline (0=clear, 1=set)
 */
export const calculatePrintMode = (options: {
  emphasized?: boolean;
  doubleHeight?: boolean;
  doubleWidth?: boolean;
  underline?: boolean;
}): number[] => {
  let n = 0;
  if (options.emphasized) n |= 0x08;     // Bit 3
  if (options.doubleHeight) n |= 0x10;   // Bit 4
  if (options.doubleWidth) n |= 0x20;    // Bit 5
  if (options.underline) n |= 0x80;      // Bit 7
  return [ESC, 0x21, n];
};

// ============================================================================
// CHARACTER SIZING - DOUBLE HEIGHT
// ============================================================================

/**
 * ESC d n - Enable/disable double height print mode
 * n = 0 or 48: Disable (default)
 * n = 1 or 49: Enable
 *
 * IMPORTANT: This is different from ESC/POS where ESC d is used for line feed
 */
export const DOUBLE_HEIGHT_ON = [ESC, 0x64, 0x01];
export const DOUBLE_HEIGHT_OFF = [ESC, 0x64, 0x00];

/**
 * ESC V - Enable on-line double height mode
 * If received at beginning of line: valid for whole line
 * Otherwise: valid only for next incoming characters
 * Returns to normal mode on next line
 */
export const DOUBLE_HEIGHT_ONLINE = [ESC, 0x56];

// ============================================================================
// CHARACTER SIZING - DOUBLE WIDTH (EXPANDED)
// ============================================================================

/**
 * ESC W n - Enable/disable expanded mode (double width)
 * n = 0 or 48: Disable (default)
 * n = 1 or 49: Enable
 * Takes effect immediately
 */
export const DOUBLE_WIDTH_ON = [ESC, 0x57, 0x01];
export const DOUBLE_WIDTH_OFF = [ESC, 0x57, 0x00];

/**
 * ESC SO - Enable on-line expanded mode
 * Hexadecimal: 1B 0E
 * If received at beginning of line: valid for whole line
 * Otherwise: valid only for next incoming characters
 * Returns to normal mode on next line
 */
export const EXPANDED_ONLINE = [ESC, SO];

/**
 * SO - Enable on-line expanded mode (alternate)
 * Hexadecimal: 0E
 * Same as ESC SO
 */
export const EXPANDED_ONLINE_ALT = [SO];

/**
 * DC4 - Disable on-line expanded print
 * Hexadecimal: 14
 * Disables expanded mode if previously set by ESC SO or SO
 */
export const EXPANDED_OFF = [DC4];

// ============================================================================
// CHARACTER SIZING - CONDENSED
// ============================================================================

/**
 * ESC SI - Enable condensed mode
 * Hexadecimal: 1B 0F
 */
export const CONDENSED_ON = [ESC, SI];

/**
 * SI - Enable condensed mode (alternate)
 * Hexadecimal: 0F
 * Same as ESC SI
 */
export const CONDENSED_ON_ALT = [SI];

/**
 * ESC H - Disable condensed mode
 * Hexadecimal: 1B 48
 * Same as DC2 or ESC P
 */
export const CONDENSED_OFF = [ESC, 0x48];

/**
 * ESC P - Disable condensed mode (alternate)
 * Hexadecimal: 1B 50
 * Same as DC2 or ESC H
 */
export const CONDENSED_OFF_ALT = [ESC, 0x50];

/**
 * DC2 - Disable condensed mode (alternate)
 * Hexadecimal: 12
 * Same as ESC H or ESC P
 */
export const CONDENSED_OFF_DC2 = [DC2];

// ============================================================================
// GRAPHICS - BIT IMAGES
// ============================================================================

/**
 * ESC $ n1 n2 - Fill in blank bit columns
 * Fills blank bit columns from current column to column (n1 + n2 × 256)
 * Must be ≤ printing width N
 */
export const fillBlankColumns = (columns: number): number[] => {
  const n1 = columns & 0xFF;
  const n2 = (columns >> 8) & 0xFF;
  return [ESC, 0x24, n1, n2];
};

/**
 * ESC * ! n1 n2 b1 ... bn - 24-bit graphics
 * Hexadecimal: 1B 2A 21 n1 n2 b1 ... bn
 * Downloads 24-bit image with (n1 + n2 × 256) columns
 * Each column = 3 bytes (24 bits height)
 * Total bytes needed = columns × 3
 */
export const print24BitGraphics = (columns: number, data: number[]): number[] => {
  const n1 = columns & 0xFF;
  const n2 = (columns >> 8) & 0xFF;
  return [ESC, 0x2A, 0x21, n1, n2, ...data];
};

/**
 * ESC K n1 n2 b1 ... bn - 8-bit graphics
 * Hexadecimal: 1B 4B n1 n2 b1 ... bn
 * Select "8 pin" bit image (compatible with dot-matrix printers)
 * Columns = n1 + (n2 × 256), each column = 1 byte
 * Low resolution (expanded to 3 bytes internally)
 */
export const print8BitGraphics = (columns: number, data: number[]): number[] => {
  const n1 = columns & 0xFF;
  const n2 = (columns >> 8) & 0xFF;
  return [ESC, 0x4B, n1, n2, ...data];
};

// ============================================================================
// GRAPHICS - RASTER BITMAP
// ============================================================================

/**
 * Raster bitmap print modes
 */
export enum RasterMode {
  NORMAL = 0,          // 203 dpi × 203 dpi
  DOUBLE_WIDTH = 1,    // 203 dpi × 101 dpi
  DOUBLE_HEIGHT = 2,   // 101 dpi × 203 dpi
  QUADRUPLE = 3        // 101 dpi × 101 dpi
}

/**
 * GS v 0 m xL xH yL yH d1 ... dk - Print raster bitmap
 * m: Mode (0-3 or 48-51)
 * xL, xH: Horizontal bytes = xL + xH × 256
 * yL, yH: Vertical bytes = yL + yH × 256
 * k = (xL + xH × 256) × (yL + yH × 256)
 *
 * Data outside printing area is discarded
 * Affected by HT, ESC $, ESC \, GS L, and ESC a
 */
export const printRasterBitmap = (
  mode: RasterMode,
  width: number,
  height: number,
  data: number[]
): number[] => {
  const xL = width & 0xFF;
  const xH = (width >> 8) & 0xFF;
  const yL = height & 0xFF;
  const yH = (height >> 8) & 0xFF;
  return [GS, 0x76, 0x30, mode, xL, xH, yL, yH, ...data];
};

// ============================================================================
// GRAPHICS - DOWNLOADED BIT IMAGE
// ============================================================================

/**
 * GS * x y d1 ... d(x×y×8) - Define downloaded bit image
 * Range: 1 ≤ x ≤ 255, 1 ≤ y ≤ 64
 * Horizontal dots: x × 8
 * Vertical dots: y × 8
 *
 * Cleared by: ESC @, FS q, printer restart, or power cycle
 */
export const defineDownloadedBitImage = (x: number, y: number, data: number[]): number[] => {
  const xVal = Math.max(1, Math.min(255, x));
  const yVal = Math.max(1, Math.min(64, y));
  return [GS, 0x2A, xVal, yVal, ...data];
};

/**
 * GS / m - Print downloaded bit image
 * m: Mode (0-3 or 48-51) - same as RasterMode
 * No effect if downloaded image not defined
 */
export const printDownloadedBitImage = (mode: RasterMode): number[] => [GS, 0x2F, mode];

// ============================================================================
// GRAPHICS - NON-VOLATILE (NV) BIT IMAGE
// ============================================================================

/**
 * FS q n [xL xH yL yH d1 ... dn]1 ... [xL xH yL yH d1 ... dn]n
 * Define NV bit images (stored in non-volatile memory)
 *
 * n: Number of NV bit images (1 ≤ n ≤ 255)
 * xL, xH: Horizontal = (xL + xH × 256) × 8 dots (max 1023 × 8)
 * yL, yH: Vertical = (yL + yH × 256) × 8 dots (max 288 × 8)
 *
 * Erases all previously defined NV images
 */
export const defineNVBitImage = (images: Array<{ width: number; height: number; data: number[] }>): number[] => {
  const result: number[] = [FS, 0x71, images.length];

  for (const img of images) {
    const xL = img.width & 0xFF;
    const xH = (img.width >> 8) & 0xFF;
    const yL = img.height & 0xFF;
    const yH = (img.height >> 8) & 0xFF;
    result.push(xL, xH, yL, yH, ...img.data);
  }

  return result;
};

/**
 * FS p n m - Print non-volatile (NV) bit image
 * n: NV bit image number (as defined by FS q)
 * m: Mode (0-3 or 48-51) - same as RasterMode
 * No effect if n-th NV image not defined
 */
export const printNVBitImage = (imageNumber: number, mode: RasterMode): number[] =>
  [FS, 0x70, imageNumber, mode];

// ============================================================================
// BARCODES - CONFIGURATION
// ============================================================================

/**
 * GS h n - Set barcode height
 * Range: 1 ≤ n ≤ 255
 * Default: n = 162
 * Height = n × 0.125mm
 */
export const setBarcodeHeight = (n: number): number[] => {
  const height = Math.max(1, Math.min(255, n));
  return [GS, 0x68, height];
};

/**
 * GS w n - Set barcode width
 * Range: 2 ≤ n ≤ 4
 * Default: n = 3
 * n = 2: Normal width
 * n = 3: Double width
 * n = 4: Quadruple width
 */
export const setBarcodeWidth = (width: 2 | 3 | 4): number[] => [GS, 0x77, width];

/**
 * Human Readable Information (HRI) position
 */
export enum BarcodeHRIPosition {
  NONE = 0,        // No HRI
  TOP = 1,         // HRI on top of barcode (default)
  BOTTOM = 2,      // HRI on bottom of barcode
  BOTH = 3         // HRI on both top and bottom
}

/**
 * GS H n - Choose HRI position in barcode
 * Range: 0 ≤ n ≤ 3
 * Default: n = 1 (top)
 */
export const setBarcodeHRI = (position: BarcodeHRIPosition): number[] => [GS, 0x48, position];

/**
 * GS f n - Set HRI font
 * n = 0 or 48: Normal font (default)
 * n = 1 or 49: Condensed font
 */
export const setBarcodeHRIFont = (condensed: boolean): number[] =>
  [GS, 0x66, condensed ? 0x01 : 0x00];

/**
 * GS k 84h n1 n2 - Program barcode left margin
 * Margin position = n1 + n2 × 256
 */
export const setBarcodeLeftMargin = (position: number): number[] => {
  const n1 = position & 0xFF;
  const n2 = (position >> 8) & 0xFF;
  return [GS, 0x6B, 0x84, n1, n2];
};

// ============================================================================
// BARCODES - UPC-A
// ============================================================================

/**
 * GS k NUL d1 ... d11 NUL - Print UPC-A barcode
 * Range: 48 ≤ dn ≤ 57 (ASCII digits '0'-'9')
 * Requires exactly 11 digits, checksum generated automatically
 */
export const printBarcodeUPCA = (data: string): number[] => {
  if (data.length !== 11 || !/^\d{11}$/.test(data)) {
    throw new Error('UPC-A requires exactly 11 digits');
  }
  const bytes = data.split('').map(c => c.charCodeAt(0));
  return [GS, 0x6B, NUL, ...bytes, NUL];
};

/**
 * GS k A VT d1 ... d11 - Print UPC-A barcode (alternate)
 * Same as GS k NUL variant
 */
export const printBarcodeUPCAAlt = (data: string): number[] => {
  if (data.length !== 11 || !/^\d{11}$/.test(data)) {
    throw new Error('UPC-A requires exactly 11 digits');
  }
  const bytes = data.split('').map(c => c.charCodeAt(0));
  return [GS, 0x6B, 0x41, 0x0B, ...bytes];
};

// ============================================================================
// BARCODES - UPC-E
// ============================================================================

/**
 * GS k SOH d1 ... d6 NUL - Print UPC-E barcode
 * Range: 48 ≤ dn ≤ 57 (ASCII digits '0'-'9')
 * Requires exactly 6 digits, checksum generated automatically
 */
export const printBarcodeUPCE = (data: string): number[] => {
  if (data.length !== 6 || !/^\d{6}$/.test(data)) {
    throw new Error('UPC-E requires exactly 6 digits');
  }
  const bytes = data.split('').map(c => c.charCodeAt(0));
  return [GS, 0x6B, SOH, ...bytes, NUL];
};

/**
 * GS k B ACK d1 ... d6 - Print UPC-E barcode (alternate)
 */
export const printBarcodeUPCEAlt = (data: string): number[] => {
  if (data.length !== 6 || !/^\d{6}$/.test(data)) {
    throw new Error('UPC-E requires exactly 6 digits');
  }
  const bytes = data.split('').map(c => c.charCodeAt(0));
  return [GS, 0x6B, 0x42, 0x06, ...bytes];
};

// ============================================================================
// BARCODES - EAN-13
// ============================================================================

/**
 * GS k STX d1 ... d12 NUL - Print EAN-13 barcode
 * Range: 48 ≤ dn ≤ 57 (ASCII digits '0'-'9')
 * Requires exactly 12 digits, 13th digit generated automatically
 */
export const printBarcodeEAN13 = (data: string): number[] => {
  if (data.length !== 12 || !/^\d{12}$/.test(data)) {
    throw new Error('EAN-13 requires exactly 12 digits');
  }
  const bytes = data.split('').map(c => c.charCodeAt(0));
  return [GS, 0x6B, STX, ...bytes, NUL];
};

/**
 * GS k C FF d1 ... d12 - Print EAN-13 barcode (alternate)
 */
export const printBarcodeEAN13Alt = (data: string): number[] => {
  if (data.length !== 12 || !/^\d{12}$/.test(data)) {
    throw new Error('EAN-13 requires exactly 12 digits');
  }
  const bytes = data.split('').map(c => c.charCodeAt(0));
  return [GS, 0x6B, 0x43, 0x0C, ...bytes];
};

// ============================================================================
// BARCODES - EAN-8
// ============================================================================

/**
 * GS k ETX d1 ... d7 NUL - Print EAN-8 barcode
 * Range: 48 ≤ dn ≤ 57 (ASCII digits '0'-'9')
 * Requires exactly 7 digits, 8th digit generated automatically
 */
export const printBarcodeEAN8 = (data: string): number[] => {
  if (data.length !== 7 || !/^\d{7}$/.test(data)) {
    throw new Error('EAN-8 requires exactly 7 digits');
  }
  const bytes = data.split('').map(c => c.charCodeAt(0));
  return [GS, 0x6B, ETX, ...bytes, NUL];
};

/**
 * GS k D BEL d1 ... d7 - Print EAN-8 barcode (alternate)
 */
export const printBarcodeEAN8Alt = (data: string): number[] => {
  if (data.length !== 7 || !/^\d{7}$/.test(data)) {
    throw new Error('EAN-8 requires exactly 7 digits');
  }
  const bytes = data.split('').map(c => c.charCodeAt(0));
  return [GS, 0x6B, 0x44, 0x07, ...bytes];
};

// ============================================================================
// BARCODES - CODE 39
// ============================================================================

/**
 * GS k EOT d1 ... dn NUL - Print CODE 39 barcode
 * Valid characters: 32 (space), 36 ($), 37 (%), 42 (*), 43 (+), 45-57 (-, ., /, 0-9), 65-90 (A-Z)
 * Checksum generated automatically
 * Length limited by physical print width and barcode width setting
 */
export const printBarcodeCODE39 = (data: string): number[] => {
  if (!/^[ $%*+\-./0-9A-Z]+$/.test(data)) {
    throw new Error('CODE 39 supports: space, $%*+-./, 0-9, A-Z');
  }
  const bytes = data.split('').map(c => c.charCodeAt(0));
  return [GS, 0x6B, EOT, ...bytes, NUL];
};

/**
 * GS k E n d1 ... dn - Print CODE 39 barcode (alternate)
 */
export const printBarcodeCODE39Alt = (data: string): number[] => {
  if (!/^[ $%*+\-./0-9A-Z]+$/.test(data)) {
    throw new Error('CODE 39 supports: space, $%*+-./, 0-9, A-Z');
  }
  const bytes = data.split('').map(c => c.charCodeAt(0));
  return [GS, 0x6B, 0x45, bytes.length, ...bytes];
};

// ============================================================================
// BARCODES - ITF (Interleaved 2 of 5)
// ============================================================================

/**
 * GS k ENQ d1 ... dn NUL - Print ITF barcode
 * Range: 48 ≤ dn ≤ 57 (ASCII digits '0'-'9')
 * Length limited by physical print width and barcode width setting
 */
export const printBarcodeITF = (data: string): number[] => {
  if (!/^\d+$/.test(data)) {
    throw new Error('ITF requires only digits 0-9');
  }
  const bytes = data.split('').map(c => c.charCodeAt(0));
  return [GS, 0x6B, ENQ, ...bytes, NUL];
};

/**
 * GS k F n d1 ... dn - Print ITF barcode (alternate)
 */
export const printBarcodeITFAlt = (data: string): number[] => {
  if (!/^\d+$/.test(data)) {
    throw new Error('ITF requires only digits 0-9');
  }
  const bytes = data.split('').map(c => c.charCodeAt(0));
  return [GS, 0x6B, 0x46, bytes.length, ...bytes];
};

// ============================================================================
// BARCODES - CODABAR
// ============================================================================

/**
 * GS k ACK d1 ... dn NUL - Print CODABAR barcode
 * Valid: 36 ($), 43 (+), 45-57 (-, ., /, 0-9), 65-68 (A-D uppercase), 97-100 (a-d lowercase)
 * Cannot mix uppercase and lowercase letters
 * If d1 is letter, dn must also be letter
 */
export const printBarcodeCODABAR = (data: string): number[] => {
  if (!/^[$+\-./0-9A-D]+$/.test(data) && !/^[$+\-./0-9a-d]+$/.test(data)) {
    throw new Error('CODABAR supports: $+-./, 0-9, A-D (or a-d, not mixed)');
  }
  const bytes = data.split('').map(c => c.charCodeAt(0));
  return [GS, 0x6B, ACK, ...bytes, NUL];
};

/**
 * GS k G n d1 ... dn - Print CODABAR barcode (alternate)
 */
export const printBarcodeCODABARAlt = (data: string): number[] => {
  if (!/^[$+\-./0-9A-D]+$/.test(data) && !/^[$+\-./0-9a-d]+$/.test(data)) {
    throw new Error('CODABAR supports: $+-./, 0-9, A-D (or a-d, not mixed)');
  }
  const bytes = data.split('').map(c => c.charCodeAt(0));
  return [GS, 0x6B, 0x47, bytes.length, ...bytes];
};

// ============================================================================
// BARCODES - CODE 93
// ============================================================================

/**
 * GS k H n d1 ... dn - Print CODE 93 barcode
 * Range: 0 ≤ dn ≤ 127 (all ASCII characters)
 * Checksum generated automatically
 */
export const printBarcodeCODE93 = (data: string): number[] => {
  const bytes = data.split('').map(c => c.charCodeAt(0));
  if (bytes.some(b => b > 127)) {
    throw new Error('CODE 93 supports ASCII 0-127');
  }
  return [GS, 0x6B, 0x48, bytes.length, ...bytes];
};

// ============================================================================
// BARCODES - CODE 128
// ============================================================================

/**
 * GS k I n d1 ... dn - Print CODE 128 barcode
 * Range: 0 ≤ dn ≤ 127 (all ASCII characters)
 * Checksum generated automatically
 */
export const printBarcodeCODE128 = (data: string): number[] => {
  const bytes = data.split('').map(c => c.charCodeAt(0));
  if (bytes.some(b => b > 127)) {
    throw new Error('CODE 128 supports ASCII 0-127');
  }
  return [GS, 0x6B, 0x49, bytes.length, ...bytes];
};

// ============================================================================
// BARCODES - PDF-417
// ============================================================================

/**
 * GS k 80h n1 n2 n3 n4 n5 n6 d1 ... dn - Print PDF-417 barcode
 * n1: ECC level (0-8)
 * n2: Pitch height (n2 × 0.125mm)
 * n3: Pitch width (n3 × 0.125mm, range 1-4)
 * n4: Codewords per row (0 = max for pitch width)
 * n5, n6: Byte count (n5 + n6 × 256, must be < 900)
 */
export const printBarcodePDF417 = (
  eccLevel: number,
  pitchHeight: number,
  pitchWidth: number,
  codewordsPerRow: number,
  data: string
): number[] => {
  const bytes = data.split('').map(c => c.charCodeAt(0));
  const totalBytes = bytes.length;

  if (totalBytes >= 900) {
    throw new Error('PDF-417 data must be less than 900 bytes');
  }

  const n1 = Math.max(0, Math.min(8, eccLevel));
  const n2 = Math.max(1, Math.min(8, pitchHeight));
  const n3 = Math.max(1, Math.min(4, pitchWidth));
  const n4 = Math.max(0, Math.min(255, codewordsPerRow));
  const n5 = totalBytes & 0xFF;
  const n6 = (totalBytes >> 8) & 0xFF;

  return [GS, 0x6B, 0x80, n1, n2, n3, n4, n5, n6, ...bytes];
};

// ============================================================================
// BARCODES - ISBN
// ============================================================================

/**
 * GS k NAK d1 ... d9 NUL - Print ISBN barcode
 * Format: X-XXXXX-XXX-X [XXXXX] (hyphens optional in data)
 * Last char before space: 'X' (88) or digit
 * After hyphen+X/digit: optional space + 5 more digits
 */
export const printBarcodeISBN = (data: string): number[] => {
  // Remove hyphens for validation
  const clean = data.replace(/-/g, '');
  if (!/^[\dX][\d ]+$/.test(clean)) {
    throw new Error('ISBN format: digits, optional X, optional space + 5 digits');
  }
  const bytes = data.split('').map(c => c.charCodeAt(0));
  return [GS, 0x6B, NAK, ...bytes, NUL];
};

// ============================================================================
// BARCODES - MSI
// ============================================================================

/**
 * GS k SYN d1 ... dn NUL - Print MSI barcode
 * Range: 48 ≤ dn ≤ 57 (ASCII digits '0'-'9')
 * Checksum generated automatically
 */
export const printBarcodeMSI = (data: string): number[] => {
  if (!/^\d+$/.test(data)) {
    throw new Error('MSI requires only digits 0-9');
  }
  const bytes = data.split('').map(c => c.charCodeAt(0));
  return [GS, 0x6B, SYN, ...bytes, NUL];
};

/**
 * GS k 82h n d1 ... dn - Print MSI barcode (alternate)
 */
export const printBarcodeMSIAlt = (data: string): number[] => {
  if (!/^\d+$/.test(data)) {
    throw new Error('MSI requires only digits 0-9');
  }
  const bytes = data.split('').map(c => c.charCodeAt(0));
  return [GS, 0x6B, 0x82, bytes.length, ...bytes];
};

// ============================================================================
// BARCODES - PLESSEY
// ============================================================================

/**
 * GS k ETB d1 ... dn NUL - Print PLESSEY barcode
 * Valid: 48-57 (0-9), 65-70 (A-F uppercase), 97-102 (a-f lowercase)
 * Cannot mix uppercase and lowercase letters
 * Checksum generated automatically
 */
export const printBarcodePLESSEY = (data: string): number[] => {
  if (!/^[0-9A-F]+$/.test(data) && !/^[0-9a-f]+$/.test(data)) {
    throw new Error('PLESSEY supports: 0-9, A-F (or a-f, not mixed)');
  }
  const bytes = data.split('').map(c => c.charCodeAt(0));
  return [GS, 0x6B, ETB, ...bytes, NUL];
};

/**
 * GS k 83h n d1 ... dn - Print PLESSEY barcode (alternate)
 */
export const printBarcodePLESSEYAlt = (data: string): number[] => {
  if (!/^[0-9A-F]+$/.test(data) && !/^[0-9a-f]+$/.test(data)) {
    throw new Error('PLESSEY supports: 0-9, A-F (or a-f, not mixed)');
  }
  const bytes = data.split('').map(c => c.charCodeAt(0));
  return [GS, 0x6B, 0x83, bytes.length, ...bytes];
};

// ============================================================================
// STATUS QUERIES
// ============================================================================

/**
 * ENQ - Printer status enquiry
 * Returns 1 byte with status bits:
 *   Bit 0: 0=offline, 1=online
 *   Bit 1: 0=paper present, 1=paper out
 *   Bit 2: Drawer/paper status (depends on ESC b setting)
 *   Bit 3: 0=print head raised, 1=print head down
 *   Bit 4: 0=paper full, 1=paper near end
 *   Bit 5: 0=command not executed, 1=command executed
 *   Bits 6-7: Unused (always 0)
 */
export const STATUS_ENQUIRY = [ENQ];

/**
 * GS F8h 1 - Printer extended status enquiry
 * Returns 5 status bytes with detailed printer information
 */
export const EXTENDED_STATUS = [GS, 0xF8, 0x31];

// ============================================================================
// BUFFER CONTROL
// ============================================================================

/**
 * STX - Clear buffer
 * Clears print buffer without restoring default printer conditions
 */
export const CLEAR_BUFFER = [STX];

/**
 * ETX - End buffer
 * Printer remains in BUSY state until print buffer becomes empty
 * DTR (RTS) remains deactivated while printing on serial interfaces
 */
export const END_BUFFER = [ETX];

/**
 * CAN - Cancel last line
 * Clears last line sent to printer
 * No action if data already dispatched to print head
 */
export const CANCEL_LINE = [CAN];

/**
 * DEL - Cancel last character
 * Clears last character sent to printer
 * No action if already dispatched to print head
 */
export const CANCEL_CHAR = [DEL];

// ============================================================================
// NETWORK CONFIGURATION - IP ADDRESS
// ============================================================================

/**
 * GS F7h BS NUL " i1 i2 i3 i4 s1 s2 s3 s4 - Set IP address and subnet mask
 * i1-i4: IP address octets
 * s1-s4: Subnet mask octets
 *
 * Example: IP 10.10.1.2, Mask 255.255.0.0
 * Command: 1D F7 08 00 22 0A 0A 01 02 FF FF 00 00
 *
 * Valid only for ethernet or wi-fi interface
 */
export const setIPAddress = (ip: [number, number, number, number], subnet: [number, number, number, number]): number[] => {
  return [GS, 0xF7, 0x08, 0x00, 0x22, ...ip, ...subnet];
};

/**
 * GS F7h EOT NUL ' g1 g2 g3 g4 - Set default gateway IP address
 * g1-g4: Gateway IP address octets
 * Default: 0.0.0.0
 *
 * Example: Gateway 192.168.1.2
 * Command: 1D F7 04 00 27 C0 A8 01 02
 */
export const setGateway = (gateway: [number, number, number, number]): number[] => {
  return [GS, 0xF7, 0x04, 0x00, 0x27, ...gateway];
};

// ============================================================================
// NETWORK CONFIGURATION - DHCP
// ============================================================================

/**
 * GS F9h E n - Set DHCP usage
 * LSB of n: 0 = DHCP disabled (default), 1 = DHCP enabled
 * Saves to non-volatile memory
 * Valid only for ethernet or wi-fi interface
 */
export const enableDHCP = (): number[] => [GS, 0xF9, 0x45, 0x01];
export const disableDHCP = (): number[] => [GS, 0xF9, 0x45, 0x00];

// ============================================================================
// NETWORK CONFIGURATION - SNMP
// ============================================================================

/**
 * GS F9h S m ip1 ip2 ip3 ip4 n c1 ... cn - Set SNMP settings
 * m: 0 = disabled, non-zero = enabled
 * ip1-ip4: SNMP trap IP address
 * n: Community name length (0-64)
 * c1-cn: Community name bytes
 *
 * Valid only for ethernet or wi-fi interface
 */
export const setSNMP = (enabled: boolean, ip: [number, number, number, number], community: string): number[] => {
  const communityBytes = community.split('').map(c => c.charCodeAt(0)).slice(0, 64);
  return [GS, 0xF9, 0x53, enabled ? 0x01 : 0x00, ...ip, communityBytes.length, ...communityBytes];
};

// ============================================================================
// NETWORK CONFIGURATION - WI-FI
// ============================================================================

/**
 * GS F9h W a s c m n e1...em p1...pn - Set Wi-Fi settings
 * a: Access mode (0=Access Point, 1=Ad-hoc)
 * s: Security mode (0=None, 1=WEP 64-bit, 2=WEP 128-bit, 3=WPA-TKIP, 4=WPA2-AES)
 * c: Channel (0-13, use 0 when a=0)
 * m: ESSID size (0-32)
 * n: Passphrase size (0-63)
 * e1-em: ESSID bytes
 * p1-pn: Passphrase bytes
 *
 * Valid only for wi-fi interface
 */
export const setWiFi = (
  accessMode: 0 | 1,
  securityMode: 0 | 1 | 2 | 3 | 4,
  channel: number,
  essid: string,
  passphrase: string
): number[] => {
  const essidBytes = essid.split('').map(c => c.charCodeAt(0)).slice(0, 32);
  const passphraseBytes = passphrase.split('').map(c => c.charCodeAt(0)).slice(0, 63);
  const c = Math.max(0, Math.min(13, channel));

  return [
    GS, 0xF9, 0x57,
    accessMode,
    securityMode,
    c,
    essidBytes.length,
    passphraseBytes.length,
    ...essidBytes,
    ...passphraseBytes
  ];
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert string to code page bytes
 * Uses CP860 encoding by default (Portuguese)
 */
export const encodeText = (text: string, codePage: CodePage = CodePage.CP860): number[] => {
  // Basic ASCII conversion - full implementation would require proper code page mapping
  return text.split('').map(c => {
    const code = c.charCodeAt(0);
    return code <= 127 ? code : 0x3F; // Replace non-ASCII with '?'
  });
};

/**
 * Validate barcode data
 */
export const validateBarcodeData = (data: string, type: 'numeric' | 'alphanumeric' | 'all'): boolean => {
  switch (type) {
    case 'numeric':
      return /^\d+$/.test(data);
    case 'alphanumeric':
      return /^[A-Z0-9\-. $%+/]+$/.test(data);
    case 'all':
      return data.split('').every(c => c.charCodeAt(0) <= 127);
    default:
      return false;
  }
};
