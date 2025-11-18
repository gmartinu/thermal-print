import { encodeText } from "./commands/escpos";
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

  constructor(
    paperWidth = 48,
    encoding = "cp860",
    debug = false,
    commandAdapter?: CommandAdapter
  ) {
    this.buffer = new ESCPOSBuffer();

    // Use provided adapter or default to ESC/POS
    this.commandAdapter = commandAdapter || new ESCPOSCommandAdapter();

    this.context = {
      paperWidth,
      currentAlign: "left",
      currentSize: { width: 1, height: 1 },
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
    // Initialize with comfortable line spacing (30 dots ≈ default 1/6 inch)
    // Common values: 10 (tight), 20 (moderate), 30 (default), 40 (spacious)
    this.setLineSpacing(10);
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
   * Apply current print mode (size + bold) using command adapter
   * This combines character size and emphasis into a single command
   */
  private applyPrintMode(): void {
    const command = this.commandAdapter.getCharacterSizeCommand(
      this.context.currentSize.width,
      this.context.currentSize.height,
      this.context.currentBold
    );
    this.buffer.pushArray(command);
  }

  /**
   * Reset text formatting to defaults
   */
  resetFormatting(): void {
    this.setAlign("left");
    this.setBold(false);
    this.setSize({ width: 1, height: 1 });
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
   * Add newline using command adapter
   */
  addNewline(count = 1): void {
    const command = this.commandAdapter.getLineFeedCommand(count);
    this.buffer.pushArray(command);
  }

  /**
   * Add line feed using command adapter
   */
  addLineFeed(lines = 1): void {
    const command = this.commandAdapter.getLineFeedCommand(lines);
    this.buffer.pushArray(command);
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
   */
  async addImage(source: string | { uri: string }): Promise<void> {
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
      const maxWidth = this.context.paperWidth * 8;

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
      const imageCommand = this.commandAdapter.getRasterImageCommand(bitmapData, width, height);
      if (imageCommand.length > 0) {
        this.buffer.pushArray(imageCommand);
      }
    } catch (error) {
      console.warn("Failed to process image:", error);
      // Silently fail - don't crash if image processing fails
    }
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
   * Cut paper with full cut using command adapter
   */
  cutFull(): void {
    const command = this.commandAdapter.getCutCommand('full');
    this.buffer.pushArray(command);
  }

  /**
   * Cut paper with partial cut using command adapter
   */
  cutPartial(): void {
    const command = this.commandAdapter.getCutCommand('partial');
    this.buffer.pushArray(command);
  }

  /**
   * Cut paper with feed then full cut using command adapter
   * @param lines - Number of lines to feed before cutting (1-255)
   */
  cutFullWithFeed(lines = 3): void {
    const feedCount = Math.max(1, Math.min(255, lines));
    const command = this.commandAdapter.getCutCommand('full', feedCount);
    this.buffer.pushArray(command);
  }

  /**
   * Cut paper with feed then partial cut using command adapter
   * @param lines - Number of lines to feed before cutting (1-255)
   */
  cutPartialWithFeed(lines = 3): void {
    const feedCount = Math.max(1, Math.min(255, lines));
    const command = this.commandAdapter.getCutCommand('partial', feedCount);
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
