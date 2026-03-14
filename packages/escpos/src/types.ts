/**
 * ESC/POS-specific type definitions
 */

export interface ESCPOSCommand {
  type: 'raw' | 'text' | 'feed' | 'cut' | 'image' | 'qr';
  data?: any;
  buffer?: Buffer;
}

export interface ConversionContext {
  paperWidth: number;
  basePaperWidth: number;
  currentAlign: 'left' | 'center' | 'right';
  currentSize: { width: number; height: number };
  currentFont: 0 | 1;
  currentBold: boolean;
  encoding: string;
  debug: boolean;
  buffer: Buffer[];
}
