import { encodeText } from "./commands/escpos";
import {
  baseFontLevel,
  calculateSpacing,
  columnsForLevel,
  extractTextStyle,
  extractViewStyle,
  FONT_LEVEL_COLUMN_UNITS,
  FONT_LEVEL_SIZES,
  FontLevel,
  generateDividerLine,
  isBold,
  isDashedBorder,
  mapTextAlign,
  resolveFontLevel,
  wrapText,
} from "./styles";
import type { FontMode, StyleMode } from "./converter";
import { ConversionContext } from "./types";
import { CommandAdapter, ESCPOSCommandAdapter } from "./command-adapters";

/**
 * Simple buffer implementation for accumulating ESC/POS commands
 */
class ESCPOSBuffer {
  private buffer: number[] = [];

  /**
   * Add raw bytes to buffer
   */
  push(...bytes: number[]): void {
    this.buffer.push(...bytes);
  }

  /**
   * Add array of bytes to buffer
   */
  pushArray(bytes: number[]): void {
    this.buffer.push(...bytes);
  }

  /**
   * Get the buffer as a Node.js Buffer
   */
  toBuffer(): Buffer {
    return Buffer.from(this.buffer);
  }

  /**
   * Get buffer size
   */
  get size(): number {
    return this.buffer.length;
  }

  /**
   * Get the last byte in the buffer
   */
  lastByte(): number | undefined {
    return this.buffer.length > 0 ? this.buffer[this.buffer.length - 1] : undefined;
  }
}

/**
 * ESC/POS Command Generator
 * Manages the buffer and context for generating ESC/POS commands
 * Pure JavaScript implementation - no Node.js dependencies
 */
export class ESCPOSGenerator {
  private buffer: ESCPOSBuffer;
  private context: ConversionContext;
  private commandAdapter: CommandAdapter;
  private compact: boolean;
  private styleMode: StyleMode;

  /** Font level the document sits at when no fontSize asks for anything else. */
  private baseLevel: FontLevel;
  /** Font level currently loaded in the printer. */
  private currentLevel: FontLevel;
  /** Horizontal padding in force, in Font A columns, as a stack of View frames. */
  private paddingStack: { left: number; right: number }[] = [];
  private reservedLeft = 0;
  private reservedRight = 0;
  /** Whether the next addText() starts a new printed line (so it gets the indent). */
  private atLineStart = true;

  constructor(
    paperWidth = 42,
    encoding = "cp860",
    debug = false,
    commandAdapter?: CommandAdapter,
    fontMode: FontMode = "medium",
    compact = false,
    styleMode: StyleMode = "legacy"
  ) {
    this.compact = compact;
    this.styleMode = styleMode;
    this.buffer = new ESCPOSBuffer();

    // Use provided adapter or default to ESC/POS
    this.commandAdapter = commandAdapter || new ESCPOSCommandAdapter();

    this.baseLevel = baseFontLevel(fontMode);
    this.currentLevel = this.baseLevel;

    // Which ESC/POS font the document starts in. In "rico" it always follows
    // fontMode; in "legacy" an adapter may pin its historical font so the
    // printers already in the field keep receiving the same bytes
    // (ESC/Bematech hardcoded Font B before DEV-2390).
    const fontFromMode = FONT_LEVEL_SIZES[this.baseLevel].font;
    const baseFont =
      styleMode === "rico"
        ? fontFromMode
        : this.commandAdapter.getLegacyDefaultFont?.() ?? fontFromMode;

    this.context = {
      paperWidth,
      basePaperWidth: paperWidth,
      currentAlign: "left",
      currentSize: { width: 1, height: 1 },
      currentFont: baseFont,
      currentBold: false,
      encoding,
      debug,
      buffer: [],
    };

    // Initialize printer using command adapter
    this.buffer.pushArray(this.commandAdapter.getInitCommand());
  }

  /**
   * Initialize printer
   * Sets up the printer with default settings and comfortable line spacing
   */
  initialize(): void {
    // Line spacing:
    // - compact=true: 5 dots (tightest practical spacing)
    // - compact=false: default spacing (ESC 2)
    const lineSpacing = this.compact ? 1 : undefined;
    this.setLineSpacing(lineSpacing);

    // Apply initial print mode
    this.applyPrintMode();
  }

  /**
   * Set line spacing using command adapter
   * @param dots - Line spacing in dots (0-255). Use 0 for minimal spacing, undefined for default (1/6 inch)
   */
  setLineSpacing(dots?: number): void {
    const command = this.commandAdapter.getLineSpacingCommand(dots);
    this.buffer.pushArray(command);
  }

  /**
   * Set text alignment using command adapter
   */
  setAlign(align: "left" | "center" | "right"): void {
    if (this.context.currentAlign !== align) {
      const command = this.commandAdapter.getAlignCommand(align);
      this.buffer.pushArray(command);
      this.context.currentAlign = align;
    }
  }

  /**
   * Set text bold
   * Uses ESC ! command which combines size and emphasis
   */
  setBold(bold: boolean): void {
    if (this.context.currentBold !== bold) {
      this.context.currentBold = bold;
      this.applyPrintMode();
    }
  }

  /**
   * Set text size using width and height multipliers
   * Uses ESC ! command which combines size and emphasis
   * @param size - Character size as {width, height} multipliers (max 2x2 for ESC !)
   */
  setSize(size: { width: number; height: number }): void {
    // Only update if size actually changed
    if (
      this.context.currentSize.width !== size.width ||
      this.context.currentSize.height !== size.height
    ) {
      this.context.currentSize = size;
      this.applyPrintMode();
    }
  }

  /**
   * Move the printer to a font level (font + character size in one ESC ! ).
   * Also re-derives the line width, since a Font B line fits 4/3 of the
   * characters a Font A line does and a 2x2 line fits half.
   */
  setFontLevel(level: FontLevel): void {
    this.currentLevel = level;
    const size = FONT_LEVEL_SIZES[level];

    const changed =
      this.context.currentFont !== size.font ||
      this.context.currentSize.width !== size.width ||
      this.context.currentSize.height !== size.height;

    this.context.currentFont = size.font;
    this.context.currentSize = { width: size.width, height: size.height };
    this.syncPaperWidth();

    if (changed) {
      this.applyPrintMode();
    }
  }

  /**
   * Set font level and bold together, emitting at most one ESC ! command.
   * Used by "rico" mode, where both can change on the same element.
   */
  setPrintState(level: FontLevel, bold: boolean): void {
    const size = FONT_LEVEL_SIZES[level];
    const changed =
      this.context.currentFont !== size.font ||
      this.context.currentSize.width !== size.width ||
      this.context.currentSize.height !== size.height ||
      this.context.currentBold !== bold;

    this.currentLevel = level;
    this.context.currentFont = size.font;
    this.context.currentSize = { width: size.width, height: size.height };
    this.context.currentBold = bold;
    this.syncPaperWidth();

    if (changed) {
      this.applyPrintMode();
    }
  }

  /** Recomputes the usable line width from the current level and padding. */
  private syncPaperWidth(): void {
    this.context.paperWidth = columnsForLevel(
      this.context.basePaperWidth,
      this.baseLevel,
      this.currentLevel,
      this.reservedLeft + this.reservedRight
    );
  }

  /** A reserved width in Font A columns, in characters of the CURRENT level. */
  private paddingChars(reserved: number): number {
    if (reserved <= 0) return 0;
    return Math.round(reserved / FONT_LEVEL_COLUMN_UNITS[this.currentLevel]);
  }

  /**
   * The indent for a line that is starting, in characters of the CURRENT level.
   * A right-aligned line hangs off the right edge, so its left inset is the
   * printer's business and spaces on the left would only push it further in.
   */
  private indentChars(): number {
    if (this.context.currentAlign === "right") return 0;
    return this.paddingChars(this.reservedLeft);
  }

  /**
   * Close a printed line by padding it out to the right inset.
   *
   * ESC a centres or right-aligns whatever bytes reach it, counting the spaces
   * we prepended: a centred line carrying only the left indent lands half that
   * indent to the right of the box it belongs to. Padding the right side as
   * well makes the printer align the text inside the padded box instead of
   * inside the paper. Left-aligned lines need nothing — they already start at
   * the indent.
   */
  endTextLine(): void {
    if (this.atLineStart || this.context.currentAlign === "left") return;
    const right = this.paddingChars(this.reservedRight);
    if (right > 0) {
      this.buffer.pushArray(encodeText(" ".repeat(right)));
    }
  }

  /** Print a COMPLETE line: the left indent, the text, and the right inset. */
  addTextLine(text: string): void {
    this.addText(text);
    this.endTextLine();
  }

  /**
   * Reserve horizontal padding for the children of a View (or a Page).
   * Widths and wrapping inside the frame shrink, and every line printed while
   * the frame is open is indented by paddingLeft.
   */
  pushHorizontalPadding(leftColumns: number, rightColumns: number): void {
    // Never let padding eat more than half the paper — a Page margin arrives in
    // points and a bad value would otherwise leave a one-character column.
    const maxTotal = Math.floor((this.context.basePaperWidth * FONT_LEVEL_COLUMN_UNITS[this.baseLevel]) / 2);
    const available = Math.max(0, maxTotal - this.reservedLeft - this.reservedRight);
    const left = Math.max(0, Math.min(leftColumns, available));
    const right = Math.max(0, Math.min(rightColumns, available - left));

    this.paddingStack.push({ left, right });
    this.reservedLeft += left;
    this.reservedRight += right;
    this.syncPaperWidth();
  }

  /** Release the innermost horizontal padding frame. */
  popHorizontalPadding(): void {
    const frame = this.paddingStack.pop();
    if (!frame) return;
    this.reservedLeft -= frame.left;
    this.reservedRight -= frame.right;
    this.syncPaperWidth();
  }

  /** Feed blank lines for a vertical margin/padding/height given in points. */
  addSpacing(points?: number | string): void {
    const lines = calculateSpacing(points);
    if (lines > 0) {
      this.addLineFeed(lines);
    }
  }

  /**
   * Apply current print mode (size + bold + font) using command adapter.
   * The font comes from context.currentFont, which starts at the fontMode base
   * and only moves in "rico" mode, when a fontSize asks for another level.
   */
  private applyPrintMode(): void {
    const useFontB = this.context.currentFont === 1;
    const command = this.commandAdapter.getCharacterSizeCommand(
      this.context.currentSize.width,
      this.context.currentSize.height,
      this.context.currentBold,
      useFontB
    );
    this.buffer.pushArray(command);
  }

  /**
   * Reset text formatting to defaults
   * Note: Alignment is NOT reset here because it should persist for the entire line
   */
  resetFormatting(): void {
    this.setAlign("left");

    if (this.styleMode === "rico") {
      this.setPrintState(this.baseLevel, false);
      return;
    }

    this.setBold(false);
    this.setSize({ width: 1, height: 1 });
  }

  /**
   * Add text with current formatting
   */
  addText(text: string): void {
    if (text) {
      const indent = this.atLineStart ? this.indentChars() : 0;
      const encodedBytes = encodeText(indent > 0 ? " ".repeat(indent) + text : text);
      this.buffer.pushArray(encodedBytes);
      this.atLineStart = false;
    }
  }

  /**
   * Add newline using command adapter.
   * In compact mode, skips if the buffer already ends with a LF (prevents double spacing).
   */
  addNewline(count = 1): void {
    if (this.compact && count === 1 && this.buffer.lastByte() === 0x0a) {
      return; // Skip duplicate LF in compact mode
    }
    const command = this.commandAdapter.getLineFeedCommand(count);
    this.buffer.pushArray(command);
    this.atLineStart = true;
  }

  /**
   * Add line feed using command adapter
   */
  addLineFeed(lines = 1): void {
    const command = this.commandAdapter.getLineFeedCommand(lines);
    this.buffer.pushArray(command);
    this.atLineStart = true;
  }

  /**
   * Add divider line.
   * In compact mode, avoids emitting a leading LF if the buffer already ends with one.
   */
  addDivider(dashed = false): void {
    this.setAlign("left");
    const line = generateDividerLine(this.getPaperWidth(), dashed);
    this.addText(line);
    this.addNewline();
  }

  /**
   * Check if the last byte in the buffer is a LF
   */
  lastByteIsLF(): boolean {
    return this.buffer.lastByte() === 0x0a;
  }

  /**
   * Add QR code using command adapter
   */
  addQRCode(data: string, size = 6): void {
    try {
      const command = this.commandAdapter.getQRCodeCommand(data, size);
      if (command.length > 0) {
        this.buffer.pushArray(command);
        this.addNewline();
      }
    } catch (error) {
      // QR code generation failed - silently ignore
    }
  }

  /**
   * Add image from base64 or data URI
   * Converts image to monochrome bitmap and prints using ESC/POS raster graphics
   * @param source - Base64 string, data URI, or object with uri property
   * @param maxWidthColumns - width budget in characters; comes from the parent
   *   View's percentage width. Without it an image inside a `width: "30%"` View
   *   printed across the whole paper.
   */
  async addImage(
    source: string | { uri: string },
    maxWidthColumns?: number
  ): Promise<void> {
    try {
      // Import Jimp dynamically to avoid loading if not needed
      const { Jimp } = await import("jimp");

      // Extract the actual data URI or base64 string
      let imageSource: string;
      if (typeof source === "string") {
        imageSource = source;
      } else if (source && typeof source === "object" && "uri" in source) {
        imageSource = source.uri;
      } else {
        console.warn("Invalid image source format");
        return;
      }

      // Handle base64 strings (with or without data URI prefix)
      let base64Data = imageSource;
      if (imageSource.startsWith("data:")) {
        // Extract base64 from data URI (e.g., "data:image/png;base64,...")
        const base64Match = imageSource.match(/^data:image\/\w+;base64,(.+)$/);
        if (base64Match) {
          base64Data = base64Match[1];
        }
      }

      // Convert base64 to buffer
      const imageBuffer = Buffer.from(base64Data, "base64");

      // Load image with Jimp (v1.x API)
      const image = await Jimp.read(imageBuffer);

      // Get paper width in pixels (assuming 8 dots per mm for 80mm thermal printer)
      // Standard 80mm paper = ~576 pixels at 8 dots/mm (72 dpi)
      // We'll use 384 pixels as max width (48 chars * 8 pixels per char)
      const maxWidth = Math.max(1, maxWidthColumns ?? this.getPaperWidth()) * 8;

      // Resize image to fit paper width while maintaining aspect ratio
      if (image.width > maxWidth) {
        await image.resize({ w: maxWidth });
      }

      // Convert to grayscale and apply threshold to create monochrome bitmap
      await image
        .greyscale()
        .contrast(0.2) // Increase contrast for better print quality
        .posterize(2); // Convert to 2-color (black and white)

      const width = image.width;
      const height = image.height;

      // Convert image to monochrome bitmap data (1 bit per pixel)
      const bytesPerLine = Math.ceil(width / 8);
      const bitmapData: number[] = [];

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < bytesPerLine; x++) {
          let byte = 0;

          for (let bit = 0; bit < 8; bit++) {
            const pixelX = x * 8 + bit;
            if (pixelX < width) {
              const pixelIndex = (y * width + pixelX) * 4;
              const pixel = image.bitmap.data[pixelIndex]; // Red channel (same for grayscale)

              // If pixel is dark (< 128), set bit to 1 (black)
              if (pixel < 128) {
                byte |= 1 << (7 - bit);
              }
            }
          }

          bitmapData.push(byte);
        }
      }

      // Generate and add raster image command using command adapter
      const imageCommand = this.commandAdapter.getRasterImageCommand(
        bitmapData,
        width,
        height
      );
      if (imageCommand.length > 0) {
        this.buffer.pushArray(imageCommand);
      }
    } catch (error) {
      console.warn("Failed to process image:", error);
      // Silently fail - don't crash if image processing fails
    }
  }

  /**
   * Apply text styles from a style object.
   *
   * @param style - the element's own style
   * @param options.inheritedAlign - alignment from an ancestor View's alignItems,
   *   used only when the element does not set textAlign itself. Before DEV-2390
   *   `alignItems: "center"` on a View simply never reached its children.
   * @param options.text - the text about to be printed. In "rico" mode it is
   *   used to check whether a 2x2 line actually fits; on 58mm paper a double
   *   size title only has ~16 columns, and wrapping it looks worse than
   *   printing it one level down.
   */
  applyTextStyle(
    style: any,
    options?: { inheritedAlign?: "left" | "center" | "right"; text?: string }
  ): void {
    const textStyle = extractTextStyle(style);

    // Set alignment — the element's own textAlign wins over the inherited one
    const align = style?.textAlign
      ? mapTextAlign(style.textAlign)
      : options?.inheritedAlign ?? "left";
    this.setAlign(align);

    const bold = isBold(textStyle);

    if (this.styleMode !== "rico") {
      // Legacy: fontSize is ignored, the whole document prints at fontMode size
      this.setBold(bold);
      this.setSize({ width: 1, height: 1 });
      return;
    }

    this.setPrintState(this.resolveTextLevel(textStyle.fontSize, options?.text), bold);
  }

  /**
   * The font level a piece of text should print at, honouring the 2x2 fallback.
   * Public so the row layout can size its columns before printing them.
   */
  resolveTextLevel(fontSize?: number | string, text?: string): FontLevel {
    const level = resolveFontLevel(this.baseLevel, fontSize);

    if (level === 2 && text) {
      const doubleWidth = columnsForLevel(
        this.context.basePaperWidth,
        this.baseLevel,
        2,
        this.reservedLeft + this.reservedRight
      );
      if (wrapText(text, doubleWidth).length > 1) {
        return 1;
      }
    }

    return level;
  }

  /** The font level currently loaded in the printer. */
  getFontLevel(): FontLevel {
    return this.currentLevel;
  }

  /** The document's base font level (what fontMode asked for). */
  getBaseFontLevel(): FontLevel {
    return this.baseLevel;
  }

  /** Whether richer styling (fontSize, spacing, per-column styles) is enabled. */
  isRichStyleMode(): boolean {
    return this.styleMode === "rico";
  }

  /**
   * Apply spacing from view style
   */
  applyViewSpacing(style: any, type: "before" | "after"): void {
    const viewStyle = extractViewStyle(style);
    const rich = this.styleMode === "rico";
    const padding = viewStyle.padding;
    const margin = viewStyle.margin;

    // CSS box model order, the same one @thermal-print/pdf follows:
    // margin -> border -> padding -> content -> padding -> border -> margin
    if (type === "before") {
      if (rich) this.addSpacing(viewStyle.marginTop ?? margin);
      if (viewStyle.borderTop) {
        this.addDivider(isDashedBorder(viewStyle.borderTop));
      }
      if (rich) this.addSpacing(viewStyle.paddingTop ?? padding);
    } else {
      if (rich) this.addSpacing(viewStyle.paddingBottom ?? padding);
      if (viewStyle.borderBottom) {
        this.addDivider(isDashedBorder(viewStyle.borderBottom));
      }
      if (rich) this.addSpacing(viewStyle.marginBottom ?? margin);
    }
  }

  /**
   * Cut paper with full cut using command adapter
   */
  cutFull(): void {
    const command = this.commandAdapter.getCutCommand("full");
    this.buffer.pushArray(command);
  }

  /**
   * Cut paper with partial cut using command adapter
   */
  cutPartial(): void {
    const command = this.commandAdapter.getCutCommand("partial");
    this.buffer.pushArray(command);
  }

  /**
   * Cut paper with feed then full cut using command adapter
   * @param lines - Number of lines to feed before cutting (1-255)
   */
  cutFullWithFeed(lines = 3): void {
    const feedCount = Math.max(1, Math.min(255, lines));
    const command = this.commandAdapter.getCutCommand("full", feedCount);
    this.buffer.pushArray(command);
  }

  /**
   * Cut paper with feed then partial cut using command adapter
   * @param lines - Number of lines to feed before cutting (1-255)
   */
  cutPartialWithFeed(lines = 3): void {
    const feedCount = Math.max(1, Math.min(255, lines));
    const command = this.commandAdapter.getCutCommand("partial", feedCount);
    this.buffer.pushArray(command);
  }

  /**
   * Add raw ESC/POS command
   * @param data - Raw buffer data to send to printer
   */
  addRawCommand(data: Buffer): void {
    this.buffer.pushArray(Array.from(data));
  }

  /**
   * Get the final buffer
   */
  getBuffer(): Buffer {
    const buffer = this.buffer.toBuffer();

    // Defensive: drop leading line feeds so a receipt could never start with
    // blank paper. The buffer opens with the adapter's init command, so in
    // practice nothing is ever stripped here — in particular a marginTop on the
    // first View survives, which the "rico" spacing tests rely on.
    let start = 0;
    while (start < buffer.length && buffer[start] === 0x0a) {
      start++;
    }

    return buffer.slice(start);
  }

  /**
   * Get paper width
   */
  getPaperWidth(): number {
    return this.context.paperWidth;
  }
}
