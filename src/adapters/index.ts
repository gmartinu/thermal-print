/**
 * Adapter system for react-escpos.
 *
 * This module provides the adapter infrastructure that allows react-escpos
 * to work with different React component libraries and custom component naming schemes.
 *
 * @module adapters
 */

export {
  StandardElementType,
  ComponentMapping,
  RendererAdapter,
} from './types';

export { BaseAdapter } from './base-adapter';
export { ReactPDFAdapter } from './react-pdf-adapter';
export { CustomAdapter } from './custom-adapter';

import { ReactPDFAdapter } from './react-pdf-adapter';
import { CustomAdapter } from './custom-adapter';
import { RendererAdapter, ComponentMapping } from './types';

/**
 * Creates an appropriate adapter based on the provided configuration.
 *
 * If no configuration is provided, returns a ReactPDFAdapter (default).
 * If a ComponentMapping object is provided, returns a CustomAdapter with that mapping.
 * If a RendererAdapter instance is provided, returns it as-is.
 *
 * @param config - Optional adapter configuration (ComponentMapping or RendererAdapter instance)
 * @returns The appropriate adapter instance
 *
 * @example
 * ```typescript
 * // Use default React-PDF adapter
 * const adapter1 = createAdapter();
 *
 * // Use custom component mapping
 * const adapter2 = createAdapter({
 *   Receipt: 'document',
 *   Item: 'text'
 * });
 *
 * // Use custom adapter instance
 * const customAdapter = new CustomAdapter({ ... });
 * const adapter3 = createAdapter(customAdapter);
 * ```
 */
export function createAdapter(
  config?: RendererAdapter | ComponentMapping
): RendererAdapter {
  // If no config provided, use default React-PDF adapter
  if (!config) {
    return new ReactPDFAdapter();
  }

  // If config is already an adapter instance, use it
  if ('renderToTree' in config && 'normalizeElementType' in config) {
    return config as RendererAdapter;
  }

  // Otherwise, treat it as a ComponentMapping and create a CustomAdapter
  return new CustomAdapter(config as ComponentMapping);
}

/**
 * Checks if a value is a valid adapter configuration.
 *
 * @param value - The value to check
 * @returns True if the value is a valid adapter or component mapping
 */
export function isValidAdapterConfig(
  value: any
): value is RendererAdapter | ComponentMapping {
  if (!value) return false;

  // Check if it's an adapter instance
  if (typeof value === 'object' && 'renderToTree' in value && 'normalizeElementType' in value) {
    return true;
  }

  // Check if it's a component mapping (plain object with string values)
  if (typeof value === 'object' && !Array.isArray(value)) {
    return Object.values(value).every(v => typeof v === 'string');
  }

  return false;
}
