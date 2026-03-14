/**
 * ESC/POS Command Adapter
 *
 * Standard ESC/POS command implementation using ESC ! for character sizing.
 * Compatible with most thermal printers that support ESC/POS protocol.
 */

import { CommandAdapter, CharacterSize } from "./types";
import * as ESCPOS from "../commands/escpos";

// Control characters (for backward compatibility)
const ESC = ESCPOS.ESC;
const GS = ESCPOS.GS;
const LF = ESCPOS.LF;

/**
 * ESC/POS Command Adapter
 * Uses ESC ! for character sizing (max 2x2) for better compatibility
 */
export class ESCPOSCommandAdapter implements CommandAdapter {
  getName(): string {
    return "ESC/POS";
  }

  getMaxCharacterSize(): CharacterSize {
    // ESC ! command supports up to 2x2 for compatibility
    // Note: GS ! supports up to 8x8, but ESC ! is more widely supported
    return { width: 2, height: 2 };
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
    bold: boolean,
    font: number = 0
  ): number[] {
    /**
     * ESC ! n - Select print mode
     * Uses the calculateCharacterSize function from escpos.ts
     * This provides character sizing up to 2x2 with optional bold and font selection
     */
    return ESCPOS.calculateCharacterSize(width, height, bold, font as 0 | 1);
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
