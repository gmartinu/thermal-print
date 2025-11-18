/**
 * Command Adapter Interface
 *
 * Abstracts printer-specific ESC/POS command generation to support
 * different printer protocols (ESC/POS, ESC/Bematech, etc.)
 */

/**
 * Character size specification
 */
export interface CharacterSize {
  width: number;  // Width multiplier (1-8)
  height: number; // Height multiplier (1-8)
}

/**
 * Command adapter interface for generating printer-specific commands
 */
export interface CommandAdapter {
  /**
   * Get the name/identifier of this adapter
   */
  getName(): string;

  /**
   * Get maximum supported character size multipliers
   */
  getMaxCharacterSize(): CharacterSize;

  /**
   * Initialize printer command
   * Resets printer to default state
   */
  getInitCommand(): number[];

  /**
   * Set text alignment command
   * @param align - Text alignment (left, center, right)
   */
  getAlignCommand(align: 'left' | 'center' | 'right'): number[];

  /**
   * Set character size and emphasis (bold) command
   * @param width - Width multiplier
   * @param height - Height multiplier
   * @param bold - Whether text should be bold
   */
  getCharacterSizeCommand(width: number, height: number, bold: boolean): number[];

  /**
   * Set line spacing command
   * @param dots - Line spacing in dots (0-255), undefined for default
   */
  getLineSpacingCommand(dots?: number): number[];

  /**
   * Paper cut command
   * @param type - Cut type (full or partial)
   * @param feedLines - Lines to feed before cutting (optional)
   */
  getCutCommand(type: 'full' | 'partial', feedLines?: number): number[];

  /**
   * Generate QR code command
   * @param data - QR code data (URL or text)
   * @param size - QR code module size (1-16)
   */
  getQRCodeCommand(data: string, size: number): number[];

  /**
   * Generate raster image command
   * @param imageData - Monochrome bitmap data (1 bit per pixel)
   * @param width - Image width in pixels
   * @param height - Image height in pixels
   */
  getRasterImageCommand(imageData: number[], width: number, height: number): number[];

  /**
   * Line feed command
   * @param lines - Number of line feeds (default: 1)
   */
  getLineFeedCommand(lines?: number): number[];

  /**
   * Feed paper command
   * @param lines - Number of lines to feed
   */
  getFeedLinesCommand(lines: number): number[];
}
