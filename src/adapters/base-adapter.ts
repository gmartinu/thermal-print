import ReactTestRenderer from 'react-test-renderer';
import { ReactElement } from 'react';
import { ElementNode } from '../types';
import { RendererAdapter } from './types';

/**
 * Base adapter class that provides common rendering functionality.
 * Child classes only need to implement the normalizeElementType method
 * to define their component name mappings.
 */
export abstract class BaseAdapter implements RendererAdapter {
  /**
   * Renders a React component to an ElementNode tree structure.
   * Uses react-test-renderer to create a test instance and converts
   * it to our internal ElementNode format.
   *
   * @param component - The React component to render
   * @returns The rendered element tree, or null if rendering fails
   */
  renderToTree(component: ReactElement): ElementNode | null {
    try {
      const renderer = ReactTestRenderer.create(component);
      const tree = renderer.toJSON();
      return this.convertToElementNode(tree);
    } catch (error) {
      console.error('Failed to render component:', error);
      return null;
    }
  }

  /**
   * Normalizes a component type name to a standard element type.
   * Must be implemented by child classes to define their specific mappings.
   *
   * @param type - The component type name
   * @returns The normalized standard element type
   */
  abstract normalizeElementType(type: string): string;

  /**
   * Converts a ReactTestRenderer node to our ElementNode structure.
   * This is the internal implementation that handles the tree conversion.
   *
   * @param node - The ReactTestRenderer node
   * @returns The converted ElementNode, or null if conversion fails
   */
  protected convertToElementNode(node: any): ElementNode | null {
    if (!node) return null;

    // Handle text nodes
    if (typeof node === 'string' || typeof node === 'number') {
      return {
        type: 'TextNode',
        props: { children: String(node) },
        children: [],
        style: {},
      };
    }

    // Handle element nodes
    if (node.type) {
      const children: ElementNode[] = [];

      if (node.props?.children) {
        const childArray = Array.isArray(node.props.children)
          ? node.props.children
          : [node.props.children];

        for (const child of childArray) {
          const childNode = this.convertToElementNode(child);
          if (childNode) {
            children.push(childNode);
          }
        }
      }

      // Also check node.children (from rendered tree)
      if (node.children && Array.isArray(node.children)) {
        for (const child of node.children) {
          const childNode = this.convertToElementNode(child);
          if (childNode) {
            children.push(childNode);
          }
        }
      }

      return {
        type: typeof node.type === 'string' ? node.type : node.type.name || 'Unknown',
        props: node.props || {},
        children,
        style: node.props?.style || {},
      };
    }

    return null;
  }
}
