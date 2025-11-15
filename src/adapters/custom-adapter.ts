import { BaseAdapter } from './base-adapter';
import { ComponentMapping, StandardElementType } from './types';

/**
 * Custom adapter that allows users to define their own component name mappings.
 * This enables the use of custom React components while still generating
 * valid ESC/POS commands.
 *
 * @example
 * ```typescript
 * // Define custom components
 * const Receipt = ({ children }) => <div>{children}</div>;
 * const ItemRow = ({ children }) => <div>{children}</div>;
 * const Price = ({ children }) => <span>{children}</span>;
 *
 * // Create custom mapping
 * const customMapping = {
 *   Receipt: 'document',
 *   ItemRow: 'view',
 *   Price: 'text'
 * };
 *
 * // Use with custom adapter
 * const adapter = new CustomAdapter(customMapping);
 * const buffer = await convertToESCPOS(
 *   <Receipt>
 *     <ItemRow>
 *       <Price>$10.00</Price>
 *     </ItemRow>
 *   </Receipt>,
 *   { adapter }
 * );
 * ```
 */
export class CustomAdapter extends BaseAdapter {
  private readonly componentMap: Map<string, string>;
  private readonly userMapping: ComponentMapping;

  /**
   * Creates a new CustomAdapter with the provided component mapping.
   *
   * @param mapping - Component name to standard element type mapping
   * @throws Error if the mapping is empty or invalid
   */
  constructor(mapping: ComponentMapping) {
    super();

    if (!mapping || Object.keys(mapping).length === 0) {
      throw new Error('CustomAdapter requires a non-empty component mapping');
    }

    this.userMapping = mapping;
    this.componentMap = new Map();

    // Build case-insensitive lookup map
    for (const [componentName, elementType] of Object.entries(mapping)) {
      const normalizedKey = componentName.toLowerCase();
      const normalizedValue = elementType.toLowerCase();
      this.componentMap.set(normalizedKey, normalizedValue);
    }

    // Also include standard types as fallbacks
    this.addStandardTypeFallbacks();
  }

  /**
   * Adds standard element types as fallbacks to support mixing
   * custom components with standard @react-pdf/renderer components.
   */
  private addStandardTypeFallbacks(): void {
    const standardTypes = [
      StandardElementType.DOCUMENT,
      StandardElementType.PAGE,
      StandardElementType.VIEW,
      StandardElementType.TEXT,
      StandardElementType.IMAGE,
      StandardElementType.TEXTNODE,
    ];

    for (const type of standardTypes) {
      const key = type.toLowerCase();
      // Only add if not already defined by user mapping
      if (!this.componentMap.has(key)) {
        this.componentMap.set(key, type);
      }
    }
  }

  /**
   * Normalizes custom component types to standard element types
   * using the user-provided mapping.
   *
   * @param type - The component type name (e.g., "Receipt", "ItemRow")
   * @returns The normalized standard element type (e.g., "document", "view")
   */
  normalizeElementType(type: string): string {
    const normalizedType = type.toLowerCase();
    const mapped = this.componentMap.get(normalizedType);

    if (!mapped) {
      console.warn(
        `No mapping found for component type "${type}". ` +
        `Available mappings: ${Object.keys(this.userMapping).join(', ')}`
      );
      return normalizedType;
    }

    return mapped;
  }

  /**
   * Gets the original user-provided component mapping.
   *
   * @returns The component mapping configuration
   */
  getMapping(): ComponentMapping {
    return { ...this.userMapping };
  }
}
