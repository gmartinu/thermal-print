/**
 * @thermal-print/pdf
 *
 * PDF generation for thermal printers
 *
 * Two modes of operation:
 * 1. Vector PDF (recommended): printNodesToPDF() - converts PrintNode IR to vector PDF with real text
 * 2. Raster PDF (legacy): convertToPDF() - captures DOM as image (lower quality)
 */

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { PrintNode } from "@thermal-print/core";
import { PDFGenerator, PDFGeneratorOptions } from "./pdf-generator";
import { PDFTraverser } from "./pdf-traverser";
import { PDFOptions, PDFResult, VectorPDFOptions, VectorPDFResult } from "./types";

/**
 * Converts a DOM element to a PDF blob
 *
 * @param elementOrId - Element ID string or HTMLElement reference
 * @param options - PDF generation options
 * @returns Promise resolving to PDF Blob and utility functions
 *
 * @example
 * ```typescript
 * // Using element ID
 * const result = await convertToPDF('thermal-receipt', {
 *   paperSize: '80mm',
 *   scale: 2
 * });
 *
 * // Open in new window for printing
 * window.open(result.url);
 *
 * // Clean up when done
 * result.cleanup();
 * ```
 *
 * @example
 * ```typescript
 * // Using HTMLElement reference
 * const element = document.getElementById('my-receipt');
 * const result = await convertToPDF(element, {
 *   paperSize: 'A4',
 *   filename: 'receipt.pdf' // Auto-download
 * });
 * ```
 */
export async function convertToPDF(
  elementOrId: string | HTMLElement,
  options: PDFOptions = {}
): Promise<PDFResult> {
  // Get the element
  const element =
    typeof elementOrId === "string"
      ? document.getElementById(elementOrId)
      : elementOrId;

  if (!element) {
    throw new Error(
      typeof elementOrId === "string"
        ? `Element with id "${elementOrId}" not found`
        : "Invalid element provided"
    );
  }

  // Default options
  const {
    paperSize = "A4",
    orientation = "portrait",
    scale = 2,
    margin = 10,
    imageQuality = 0.95,
    backgroundColor = "#ffffff",
    filename,
    waitTime = 0,
  } = options;

  // Wait for element to render if waitTime is specified
  if (waitTime > 0) {
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  // Check if element has content before capturing
  const elementHeight = element.offsetHeight || element.scrollHeight || element.clientHeight;
  if (elementHeight === 0) {
    throw new Error(
      `Element has zero height. The element may be empty or not yet rendered. ` +
      `Try using the 'waitTime' option (e.g., waitTime: 100) to wait for content to load.`
    );
  }

  // Convert paper size to dimensions in mm
  const dimensions = getPaperDimensions(paperSize, orientation);

  // Capture the element as canvas
  const canvas = await html2canvas(element, {
    scale,
    backgroundColor,
    useCORS: true,
    logging: false,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  // Validate canvas dimensions
  if (!canvas.width || !canvas.height || canvas.width <= 0 || canvas.height <= 0) {
    throw new Error(
      `Invalid canvas dimensions: width=${canvas.width}, height=${canvas.height}. ` +
      `The element may be hidden or have zero size.`
    );
  }

  // Calculate PDF dimensions
  const imgWidth = dimensions.width - margin * 2;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // Validate calculated dimensions
  if (!imgWidth || !imgHeight || imgWidth <= 0 || imgHeight <= 0 || isNaN(imgWidth) || isNaN(imgHeight)) {
    throw new Error(
      `Invalid image dimensions: width=${imgWidth}mm, height=${imgHeight}mm. ` +
      `Canvas: ${canvas.width}x${canvas.height}px, Paper: ${dimensions.width}x${dimensions.height}mm, Margin: ${margin}mm`
    );
  }

  // Create PDF
  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: [dimensions.width, dimensions.height],
  });

  // Add image to PDF
  const imgData = canvas.toDataURL("image/jpeg", imageQuality);
  pdf.addImage(imgData, "JPEG", margin, margin, imgWidth, imgHeight);

  // Generate blob
  const blob = pdf.output("blob");

  // Create object URL
  const url = URL.createObjectURL(blob);

  // Auto-download if filename provided
  if (filename) {
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Return result with cleanup function
  return {
    blob,
    url,
    cleanup: () => URL.revokeObjectURL(url),
  };
}

/**
 * Get paper dimensions in mm based on paper size and orientation
 */
function getPaperDimensions(
  paperSize: PDFOptions["paperSize"],
  orientation: PDFOptions["orientation"]
): { width: number; height: number } {
  let width: number;
  let height: number;

  if (typeof paperSize === "object") {
    // Custom dimensions
    width = paperSize.width;
    height = paperSize.height;

    // Validate custom dimensions
    if (typeof width !== "number" || typeof height !== "number" || isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
      throw new Error(
        `Invalid custom paper dimensions: width=${width}, height=${height}. ` +
        `Both width and height must be positive numbers in millimeters.`
      );
    }
  } else {
    // Predefined paper sizes
    switch (paperSize) {
      case "A4":
        width = 210;
        height = 297;
        break;
      case "Letter":
        width = 215.9;
        height = 279.4;
        break;
      case "80mm":
        width = 80;
        height = 297; // Default height, can be adjusted
        break;
      case "58mm":
        width = 58;
        height = 297; // Default height, can be adjusted
        break;
      default:
        width = 210;
        height = 297;
    }
  }

  // Swap dimensions for landscape
  if (orientation === "landscape") {
    [width, height] = [height, width];
  }

  return { width, height };
}

/**
 * Converts a PrintNode tree to a vector PDF blob
 *
 * This is the recommended method for high-quality PDF output.
 * Uses jsPDF's native text rendering for crisp, vector-based text.
 *
 * Styles (fontSize, margins, padding, etc.) are read from the PrintNode tree
 * itself, matching how @react-pdf/renderer works.
 *
 * @param printNode - The PrintNode tree (from convertToPrintNodes)
 * @param options - Optional PDF generation options (overrides for paper size, etc.)
 * @returns Promise resolving to PDF result with blob and utilities
 *
 * @example
 * ```typescript
 * import { convertToPrintNodes } from '@thermal-print/react';
 * import { printNodesToPDF } from '@thermal-print/pdf';
 *
 * // Convert React component to PrintNode
 * const printNode = convertToPrintNodes(<MyCupom />);
 *
 * // Generate vector PDF (styles are read from the component)
 * const result = await printNodesToPDF(printNode);
 *
 * // Send to printer
 * const buffer = result.arrayBuffer;
 * ipcRenderer.send('print-pdf', buffer);
 * ```
 */
export async function printNodesToPDF(
  printNode: PrintNode,
  options: VectorPDFOptions = {}
): Promise<VectorPDFResult> {
  // Read paper size from Page component if available
  const pageNode = findPageNode(printNode);
  const pageSize = pageNode?.props?.size;

  // Check for wrap prop - wrap=true means dynamic height (no page breaks)
  const pageWrap = pageNode?.props?.wrap;

  // Debug: log what we found
  console.log(`[printNodesToPDF] pageNode:`, pageNode?.type, pageNode?.props);
  console.log(`[printNodesToPDF] pageSize:`, pageSize);
  console.log(`[printNodesToPDF] pageWrap:`, pageWrap);

  // Paper dimensions in POINTS (matching react-pdf which uses points directly)
  // No conversion needed - Page.size is already in points
  const paperWidth = pageSize?.width ?? options.paperWidth ?? 205; // Default 205pt ≈ 72mm

  // Paper height priority:
  // 1. Explicit size.height from Page component (if provided)
  // 2. If wrap=true and no explicit height → dynamic height
  // 3. options.paperHeight from function call
  // 4. Default to 'auto'
  const paperHeight: number | 'auto' =
    (typeof pageSize?.height === 'number' ? pageSize.height : null)
      ?? (pageWrap === true ? 'auto' : null)
      ?? options.paperHeight
      ?? 'auto';

  console.log(`[printNodesToPDF] Calculated dimensions (points):`, { paperWidth, paperHeight });

  const generator = new PDFGenerator({
    paperWidth,
    paperHeight,
    defaultFontSize: options.defaultFontSize ?? 10,
    lineHeight: options.lineHeight ?? 1.2,
    fontFamily: options.fontFamily ?? "Helvetica",
    pxToMm: options.pxToMm ?? 0.264583,
  });

  const traverser = new PDFTraverser(generator);

  // Traverse the PrintNode tree and generate PDF
  await traverser.traverse(printNode);

  // Finalize page height to fit content (for dynamic height mode)
  generator.finalizePageHeight();

  // Get outputs
  const blob = generator.getBlob();
  const arrayBuffer = generator.getArrayBuffer();
  const url = URL.createObjectURL(blob);

  return {
    blob,
    arrayBuffer,
    url,
    cleanup: () => URL.revokeObjectURL(url),
    save: (filename: string) => generator.save(filename),
  };
}

/**
 * Find the Page node in the PrintNode tree
 */
function findPageNode(node: PrintNode): PrintNode | null {
  if (node.type.toLowerCase() === "page") {
    return node;
  }

  for (const child of node.children || []) {
    const found = findPageNode(child);
    if (found) return found;
  }

  return null;
}

// Export types
export type * from "./types";

// Export generator and traverser for advanced usage
export { PDFGenerator, PDFTraverser };
export type { PDFGeneratorOptions };
