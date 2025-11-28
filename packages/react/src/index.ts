/**
 * @thermal-print/react
 *
 * React integration for thermal printers
 *
 * Main APIs:
 * - convertToPrintNodes(component, options) -> PrintNode (React -> IR)
 * - convertToESCPOS(component, options) -> Buffer (React -> ESC/POS, convenience wrapper)
 */

import { ReactElement } from "react";
import { PrintNode } from "@thermal-print/core";
import { printNodesToESCPOS, PrintNodeToESCPOSOptions } from "@thermal-print/escpos";
import { convertToPrintNodes, renderToElementTree } from "./renderer";
import { ConversionOptions } from "./types";
import { createAdapter, RendererAdapter, ComponentMapping } from "./adapters";

/**
 * Convenience function: Converts React component directly to ESC/POS buffer
 *
 * This is a shortcut that combines convertToPrintNodes() + printNodesToESCPOS().
 * Use this if you want to go straight from React to ESC/POS without manipulating
 * the PrintNode IR.
 *
 * @param component - React component (typically @react-pdf/renderer components)
 * @param options - Conversion options
 * @returns Buffer containing ESC/POS commands ready to be sent to printer
 *
 * @example
 * ```typescript
 * import { Document, Page, Text } from '@react-pdf/renderer';
 * import { convertToESCPOS } from '@thermal-print/react';
 *
 * const buffer = await convertToESCPOS(
 *   <Document><Page><Text>Hello</Text></Page></Document>,
 *   { paperWidth: 48, cut: 'full' }
 * );
 *
 * // Send buffer to printer
 * await printer.write(buffer);
 * ```
 */
export async function convertToESCPOS(
  component: ReactElement,
  options?: ConversionOptions
): Promise<Buffer> {
  const {
    adapter: adapterConfig,
    ...escposOptions
  } = options || {};

  // Step 1: Convert React component to PrintNode tree
  const adapter = adapterConfig ? createAdapter(adapterConfig) : undefined;
  const printNode = convertToPrintNodes(component, adapter);

  if (!printNode) {
    throw new Error("Failed to render React component to PrintNode tree");
  }

  // Step 2: Convert PrintNode tree to ESC/POS buffer
  const buffer = await printNodesToESCPOS(printNode, escposOptions);

  return buffer;
}

// Export main conversion functions
export { convertToPrintNodes } from "./renderer";
export { convertToHTML } from "./html-converter";
export type { ConvertToHTMLOptions, ConvertToHTMLResult } from "./html-converter";

// Export components (drop-in replacements for @react-pdf/renderer)
export {
  Document,
  Page,
  View,
  Text,
  Image,
  Preview
} from "./components";

export type {
  DocumentProps,
  PageProps,
  ViewProps,
  TextProps,
  ImageProps,
  PreviewProps
} from "./components";

// Export StyleSheet and Font utilities
export { StyleSheet } from "./StyleSheet";
export type { StyleDeclaration, Styles } from "./StyleSheet";
export { Font } from "./Font";

// Export adapters for custom component mapping
export { createAdapter } from "./adapters";
export type { RendererAdapter, ComponentMapping } from "./adapters";
export { ReactPDFAdapter, CustomAdapter } from "./adapters";

// Export types
export type * from "./types";

// Re-export from @thermal-print/core (PrintNode, styles, etc.)
export type { PrintNode, ElementNode, TextStyle, ViewStyle } from "@thermal-print/core";
export { StandardElementType } from "@thermal-print/core";

// Re-export from @thermal-print/escpos (printNodesToESCPOS, options, etc.)
export { printNodesToESCPOS } from "@thermal-print/escpos";
export type { PrintNodeToESCPOSOptions } from "@thermal-print/escpos";

// Deprecated exports (for backward compatibility)
export { renderToElementTree } from "./renderer";
