/**
 * HTML conversion utilities for React components
 *
 * Renders React components to HTML using ReactDOM
 */

import { ReactElement } from 'react';
import { createRoot, Root } from 'react-dom/client';

/**
 * Options for HTML conversion
 */
export interface ConvertToHTMLOptions {
  /**
   * Container width in pixels
   * @default 400
   */
  width?: number;

  /**
   * Whether to apply thermal printer styling
   * @default true
   */
  applyThermalStyles?: boolean;

  /**
   * Return format
   * - 'html': Returns HTML string
   * - 'element': Returns HTMLElement reference
   * @default 'element'
   */
  format?: 'html' | 'element';

  /**
   * Container ID for the rendered element
   * If not provided, a random ID will be generated
   */
  containerId?: string;

  /**
   * Whether to keep the container in the DOM
   * If false, you must call cleanup() to remove it
   * @default false
   */
  keepInDOM?: boolean;

  /**
   * Additional wait time in milliseconds after rendering
   * Useful if content needs extra time to load (fonts, images, etc.)
   * @default 0
   */
  waitTime?: number;
}

/**
 * Result of HTML conversion
 */
export interface ConvertToHTMLResult {
  /**
   * The rendered content (HTML string or HTMLElement)
   */
  content: string | HTMLElement;

  /**
   * Container element (always available)
   */
  container: HTMLElement;

  /**
   * Container ID
   */
  containerId: string;

  /**
   * Cleanup function to remove container from DOM
   */
  cleanup: () => void;
}

/**
 * Converts a React component to HTML
 *
 * Renders the component to a DOM container and returns the HTML or element.
 * Useful for integrations that require HTML output (emails, PDFs, etc.)
 *
 * @param component - React component to render
 * @param options - Conversion options
 * @returns Promise resolving to HTML result with cleanup function
 *
 * @example
 * ```typescript
 * // Return HTMLElement
 * const result = await convertToHTML(
 *   <Document><Page><Text>Receipt</Text></Page></Document>,
 *   { format: 'element' }
 * );
 *
 * // Use the element
 * console.log(result.container);
 *
 * // Clean up when done
 * result.cleanup();
 * ```
 *
 * @example
 * ```typescript
 * // Return HTML string
 * const result = await convertToHTML(
 *   <Document><Page><Text>Receipt</Text></Page></Document>,
 *   { format: 'html' }
 * );
 *
 * console.log(result.content); // HTML string
 * result.cleanup();
 * ```
 *
 * @example
 * ```typescript
 * // Keep in DOM with custom ID
 * const result = await convertToHTML(
 *   <Document><Page><Text>Receipt</Text></Page></Document>,
 *   {
 *     containerId: 'my-receipt',
 *     keepInDOM: true,
 *     width: 600
 *   }
 * );
 *
 * // Container remains in DOM, accessible by ID
 * const element = document.getElementById('my-receipt');
 * ```
 */
export async function convertToHTML(
  component: ReactElement,
  options: ConvertToHTMLOptions = {}
): Promise<ConvertToHTMLResult> {
  const {
    width = 400,
    applyThermalStyles = true,
    format = 'element',
    containerId = `thermal-html-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    keepInDOM = false,
    waitTime = 0
  } = options;

  // Create container
  const container = document.createElement('div');
  container.id = containerId;

  // Apply styles
  if (applyThermalStyles) {
    container.style.fontFamily = '"Courier New", Courier, monospace';
    container.style.fontSize = '12px';
    container.style.width = `${width}px`;
    container.style.backgroundColor = '#ffffff';
    container.style.color = '#000000';
    container.style.lineHeight = '1.2';
    container.style.whiteSpace = 'pre-wrap';
    container.style.wordBreak = 'break-word';
  } else {
    container.style.width = `${width}px`;
  }

  // Hide container if not keeping in DOM
  if (!keepInDOM) {
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.visibility = 'hidden';
  }

  // Append to body
  document.body.appendChild(container);

  // Create React root and render
  const root = createRoot(container);

  // Render and wait for completion
  await new Promise<void>((resolve) => {
    root.render(component);

    // Wait for React to commit changes
    setTimeout(() => {
      // Then wait for browser to paint and calculate layout
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Additional wait time if specified
          if (waitTime > 0) {
            setTimeout(resolve, waitTime);
          } else {
            resolve();
          }
        });
      });
    }, 0);
  });

  // Get content based on format
  const content = format === 'html'
    ? container.innerHTML
    : container;

  // Cleanup function
  const cleanup = () => {
    root.unmount();
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  };

  // Auto cleanup if not keeping in DOM
  if (!keepInDOM && format === 'html') {
    // For HTML format, we can cleanup immediately after getting the string
    setTimeout(cleanup, 0);
  }

  return {
    content,
    container,
    containerId,
    cleanup
  };
}
