import React, { ReactNode } from 'react';
import { TextStyle } from '@thermal-print/core';

/**
 * Text component - Displays text content
 *
 * Supports:
 * - Font sizes (maps to thermal printer character sizes)
 * - Text alignment (left/center/right)
 * - Bold text
 *
 * @example
 * ```typescript
 * <Text style={{ fontSize: 20, textAlign: 'center', fontWeight: 'bold' }}>
 *   My Store
 * </Text>
 * ```
 */
export interface TextProps {
  children?: ReactNode;
  style?: TextStyle;
}

// Mark component with displayName for reconciler
export const Text = ({ children, style }: TextProps) => {
  // Apply paddingLeft/paddingRight as CSS if provided
  const textStyle = style ? {
    ...style,
    ...(style.paddingLeft !== undefined ? { paddingLeft: typeof style.paddingLeft === 'number' ? `${style.paddingLeft}px` : style.paddingLeft } : {}),
    ...(style.paddingRight !== undefined ? { paddingRight: typeof style.paddingRight === 'number' ? `${style.paddingRight}px` : style.paddingRight } : {})
  } : style;

  // Use 'span' for DOM rendering, but keep data attribute for reconciler to identify
  return React.createElement('span', {
    'data-thermal-component': 'Text',
    style: textStyle
  }, children);
};

Text.displayName = 'Text';
