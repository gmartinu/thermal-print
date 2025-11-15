import { BaseAdapter } from './base-adapter';
import { StandardElementType } from './types';

/**
 * Default adapter for @react-pdf/renderer components.
 * This adapter maintains backward compatibility with the existing
 * react-escpos API and component naming conventions.
 *
 * Supported component mappings:
 * - Document → document
 * - Page → page
 * - View → view
 * - Text → text
 * - Image → image
 * - TextNode → textnode
 *
 * @example
 * ```typescript
 * import { Document, Page, View, Text } from '@react-pdf/renderer';
 *
 * const receipt = (
 *   <Document>
 *     <Page>
 *       <View>
 *         <Text>Hello World</Text>
 *       </View>
 *     </Page>
 *   </Document>
 * );
 *
 * const adapter = new ReactPDFAdapter();
 * const buffer = await convertToESCPOS(receipt, { adapter });
 * ```
 */
export class ReactPDFAdapter extends BaseAdapter {
  private readonly componentMap: Map<string, string>;

  constructor() {
    super();

    // Initialize the component mapping for @react-pdf/renderer
    this.componentMap = new Map([
      ['document', StandardElementType.DOCUMENT],
      ['page', StandardElementType.PAGE],
      ['view', StandardElementType.VIEW],
      ['text', StandardElementType.TEXT],
      ['image', StandardElementType.IMAGE],
      ['textnode', StandardElementType.TEXTNODE],
    ]);
  }

  /**
   * Normalizes @react-pdf/renderer component types to standard element types.
   * Performs case-insensitive matching to handle variations in component naming.
   *
   * @param type - The component type name (e.g., "Document", "View", "Text")
   * @returns The normalized standard element type (e.g., "document", "view", "text")
   */
  normalizeElementType(type: string): string {
    const normalizedType = type.toLowerCase();
    return this.componentMap.get(normalizedType) || normalizedType;
  }
}
