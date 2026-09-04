/**
 * @thermal-print/escpos
 *
 * ESC/POS command generation and thermal printer control
 *
 * Main API: printNodesToESCPOS(printNode, options) -> Buffer
 */

// Main conversion function
export { printNodesToESCPOS } from './converter';
export type { PrintNodeToESCPOSOptions, FontMode, StyleMode } from './converter';

// Core classes (for advanced usage)
export { ESCPOSGenerator } from './generator';
export { TreeTraverser } from './traverser';

// Command adapters
export type { CommandAdapter, CharacterSize } from './command-adapters/types';
export { ESCPOSCommandAdapter } from './command-adapters/escpos-adapter';
export { ESCBematechCommandAdapter } from './command-adapters/escbematech-adapter';

// Style utilities
export {
  extractTextStyle,
  extractViewStyle,
  isBold,
  baseFontLevel,
  fontSizeLevelDelta,
  resolveFontLevel,
  mapFontSizeToESCPOS,
  columnsForLevel,
  FONT_LEVEL_SIZES,
  FONT_LEVEL_COLUMN_UNITS,
  POINTS_PER_LINE,
  POINTS_PER_COLUMN,
  mapTextAlign,
  parseSize,
  parsePercentageWidth,
  calculateSpacing,
  calculateHorizontalSpacing,
  isDashedBorder,
  generateDividerLine,
  mergeStyles,
  parseWidth,
  distributeColumnWidths,
  distributeGaps,
  alignTextInColumn,
  wrapText,
} from './styles';
export type { ESCPOSFontSize, FontLevel } from './styles';

// Encodings
export { encodeCP860 } from './encodings/cp860';

// Types
export type * from './types';
