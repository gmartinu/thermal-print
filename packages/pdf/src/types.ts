/**
 * Paper size options for PDF generation
 */
export type PaperSize =
  | 'A4'
  | 'Letter'
  | '80mm'
  | '58mm'
  | { width: number; height: number }; // Custom size in mm

/**
 * Page orientation for PDF
 */
export type Orientation = 'portrait' | 'landscape';

/**
 * Options for PDF conversion
 */
export interface PDFOptions {
  /**
   * Paper size for the PDF
   * - 'A4': 210mm x 297mm
   * - 'Letter': 215.9mm x 279.4mm
   * - '80mm': 80mm x auto (thermal paper)
   * - '58mm': 58mm x auto (thermal paper)
   * - Custom: { width, height } in mm
   * @default 'A4'
   */
  paperSize?: PaperSize;

  /**
   * Page orientation
   * @default 'portrait'
   */
  orientation?: Orientation;

  /**
   * Scale factor for html2canvas rendering quality
   * Higher values produce better quality but larger file sizes
   * @default 2
   */
  scale?: number;

  /**
   * PDF margins in mm
   * @default 10
   */
  margin?: number;

  /**
   * Optional filename for automatic download
   * If provided, the PDF will be automatically downloaded
   * If not provided, only the Blob is returned
   */
  filename?: string;

  /**
   * JPEG quality for images (0-1)
   * @default 0.95
   */
  imageQuality?: number;

  /**
   * Background color for transparent areas
   * @default '#ffffff'
   */
  backgroundColor?: string;

  /**
   * Wait time in milliseconds before capturing the element
   * Useful when the element needs time to render content
   * @default 0
   */
  waitTime?: number;
}

/**
 * Result of PDF conversion (raster mode)
 */
export interface PDFResult {
  /**
   * The generated PDF as a Blob
   */
  blob: Blob;

  /**
   * Object URL for the blob (can be used with window.open)
   */
  url: string;

  /**
   * Function to revoke the object URL (call when done)
   */
  cleanup: () => void;
}

/**
 * Options for vector PDF generation (printNodesToPDF)
 *
 * Note: Most styling (fontSize, margins, padding) is read from the
 * PrintNode tree itself, matching @react-pdf/renderer behavior.
 * These options are for overriding or providing defaults.
 */
export interface VectorPDFOptions {
  /**
   * Paper width in points (overrides Page component's size.width)
   * @default Read from Page component, or 205pt (≈72mm)
   */
  paperWidth?: number;

  /**
   * Paper height in points (overrides Page component's size.height)
   * Set to 'auto' for dynamic height based on content (like @react-pdf)
   * @default 'auto' - height adjusts to fit content
   */
  paperHeight?: number | 'auto';

  /**
   * Default font size in points (used when component doesn't specify fontSize)
   * @default 10
   */
  defaultFontSize?: number;

  /**
   * Line height multiplier
   * @default 1.2
   */
  lineHeight?: number;

  /**
   * Font family (must be available in jsPDF)
   * @default "Helvetica"
   */
  fontFamily?: string;

  /**
   * Pixel to mm conversion factor
   * @default 0.264583 (1px = 0.264583mm at 96dpi)
   */
  pxToMm?: number;
}

/**
 * Result of vector PDF generation
 */
export interface VectorPDFResult {
  /**
   * The generated PDF as a Blob
   */
  blob: Blob;

  /**
   * The generated PDF as an ArrayBuffer (for IPC transfer)
   */
  arrayBuffer: ArrayBuffer;

  /**
   * Object URL for the blob (can be used with window.open)
   */
  url: string;

  /**
   * Function to revoke the object URL (call when done)
   */
  cleanup: () => void;

  /**
   * Save PDF to file (triggers download in browser)
   */
  save: (filename: string) => void;
}
