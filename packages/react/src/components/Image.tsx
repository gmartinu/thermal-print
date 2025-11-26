import React from 'react';
import { ViewStyle, TextStyle } from '@thermal-print/core';

/**
 * Image component - Displays images (converted to monochrome for thermal printing)
 *
 * Images are automatically:
 * - Resized to fit paper width
 * - Converted to grayscale
 * - Converted to monochrome (black/white)
 *
 * @example
 * ```typescript
 * // Base64 image
 * <Image src="data:image/png;base64,..." />
 *
 * // With alignment
 * <Image
 *   src="data:image/png;base64,..."
 *   style={{ textAlign: 'center' }}
 * />
 *
 * // With fixed height (PDF only)
 * <Image
 *   src="data:image/png;base64,..."
 *   style={{ height: 100 }}
 * />
 * ```
 */
export interface ImageProps {
  src: string; // base64 or data URI or {uri: string}
  style?: ViewStyle & TextStyle; // For alignment

  /**
   * Fixed image height (HTML/PDF ONLY)
   *
   * ⚠️ ESC/POS: Completely ignored. Images auto-scale to paper width.
   * ✅ HTML/PDF: Applied as CSS height, maintaining aspect ratio.
   *
   * Formats:
   * - String with unit: '100px', '50mm', '2in'
   * - Number: Treated as pixels
   *
   * @example height={100} // 100px height in PDF
   * @example height="50mm" // 50mm height in PDF
   */
  height?: string | number;
}

// Mark component with displayName for reconciler
export const Image = ({ src, style, height }: ImageProps) => {
  // Handle both string src and {uri: string} format
  const source = typeof src === 'string' ? src : (src as any)?.uri || src;

  // Apply height to style if provided
  const imageStyle = height !== undefined
    ? { ...style, height: typeof height === 'number' ? `${height}px` : height, objectFit: 'contain' as const }
    : style;

  // Use 'img' for DOM rendering, but keep data attribute for reconciler to identify
  return React.createElement('img', {
    'data-thermal-component': 'Image',
    src: source,
    style: imageStyle,
    'data-height': height
  });
};

Image.displayName = 'Image';
