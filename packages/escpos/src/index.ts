/**
 * @thermal-print/escpos
 *
 * ESC/POS command generation and thermal printer control
 *
 * Main API: printNodesToESCPOS(printNode, options) -> Buffer
 */

// Main conversion function
export { printNodesToESCPOS } from './converter';
export type { PrintNodeToESCPOSOptions } from './converter';

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
  mapFontSizeToESCPOS,
  mapTextAlign,
  calculateSpacing,
  isDashedBorder,
  generateDividerLine,
  mergeStyles,
  parseWidth,
  alignTextInColumn,
  wrapText,
} from './styles';

// Encodings
export { encodeCP860 } from './encodings/cp860';

// Types
export type * from './types';
