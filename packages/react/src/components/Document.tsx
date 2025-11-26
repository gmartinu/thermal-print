import React, { ReactNode } from 'react';
import { ViewStyle } from '@thermal-print/core';

/**
 * Document component - Root wrapper for thermal printer documents
 *
 * @example
 * ```typescript
 * <Document>
 *   <Page>
 *     <Text>Content</Text>
 *   </Page>
 * </Document>
 * ```
 */
export interface DocumentProps {
  children: ReactNode;
  style?: ViewStyle;
}

// Mark component with displayName for reconciler
export const Document = ({ children, style }: DocumentProps) => {
  // Use 'div' for DOM rendering, but keep data attribute for reconciler to identify
  return React.createElement('div', {
    'data-thermal-component': 'Document',
    style
  }, children);
};

Document.displayName = 'Document';
