/**
 * ESC/POS Command Adapter
 *
 * Standard ESC/POS command implementation using:
 * - ESC M for font selection (Font A / Font B)
 * - GS ! for character size multipliers (up to 8x8)
 * - ESC E for bold/emphasis (separate from size)
 *
 * This provides 6 discrete font size levels for fine-grained control.
 */

import { CommandAdapter, CharacterSize, FontSizeMapping } from "./types";
import * as ESCPOS from "../commands/escpos";

// Control characters (for backward compatibility)
const ESC = ESCPOS.ESC;
const GS = ESCPOS.GS;
const LF = ESCPOS.LF;

/**
 * ESC/POS Command Adapter
 * Uses ESC M + GS ! + ESC E for independent font/size/bold control
 */
export class ESCPOSCommandAdapter implements CommandAdapter {
  getName(): string {
    return "ESC/POS";
  }

  getMaxCharacterSize(): CharacterSize {
    // GS ! supports up to 8x8, but we limit to 4x4 for practical use
    return { width: 4, height: 4 };
  }

  getInitCommand(): number[] {
    const commands: number[] = [];

    // ESC @ - Reset printer to default state
    commands.push(...ESCPOS.INIT);

    // GS P x y - Set horizontal and vertical motion units
    // Set both to 203 DPI (standard thermal printer resolution)
    // This ensures GS W and other commands use 1/203 inch per unit
    commands.push(0x1D, 0x50, 203, 203);

    // GS W nL nH - Set printing area width
    // For 80mm paper at 203 DPI: 80mm ≈ 3.15" × 203 = 640 dots
    // Using 640 dots to match physical paper width
    const width = 640;
    commands.push(0x1D, 0x57, width & 0xFF, (width >> 8) & 0xFF);

    return commands;
  }

  getAlignCommand(align: "left" | "center" | "right"): number[] {
    // ESC a n - Set text alignment (n: 0=left, 1=center, 2=right)
    switch (align) {
      case "left":
        return ESCPOS.ALIGN_LEFT;
      case "center":
        return ESCPOS.ALIGN_CENTER;
      case "right":
        return ESCPOS.ALIGN_RIGHT;
    }
  }

  getCharacterSizeCommand(
    width: number,
    height: number,
    bold: boolean
  ): number[] {
    /**
     * Uses separate commands for maximum flexibility:
     * 1. GS ! n - Set character size (width/height multipliers, up to 8x8)
     * 2. ESC E n - Set emphasis (bold) independently
     *
     * This replaces the old ESC ! approach which was limited to 2x2
     * and combined font/size/bold into a single byte.
     */
    const commands: number[] = [];

    // GS ! n - Set character size multipliers
    commands.push(...ESCPOS.setCharacterSize(width, height));

    // ESC E n - Set bold/emphasis separately
    commands.push(...ESCPOS.setEmphasis(bold));

    return commands;
  }

  /**
   * Get font selection command
   * ESC M n: 0=Font A (12x24), 1=Font B (9x17 condensed)
   */
  getFontCommand(font: 'A' | 'B'): number[] {
    return ESCPOS.selectFontByName(font);
  }

  /**
   * Get combined font + size + bold commands from a FontSizeMapping.
   * Convenience method for applying a complete font size mapping at once.
   */
  getFullFontSizeCommand(mapping: FontSizeMapping, bold: boolean): number[] {
    const commands: number[] = [];

    // 1. Select font (ESC M)
    commands.push(...ESCPOS.selectFontByName(mapping.font));

    // 2. Set character size multipliers (GS !)
    commands.push(...ESCPOS.setCharacterSize(mapping.widthMultiplier, mapping.heightMultiplier));

    // 3. Set bold (ESC E)
    commands.push(...ESCPOS.setEmphasis(bold));

    return commands;
  }

  getLineSpacingCommand(dots?: number): number[] {
    if (dots === undefined) {
      // ESC 2 - Reset to default spacing (1/6 inch)
      return ESCPOS.LINE_SPACING_DEFAULT_ALT;
    } else {
      // ESC 3 n - Set line spacing to n dots
      return ESCPOS.setLineSpacing(dots);
    }
  }

  getCutCommand(type: "full" | "partial", feedLines?: number): number[] {
    const commands: number[] = [];

    // Feed paper if requested
    if (feedLines && feedLines > 0) {
      commands.push(...this.getFeedLinesCommand(feedLines));
    }

    // Cut command - using commands from escpos.ts
    if (type === "full") {
      // ESC i - Full cut
      commands.push(...ESCPOS.CUT_FULL_ESC);
    } else {
      // ESC m - Partial cut
      commands.push(...ESCPOS.CUT_PARTIAL_ESC);
    }

    return commands;
  }

  getQRCodeCommand(data: string, size: number): number[] {
    // Use the generateQRCode function from escpos.ts
    return ESCPOS.generateQRCode(data, size);
  }

  getRasterImageCommand(
    imageData: number[],
    width: number,
    height: number
  ): number[] {
    // Use the generateRasterImage function from escpos.ts
    return ESCPOS.generateRasterImage(imageData, width, height);
  }

  getLineFeedCommand(lines: number = 1): number[] {
    // LF - Line feed (0x0A)
    // Repeat LF command for multiple lines
    const commands: number[] = [];
    for (let i = 0; i < lines; i++) {
      commands.push(...ESCPOS.LINE_FEED);
    }
    return commands;
  }

  getFeedLinesCommand(lines: number): number[] {
    // ESC d n - Print and feed n lines
    return ESCPOS.feedLines(lines);
  }
}
