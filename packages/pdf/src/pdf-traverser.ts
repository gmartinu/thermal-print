/**
 * PDF Tree Traverser
 *
 * Walks through the PrintNode tree and generates vector PDF using PDFGenerator.
 * Similar to ESC/POS TreeTraverser but outputs to PDF.
 *
 * Reads all styling from the PrintNode tree (like @react-pdf/renderer does)
 * to produce identical output without hardcoded values.
 */

import { PrintNode } from "@thermal-print/core";
import { PDFGenerator } from "./pdf-generator";

/**
 * Style extraction utilities
 */
function extractTextStyle(style: any): {
  fontSize?: number;
  fontWeight?: string | number;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
  color?: string;
  backgroundColor?: string;
} {
  if (!style) return {};

  return {
    fontSize: style.fontSize,
    fontWeight: style.fontWeight,
    fontFamily: style.fontFamily,
    textAlign: style.textAlign,
    color: style.color,
    backgroundColor: style.backgroundColor,
  };
}

function extractViewStyle(style: any): {
  flexDirection?: "row" | "column";
  justifyContent?: string;
  alignItems?: string;
  borderTop?: string;
  borderBottom?: string;
  padding?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  margin?: number;
  marginTop?: number;
  marginBottom?: number;
  width?: string | number;
  height?: string | number;
} {
  if (!style) return {};

  return {
    flexDirection: style.flexDirection,
    justifyContent: style.justifyContent,
    alignItems: style.alignItems,
    borderTop: style.borderTop,
    borderBottom: style.borderBottom,
    padding: style.padding,
    paddingTop: style.paddingTop,
    paddingBottom: style.paddingBottom,
    paddingLeft: style.paddingLeft,
    paddingRight: style.paddingRight,
    margin: style.margin,
    marginTop: style.marginTop,
    marginBottom: style.marginBottom,
    width: style.width,
    height: style.height,
  };
}

function mapTextAlign(align?: string): "left" | "center" | "right" {
  if (align === "center") return "center";
  if (align === "right") return "right";
  return "left";
}

/**
 * Parse a height/width value that may be a number or string like "1px"
 * Returns the numeric value (assumes points for numbers, converts px to pt)
 */
function parseSize(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === "number") return value;

  // Parse string values like "1px", "10pt", or just "5"
  const match = value.match(/^([\d.]+)(px|pt)?$/);
  if (match) {
    const num = parseFloat(match[1]);
    const unit = match[2];
    // Convert px to pt (1px ≈ 0.75pt at 96dpi)
    if (unit === "px") return num * 0.75;
    return num; // pt or unitless (assume pt)
  }
  return 0;
}

/**
 * Parse a percentage value like "20%" to a decimal (0.20)
 * Returns undefined if not a percentage
 */
function parsePercentage(value: string | number | undefined): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "string" && value.endsWith("%")) {
    return parseFloat(value) / 100;
  }
  return undefined;
}

/**
 * Horizontal breathing room kept between adjacent column boxes, in points.
 * Without it a wrapped cell can touch the next column's first glyph.
 */
const COLUMN_GUTTER = 2;

/** A single cell of a `flexDirection: "row"` View. */
interface RowColumn {
  content: string;
  fontSize?: number;
  bold: boolean;
  align: "left" | "center" | "right";
  /** percentage as decimal (0.20 for "20%") */
  width?: number;
}

function isBold(style: any): boolean {
  if (!style) return false;

  if (style.fontWeight === "bold" || style.fontWeight >= 700) return true;
  if (style.fontFamily?.toLowerCase().includes("bold")) return true;

  return false;
}

/**
 * PDF Tree Traverser
 */
export class PDFTraverser {
  private generator: PDFGenerator;
  private widthConstraint: number | undefined; // Current width constraint from parent View
  private alignmentContext: "left" | "center" | "right" = "left"; // Alignment from parent View

  constructor(generator: PDFGenerator) {
    this.generator = generator;
  }

  /**
   * Traverse the entire tree starting from root
   */
  async traverse(node: PrintNode | null): Promise<void> {
    if (!node) return;

    const nodeType = node.type.toLowerCase();

    switch (nodeType) {
      case "document":
        await this.handleDocument(node);
        break;
      case "page":
        await this.handlePage(node);
        break;
      case "view":
        await this.handleView(node);
        break;
      case "text":
        await this.handleText(node);
        break;
      case "textnode":
        await this.handleTextNode(node);
        break;
      case "image":
        await this.handleImage(node);
        break;
      default:
        await this.traverseChildren(node);
    }
  }

  /**
   * Handle Document element
   */
  private async handleDocument(node: PrintNode): Promise<void> {
    this.generator.initialize();
    await this.traverseChildren(node);
  }

  /**
   * Handle Page element
   * Reads size and style from the Page props to set margins
   */
  private async handlePage(node: PrintNode): Promise<void> {
    // Read page style for margins
    const style = node.style || {};
    const paddingLeft = style.paddingLeft ?? style.padding ?? 0;
    const paddingRight = style.paddingRight ?? style.padding ?? 0;
    const paddingTop = style.paddingTop ?? style.padding ?? 0;

    // Set page margins from the Page component's style
    this.generator.setPageMargins(paddingLeft, paddingRight, paddingTop);

    await this.traverseChildren(node);
  }

  /**
   * Handle View element (container with layout)
   * Follows CSS box model order: margin → border → padding → content → padding → border → margin
   */
  private async handleView(node: PrintNode): Promise<void> {
    const viewStyle = extractViewStyle(node.style);
    const padding = viewStyle.padding ?? 0;
    const margin = viewStyle.margin ?? 0;

    // 1. Apply margin top (space before element's border box)
    const marginTop = viewStyle.marginTop ?? margin;
    if (marginTop > 0) {
      this.generator.addSpacing(marginTop);
    }

    // 2. Apply border top
    if (viewStyle.borderTop) {
      const isDashed = viewStyle.borderTop.includes("dashed");
      this.generator.addDivider(isDashed ? "dashed" : "solid");
    }

    // 3. Apply padding top (inside element, before content)
    const paddingTop = viewStyle.paddingTop ?? padding;
    if (paddingTop > 0) {
      this.generator.addSpacing(paddingTop);
    }

    // 4. Handle horizontal padding for children
    const paddingLeft = viewStyle.paddingLeft ?? padding;
    const paddingRight = viewStyle.paddingRight ?? padding;
    if (paddingLeft > 0 || paddingRight > 0) {
      this.generator.pushHorizontalPadding(paddingLeft, paddingRight);
    }

    // 5. Track width constraint if this View has explicit percentage width
    const previousWidthConstraint = this.widthConstraint;
    const widthPercent = parsePercentage(viewStyle.width);
    if (widthPercent !== undefined) {
      // Calculate actual width in points based on current content width
      this.widthConstraint = this.generator.getContentWidth() * widthPercent;
    }

    // 5b. Track alignment context from View's alignItems (for column layouts)
    // In CSS flexbox, alignItems: "center" on a column container centers children horizontally
    const previousAlignmentContext = this.alignmentContext;
    if (viewStyle.flexDirection !== "row" && viewStyle.alignItems === "center") {
      this.alignmentContext = "center";
    } else if (viewStyle.flexDirection !== "row" && viewStyle.alignItems === "flex-end") {
      this.alignmentContext = "right";
    }

    // 6. Process children OR apply explicit height for empty views
    if (node.children.length > 0) {
      if (viewStyle.flexDirection === "row") {
        await this.handleRowLayout(node);
      } else {
        await this.handleColumnLayout(node);
      }
    } else {
      // Empty view - apply explicit height if specified (e.g., divider with height: "1px")
      const height = parseSize(viewStyle.height);
      if (height > 0) {
        this.generator.addSpacing(height);
      }
    }

    // 7. Restore previous width constraint and alignment context
    this.widthConstraint = previousWidthConstraint;
    this.alignmentContext = previousAlignmentContext;

    // 8. Pop horizontal padding
    if (paddingLeft > 0 || paddingRight > 0) {
      this.generator.popHorizontalPadding(paddingLeft, paddingRight);
    }

    // 9. Apply padding bottom (inside element, after content)
    const paddingBottom = viewStyle.paddingBottom ?? padding;
    if (paddingBottom > 0) {
      this.generator.addSpacing(paddingBottom);
    }

    // 10. Apply border bottom (BEFORE marginBottom!)
    if (viewStyle.borderBottom) {
      const isDashed = viewStyle.borderBottom.includes("dashed");
      this.generator.addDivider(isDashed ? "dashed" : "solid");
    }

    // 11. Apply margin bottom (space after element's border box)
    const marginBottom = viewStyle.marginBottom ?? margin;
    if (marginBottom > 0) {
      this.generator.addSpacing(marginBottom);
    }
  }

  /**
   * Handle column layout (stacked vertically)
   */
  private async handleColumnLayout(node: PrintNode): Promise<void> {
    for (const child of node.children) {
      await this.traverse(child);
    }
  }

  /**
   * Handle row layout (side-by-side columns)
   * Uses actual PDF positioning instead of character-based spacing
   */
  private async handleRowLayout(node: PrintNode): Promise<void> {
    const children = node.children;
    if (children.length === 0) return;

    // Single child - render normally
    if (children.length === 1) {
      await this.traverse(children[0]);
      return;
    }

    const viewStyle = extractViewStyle(node.style);
    const isSpaceBetween = viewStyle.justifyContent === "space-between";
    const isCenter = viewStyle.justifyContent === "center";

    // Collect column data with text content, styles, and widths
    const columns: RowColumn[] = [];

    for (const child of children) {
      const content = this.collectTextContent(child);
      const textNode = this.findFirstTextNode(child);
      const textStyle = textNode ? extractTextStyle(textNode.style) : {};
      const childViewStyle = extractViewStyle(child.style);

      // Determine alignment from text style or view style
      let align: "left" | "center" | "right" = "left";
      if (textStyle.textAlign) {
        align = mapTextAlign(textStyle.textAlign);
      } else if (
        childViewStyle.alignItems === "flex-end" ||
        childViewStyle.justifyContent === "flex-end"
      ) {
        align = "right";
      } else if (
        childViewStyle.alignItems === "center" ||
        childViewStyle.justifyContent === "center"
      ) {
        align = "center";
      }

      // Extract width percentage if specified
      const widthPercent = parsePercentage(childViewStyle.width);

      columns.push({
        content,
        fontSize: textStyle.fontSize,
        bold: textNode ? isBold(textNode.style) : false,
        align,
        width: widthPercent,
      });
    }

    // Get font size from first column for line height calculation
    const rowFontSize = columns[0]?.fontSize;
    const contentWidth = this.generator.getContentWidth();

    // Check if columns have explicit widths (like "20%", "80%")
    const hasExplicitWidths = columns.some((c) => c.width !== undefined);

    if (hasExplicitWidths) {
      // Position columns based on their explicit widths.
      // Each column is wrapped inside its OWN box, so a long cell grows the row
      // downwards instead of running over the next column and off the paper.
      let xOffset = 0;
      let extraHeight = 0;

      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        if (col.fontSize) this.generator.setFontSize(col.fontSize);
        if (col.bold) this.generator.setBold(true);

        const remaining = Math.max(contentWidth - xOffset, 1);
        const boxWidth =
          col.width !== undefined
            ? Math.min(col.width * contentWidth, remaining)
            : remaining;
        const isLast = i === columns.length - 1;
        const usableWidth = isLast
          ? boxWidth
          : Math.max(boxWidth - COLUMN_GUTTER, 1);

        // Position text at the start of this column
        const lines = this.generator.addTextBlockAtX(
          col.content,
          xOffset,
          usableWidth
        );
        extraHeight = Math.max(
          extraHeight,
          (lines - 1) * this.generator.getLineAdvance()
        );

        // Move to the next column position
        if (col.width !== undefined) {
          xOffset += col.width * contentWidth;
        }

        if (col.bold) this.generator.setBold(false);
      }
      // Add newline BEFORE reset so it uses the row's font size
      if (rowFontSize) this.generator.setFontSize(rowFontSize);
      this.generator.addNewline();
      if (extraHeight > 0) this.generator.addSpacing(extraHeight);
      this.generator.resetFormatting();
    } else if (isCenter && columns.length >= 1) {
      // Handle center layout: group all columns and center them together
      // First, calculate total width of all text with spacing
      const columnWidths = this.measureColumns(columns);
      let totalWidth = columnWidths.reduce((sum, w) => sum + w, 0);

      // Add small gap between columns (5pt per gap)
      const gap = 5;
      totalWidth += gap * (columns.length - 1);

      // The group does not fit on one line: stack each column as its own
      // centered wrapped block instead of letting it spill off the paper.
      if (totalWidth > contentWidth) {
        for (const col of columns) {
          if (col.fontSize) this.generator.setFontSize(col.fontSize);
          if (col.bold) this.generator.setBold(true);
          this.generator.setAlign("center");
          this.generator.addText(col.content);
          this.generator.addNewline();
          if (col.bold) this.generator.setBold(false);
        }
        this.generator.resetFormatting();
        return;
      }

      // Calculate starting X offset to center the group
      const startX = (contentWidth - totalWidth) / 2;
      let currentX = startX;

      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        if (col.fontSize) this.generator.setFontSize(col.fontSize);
        if (col.bold) this.generator.setBold(true);

        this.generator.addTextAtX(col.content, currentX);
        currentX += columnWidths[i] + gap;

        if (col.bold) this.generator.setBold(false);
      }

      // Add newline BEFORE reset so it uses the row's font size
      if (rowFontSize) this.generator.setFontSize(rowFontSize);
      this.generator.addNewline();
      this.generator.resetFormatting();
    } else if (isSpaceBetween && columns.length >= 2) {
      // Handle space-between layout: first at left, last at right, middle distributed
      const naturalWidths = this.measureColumns(columns);
      const gap = COLUMN_GUTTER * 2;
      const naturalTotal =
        naturalWidths.reduce((sum, w) => sum + w, 0) +
        gap * (columns.length - 1);

      if (naturalTotal <= contentWidth) {
        // Everything fits on one line - keep the exact single-line placement
        for (let i = 0; i < columns.length; i++) {
          const col = columns[i];
          if (col.fontSize) this.generator.setFontSize(col.fontSize);
          if (col.bold) this.generator.setBold(true);

          if (i === 0) {
            // First column: left-aligned
            this.generator.addTextAtPosition(col.content, "left");
          } else if (i === columns.length - 1) {
            // Last column: right-aligned
            this.generator.addTextAtPosition(col.content, "right");
          } else {
            // Middle columns: distributed evenly
            const spacing = contentWidth / (columns.length - 1);
            const xOffset = i * spacing;
            this.generator.addTextAtX(col.content, xOffset);
          }

          if (col.bold) this.generator.setBold(false);
        }
        if (rowFontSize) this.generator.setFontSize(rowFontSize);
        this.generator.addNewline();
        this.generator.resetFormatting();
        return;
      }

      // Does not fit: give the trailing column (usually a value) its natural
      // width and wrap the remaining columns into what is left.
      const lastIndex = columns.length - 1;
      const lastWidth = Math.min(
        Math.max(naturalWidths[lastIndex], 1),
        contentWidth * 0.5
      );
      const leadingWidth = Math.max(
        contentWidth - lastWidth - gap,
        1
      );
      const leadingSlot = leadingWidth / lastIndex;
      let extraHeight = 0;

      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        if (col.fontSize) this.generator.setFontSize(col.fontSize);
        if (col.bold) this.generator.setBold(true);

        const lines =
          i === lastIndex
            ? this.generator.addTextBlockAtX(
                col.content,
                contentWidth - lastWidth,
                lastWidth,
                "right"
              )
            : this.generator.addTextBlockAtX(
                col.content,
                i * leadingSlot,
                Math.max(leadingSlot - COLUMN_GUTTER, 1)
              );
        extraHeight = Math.max(
          extraHeight,
          (lines - 1) * this.generator.getLineAdvance()
        );

        if (col.bold) this.generator.setBold(false);
      }
      if (rowFontSize) this.generator.setFontSize(rowFontSize);
      this.generator.addNewline();
      if (extraHeight > 0) this.generator.addSpacing(extraHeight);
      this.generator.resetFormatting();
    } else if (columns.length >= 2) {
      // For non-space-between layouts, distribute evenly across the content width
      const colWidth = contentWidth / columns.length;
      let extraHeight = 0;

      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        if (col.fontSize) this.generator.setFontSize(col.fontSize);
        if (col.bold) this.generator.setBold(true);

        // Calculate X position for this column
        const colX = i * colWidth;
        const isLast = i === columns.length - 1;
        const usableWidth = isLast
          ? Math.max(contentWidth - colX, 1)
          : Math.max(colWidth - COLUMN_GUTTER, 1);
        const lines = this.generator.addTextBlockAtX(
          col.content,
          colX,
          usableWidth
        );
        extraHeight = Math.max(
          extraHeight,
          (lines - 1) * this.generator.getLineAdvance()
        );

        if (col.bold) this.generator.setBold(false);
      }
      // Add newline BEFORE reset so it uses the row's font size
      if (rowFontSize) this.generator.setFontSize(rowFontSize);
      this.generator.addNewline();
      if (extraHeight > 0) this.generator.addSpacing(extraHeight);
      this.generator.resetFormatting();
    } else {
      // Single column fallback
      const col = columns[0];
      if (col.fontSize) this.generator.setFontSize(col.fontSize);
      if (col.bold) this.generator.setBold(true);
      this.generator.setAlign(col.align);
      this.generator.addText(col.content);
      if (col.bold) this.generator.setBold(false);
      // Add newline BEFORE reset so it uses the actual font size
      this.generator.addNewline();
      this.generator.resetFormatting();
    }
  }

  /**
   * Natural (unwrapped) width of every column, measured with its own font.
   * Leaves the generator's font on the last column's settings - every render
   * path below re-applies the font per column before drawing.
   */
  private measureColumns(columns: RowColumn[]): number[] {
    return columns.map((col) => {
      if (col.fontSize) this.generator.setFontSize(col.fontSize);
      if (col.bold) this.generator.setBold(true);
      const width = this.generator.getTextWidth(col.content);
      if (col.bold) this.generator.setBold(false);
      return width;
    });
  }

  /**
   * Find the first Text node in a tree
   */
  private findFirstTextNode(node: PrintNode): PrintNode | null {
    const normalizedType = node.type.toLowerCase();
    if (normalizedType === "text") {
      return node;
    }

    for (const child of node.children) {
      const found = this.findFirstTextNode(child);
      if (found) return found;
    }

    return null;
  }

  /**
   * Collect text content from a node and its children
   */
  private collectTextContent(node: PrintNode): string {
    let text = "";

    const normalizedType = node.type.toLowerCase();
    if (normalizedType === "text" || normalizedType === "textnode") {
      if (node.props.children !== undefined) {
        text += String(node.props.children);
      }
    }

    for (const child of node.children) {
      text += this.collectTextContent(child);
    }

    return text;
  }

  /**
   * Handle Text element
   * Reads fontSize, fontWeight, textAlign from the node's style
   */
  private async handleText(node: PrintNode): Promise<void> {
    const textStyle = extractTextStyle(node.style);

    // Apply text alignment: use explicit textAlign if present, else use parent's alignment context
    if (textStyle.textAlign) {
      this.generator.setAlign(mapTextAlign(textStyle.textAlign));
    } else if (this.alignmentContext !== "left") {
      // Inherit alignment from parent View's alignItems
      this.generator.setAlign(this.alignmentContext);
    }

    // Apply font size from style (in CSS pixels)
    if (textStyle.fontSize) {
      this.generator.setFontSize(textStyle.fontSize);
    }

    // Apply bold
    if (isBold(node.style)) {
      this.generator.setBold(true);
    }

    // Apply text color and background band (inverted highlights)
    if (textStyle.color) {
      this.generator.setTextColor(textStyle.color);
    }
    if (textStyle.backgroundColor) {
      this.generator.setBackgroundColor(textStyle.backgroundColor);
    }

    // Collect ALL text content from this Text element and its TextNode children
    // This ensures the entire line is rendered together (important for centering)
    const fullText = this.collectTextContent(node);

    if (fullText) {
      this.generator.addText(fullText);
    }

    // Add newline BEFORE reset so it uses the actual font size for line height
    this.generator.addNewline();
    this.generator.resetFormatting();
  }

  /**
   * Handle TextNode (raw text) - only used when TextNode is a direct child of non-Text element
   * Normally TextNodes are collected by handleText via collectTextContent
   */
  private async handleTextNode(node: PrintNode): Promise<void> {
    // TextNodes inside Text elements are handled by collectTextContent
    // This only handles orphan TextNodes (which shouldn't normally happen)
    if (node.props.children) {
      this.generator.addText(String(node.props.children));
    }
  }

  /**
   * Handle Image element
   * Uses width constraint from parent View if available
   * Uses alignment context from parent View if available
   */
  private async handleImage(node: PrintNode): Promise<void> {
    const source = node.props.source || node.props.src;

    if (source) {
      const style = extractViewStyle(node.style);
      const textStyle = extractTextStyle(node.style);

      // Determine alignment: check own style first, then use parent's alignment context
      let align: "left" | "center" | "right" = "left";
      if (textStyle.textAlign) {
        align = mapTextAlign(textStyle.textAlign);
      } else if (
        style.justifyContent === "center" ||
        style.alignItems === "center"
      ) {
        align = "center";
      } else if (this.alignmentContext !== "left") {
        // Inherit alignment from parent View's alignItems
        align = this.alignmentContext;
      }

      // Use parent's width constraint if available, otherwise default to 50% of content width
      const imgWidth = this.widthConstraint ?? this.generator.getContentWidth() * 0.5;
      const imgHeight = imgWidth; // Square for QR codes

      this.generator.setAlign(align);
      await this.generator.addImage(source, imgWidth, imgHeight);
      this.generator.setAlign("left");
    }
  }

  /**
   * Traverse children nodes
   */
  private async traverseChildren(node: PrintNode): Promise<void> {
    for (const child of node.children) {
      await this.traverse(child);
    }
  }
}
