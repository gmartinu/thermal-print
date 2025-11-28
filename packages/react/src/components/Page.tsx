import React, { ReactNode } from "react";
import { ViewStyle } from "@thermal-print/core";

/**
 * Page component - Represents a page in the document
 *
 * Note: For thermal printers, this is mostly semantic.
 * Thermal printers print continuously without page breaks.
 * The size prop is accepted for @react-pdf/renderer compatibility.
 *
 * @example
 * ```typescript
 * <Page size="A4" style={{ padding: 20 }}>
 *   <Text>Page content</Text>
 * </Page>
 * ```
 *
 * @example
 * ```typescript
 * // With page breaks for PDF (ignored for ESC/POS)
 * <Page wrap={false}>
 *   <Text>This won't break across pages in PDF</Text>
 * </Page>
 * ```
 */
export interface PageProps {
  children: ReactNode;
  style?: ViewStyle;
  size?: string | { width: number; height?: number | "auto" };

  /**
   * Whether content can wrap to next page (HTML/PDF ONLY)
   *
   * ⚠️ ESC/POS: Completely ignored. Thermal printers print continuously.
   * ✅ HTML/PDF: Controls CSS page-break behavior.
   *
   * - undefined (default): Uses fixed height from size.height if provided
   * - true: Content flows continuously (dynamic height, no page breaks)
   * - false: Keeps content on single page (uses page-break-inside: avoid)
   *
   * @default undefined
   * @example wrap={true} // Enable dynamic height for long receipts
   * @example wrap={false} // Prevent page breaks in PDF
   */
  wrap?: boolean;
}

// Mark component with displayName for reconciler
export const Page = ({ children, style, size, wrap }: PageProps) => {
  // Use 'div' for DOM rendering, but keep data attribute for reconciler to identify
  const pageStyle = {
    ...style,
    // Apply page-break-inside CSS for PDF when wrap is explicitly false
    ...(wrap === false ? { pageBreakInside: "avoid" as const } : {}),
  };

  return React.createElement(
    "div",
    {
      "data-thermal-component": "Page",
      style: pageStyle,
      "data-size": size,
      "data-wrap": wrap,
    },
    children
  );
};

Page.displayName = "Page";
