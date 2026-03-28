import { encodeCP860 } from "./encodings/cp860";
import { TextStyle, ViewStyle } from "@thermal-print/core";
import { FontSizeMapping } from "./command-adapters/types";

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
 * Maps fontSize to ESC/POS font selection and character size multipliers.
 *
 * 6-level font size mapping using ESC M (font select) + GS ! (size multiplier):
 *
 * | fontSize   | Font | GS ! byte | Multiplier | Effective cols (80mm) |
 * |------------|------|-----------|------------|-----------------------|
 * | ≤ 8        | B    | 0x00     | 1x1        | 64                    |
 * | 9-16       | A    | 0x00     | 1x1        | 48                    |
 * | 17-24      | A    | 0x10     | 2x1 (w2h1)| 24                    |
 * | 25-32      | A    | 0x11     | 2x2        | 24                    |
 * | 33-48      | A    | 0x22     | 3x3        | 16                    |
 * | 49+        | A    | 0x33     | 4x4        | 12                    |
 *
 * Note: Uses GS ! (1D 21 n) for size multipliers (supports up to 8x8).
 * Font selection uses ESC M (1B 4D n): 0=Font A, 1=Font B.
 * Bold uses ESC E (1B 45 n): separate from size command.
 *
 * @deprecated Use mapFontSize instead for full FontSizeMapping result.
 *             This function is kept for backward compatibility.
 */
export function mapFontSizeToESCPOS(fontSize?: number | string): {
  width: number;
  height: number;
} {
  const mapping = mapFontSize(fontSize);
  return { width: mapping.widthMultiplier, height: mapping.heightMultiplier };
}

/**
 * Maps fontSize to a full FontSizeMapping with font selection and multipliers.
 *
 * 6-level font size mapping:
 * - fontSize ≤ 8   → Font B (condensed, 64 cols) via ESC M 1
 * - fontSize 9-16  → Font A (normal, 48 cols) via ESC M 0
 * - fontSize 17-24 → Font A + GS ! 0x10 (width 2x, 24 cols)
 * - fontSize 25-32 → Font A + GS ! 0x11 (2x2, 24 cols)
 * - fontSize 33-48 → Font A + GS ! 0x22 (3x3, 16 cols)
 * - fontSize 49+   → Font A + GS ! 0x33 (4x4, 12 cols)
 */
export function mapFontSize(fontSize?: number | string): FontSizeMapping {
  // Default: Font A, 1x1 (normal)
  if (!fontSize) return { font: 'A', widthMultiplier: 1, heightMultiplier: 1, effectiveCols: 48 };

  // Parse fontSize if it's a string (e.g., "8.28px")
  const size = typeof fontSize === "string" ? parseFloat(fontSize) : fontSize;

  if (isNaN(size)) return { font: 'A', widthMultiplier: 1, heightMultiplier: 1, effectiveCols: 48 };

  // 6-level mapping
  if (size <= 8) {
    // Font B condensed (9x17 dots) → ~64 cols on 80mm paper
    return { font: 'B', widthMultiplier: 1, heightMultiplier: 1, effectiveCols: 64 };
  }
  if (size <= 16) {
    // Font A normal (12x24 dots) → 48 cols
    return { font: 'A', widthMultiplier: 1, heightMultiplier: 1, effectiveCols: 48 };
  }
  if (size <= 24) {
    // Font A + 2x width → 24 cols
    return { font: 'A', widthMultiplier: 2, heightMultiplier: 1, effectiveCols: 24 };
  }
  if (size <= 32) {
    // Font A + 2x2 → 24 cols
    return { font: 'A', widthMultiplier: 2, heightMultiplier: 2, effectiveCols: 24 };
  }
  if (size <= 48) {
    // Font A + 3x3 → 16 cols
    return { font: 'A', widthMultiplier: 3, heightMultiplier: 3, effectiveCols: 16 };
  }
  // 49+ → Font A + 4x4 → 12 cols
  return { font: 'A', widthMultiplier: 4, heightMultiplier: 4, effectiveCols: 12 };
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
