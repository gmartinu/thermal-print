/**
 * ESC/Bematech Command Adapter
 *
 * ESC/Bematech (ESC/Bema) command implementation for Bematech thermal printers.
 * The MP-4200 TH supports both ESC/Bema and ESC/POS modes - only one active at a time.
 *
 * Note: ESC/Bema has limited command support compared to ESC/POS.
 * Some advanced features (like QR codes) may not be available.
 *
 * Reference: Bematech MP-4200 TH Programming Manual
 */

import { CommandAdapter, CharacterSize } from './types';
import * as ESCBema from '../commands/escbematech';

/**
 * ESC/Bematech Command Adapter
 * For Bematech printers in ESC/Bema mode
 */
export class ESCBematechCommandAdapter implements CommandAdapter {
  getName(): string {
    return 'ESC/Bematech';
  }

  getMaxCharacterSize(): CharacterSize {
    // ESC/Bema supports double width and double height
    // but typically not independent control like ESC/POS
    return { width: 2, height: 2 };
  }

  getInitCommand(): number[] {
    // ESC @ - Reset printer
    return ESCBema.INIT;
  }

  getAlignCommand(align: 'left' | 'center' | 'right'): number[] {
    // ESC a n - Set text alignment (ESC/Bema uses same command as ESC/POS)
    switch (align) {
      case 'left':
        return ESCBema.ALIGN_LEFT;
      case 'center':
        return ESCBema.ALIGN_CENTER;
      case 'right':
        return ESCBema.ALIGN_RIGHT;
    }
  }

  getCharacterSizeCommand(width: number, height: number, bold: boolean): number[] {
    /**
     * ESC/Bema character sizing:
     * - Uses ESC ! n for combined mode (emphasis, double-height, double-width)
     * - Also supports separate commands: ESC E/F (bold), ESC W (width), ESC d (height)
     *
     * We'll use the combined ESC ! command for better efficiency
     * Max size: 2x2 (same as ESC/POS compatibility mode)
     */
    return ESCBema.calculatePrintMode({
      emphasized: bold,
      doubleHeight: height >= 2,
      doubleWidth: width >= 2,
      underline: false
    });
  }

  getLineSpacingCommand(dots?: number): number[] {
    if (dots === undefined) {
      // ESC 2 - Reset to default spacing (1/6 inches)
      return ESCBema.SET_LINE_HEIGHT_DEFAULT;
    } else {
      // ESC 3 n - Set line spacing to n/144 inches
      // Range: 18 ≤ n ≤ 255
      return ESCBema.setLineSpacing(dots);
    }
  }

  getCutCommand(type: 'full' | 'partial', feedLines?: number): number[] {
    const commands: number[] = [];

    // Feed paper if requested
    if (feedLines && feedLines > 0) {
      commands.push(...this.getLineFeedCommand(feedLines));
    }

    // ESC/Bema cut commands
    // ESC i or ESC w: Full cut (both work, ESC i is primary)
    // Note: Partial cut (ESC m) is ESC/POS command, not documented in ESC/Bema manual
    if (type === 'full') {
      commands.push(...ESCBema.CUT_FULL);
    } else {
      // Partial cut not available in ESC/Bema, use full cut instead
      commands.push(...ESCBema.CUT_FULL);
    }

    return commands;
  }

  getQRCodeCommand(data: string, size: number): number[] {
    /**
     * QR Code support is NOT documented in ESC/Bematech manual Chapter 3.
     * QR codes require ESC/POS mode with GS ( k commands.
     *
     * Recommendation: Switch printer to ESC/POS mode temporarily:
     *   1. Send GS F9h SP 1 (temp switch to ESC/POS)
     *   2. Print QR code using ESC/POS commands
     *   3. Send GS F9h 1Fh 1 (return to previous mode)
     *
     * For now, we return empty array and log a warning.
     */
    console.warn('QR Code generation is not supported in ESC/Bematech mode. Switch to ESC/POS mode using GS F9h SP 1.');
    return [];
  }

  getRasterImageCommand(imageData: number[], width: number, height: number): number[] {
    /**
     * ESC/Bematech supports multiple graphics formats:
     * - GS v 0 m: Raster bitmap (documented, preferred)
     * - ESC * !: 24-bit graphics (documented)
     * - ESC K: 8-bit graphics (documented, lower quality)
     *
     * We'll use GS v 0 format (raster bitmap) which is explicitly documented
     * in the Bematech manual and provides best compatibility.
     */
    const bytesPerLine = Math.ceil(width / 8);

    // Use raster bitmap format with normal mode (203 dpi × 203 dpi)
    const commands = ESCBema.printRasterBitmap(
      ESCBema.RasterMode.NORMAL,
      bytesPerLine,
      height,
      imageData
    );

    return commands;
  }

  getLineFeedCommand(lines: number = 1): number[] {
    // LF (0x0A) - Feed one line
    // Repeat for multiple lines
    const commands: number[] = [];
    for (let i = 0; i < lines; i++) {
      commands.push(...ESCBema.FEED_LINE);
    }
    return commands;
  }

  getFeedLinesCommand(lines: number): number[] {
    /**
     * IMPORTANT FIX: ESC d in ESC/Bema is for DOUBLE-HEIGHT, not line feed!
     *
     * For paper feeding in ESC/Bema, use:
     * - LF (0x0A): Feed one line (preferred for multiple lines)
     * - ESC A n: Feed paper by [n × 0.375mm]
     * - ESC J n: Fine line feed [(n-48) × 0.125mm]
     *
     * We'll use LF for simplicity
     */
    return this.getLineFeedCommand(lines);
  }
}
