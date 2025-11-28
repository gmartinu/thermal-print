/**
 * Core type definitions for thermal printer libraries
 */

/**
 * Universal intermediate representation (IR) for thermal printing.
 * This is the core data structure that bridges renderers (React, Vue, etc.)
 * and printer formats (ESC/POS, Star, ZPL, etc.)
 */
export interface PrintNode {
  type: string; // 'document', 'page', 'view', 'text', 'image', 'textnode'
  props: any;
  children: PrintNode[];
  style?: any;
}

/**
 * @deprecated Use PrintNode instead. Will be removed in v1.0
 */
export type ElementNode = PrintNode;

/**
 * Standard element types that can be converted to printer commands.
 * All adapters must normalize their component types to these standard types.
 */
export const StandardElementType = {
  DOCUMENT: 'document',
  PAGE: 'page',
  VIEW: 'view',
  TEXT: 'text',
  IMAGE: 'image',
  TEXTNODE: 'textnode',
} as const;

export type StandardElementType = typeof StandardElementType[keyof typeof StandardElementType];

/**
 * Text styling properties that map to printer commands
 *
 * @see docs/STYLING.md for complete reference
 */
export interface TextStyle {
  /**
   * Font size in pixels (maps to 4 discrete ESC/POS sizes)
   *
   * Size mapping (ESC ! command):
   * - 8-12px → 1x1 (normal)
   * - 13-18px → 1x2 (normal width, double height)
   * - 19-24px → 2x1 (double width, normal height)
   * - 25+px → 2x2 (double width, double height - MAX)
   *
   * @example fontSize: 16 // → 1x2 size
   */
  fontSize?: number;

  /**
   * Font weight for bold emphasis
   *
   * Recognized as bold:
   * - 'bold'
   * - 700 or higher
   *
   * @example fontWeight: 'bold'
   * @example fontWeight: 700
   */
  fontWeight?: string | number;

  /**
   * Font family (only used for bold detection)
   *
   * Note: Thermal printers cannot change fonts.
   * Only 'Helvetica-Bold' is recognized for bold detection.
   *
   * @example fontFamily: 'Helvetica-Bold' // Treated as bold
   */
  fontFamily?: string;

  /**
   * Text alignment (ESC a n command)
   *
   * Maps to:
   * - 'left' → ESC a 0
   * - 'center' → ESC a 1
   * - 'right' → ESC a 2
   *
   * Note: Sets global printer alignment for the line.
   *
   * @example textAlign: 'center'
   */
  textAlign?: 'left' | 'center' | 'right';

  /**
   * Left padding (HTML/PDF ONLY)
   *
   * ⚠️ ESC/POS: Completely ignored.
   * ✅ HTML/PDF: Applied as CSS padding-left.
   *
   * Use this when generating PDFs to add horizontal spacing.
   *
   * @example paddingLeft: 10 // 10px left padding in PDF
   */
  paddingLeft?: number;

  /**
   * Right padding (HTML/PDF ONLY)
   *
   * ⚠️ ESC/POS: Completely ignored.
   * ✅ HTML/PDF: Applied as CSS padding-right.
   *
   * Use this when generating PDFs to add horizontal spacing.
   *
   * @example paddingRight: 10 // 10px right padding in PDF
   */
  paddingRight?: number;
}

/**
 * View/Layout styling properties for container elements
 *
 * Note: Many CSS properties are unsupported due to thermal printer constraints.
 * Only top/bottom spacing works (no left/right margins possible).
 *
 * @see docs/STYLING.md for complete reference
 */
export interface ViewStyle {
  /**
   * Display type (extracted but NOT used)
   *
   * ⚠️ WARNING: This property has no effect on rendering.
   *
   * @deprecated Property is extracted but not implemented
   */
  display?: string;

  /**
   * Flex direction for layout mode
   *
   * - 'column' (default): Stacks children vertically
   * - 'row': Side-by-side columns
   *
   * @example flexDirection: 'row' // Table layout
   */
  flexDirection?: 'row' | 'column';

  /**
   * Main axis justification (row layouts only)
   *
   * Supported values:
   * - 'space-between': Two-column layout with maximized gap (requires 2 children, no explicit widths)
   * - 'center': Centers entire row on paper (no explicit widths)
   *
   * Unsupported values:
   * - 'flex-start': Default behavior (no special handling)
   * - 'flex-end': NOT IMPLEMENTED
   * - 'space-around': NOT IMPLEMENTED
   * - 'space-evenly': NOT IMPLEMENTED
   *
   * @example justifyContent: 'space-between' // Payment summary layout
   * @example justifyContent: 'center' // Centered button row
   */
  justifyContent?: string;

  /**
   * Cross axis alignment (limited support)
   *
   * ⚠️ WARNING: Only used as text alignment fallback, NOT for vertical positioning.
   *
   * Behavior:
   * - 'center' → Sets text alignment to center (if textAlign not specified)
   * - 'flex-end' → Sets text alignment to right (if textAlign not specified)
   *
   * Does NOT control:
   * - Vertical centering (no concept in thermal printing)
   * - Row-level horizontal alignment (use justifyContent instead)
   *
   * @example alignItems: 'center' // Fallback text centering only
   */
  alignItems?: string;

  /**
   * Padding (shorthand for top/bottom only)
   *
   * Conversion: ~20 pixels = 1 line feed
   *
   * ⚠️ WARNING: Only affects top and bottom padding.
   * Left/right padding is NOT supported on thermal printers.
   *
   * @example padding: 20 // ~1 line feed top and bottom
   */
  padding?: number;

  /**
   * Top padding (converted to line feeds)
   *
   * Conversion: ~20 pixels = 1 line feed
   *
   * @example paddingTop: 40 // ~2 line feeds before content
   */
  paddingTop?: number;

  /**
   * Bottom padding (converted to line feeds)
   *
   * Conversion: ~20 pixels = 1 line feed
   *
   * @example paddingBottom: 20 // ~1 line feed after content
   */
  paddingBottom?: number;

  /**
   * Left padding (HTML/PDF ONLY)
   *
   * ⚠️ ESC/POS: Completely ignored.
   * ✅ HTML/PDF: Applied as CSS padding-left.
   *
   * Use this when generating PDFs to add horizontal spacing.
   *
   * @example paddingLeft: 10 // 10px left padding in PDF
   */
  paddingLeft?: number;

  /**
   * Right padding (HTML/PDF ONLY)
   *
   * ⚠️ ESC/POS: Completely ignored.
   * ✅ HTML/PDF: Applied as CSS padding-right.
   *
   * Use this when generating PDFs to add horizontal spacing.
   *
   * @example paddingRight: 10 // 10px right padding in PDF
   */
  paddingRight?: number;

  /**
   * Margin (shorthand for top/bottom only)
   *
   * Conversion: ~20 pixels = 1 line feed
   *
   * ⚠️ WARNING: Only affects top and bottom margin.
   * Left/right margin is NOT supported on thermal printers.
   *
   * @example margin: 20 // ~1 line feed top and bottom
   */
  margin?: number;

  /**
   * Top margin (converted to line feeds)
   *
   * Conversion: ~20 pixels = 1 line feed
   *
   * @example marginTop: 40 // ~2 line feeds before content
   */
  marginTop?: number;

  /**
   * Bottom margin (converted to line feeds)
   *
   * Conversion: ~20 pixels = 1 line feed
   *
   * @example marginBottom: 20 // ~1 line feed after content
   */
  marginBottom?: number;

  /**
   * Left margin (NOT SUPPORTED)
   *
   * ⚠️ WARNING: Extracted but completely ignored.
   * Thermal printers cannot apply horizontal margins.
   *
   * @deprecated Property is extracted but not implemented
   */
  marginLeft?: number;

  /**
   * Right margin (NOT SUPPORTED)
   *
   * ⚠️ WARNING: Extracted but completely ignored.
   * Thermal printers cannot apply horizontal margins.
   *
   * @deprecated Property is extracted but not implemented
   */
  marginRight?: number;

  /**
   * Bottom border (generates divider line)
   *
   * Styles:
   * - Contains "dashed": Renders with '-' characters
   * - Any other value: Renders with '─' characters (solid line)
   *
   * Note: Always renders full-width across entire paper.
   * Border width/color are ignored (monochrome thermal printers).
   *
   * @example borderBottom: '1px solid black' // Solid divider
   * @example borderBottom: '1px dashed gray' // Dashed divider
   */
  borderBottom?: string;

  /**
   * Top border (generates divider line)
   *
   * Styles:
   * - Contains "dashed": Renders with '-' characters
   * - Any other value: Renders with '─' characters (solid line)
   *
   * Note: Always renders full-width across entire paper.
   * Border width/color are ignored (monochrome thermal printers).
   *
   * @example borderTop: '1px solid black' // Solid divider
   * @example borderTop: '2px dashed black' // Dashed divider
   */
  borderTop?: string;

  /**
   * Column width (row layouts only)
   *
   * Formats:
   * - Percentage string: '50%' → 50% of paper width
   * - Number: Absolute character count
   * - undefined: Auto-calculated (equal distribution)
   *
   * Note: Only used when flexDirection: 'row'
   *
   * @example width: '30%' // 30% of paper width
   * @example width: 20 // Fixed 20 characters
   */
  width?: string | number;

  /**
   * Fixed height (HTML/PDF ONLY)
   *
   * ⚠️ ESC/POS: Completely ignored. Thermal printers expand vertically to fit content.
   * ✅ HTML/PDF: Applied as CSS height or min-height.
   *
   * Formats:
   * - String with unit: '100px', '50mm', '2in'
   * - Number: Treated as pixels
   *
   * Use this when generating PDFs to enforce specific heights.
   *
   * @example height: '100px' // 100px height in PDF
   * @example height: 100 // 100px height in PDF
   */
  height?: string | number;
}
