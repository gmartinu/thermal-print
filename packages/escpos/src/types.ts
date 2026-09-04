/**
 * ESC/POS-specific type definitions
 */

export interface ESCPOSCommand {
  type: 'raw' | 'text' | 'feed' | 'cut' | 'image' | 'qr';
  data?: any;
  buffer?: Buffer;
}

export interface ConversionContext {
  /** Characters that fit on a line at the CURRENT font level, minus horizontal padding. */
  paperWidth: number;
  /** Characters that fit on a line at the document's base font level, with no padding. */
  basePaperWidth: number;
  currentAlign: 'left' | 'center' | 'right';
  currentSize: { width: number; height: number };
  /** ESC ! bit 0: 0 = Font A (12x24), 1 = Font B (9x17). */
  currentFont: 0 | 1;
  currentBold: boolean;
  encoding: string;
  debug: boolean;
  buffer: Buffer[];
}
