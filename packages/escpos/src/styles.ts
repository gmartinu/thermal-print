import { encodeCP860 } from "./encodings/cp860";
import { TextStyle, ViewStyle } from "@thermal-print/core";

/**
 * Extracts text style from a style object
 */
export function extractTextStyle(style: any): TextStyle {
  return {
    fontSize: style?.fontSize,
    fontWeight: style?.fontWeight,
    fontFamily: style?.fontFamily,
    textAlign: style?.textAlign || "left",
  };
}

/**
 * Extracts view/layout style from a style object
 */
export function extractViewStyle(style: any): ViewStyle {
  return {
    display: style?.display,
    flexDirection: style?.flexDirection || "column",
    justifyContent: style?.justifyContent,
    alignItems: style?.alignItems,
    padding: style?.padding,
    paddingTop: style?.paddingTop,
    paddingBottom: style?.paddingBottom,
    paddingLeft: style?.paddingLeft,
    paddingRight: style?.paddingRight,
    margin: style?.margin,
    marginTop: style?.marginTop,
    marginBottom: style?.marginBottom,
    marginLeft: style?.marginLeft,
    marginRight: style?.marginRight,
    borderBottom: style?.borderBottom,
    borderTop: style?.borderTop,
    width: style?.width,
  };
}

/**
 * Determines if text should be bold
 */
export function isBold(style: TextStyle): boolean {
  return (
    style.fontWeight === "bold" ||
    style.fontWeight === 700 ||
    style.fontWeight === "Helvetica-Bold" ||
    style.fontFamily === "Helvetica-Bold"
  );
}

/**
 * ESC/POS font size mapping result
 */
export interface ESCPOSFontSize {
  font: 0 | 1;      // 0 = Font A (12x24, 48 cols), 1 = Font B (9x17, 64 cols)
  width: number;     // Width multiplier (1-2)
  height: number;    // Height multiplier (1-2)
}

/**
 * Maps fontSize to ESC/POS font selection + character size multipliers
 *
 * Three visual levels using standard ESC/POS fonts:
 * - Condensada: Font B 1x1 (9x17, 64 cols) — fontSize <= 10
 * - Normal:     Font A 1x1 (12x24, 48 cols) — fontSize 11-19
 * - Expandida:  Font A 2x2 (12x24, 24 cols) — fontSize >= 20
 *
 * Note: ESC ! command only supports up to 2x2 character size.
 */
export function mapFontSizeToESCPOS(fontSize?: number | string): ESCPOSFontSize {
  // Default: Font A normal (48 cols)
  if (!fontSize) return { font: 0, width: 1, height: 1 };

  // Parse fontSize if it's a string (e.g., "8.28px")
  const size = typeof fontSize === "string" ? parseFloat(fontSize) : fontSize;

  if (isNaN(size)) return { font: 0, width: 1, height: 1 };

  // Condensada: Font B (64 cols) — fontSize <= 10
  if (size <= 10) return { font: 1, width: 1, height: 1 };

  // Normal: Font A (48 cols) — fontSize 11-19
  if (size <= 19) return { font: 0, width: 1, height: 1 };

  // Expandida: Font A 2x2 (24 cols) — fontSize >= 20
  return { font: 0, width: 2, height: 2 };
}

/**
 * Maps textAlign to ESC/POS alignment
 */
export function mapTextAlign(textAlign?: string): "left" | "center" | "right" {
  if (textAlign === "center") return "center";
  if (textAlign === "right") return "right";
  return "left";
}

/**
 * Calculates spacing (margin/padding) in lines
 * Approximates pixels to line feeds
 */
export function calculateSpacing(value?: number): number {
  if (!value) return 0;
  // Rough approximation: ~20 pixels = 1 line feed
  return Math.round(value / 20);
}

/**
 * Determines if a border is dashed
 */
export function isDashedBorder(border?: string): boolean {
  return border?.includes("dashed") ?? false;
}

/**
 * Generates a divider line based on border style
 */
export function generateDividerLine(width: number, dashed = false): string {
  const char = dashed ? "-" : "─";
  return char.repeat(width);
}

/**
 * Merges multiple style objects (handles spread syntax)
 */
export function mergeStyles(...styles: any[]): any {
  return Object.assign({}, ...styles.filter((s) => s));
}

/**
 * Parses width percentage to column width in characters
 * Uses Math.round() to minimize rounding errors
 */
export function parseWidth(
  width: string | number | undefined,
  totalWidth: number
): number {
  if (!width) return totalWidth;

  if (typeof width === "number") return width;

  if (typeof width === "string") {
    if (width.includes("%")) {
      const percentage = parseInt(width.replace("%", ""));
      return Math.round((percentage / 100) * totalWidth);
    }
  }

  return totalWidth;
}

/**
 * Aligns text within a column width (using CP860 byte length for accurate padding)
 */
export function alignTextInColumn(
  text: string,
  width: number,
  align: "left" | "center" | "right"
): string {
  // Get actual byte length when encoded to CP860
  let encodedLength = encodeCP860(text).length;
  let truncatedText = text;

  // Truncate if too long (character by character until it fits)
  while (encodedLength > width && truncatedText.length > 0) {
    truncatedText = truncatedText.substring(0, truncatedText.length - 1);
    encodedLength = encodeCP860(truncatedText).length;
  }

  // Calculate padding based on actual encoded byte length
  const padding = width - encodedLength;

  // Already fits perfectly
  if (padding === 0) {
    return truncatedText;
  }

  // Pad based on alignment
  if (align === "right") {
    return " ".repeat(padding) + truncatedText;
  } else if (align === "center") {
    const leftPad = Math.floor(padding / 2);
    const rightPad = padding - leftPad;
    return " ".repeat(leftPad) + truncatedText + " ".repeat(rightPad);
  } else {
    // left align
    return truncatedText + " ".repeat(padding);
  }
}

/**
 * Splits text into multiple lines if it exceeds width
 */
export function wrapText(text: string, width: number): string[] {
  if (text.length <= width) {
    return [text];
  }

  const lines: string[] = [];
  let currentLine = "";
  const words = text.split(" ");

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= width) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.length > 0 ? lines : [text.substring(0, width)];
}
