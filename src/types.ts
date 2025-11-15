/**
 * Type definitions for react-escpos converter
 */

import type { RendererAdapter, ComponentMapping } from './adapters';

export interface ConversionOptions {
  paperWidth?: number; // Width in characters (default: 48 for 80mm thermal)
  encoding?: string; // Character encoding (default: 'utf-8')
  debug?: boolean; // Enable debug output
  imageMode?: 'column' | 'raster'; // Image printing mode
  cut?: boolean | 'full' | 'partial'; // Cut paper after printing (default: 'full')
  feedBeforeCut?: number; // Lines to feed before cutting (default: 3)
  adapter?: RendererAdapter | ComponentMapping; // Custom adapter or component mapping (default: ReactPDFAdapter)
}

export interface ESCPOSCommand {
  type: 'raw' | 'text' | 'feed' | 'cut' | 'image' | 'qr';
  data?: any;
  buffer?: Buffer;
}

export interface ElementNode {
  type: string; // 'Text', 'View', 'Image', 'Document', 'Page'
  props: any;
  children: ElementNode[];
  style?: any;
}

export interface TextStyle {
  fontSize?: number;
  fontWeight?: string | number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface ViewStyle {
  display?: string;
  flexDirection?: 'row' | 'column';
  justifyContent?: string;
  alignItems?: string;
  padding?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  margin?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  borderBottom?: string;
  borderTop?: string;
  width?: string | number;
}

export interface ConversionContext {
  paperWidth: number;
  currentAlign: 'left' | 'center' | 'right';
  currentSize: 'normal' | 'double-width' | 'double-height' | 'quad';
  currentBold: boolean;
  encoding: string;
  debug: boolean;
  buffer: Buffer[];
}
