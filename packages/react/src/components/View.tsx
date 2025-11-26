import React, { ReactNode } from 'react';
import { ViewStyle } from '@thermal-print/core';

/**
 * View component - Layout container for organizing content
 *
 * Supports:
 * - Flexbox layout (row/column)
 * - Borders (top/bottom dividers)
 * - Spacing (margin/padding)
 *
 * @example
 * ```typescript
 * // Column layout (default)
 * <View style={{ padding: 10 }}>
 *   <Text>Item 1</Text>
 *   <Text>Item 2</Text>
 * </View>
 *
 * // Row layout (side-by-side)
 * <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
 *   <Text>Left</Text>
 *   <Text>Right</Text>
 * </View>
 * ```
 */
export interface ViewProps {
  children?: ReactNode;
  style?: ViewStyle;
}

// Mark component with displayName for reconciler
export const View = ({ children, style }: ViewProps) => {
  // Apply HTML/PDF-specific styles as CSS
  const viewStyle = style ? {
    ...style,
    ...(style.height !== undefined ? { height: typeof style.height === 'number' ? `${style.height}px` : style.height } : {}),
    ...(style.paddingLeft !== undefined ? { paddingLeft: typeof style.paddingLeft === 'number' ? `${style.paddingLeft}px` : style.paddingLeft } : {}),
    ...(style.paddingRight !== undefined ? { paddingRight: typeof style.paddingRight === 'number' ? `${style.paddingRight}px` : style.paddingRight } : {})
  } : style;

  // Use 'div' for DOM rendering, but keep data attribute for reconciler to identify
  return React.createElement('div', {
    'data-thermal-component': 'View',
    style: viewStyle
  }, children);
};

View.displayName = 'View';
