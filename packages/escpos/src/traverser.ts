import { ElementNode } from "@thermal-print/core";
import { ESCPOSGenerator } from "./generator";
import {
  alignTextInColumn,
  calculateHorizontalSpacing,
  distributeColumnWidths,
  distributeGaps,
  extractTextStyle,
  extractViewStyle,
  FontLevel,
  FONT_LEVEL_COLUMN_UNITS,
  isBold,
  mapTextAlign,
  mergeStyles,
  parsePercentageWidth,
  parseSize,
  wrapText,
} from "./styles";

type Align = "left" | "center" | "right";

interface RowCell {
  /** Raw width from the child View style, before distribution. */
  rawWidth: string | number | undefined;
  content: string;
  align: Align;
  /** Style of the first Text node inside the cell, when it has one. */
  textStyle: any | null;
}

/**
 * Tree Traverser
 * Walks through the element tree and generates ESC/POS commands
 */
export class TreeTraverser {
  private generator: ESCPOSGenerator;

  /**
   * Alignment inherited from an ancestor View's `alignItems`, mirroring
   * PDFTraverser.alignmentContext. A Text or Image without its own textAlign
   * follows it.
   */
  private alignmentContext: Align = "left";

  /** Fraction of the line an ancestor View's percentage width allows (0.3 for "30%"). */
  private widthFraction: number | undefined;

  constructor(generator: ESCPOSGenerator) {
    this.generator = generator;
  }

  /**
   * Traverse the entire tree starting from root
   */
  async traverse(node: ElementNode | null): Promise<void> {
    if (!node) return;

    // Work with lowercase normalized types
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
        // Unknown element, traverse children
        await this.traverseChildren(node);
    }
  }

  /**
   * Handle Document element
   */
  private async handleDocument(node: ElementNode): Promise<void> {
    this.generator.initialize();
    await this.traverseChildren(node);
    // Add blank lines at end for paper feed spacing
    this.generator.addNewline(2);
  }

  /**
   * Handle Page element.
   *
   * In "rico" mode the Page padding becomes the receipt margin, the same way
   * PDFTraverser.handlePage turns it into page margins. Margins arrive in
   * points; the generator clamps them so they can never eat the whole line.
   */
  private async handlePage(node: ElementNode): Promise<void> {
    if (!this.generator.isRichStyleMode()) {
      await this.traverseChildren(node);
      return;
    }

    const style = node.style || {};
    const padding = style.padding;
    const left = calculateHorizontalSpacing(style.paddingLeft ?? padding);
    const right = calculateHorizontalSpacing(style.paddingRight ?? padding);
    const hasHorizontalPadding = left > 0 || right > 0;

    if (hasHorizontalPadding) {
      this.generator.pushHorizontalPadding(left, right);
    }
    this.generator.addSpacing(style.paddingTop ?? padding);

    await this.traverseChildren(node);

    this.generator.addSpacing(style.paddingBottom ?? padding);
    if (hasHorizontalPadding) {
      this.generator.popHorizontalPadding();
    }
  }

  /**
   * Handle View element (container with layout)
   */
  private async handleView(node: ElementNode): Promise<void> {
    const viewStyle = extractViewStyle(node.style);
    const rich = this.generator.isRichStyleMode();

    // margin-top -> border-top -> padding-top
    this.generator.applyViewSpacing(node.style, "before");

    // Horizontal padding shrinks the line for everything inside this View
    let hasHorizontalPadding = false;
    if (rich) {
      const padding = viewStyle.padding;
      const left = calculateHorizontalSpacing(viewStyle.paddingLeft ?? padding);
      const right = calculateHorizontalSpacing(viewStyle.paddingRight ?? padding);
      hasHorizontalPadding = left > 0 || right > 0;
      if (hasHorizontalPadding) {
        this.generator.pushHorizontalPadding(left, right);
      }
    }

    // A percentage width constrains images drawn inside this View
    const previousWidthFraction = this.widthFraction;
    const widthFraction = parsePercentageWidth(viewStyle.width);
    if (widthFraction !== undefined) {
      this.widthFraction = widthFraction;
    }

    // alignItems on a column container aligns its children horizontally
    const previousAlignment = this.alignmentContext;
    if (viewStyle.flexDirection !== "row") {
      if (viewStyle.alignItems === "center") {
        this.alignmentContext = "center";
      } else if (viewStyle.alignItems === "flex-end") {
        this.alignmentContext = "right";
      }
    }

    if (node.children.length > 0) {
      if (viewStyle.flexDirection === "row") {
        await this.handleRowLayout(node);
      } else {
        await this.handleColumnLayout(node);
      }
    } else {
      // An empty View with an explicit height is a spacer, not a no-op
      this.generator.addSpacing(parseSize(viewStyle.height));
    }

    this.alignmentContext = previousAlignment;
    this.widthFraction = previousWidthFraction;
    if (hasHorizontalPadding) {
      this.generator.popHorizontalPadding();
    }

    // padding-bottom -> border-bottom -> margin-bottom
    this.generator.applyViewSpacing(node.style, "after");
  }

  /**
   * Handle column layout (stacked vertically)
   */
  private async handleColumnLayout(node: ElementNode): Promise<void> {
    for (const child of node.children) {
      await this.traverse(child);
    }
  }

  /**
   * Handle row layout (side-by-side columns)
   */
  private async handleRowLayout(node: ElementNode): Promise<void> {
    const children = node.children;
    if (children.length === 0) return;

    // If there's only 1 child, just render it normally (not as a row)
    // This prevents nested column layouts from being flattened
    if (children.length === 1) {
      await this.traverse(children[0]);
      return;
    }

    const viewStyle = extractViewStyle(node.style);
    const rich = this.generator.isRichStyleMode();

    const isSpaceBetween = viewStyle.justifyContent === "space-between";
    const isCentered = viewStyle.justifyContent === "center";

    const cells: RowCell[] = [];
    for (const child of children) {
      const childStyle = extractViewStyle(child.style);
      const content = await this.collectTextContent(child);
      const textNode = this.findFirstTextNode(child);

      // Alignment: the cell's own Text wins, then the cell View's own flex props
      let align: Align = "left";
      if (textNode && textNode.style) {
        align = mapTextAlign(extractTextStyle(textNode.style).textAlign);
      } else if (childStyle.alignItems === "center" || childStyle.justifyContent === "center") {
        align = "center";
      } else if (childStyle.alignItems === "flex-end" || childStyle.justifyContent === "flex-end") {
        align = "right";
      }

      cells.push({
        rawWidth: childStyle.width,
        content,
        align,
        textStyle: textNode?.style ? mergeStyles(textNode.style) : null,
      });
    }

    const hasExplicitWidths = cells.some((cell) => cell.rawWidth !== undefined);
    // space-between / centered place the cells by their content, not on a grid
    const usesColumnGrid = hasExplicitWidths || (!isSpaceBetween && !isCentered);

    // The row prints in the font of its first Text node; column widths are
    // measured in characters of THAT font, so the print mode goes first.
    const rowTextStyle = cells[0]?.textStyle ?? null;
    if (rowTextStyle || rich) {
      this.generator.applyTextStyle(rowTextStyle ?? {}, {
        inheritedAlign: this.alignmentContext,
      });
    }

    const rowLevel = this.generator.getFontLevel();
    const rowBold = isBold(extractTextStyle(rowTextStyle));
    const paperWidth = this.generator.getPaperWidth();
    const widths = distributeColumnWidths(
      cells.map((cell) => cell.rawWidth),
      paperWidth
    );

    // In "rico" a cell may print one level up or down from the row; a bigger
    // character eats more of the column, so the capacity is not the width.
    const cellLevels: FontLevel[] = cells.map((cell) =>
      rich && cell.textStyle ? this.generator.resolveTextLevel(cell.textStyle.fontSize) : rowLevel
    );
    const cellBolds = cells.map((cell) =>
      rich && cell.textStyle ? isBold(extractTextStyle(cell.textStyle)) : rowBold
    );
    const capacities = widths.map((width, i) =>
      Math.max(
        1,
        Math.floor(
          (width * FONT_LEVEL_COLUMN_UNITS[rowLevel]) / FONT_LEVEL_COLUMN_UNITS[cellLevels[i]]
        )
      )
    );

    const perCellStyles =
      rich && cellLevels.some((level, i) => level !== rowLevel || cellBolds[i] !== rowBold);

    // A cell wider than its column wraps onto the next row line — it used to be
    // silently truncated, which lost the end of long product names.
    const columnLines = cells.map((cell, i) =>
      cell.content
        .split("\n")
        .flatMap((line) => (usesColumnGrid ? wrapText(line, capacities[i]) : [line]))
    );
    const maxLines = Math.max(...columnLines.map((lines) => lines.length));

    for (let lineIdx = 0; lineIdx < maxLines; lineIdx++) {
      if (usesColumnGrid) {
        this.emitGridLine(columnLines, capacities, cells, lineIdx, {
          perCellStyles,
          cellLevels,
          cellBolds,
          rowLevel,
          rowBold,
        });
      } else if (isSpaceBetween) {
        const parts = columnLines.map((lines) => lines[lineIdx] || "");
        const used = parts.reduce((sum, part) => sum + part.length, 0);
        const gaps = distributeGaps(used, paperWidth, parts.length - 1);
        let rowText = parts[0];
        for (let i = 1; i < parts.length; i++) {
          rowText += " ".repeat(gaps[i - 1]) + parts[i];
        }
        this.generator.addText(rowText);
      } else {
        const parts = columnLines.map((lines) => lines[lineIdx] || "");
        const spacingBetweenColumns = Math.max(0, parts.length - 1);
        const totalContentWidth =
          parts.reduce((sum, part) => sum + part.length, 0) + spacingBetweenColumns;
        const leadingSpaces = Math.max(0, Math.floor((paperWidth - totalContentWidth) / 2));
        this.generator.addText(" ".repeat(leadingSpaces) + parts.join(" "));
      }

      this.generator.addNewline();
    }

    // Reset formatting after the row
    if (rowTextStyle || rich) {
      this.generator.resetFormatting();
    }
  }

  /**
   * Emits one line of a column-grid row, padding every cell to its capacity.
   * With per-cell styling the cells are printed one by one so each can carry
   * its own print mode; otherwise the whole line goes out as a single string.
   */
  private emitGridLine(
    columnLines: string[][],
    capacities: number[],
    cells: RowCell[],
    lineIdx: number,
    style: {
      perCellStyles: boolean;
      cellLevels: FontLevel[];
      cellBolds: boolean[];
      rowLevel: FontLevel;
      rowBold: boolean;
    }
  ): void {
    if (!style.perCellStyles) {
      let rowText = "";
      for (let i = 0; i < cells.length; i++) {
        rowText += alignTextInColumn(columnLines[i][lineIdx] || "", capacities[i], cells[i].align);
      }
      this.generator.addText(rowText);
      return;
    }

    for (let i = 0; i < cells.length; i++) {
      this.generator.setPrintState(style.cellLevels[i], style.cellBolds[i]);
      this.generator.addText(
        alignTextInColumn(columnLines[i][lineIdx] || "", capacities[i], cells[i].align)
      );
    }
    this.generator.setPrintState(style.rowLevel, style.rowBold);
  }

  /**
   * Find the first Text node in a tree
   */
  private findFirstTextNode(node: ElementNode): ElementNode | null {
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
   * Collect text content from a node and its children.
   * Returns lines separated by \n when nested column Views contain multiple Text elements.
   */
  private async collectTextContent(node: ElementNode): Promise<string> {
    const normalizedType = node.type.toLowerCase();

    if (normalizedType === "textnode") {
      if (node.props.children !== undefined) {
        return String(node.props.children);
      }
      return "";
    }

    if (normalizedType === "text") {
      // Collect all nested text into one string (inline)
      let text = "";
      if (node.props.children !== undefined) {
        text += String(node.props.children);
      }
      for (const child of node.children) {
        text += await this.collectTextContent(child);
      }
      return text;
    }

    // For View nodes: check if it's a column layout with multiple children
    // If so, join children with \n (each child = separate line)
    const viewStyle = extractViewStyle(node.style);
    const isColumn = viewStyle.flexDirection !== "row";
    const parts: string[] = [];

    for (const child of node.children) {
      const childText = await this.collectTextContent(child);
      if (childText) {
        parts.push(childText);
      }
    }

    if (isColumn && parts.length > 1) {
      return parts.join("\n");
    }
    return parts.join("");
  }

  /**
   * Handle Text element
   * Collects ALL text (props + nested children) then applies word wrap
   */
  private async handleText(node: ElementNode): Promise<void> {
    const style = mergeStyles(node.style);

    // Collect ALL text content before styling: in "rico" the text decides
    // whether a 2x2 size actually fits on the line.
    const fullText = await this.collectTextContent(node);

    this.generator.applyTextStyle(style, {
      inheritedAlign: this.alignmentContext,
      text: fullText,
    });

    // Word wrap the full text to fit the line at the size just selected
    if (fullText) {
      const paperWidth = this.generator.getPaperWidth();
      const lines = wrapText(fullText, paperWidth);
      for (let i = 0; i < lines.length; i++) {
        this.generator.addText(lines[i]);
        if (i < lines.length - 1) {
          this.generator.addNewline();
        }
      }
    }

    // Reset formatting after text (especially bold)
    this.generator.resetFormatting();

    // Add newline after text element
    this.generator.addNewline();
  }

  /**
   * Handle TextNode (raw text)
   */
  private async handleTextNode(node: ElementNode): Promise<void> {
    if (node.props.children) {
      this.generator.addText(String(node.props.children));
    }
  }

  /**
   * Handle Image element
   */
  private async handleImage(node: ElementNode): Promise<void> {
    const source = node.props.source || node.props.src;

    if (source) {
      const style = mergeStyles(node.style);
      const viewStyle = extractViewStyle(style);

      // Own textAlign wins, then the image's own flex props, then the parent's
      // alignItems. `extractTextStyle` defaults textAlign to "left", so reading
      // it here used to make the justifyContent branches dead code.
      let align: Align = this.alignmentContext;
      if (style?.textAlign) {
        align = mapTextAlign(style.textAlign);
      } else if (viewStyle.justifyContent === "center" || viewStyle.alignItems === "center") {
        align = "center";
      } else if (
        viewStyle.justifyContent === "flex-end" ||
        viewStyle.alignItems === "flex-end"
      ) {
        align = "right";
      }

      this.generator.setAlign(align);

      // A percentage width on the parent View caps the image, like in the PDF
      const maxWidthColumns =
        this.widthFraction !== undefined
          ? Math.max(1, Math.floor(this.generator.getPaperWidth() * this.widthFraction))
          : undefined;

      await this.generator.addImage(source, maxWidthColumns);

      // Reset alignment
      this.generator.setAlign("left");
    }

    this.generator.addNewline();
  }

  /**
   * Traverse children nodes
   */
  private async traverseChildren(node: ElementNode): Promise<void> {
    for (const child of node.children) {
      await this.traverse(child);
    }
  }
}
