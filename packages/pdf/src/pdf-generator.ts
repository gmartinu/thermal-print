/**
 * PDF Generator
 *
 * Low-level PDF generation using jsPDF's native text APIs.
 * Produces vector PDFs with crisp text (not rasterized images).
 *
 * Designed to read styling from PrintNode tree (like @react-pdf/renderer does)
 * rather than using hardcoded values.
 */

import { jsPDF } from "jspdf";

export interface PDFGeneratorOptions {
  /**
   * Paper width in points (read from Page component's size prop)
   * @default 205 (≈72mm)
   */
  paperWidth?: number;

  /**
   * Paper height in points (read from Page component's size prop)
   * When 'auto', printNodesToPDF uses two-pass rendering to calculate exact height.
   * @default 'auto'
   */
  paperHeight?: number | "auto";

  /**
   * Page orientation (read from Page/Document component)
   * If not specified, auto-detected from dimensions (width > height = landscape)
   * @default auto-detect from dimensions
   */
  orientation?: "portrait" | "landscape";

  /**
   * Default font size in points (components override this via style.fontSize)
   * @default 10
   */
  defaultFontSize?: number;

  /**
   * Line height multiplier
   * @default 1.2
   */
  lineHeight?: number;

  /**
   * Default font family
   * @default "Helvetica"
   */
  fontFamily?: string;

  /**
   * Pixel to mm conversion factor
   * Used to convert CSS pixel values to PDF mm
   * @default 0.264583 (1px = 0.264583mm at 96dpi)
   */
  pxToMm?: number;
}

/**
 * Internal options for measurement pass (not exposed publicly)
 */
interface PDFGeneratorInternalOptions extends PDFGeneratorOptions {
  /**
   * Measurement mode - tracks positions without rendering to jsPDF
   * Used internally for two-pass rendering with dynamic height
   */
  _measurementMode?: boolean;

  /**
   * Disable page breaks entirely (for thermal receipt-style output)
   * Used when rendering with a pre-calculated height from measurement pass
   */
  _noPageBreaks?: boolean;
}

type TextAlign = "left" | "center" | "right";

// Large initial height for dynamic sizing (will be trimmed after content is rendered)
// Must be large enough to fit all content - will be trimmed by finalizePageHeight()
const DYNAMIC_HEIGHT_INITIAL = 5000;

export class PDFGenerator {
  private pdf!: jsPDF;
  private options: Required<Omit<PDFGeneratorOptions, "paperHeight" | "orientation">> & {
    paperHeight: number | "auto";
    orientation?: "portrait" | "landscape";
  };
  private currentY: number;
  private currentX: number; // Current X position (for margins)
  private contentWidth: number;
  private isDynamicHeight: boolean;
  private actualPaperHeight: number;
  private measurementMode: boolean;
  private noPageBreaks: boolean;

  // Current text state
  private currentAlign: TextAlign = "left";
  private currentFontSize: number;
  private isBold: boolean = false;

  // Margin stack for nested views
  private marginLeft: number = 0;
  private marginRight: number = 0;

  constructor(options: PDFGeneratorInternalOptions = {}) {
    // Measurement mode: only track positions, don't render to jsPDF
    this.measurementMode = options._measurementMode ?? false;

    // Disable page breaks (used for thermal receipt-style continuous output)
    this.noPageBreaks = options._noPageBreaks ?? false;

    // Check if height should be dynamic (default to 'auto' like @react-pdf)
    this.isDynamicHeight =
      options.paperHeight === "auto" || options.paperHeight === undefined;

    // Use large initial height for dynamic, or specified height for fixed
    // Note: We use POINTS as the unit (like react-pdf) not mm
    this.actualPaperHeight = this.isDynamicHeight
      ? DYNAMIC_HEIGHT_INITIAL
      : (options.paperHeight as number);

    // Paper width in points (react-pdf uses points directly from Page.size)
    const paperWidth = options.paperWidth ?? 80;

    this.options = {
      paperWidth,
      paperHeight: options.paperHeight ?? "auto",
      defaultFontSize: options.defaultFontSize ?? 10,
      lineHeight: options.lineHeight ?? 1.2,
      fontFamily: options.fontFamily ?? "Helvetica",
      pxToMm: options.pxToMm ?? 0.264583,
      orientation: options.orientation,
    };

    this.currentFontSize = this.options.defaultFontSize;
    this.contentWidth = this.options.paperWidth;
    this.currentX = 0;
    this.currentY = 0;

    if (this.measurementMode) {
      console.log(
        `[PDFGenerator] Measurement mode: calculating content height only`
      );
    } else {
      console.log(
        `[PDFGenerator] Creating jsPDF with format: [${this.options.paperWidth}, ${this.actualPaperHeight}] (points)`
      );
    }

    // Determine orientation: use explicit option, or auto-detect from dimensions
    const isLandscape =
      options.orientation === "landscape" ||
      (options.orientation === undefined &&
        this.options.paperWidth > this.actualPaperHeight);

    // Always create jsPDF - needed for font metrics even in measurement mode
    // Note: format is always [width, height] - jsPDF handles rotation via orientation param
    this.pdf = new jsPDF({
      orientation: isLandscape ? "landscape" : "portrait",
      unit: "pt", // POINTS - matches react-pdf
      format: [this.options.paperWidth, this.actualPaperHeight],
    });

    if (!this.measurementMode) {
      console.log(`[PDFGenerator] jsPDF created. Internal page size:`, {
        width: this.pdf.internal.pageSize.getWidth(),
        height: this.pdf.internal.pageSize.getHeight(),
      });
    }

    this.applyFont();
  }

  /**
   * Create a measurement-only generator for calculating content height
   * Used internally for two-pass rendering with dynamic height
   */
  static createForMeasurement(options: PDFGeneratorOptions = {}): PDFGenerator {
    return new PDFGenerator({
      ...options,
      _measurementMode: true,
    });
  }

  /**
   * Check if this generator is in measurement mode
   */
  isMeasurementMode(): boolean {
    return this.measurementMode;
  }

  /**
   * Get the calculated content height (for measurement pass)
   * @param bottomMargin - Bottom margin in points (default: 5pt)
   */
  getContentHeight(bottomMargin: number = 5): number {
    return this.currentY + bottomMargin;
  }

  /**
   * Convert CSS pixels to points
   * CSS pixels to points: 1px ≈ 0.75pt at 96dpi (72pt/inch ÷ 96px/inch)
   */
  pxToPt(px: number): number {
    return px * 0.75;
  }

  /**
   * Convert font size (in CSS pixels) to PDF points
   * CSS pixels to points: 1px ≈ 0.75pt at 96dpi
   */
  pxToPoints(px: number): number {
    return px * 0.75;
  }

  /**
   * Initialize/reset the generator
   */
  initialize(): void {
    // Start with a small offset to avoid jsPDF issues at y=0
    this.currentY = 1;
    this.currentX = 0;
    this.marginLeft = 0;
    this.marginRight = 0;
    this.currentAlign = "left";
    this.currentFontSize = this.options.defaultFontSize;
    this.isBold = false;
    this.contentWidth = this.options.paperWidth;
    this.applyFont();
  }

  /**
   * Set page margins (called when processing Page element)
   * Values are in points (from @react-pdf styles)
   */
  setPageMargins(left: number, right: number, top: number): void {
    // Values are already in points from @react-pdf - no conversion needed
    this.marginLeft = left;
    this.marginRight = right;
    this.currentX = this.marginLeft;
    // Ensure minimum Y position to avoid jsPDF issues at y=0
    this.currentY = Math.max(top, 1);
    this.contentWidth =
      this.options.paperWidth - this.marginLeft - this.marginRight;
  }

  /**
   * Add padding/margin to current position (values in points)
   */
  addPadding(left: number, top: number): void {
    // Values are already in points from @react-pdf - no conversion needed
    this.currentX += left;
    this.currentY += top;
  }

  /**
   * Push horizontal padding - reduces content width and adjusts margin
   * Call popHorizontalPadding to restore
   */
  pushHorizontalPadding(left: number, right: number): void {
    this.marginLeft += left;
    this.marginRight += right;
    this.contentWidth =
      this.options.paperWidth - this.marginLeft - this.marginRight;
  }

  /**
   * Pop horizontal padding - restores previous content width and margins
   */
  popHorizontalPadding(left: number, right: number): void {
    this.marginLeft -= left;
    this.marginRight -= right;
    this.contentWidth =
      this.options.paperWidth - this.marginLeft - this.marginRight;
  }

  /**
   * Apply current font settings to PDF
   * Always applied (even in measurement mode) for accurate font metrics
   */
  private applyFont(): void {
    const fontStyle = this.isBold ? "bold" : "normal";
    this.pdf.setFont(this.options.fontFamily, fontStyle);
    // Ensure font size is valid (minimum 1pt)
    const fontSize = Math.max(this.currentFontSize, 1);
    this.pdf.setFontSize(fontSize);
  }

  /**
   * Get content width in mm
   */
  getContentWidth(): number {
    return this.contentWidth;
  }

  /**
   * Get paper width in mm
   */
  getPaperWidth(): number {
    return this.options.paperWidth;
  }

  /**
   * Get approximate characters per line (for layout calculations)
   */
  getCharsPerLine(): number {
    // Approximate character width based on font size
    // At 10pt, Helvetica is roughly 2.5mm per char average
    const charWidth = (this.currentFontSize / 10) * 2.5;
    return Math.floor(this.contentWidth / charWidth);
  }

  /**
   * Get text width in points using jsPDF's font metrics
   */
  getTextWidth(text: string): number {
    return this.pdf.getTextWidth(text);
  }

  /**
   * Get current Y position
   */
  getCurrentY(): number {
    return this.currentY;
  }

  /**
   * Get current X position (left margin)
   */
  getCurrentX(): number {
    return this.currentX;
  }

  /**
   * Set text alignment
   */
  setAlign(align: TextAlign): void {
    this.currentAlign = align;
  }

  /**
   * Set font size (in points - matching @react-pdf which uses points directly)
   */
  setFontSize(sizeInPt: number): void {
    // Validate input
    if (!Number.isFinite(sizeInPt) || sizeInPt <= 0) {
      console.warn(
        `[PDFGenerator] Invalid font size: ${sizeInPt}pt, using default`
      );
      return;
    }
    // Use directly - PrintNode fontSize is already in points (from @react-pdf)
    this.currentFontSize = sizeInPt;
    this.applyFont();
  }

  /**
   * Set font size directly in points
   */
  setFontSizePoints(sizeInPt: number): void {
    this.currentFontSize = sizeInPt;
    this.applyFont();
  }

  /**
   * Get current font size in points
   */
  getCurrentFontSize(): number {
    return this.currentFontSize;
  }

  /**
   * Set bold state
   */
  setBold(bold: boolean): void {
    this.isBold = bold;
    this.applyFont();
  }

  /**
   * Reset formatting to defaults
   */
  resetFormatting(): void {
    this.currentAlign = "left";
    this.currentFontSize = this.options.defaultFontSize;
    this.isBold = false;
    this.applyFont();
  }

  /**
   * Add text to the PDF
   */
  addText(text: string): void {
    if (!text) return;

    // Validate Y coordinate
    if (!Number.isFinite(this.currentY)) {
      console.warn(
        `[PDFGenerator] Invalid Y coordinate: ${this.currentY}, skipping text: "${text}"`
      );
      return;
    }

    // Ensure Y is at least slightly positive (jsPDF may have issues at y=0)
    if (this.currentY < 0.1) {
      this.currentY = 0.1;
    }

    // Split text into lines if it contains newlines
    const lines = text.split("\n");

    for (const line of lines) {
      if (line.trim()) {
        // Get text width for positioning
        const textWidth = this.pdf.getTextWidth(line);

        // Calculate X position manually to avoid jsPDF alignment bugs
        const x = this.calculateTextX(line, textWidth);

        if (!Number.isFinite(x)) {
          console.warn(
            `[PDFGenerator] Invalid X coordinate: ${x}, skipping text: "${line}"`
          );
          continue;
        }

        // Round coordinates to 2 decimal places to avoid jsPDF floating point issues
        const roundedX = Math.round(x * 100) / 100;
        const roundedY = Math.round(this.currentY * 100) / 100;

        // Skip actual rendering in measurement mode (only track positions)
        if (!this.measurementMode) {
          // Log each text placement for debugging
          console.log(
            `[PDFGenerator] text("${line.substring(0, 20)}${
              line.length > 20 ? "..." : ""
            }", x=${roundedX}, y=${roundedY}, fontSize=${this.currentFontSize}pt)`
          );

          // Use 'top' baseline so Y represents the top of text, not the baseline
          // This matches how @react-pdf positions text
          // Use jsPDF's native alignment for more precise positioning
          this.pdf.text(line, roundedX, roundedY, {
            align: this.currentAlign,
            baseline: "top",
          });
        }
      }
      if (lines.length > 1) {
        this.addNewline();
      }
    }
  }

  /**
   * Add text at a specific alignment position WITHOUT advancing Y
   * Used for placing multiple text elements on the same line (e.g., space-between layout)
   */
  addTextAtPosition(text: string, position: "left" | "center" | "right"): void {
    if (!text) return;

    // Skip actual rendering in measurement mode
    if (this.measurementMode) return;

    let x: number;
    let alignOption: "left" | "center" | "right" = "left";

    switch (position) {
      case "center":
        // For center, x is the center point
        x = this.marginLeft + this.contentWidth / 2;
        alignOption = "center";
        break;
      case "right":
        // For right, x is the RIGHT edge - jsPDF handles text width internally
        x = this.marginLeft + this.contentWidth;
        alignOption = "right";
        break;
      default:
        x = this.marginLeft;
        alignOption = "left";
    }

    const roundedX = Math.round(x * 100) / 100;
    const roundedY = Math.round(this.currentY * 100) / 100;

    console.log(
      `[PDFGenerator] textAtPos("${text.substring(0, 20)}${
        text.length > 20 ? "..." : ""
      }", x=${roundedX}, y=${roundedY}, pos=${position})`
    );

    // Use jsPDF's native alignment - more precise than manual calculation
    this.pdf.text(text, roundedX, roundedY, {
      align: alignOption,
      baseline: "top",
    });
  }

  /**
   * Add text at a specific X offset from the left margin WITHOUT advancing Y
   * Used for multi-column layouts
   */
  addTextAtX(text: string, xOffset: number): void {
    if (!text) return;

    // Skip actual rendering in measurement mode
    if (this.measurementMode) return;

    const x = this.marginLeft + xOffset;
    const roundedX = Math.round(x * 100) / 100;
    const roundedY = Math.round(this.currentY * 100) / 100;

    console.log(
      `[PDFGenerator] textAtX("${text.substring(0, 20)}${
        text.length > 20 ? "..." : ""
      }", x=${roundedX}, y=${roundedY})`
    );

    this.pdf.text(text, roundedX, roundedY, { baseline: "top" });
  }

  /**
   * Calculate X position for text based on alignment
   * Returns anchor point for jsPDF's native alignment:
   * - left: left edge
   * - center: center point
   * - right: right edge
   */
  private calculateTextX(text: string, textWidth?: number): number {
    switch (this.currentAlign) {
      case "center": {
        // Center point of content area
        return Number((this.marginLeft + this.contentWidth / 2).toFixed(6));
      }
      case "right": {
        // Right edge - jsPDF's native alignment handles text width
        // Small buffer (2pt) to account for font metric variations
        return Number((this.marginLeft + this.contentWidth - 2).toFixed(6));
      }
      default:
        // Left alignment - left edge
        return Number(this.marginLeft.toFixed(6));
    }
  }

  /**
   * Add text with automatic word wrapping
   */
  addWrappedText(text: string): void {
    if (!text) return;

    const maxWidth = this.contentWidth;
    const lines = this.pdf.splitTextToSize(text, maxWidth);

    for (const line of lines) {
      this.addText(line);
      this.addNewline();
    }
  }

  /**
   * Add a newline (advance Y position)
   */
  addNewline(count: number = 1): void {
    // Font size is already in points, calculate line height in points
    const lineHeightPt = this.currentFontSize * this.options.lineHeight;
    this.currentY += lineHeightPt * count;
    this.checkPageBreak();
  }

  /**
   * Add vertical spacing in points (values from @react-pdf styles are already in points)
   */
  addSpacing(pt: number): void {
    this.currentY += pt;
    this.checkPageBreak();
  }

  /**
   * Add a horizontal divider line
   * Does NOT advance Y - spacing should come from View margins
   */
  addDivider(style: "solid" | "dashed" = "solid"): void {
    // Skip actual rendering in measurement mode
    if (this.measurementMode) return;

    const startX = this.marginLeft;
    const endX = this.options.paperWidth - this.marginRight;
    const y = this.currentY;

    this.pdf.setLineWidth(1); // 1pt line width

    if (style === "dashed") {
      // Draw dashed line
      this.pdf.setLineDashPattern([2, 2], 0);
    } else {
      this.pdf.setLineDashPattern([], 0);
    }

    this.pdf.line(startX, y, endX, y);
    this.pdf.setLineDashPattern([], 0); // Reset to solid
  }

  /**
   * Add an image to the PDF
   */
  async addImage(
    source: string,
    width?: number,
    height?: number
  ): Promise<void> {
    try {
      // Default width to content width, maintain aspect ratio
      const imgWidth = width ?? this.contentWidth * 0.5;
      const imgHeight = height ?? imgWidth; // Square by default

      // Skip actual rendering in measurement mode, but still track Y position
      if (!this.measurementMode) {
        const x = this.getImageXPosition(imgWidth);
        // Add the image
        this.pdf.addImage(source, "PNG", x, this.currentY, imgWidth, imgHeight);
      }

      // Advance Y position (no extra newline - View margins handle spacing)
      this.currentY += imgHeight;
    } catch (error) {
      console.error("[PDFGenerator] Failed to add image:", error);
    }
  }

  /**
   * Get X position based on current alignment
   */
  private getXPosition(): number {
    switch (this.currentAlign) {
      case "center":
        return this.marginLeft + this.contentWidth / 2;
      case "right":
        return this.options.paperWidth - this.marginRight;
      default:
        return this.marginLeft;
    }
  }

  /**
   * Get X position for an image based on alignment
   */
  private getImageXPosition(imageWidth: number): number {
    switch (this.currentAlign) {
      case "center":
        return this.marginLeft + (this.contentWidth - imageWidth) / 2;
      case "right":
        return this.options.paperWidth - this.marginRight - imageWidth;
      default:
        return this.marginLeft;
    }
  }

  /**
   * Check if we need to add a new page (only for fixed height)
   */
  private checkPageBreak(): void {
    // For dynamic height, no page breaks - content flows continuously
    if (this.isDynamicHeight) return;

    // Skip page breaks in measurement mode
    if (this.measurementMode) return;

    // Skip page breaks when disabled (thermal receipt-style output)
    if (this.noPageBreaks) return;

    const maxY = this.actualPaperHeight - 10; // 10mm bottom margin

    if (this.currentY > maxY) {
      this.pdf.addPage([this.options.paperWidth, this.actualPaperHeight]);
      this.currentY = 5; // Reset to default top margin
    }
  }

  /**
   * Finalize the page height (legacy method, kept for backwards compatibility)
   *
   * Note: With two-pass rendering, the height is set correctly at PDF creation time,
   * so this method is now a no-op. It's kept for backwards compatibility.
   *
   * @param _bottomMargin - Unused (kept for backwards compatibility)
   */
  finalizePageHeight(_bottomMargin: number = 5): void {
    // No-op: Two-pass rendering sets the correct height at creation time
    console.log(
      `[PDFGenerator] finalizePageHeight called. Page height: ${this.actualPaperHeight}pt`
    );
  }

  /**
   * Get the generated PDF as a Blob
   */
  getBlob(): Blob {
    return this.pdf.output("blob");
  }

  /**
   * Get the generated PDF as a data URL
   */
  getDataUrl(): string {
    return this.pdf.output("dataurlstring");
  }

  /**
   * Get the generated PDF as ArrayBuffer
   */
  getArrayBuffer(): ArrayBuffer {
    return this.pdf.output("arraybuffer");
  }

  /**
   * Download the PDF
   */
  save(filename: string): void {
    this.pdf.save(filename);
  }
}
