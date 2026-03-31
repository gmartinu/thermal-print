import { ElementNode } from "@thermal-print/core";
import { ESCPOSGenerator } from "./generator";
import { alignTextInColumn, extractTextStyle, extractViewStyle, mapTextAlign, mergeStyles, parseWidth, wrapText } from "./styles";

/**
 * Tree Traverser
 * Walks through the element tree and generates ESC/POS commands
 */
export class TreeTraverser {
  private generator: ESCPOSGenerator;

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
    // Add 6 blank lines at end for paper feed spacing
    this.generator.addNewline(2);
  }

  /**
   * Handle Page element
   */
  private async handlePage(node: ElementNode): Promise<void> {
    await this.traverseChildren(node);
  }

  /**
   * Handle View element (container with layout)
   */
  private async handleView(node: ElementNode): Promise<void> {
    const viewStyle = extractViewStyle(node.style);

    // Apply spacing before
    this.generator.applyViewSpacing(node.style, "before");

    // Handle different layout modes
    if (viewStyle.flexDirection === "row") {
      await this.handleRowLayout(node);
    } else {
      // Column layout (default) - add spacing between children
      await this.handleColumnLayout(node);
    }

    // Apply spacing after
    this.generator.applyViewSpacing(node.style, "after");
  }

  /**
   * Handle column layout (stacked vertically)
   * Adds newlines between sibling elements for proper spacing
   */
  private async handleColumnLayout(node: ElementNode): Promise<void> {
    const children = node.children;

    for (let i = 0; i < children.length; i++) {
      await this.traverse(children[i]);

      // Add newline after each child except the last one
      // This ensures proper spacing between elements in column layout
      // if (i < children.length - 1 && children[i].type.toLowerCase() === "view") {
      //   this.generator.addNewline();
      // }
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
    const paperWidth = this.generator.getPaperWidth();

    // Check layout justification mode
    const isSpaceBetween = viewStyle.justifyContent === "space-between";
    const isCentered = viewStyle.justifyContent === "center";

    // Calculate column widths
    const columns: { node: ElementNode; width: number; content: string; align: "left" | "center" | "right" }[] = [];

    // Extract text style from the first Text node for the entire row
    // This preserves formatting like bold, fontSize across all columns
    let rowTextStyle: any = null;
    const firstTextNode = this.findFirstTextNode(children[0]);
    if (firstTextNode && firstTextNode.style) {
      rowTextStyle = mergeStyles(firstTextNode.style);
    }

    for (const child of children) {
      const childStyle = extractViewStyle(child.style);
      const width = parseWidth(childStyle.width, paperWidth);

      // Collect text content from child
      const content = await this.collectTextContent(child);

      // Determine alignment - check for Text node textAlign first
      let align: "left" | "center" | "right" = "left";

      // Look for Text element with textAlign
      const textNode = this.findFirstTextNode(child);
      if (textNode && textNode.style) {
        const textStyle = extractTextStyle(textNode.style);
        align = mapTextAlign(textStyle.textAlign);
      } else {
        // Fall back to View alignment
        if (childStyle.alignItems === "center" || childStyle.justifyContent === "center") {
          align = "center";
        } else if (childStyle.alignItems === "flex-end" || childStyle.justifyContent === "flex-end") {
          align = "right";
        }
      }

      columns.push({ node: child, width, content, align });
    }

    // Check if columns have explicit widths (table layout) or should use space-between
    const hasExplicitWidths = columns.some((col) => {
      const childStyle = extractViewStyle(col.node.style);
      return childStyle.width !== undefined;
    });

    // Determine max number of sub-lines across all columns
    const columnLines = columns.map(col => col.content.split("\n"));
    const maxLines = Math.max(...columnLines.map(lines => lines.length));

    // Apply text style (bold, fontSize) before adding the row text
    if (rowTextStyle) {
      this.generator.applyTextStyle(rowTextStyle);
    }

    // Emit one output line per sub-line
    for (let lineIdx = 0; lineIdx < maxLines; lineIdx++) {
      let rowText = "";

      if (isSpaceBetween && columns.length === 2 && !hasExplicitWidths) {
        const left = (columnLines[0][lineIdx] || "");
        const right = (columnLines[1][lineIdx] || "");
        const usedSpace = left.length + right.length;
        const gap = Math.max(1, paperWidth - usedSpace);
        rowText = left + " ".repeat(gap) + right;
      } else if (isCentered && !hasExplicitWidths) {
        const parts: string[] = [];
        for (let i = 0; i < columns.length; i++) {
          parts.push(columnLines[i][lineIdx] || "");
        }
        const spacingBetweenColumns = Math.max(0, columns.length - 1);
        const totalContentWidth = parts.reduce((sum, p) => sum + p.length, 0) + spacingBetweenColumns;
        const leadingSpaces = Math.max(0, Math.floor((paperWidth - totalContentWidth) / 2));
        rowText = " ".repeat(leadingSpaces) + parts.join(" ");
      } else {
        for (let i = 0; i < columns.length; i++) {
          const cellContent = columnLines[i][lineIdx] || "";
          const cellText = alignTextInColumn(cellContent, columns[i].width, columns[i].align);
          rowText += cellText;
        }
      }

      this.generator.addText(rowText);
      this.generator.addNewline();
    }

    // Reset formatting after the row
    if (rowTextStyle) {
      this.generator.resetFormatting();
    }
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
    // Merge styles from parent if needed
    const style = mergeStyles(node.style);

    // Apply text styling (sets alignment, bold, size)
    this.generator.applyTextStyle(style);

    // Collect ALL text content from this node and all nested children
    const fullText = await this.collectTextContent(node);

    // Word wrap the full text to fit paper width
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
      // Apply alignment from style (check both node style and parent style)
      const style = mergeStyles(node.style);
      const viewStyle = extractViewStyle(style);
      const textStyle = extractTextStyle(style);

      // Determine alignment from textAlign or justifyContent
      let align: "left" | "center" | "right" = "left";
      if (textStyle.textAlign) {
        align = mapTextAlign(textStyle.textAlign);
      } else if (viewStyle.justifyContent === "center" || viewStyle.alignItems === "center") {
        align = "center";
      } else if (viewStyle.justifyContent === "flex-end" || viewStyle.alignItems === "flex-end") {
        align = "right";
      }

      // Set alignment before adding image
      this.generator.setAlign(align);

      await this.generator.addImage(source);

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
