import { ReactElement } from 'react';
import { ElementNode } from '../types';

/**
 * Standard element types that can be converted to ESC/POS commands.
 * All adapters must normalize their component types to these standard types.
 */
export enum StandardElementType {
  DOCUMENT = 'document',
  PAGE = 'page',
  VIEW = 'view',
  TEXT = 'text',
  IMAGE = 'image',
  TEXTNODE = 'textnode',
}

/**
 * Component mapping configuration for custom adapters.
 * Maps custom component names to standard element types.
 *
 * @example
 * ```typescript
 * const mapping: ComponentMapping = {
 *   Receipt: 'document',
 *   Item: 'text',
 *   Row: 'view',
 *   Logo: 'image'
 * };
 * ```
 */
export type ComponentMapping = Record<string, StandardElementType | string>;

/**
 * Renderer adapter interface that all adapters must implement.
 * Adapters are responsible for:
 * 1. Rendering React components to an element tree
 * 2. Normalizing component types to standard element types
 */
export interface RendererAdapter {
  /**
   * Renders a React component to an ElementNode tree structure.
   *
   * @param component - The React component to render
   * @returns The rendered element tree, or null if rendering fails
   */
  renderToTree(component: ReactElement): ElementNode | null;

  /**
   * Normalizes a component type name to a standard element type.
   * This allows different renderers to use different component names
   * while maintaining consistent internal processing.
   *
   * @param type - The component type name (e.g., "Document", "Receipt", "View")
   * @returns The normalized standard element type (e.g., "document", "view")
   */
  normalizeElementType(type: string): string;
}
