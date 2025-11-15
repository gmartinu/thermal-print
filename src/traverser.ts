import { ESCPOSGenerator } from "./generator";
import { alignTextInColumn, extractTextStyle, extractViewStyle, mapTextAlign, mergeStyles, parseWidth } from "./styles";
import { ElementNode } from "./types";
import { RendererAdapter, ReactPDFAdapter } from "./adapters";

/**
 * Tree Traverser
 * Walks through the element tree and generates ESC/POS commands
 */
export class TreeTraverser {
  private generator: ESCPOSGenerator;
  private adapter: RendererAdapter;

  constructor(generator: ESCPOSGenerator, adapter?: RendererAdapter) {
    this.generator = generator;
    // Use provided adapter or default to ReactPDFAdapter for backward compatibility
    this.adapter = adapter || new ReactPDFAdapter();
  }

  /**
   * Traverse the entire tree starting from root
   */
  async traverse(node: ElementNode | null): Promise<void> {
    if (!node) return;

    // Normalize type using adapter (supports custom component names)
    const nodeType = this.adapter.normalizeElementType(node.type);

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

    // Check if this is a "space-between" layout (payment-style two-column)
    const isSpaceBetween = viewStyle.justifyContent === "space-between";

    // Calculate column widths
    const columns: { node: ElementNode; width: number; content: string; align: "left" | "center" | "right" }[] = [];

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

    // Build row text
    let rowText = "";

    // Check if columns have explicit widths (table layout) or should use space-between
    const hasExplicitWidths = columns.some((col) => {
      const childStyle = extractViewStyle(col.node.style);
      return childStyle.width !== undefined;
    });

    if (isSpaceBetween && columns.length === 2 && !hasExplicitWidths) {
      // Special handling for space-between layout (payment summary style) WITHOUT explicit widths
      // Calculate space between
      const usedSpace = columns[0].content.length + columns[1].content.length;
      const gap = Math.max(1, paperWidth - usedSpace);

      rowText = columns[0].content + " ".repeat(gap) + columns[1].content;
    } else {
      // Normal column layout OR space-between with explicit widths (use column padding)
      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        const cellText = alignTextInColumn(col.content, col.width, col.align);
        rowText += cellText;
      }
    }

    this.generator.addText(rowText);
    this.generator.addNewline();
  }

  /**
   * Find the first Text node in a tree
   */
  private findFirstTextNode(node: ElementNode): ElementNode | null {
    const normalizedType = this.adapter.normalizeElementType(node.type);
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
  private async collectTextContent(node: ElementNode): Promise<string> {
    let text = "";

    const normalizedType = this.adapter.normalizeElementType(node.type);
    if (normalizedType === "text" || normalizedType === "textnode") {
      // Get text from props.children
      if (node.props.children !== undefined) {
        text += String(node.props.children);
      }
    }

    // Recursively collect from children
    for (const child of node.children) {
      text += await this.collectTextContent(child);
    }

    return text;
  }

  /**
   * Handle Text element
   */
  private async handleText(node: ElementNode): Promise<void> {
    // Merge styles from parent if needed
    const style = mergeStyles(node.style);

    // Apply text styling (sets alignment, bold, size)
    this.generator.applyTextStyle(style);

    // Get text content
    let textContent = "";

    // Check props.children first
    if (node.props.children !== undefined) {
      if (typeof node.props.children === "string" || typeof node.props.children === "number") {
        textContent = String(node.props.children);
      }
    }

    // If we have direct text, print it
    if (textContent) {
      this.generator.addText(textContent);
    }

    // Traverse children (nested Text elements)
    await this.traverseChildren(node);

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
      await this.generator.addImage(source);
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
