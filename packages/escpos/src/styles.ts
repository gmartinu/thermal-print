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
    height: style?.height,
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
  font: 0 | 1; // 0 = Font A (12x24), 1 = Font B (9x17)
  width: number; // Width multiplier (1-2)
  height: number; // Height multiplier (1-2)
}

/**
 * The three visual sizes an ESC ! command can reach on the printers we support.
 *
 * Level 0 — Font B 1x1: the condensed font.
 * Level 1 — Font A 1x1: the normal font.
 * Level 2 — Font A 2x2: the double-size font (ESC ! caps out at 2x2).
 *
 * The number of columns each level fits is NOT hardcoded here: it is derived
 * from the paperWidth the caller passes, which is already calibrated per
 * printer/paper (42 for Font A on 80mm, 56 for Font B on 80mm, 32 on 58mm).
 */
export type FontLevel = 0 | 1 | 2;

export const FONT_LEVEL_SIZES: Record<FontLevel, ESCPOSFontSize> = {
  0: { font: 1, width: 1, height: 1 },
  1: { font: 0, width: 1, height: 1 },
  2: { font: 0, width: 2, height: 2 },
};

/**
 * How many Font A 1x1 columns one character of each level occupies.
 * Font B fits 4/3 of the characters Font A does (56 vs 42 on the MP-4200 TH),
 * so one Font B character is 3/4 of a column.
 */
export const FONT_LEVEL_COLUMN_UNITS: Record<FontLevel, number> = {
  0: 0.75,
  1: 1,
  2: 2,
};

/** The level a document sits at before any per-element fontSize is applied. */
export function baseFontLevel(fontMode: "small" | "medium"): FontLevel {
  return fontMode === "small" ? 0 : 1;
}

/**
 * How many levels a fontSize moves relative to the document's base level.
 *
 * fontSize is RELATIVE, not absolute: the same `fontSize: 22` means "one step
 * bigger than this document's body text", so a receipt printed in `fontMode:
 * "small"` does not suddenly jump to double size.
 */
export function fontSizeLevelDelta(fontSize?: number | string): -1 | 0 | 1 {
  if (fontSize === undefined || fontSize === null || fontSize === "") return 0;

  const size = typeof fontSize === "string" ? parseFloat(fontSize) : fontSize;
  if (typeof size !== "number" || Number.isNaN(size)) return 0;

  if (size <= 10) return -1;
  if (size <= 19) return 0;
  return 1;
}

/** Clamps base level + fontSize delta into the three levels ESC ! can express. */
export function resolveFontLevel(baseLevel: FontLevel, fontSize?: number | string): FontLevel {
  const level = baseLevel + fontSizeLevelDelta(fontSize);
  return Math.max(0, Math.min(2, level)) as FontLevel;
}

/**
 * Maps fontSize to the ESC/POS font + character size multipliers of its level.
 *
 * @param fontSize - fontSize from the component style (relative to baseLevel)
 * @param baseLevel - the document's base level (see baseFontLevel)
 */
export function mapFontSizeToESCPOS(
  fontSize?: number | string,
  baseLevel: FontLevel = 1
): ESCPOSFontSize {
  return FONT_LEVEL_SIZES[resolveFontLevel(baseLevel, fontSize)];
}

/**
 * Characters that fit on one line at `level`, on a paper that fits
 * `baseColumns` characters at `baseLevel`.
 *
 * @param reservedColumns - columns taken by horizontal padding, in Font A units
 */
export function columnsForLevel(
  baseColumns: number,
  baseLevel: FontLevel,
  level: FontLevel,
  reservedColumns = 0
): number {
  const fontAColumns = baseColumns * FONT_LEVEL_COLUMN_UNITS[baseLevel] - reservedColumns;
  return Math.max(1, Math.floor(fontAColumns / FONT_LEVEL_COLUMN_UNITS[level]));
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
 * Points per printed line, and per character column.
 *
 * margin/padding/height arrive in POINTS, the same unit @react-pdf/renderer
 * and @thermal-print/pdf use — a 10pt body line is 12pt tall with the default
 * 1.2 line height, and an 80mm page is 226pt wide for 42 Font A columns.
 * Converting with those two constants is what makes a `marginTop: 12` produce
 * the same visual gap in the PDF preview and on the thermal printer.
 */
export const POINTS_PER_LINE = 12;
export const POINTS_PER_COLUMN = 226 / 42;

/** Parses a size that may arrive as a number or as "12px" / "12pt". */
export function parseSize(value?: number | string): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Converts a vertical spacing (margin/padding/height) in points to line feeds.
 * Capped at 6 lines so a stray `marginTop: 400` cannot eject a page of paper.
 */
export function calculateSpacing(value?: number | string): number {
  const points = parseSize(value);
  if (points <= 0) return 0;
  return Math.min(6, Math.round(points / POINTS_PER_LINE));
}

/** Converts a horizontal spacing (padding left/right) in points to columns. */
export function calculateHorizontalSpacing(value?: number | string): number {
  const points = parseSize(value);
  if (points <= 0) return 0;
  return Math.round(points / POINTS_PER_COLUMN);
}

/** Parses a percentage width ("30%") into a fraction (0.3). Returns undefined otherwise. */
export function parsePercentageWidth(width?: string | number): number | undefined {
  if (typeof width === "string" && width.includes("%")) {
    const percentage = parseFloat(width);
    if (!Number.isNaN(percentage)) return percentage / 100;
  }
  return undefined;
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
 * Splits the row width across its columns.
 *
 * Columns with an explicit width (fixed or percentage) take it; whatever is
 * left over is shared evenly by the columns that declared none. Before
 * DEV-2390 a column without a width got `parseWidth(undefined) === totalWidth`,
 * so a three-column row asked for three full paper widths and printed each
 * cell padded to the whole line.
 */
export function distributeColumnWidths(
  widths: (string | number | undefined)[],
  totalWidth: number
): number[] {
  const resolved: (number | undefined)[] = widths.map((width) =>
    width === undefined ? undefined : parseWidth(width, totalWidth)
  );

  const explicitTotal = resolved.reduce<number>((sum, width) => sum + (width ?? 0), 0);
  const autoColumns = resolved.filter((width) => width === undefined).length;

  if (autoColumns === 0) return resolved as number[];

  const remaining = Math.max(0, totalWidth - explicitTotal);
  const share = Math.floor(remaining / autoColumns);
  let leftover = remaining - share * autoColumns;

  return resolved.map((width) => {
    if (width !== undefined) return width;
    const extra = leftover > 0 ? 1 : 0;
    leftover -= extra;
    return share + extra;
  });
}

/**
 * Splits the free space of a space-between row across its gaps.
 * Every gap gets at least one space; the remainder goes to the leftmost gaps.
 */
export function distributeGaps(contentWidth: number, totalWidth: number, gapCount: number): number[] {
  if (gapCount <= 0) return [];

  const free = Math.max(gapCount, totalWidth - contentWidth);
  const share = Math.floor(free / gapCount);
  let leftover = free - share * gapCount;

  return Array.from({ length: gapCount }, () => {
    const extra = leftover > 0 ? 1 : 0;
    leftover -= extra;
    return share + extra;
  });
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
  if (width <= 0) return [text];
  if (text.length <= width) {
    return [text];
  }

  const lines: string[] = [];
  let currentLine = "";

  const pushCurrent = () => {
    if (currentLine) {
      lines.push(currentLine);
      currentLine = "";
    }
  };

  for (const word of text.split(" ")) {
    if ((currentLine + " " + word).trim().length <= width) {
      currentLine = (currentLine + " " + word).trim();
      continue;
    }

    pushCurrent();

    // A single word wider than the column has to be broken, otherwise the
    // printer wraps it wherever it likes and the column grid falls apart.
    let rest = word;
    while (rest.length > width) {
      lines.push(rest.slice(0, width));
      rest = rest.slice(width);
    }
    currentLine = rest;
  }

  pushCurrent();

  return lines.length > 0 ? lines : [text.substring(0, width)];
}
