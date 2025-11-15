import {
  ALIGN_CENTER,
  ALIGN_LEFT,
  ALIGN_RIGHT,
  BOLD_OFF,
  BOLD_ON,
  encodeText,
  feedLines,
  generateQRCode,
  INIT,
  setLineSpacing,
} from "./commands/escpos";
import {
  extractTextStyle,
  extractViewStyle,
  generateDividerLine,
  isBold,
  isDashedBorder,
  mapFontSizeToESCPOS,
  mapTextAlign,
} from "./styles";
import { ConversionContext } from "./types";

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
}

/**
 * ESC/POS Command Generator
 * Manages the buffer and context for generating ESC/POS commands
 * Pure JavaScript implementation - no Node.js dependencies
 */
export class ESCPOSGenerator {
  private buffer: ESCPOSBuffer;
  private context: ConversionContext;

  constructor(paperWidth = 48, encoding = "cp860", debug = false) {
    this.buffer = new ESCPOSBuffer();

    this.context = {
      paperWidth,
      currentAlign: "left",
      currentSize: "normal",
      currentBold: false,
      encoding,
      debug,
      buffer: [],
    };

    // Initialize printer
    this.buffer.pushArray(INIT);
  }

  /**
   * Initialize printer
   * Sets up the printer with default settings and comfortable line spacing
   */
  initialize(): void {
    // Initialize with comfortable line spacing (30 dots ≈ default 1/6 inch)
    // Common values: 10 (tight), 20 (moderate), 30 (default), 40 (spacious)
    this.setLineSpacing(10);
  }

  /**
   * Set line spacing using raw ESC/POS commands
   * @param dots - Line spacing in dots (0-255). Use 0 for minimal spacing, undefined for default (1/6 inch)
   */
  setLineSpacing(dots?: number): void {
    if (dots === undefined) {
      // Reset to default spacing (1/6 inch) - ESC 2 (0x1B 0x32)
      this.buffer.push(0x1b, 0x32);
    } else {
      // Set custom line spacing in dots - ESC 3 n (0x1B 0x33 n)
      const spacing = Math.max(0, Math.min(255, dots));
      this.buffer.pushArray(setLineSpacing(spacing));
    }
  }

  /**
   * Set text alignment
   */
  setAlign(align: "left" | "center" | "right"): void {
    if (this.context.currentAlign !== align) {
      const alignCommands = {
        left: ALIGN_LEFT,
        center: ALIGN_CENTER,
        right: ALIGN_RIGHT,
      };
      this.buffer.pushArray(alignCommands[align]);
      this.context.currentAlign = align;
    }
  }

  /**
   * Set text bold
   */
  setBold(bold: boolean): void {
    if (this.context.currentBold !== bold) {
      this.buffer.pushArray(bold ? BOLD_ON : BOLD_OFF);
      this.context.currentBold = bold;
    }
  }

  /**
   * Set text size
   */
  setSize(size: "normal" | "double-width" | "double-height" | "quad"): void {
    // Disable all size commands as they're causing '!' to print on some printers
    // The GS ! command (0x1D 0x21) is being interpreted as text instead of command
    // All text will use the printer's default size - bold will provide emphasis

    // Just update state without sending any commands to printer
    this.context.currentSize = size;
  }

  /**
   * Reset text formatting to defaults
   */
  resetFormatting(): void {
    this.setAlign("left");
    this.setBold(false);
    this.setSize("normal");
  }

  /**
   * Add text with current formatting
   */
  addText(text: string): void {
    if (text) {
      // Encode text to CP860 for Portuguese support
      const encodedBytes = encodeText(text);
      this.buffer.pushArray(encodedBytes);
    }
  }

  /**
   * Add newline
   */
  addNewline(count = 1): void {
    // Use direct LF (0x0A) characters for line breaks
    // ESC d command requires print buffer and doesn't always work
    for (let i = 0; i < count; i++) {
      this.buffer.push(0x0a); // LF - Line Feed
    }
  }

  /**
   * Add line feed
   */
  addLineFeed(lines = 1): void {
    // Use direct LF (0x0A) characters for line breaks
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0a); // LF - Line Feed
    }
  }

  /**
   * Add divider line
   */
  addDivider(dashed = false): void {
    this.setAlign("left");
    const line = generateDividerLine(this.context.paperWidth, dashed);
    this.addText(line);
    this.addNewline();
  }

  /**
   * Add QR code
   */
  addQRCode(data: string, size = 6): void {
    try {
      const qrCommands = generateQRCode(data, size);
      this.buffer.pushArray(qrCommands);
      this.addNewline();
    } catch (error) {
      // QR code generation failed - silently ignore
    }
  }

  /**
   * Add image from base64 or URL
   * Note: Image printing is complex and printer-specific
   * This is a placeholder for future implementation
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async addImage(source: string | { uri: string }): Promise<void> {
    // TODO: Implement image conversion to ESC/POS raster graphics
    // This requires converting image to monochrome bitmap and using GS v 0 command
  }

  /**
   * Apply text styles from style object
   */
  applyTextStyle(style: any): void {
    const textStyle = extractTextStyle(style);

    // Set alignment
    const align = mapTextAlign(textStyle.textAlign);
    this.setAlign(align);

    // Set bold
    const bold = isBold(textStyle);
    this.setBold(bold);

    // Set size
    const size = mapFontSizeToESCPOS(textStyle.fontSize);
    this.setSize(size);
  }

  /**
   * Apply spacing from view style
   */
  applyViewSpacing(style: any, type: "before" | "after"): void {
    const viewStyle = extractViewStyle(style);

    if (type === "before") {
      // Apply top border
      if (viewStyle.borderTop) {
        this.addDivider(isDashedBorder(viewStyle.borderTop));
      }
    } else {
      // Apply bottom border
      if (viewStyle.borderBottom) {
        this.addDivider(isDashedBorder(viewStyle.borderBottom));
      }
    }
  }

  /**
   * Cut paper with full cut (raw command)
   * Uses ESC i (0x1B 0x69) - tested and working on Bematech MP-4200 TH
   */
  cutFull(): void {
    this.buffer.push(0x1b, 0x69); // ESC i - full cut
  }

  /**
   * Cut paper with partial cut (raw command)
   * Uses ESC m (0x1B 0x6D) - tested and working on Bematech MP-4200 TH
   */
  cutPartial(): void {
    this.buffer.push(0x1b, 0x6d); // ESC m - partial cut
  }

  /**
   * Cut paper with feed then full cut (raw command)
   * Feed lines manually then send ESC i
   * @param lines - Number of lines to feed before cutting (1-255)
   */
  cutFullWithFeed(lines = 3): void {
    const feedCount = Math.max(1, Math.min(255, lines));
    this.buffer.pushArray(feedLines(feedCount));
    this.buffer.push(0x1b, 0x69); // ESC i - full cut
  }

  /**
   * Cut paper with feed then partial cut (raw command)
   * Feed lines manually then send ESC m
   * @param lines - Number of lines to feed before cutting (1-255)
   */
  cutPartialWithFeed(lines = 3): void {
    const feedCount = Math.max(1, Math.min(255, lines));
    this.buffer.pushArray(feedLines(feedCount));
    this.buffer.push(0x1b, 0x6d); // ESC m - partial cut
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

    // Remove leading line feeds (0x0A)
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
