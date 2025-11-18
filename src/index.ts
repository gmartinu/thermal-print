import { ReactElement } from "react";
import { ESCPOSGenerator } from "./generator";
import { renderToElementTree } from "./renderer";
import { TreeTraverser } from "./traverser";
import { ConversionOptions } from "./types";
import { createAdapter } from "./adapters";
import {
  CommandAdapter,
  ESCPOSCommandAdapter,
  ESCBematechCommandAdapter,
} from "./command-adapters";

/**
 * Create command adapter based on configuration
 */
function createCommandAdapter(config?: CommandAdapter | 'escpos' | 'escbematech'): CommandAdapter {
  // If no config provided, default to ESC/POS
  if (!config) {
    return new ESCPOSCommandAdapter();
  }

  // If it's already a CommandAdapter instance, return it
  if (typeof config === 'object' && 'getName' in config) {
    return config;
  }

  // If it's a string identifier, create the appropriate adapter
  if (config === 'escpos') {
    return new ESCPOSCommandAdapter();
  } else if (config === 'escbematech') {
    return new ESCBematechCommandAdapter();
  }

  // Default to ESC/POS if unknown
  return new ESCPOSCommandAdapter();
}

/**
 * Main conversion function: Converts React component to ESC/POS commands
 *
 * @param component - React component (typically a @react-pdf/renderer component)
 * @param options - Conversion options
 * @returns Buffer containing ESC/POS commands ready to be sent to printer
 *
 * @example
 * ```typescript
 * // Using default @react-pdf/renderer components
 * const commands = await convertToESCPOS(
 *   <Document><Page><Text>Hello</Text></Page></Document>,
 *   { paperWidth: 48, debug: true }
 * );
 *
 * // Using custom component mapping
 * const commands = await convertToESCPOS(
 *   <Receipt><Item>Product</Item></Receipt>,
 *   {
 *     paperWidth: 48,
 *     adapter: {
 *       Receipt: 'document',
 *       Item: 'text'
 *     }
 *   }
 * );
 * ```
 */
export async function convertToESCPOS(component: ReactElement, options?: ConversionOptions): Promise<Buffer> {
  const {
    paperWidth = 48, // Default to 48 chars (80mm thermal)
    encoding = "utf-8",
    debug = false,
    cut = "full", // Default to full cut
    feedBeforeCut = 3, // Default to 3 lines feed before cut
    adapter: adapterConfig, // Custom adapter or component mapping
    commandAdapter: commandAdapterConfig, // Command protocol adapter
  } = options || {};

  // Step 1: Create component adapter (defaults to ReactPDFAdapter if not provided)
  const adapter = createAdapter(adapterConfig);

  // Step 1.5: Create command adapter (defaults to ESC/POS if not provided)
  const commandAdapter = createCommandAdapter(commandAdapterConfig);

  if (debug) {
    console.log(`Using command adapter: ${commandAdapter.getName()}`);
  }

  // Step 2: Render React component to element tree
  const elementTree = renderToElementTree(component, adapter);

  if (!elementTree) {
    throw new Error("Failed to render component to element tree");
  }

  // Step 3: Create ESC/POS generator with command adapter
  const generator = new ESCPOSGenerator(paperWidth, encoding, debug, commandAdapter);

  // Step 4: Traverse tree and generate commands
  const traverser = new TreeTraverser(generator, adapter);
  await traverser.traverse(elementTree);

  // Step 5: Add cut command if requested
  if (cut !== false) {
    if (cut === "full") {
      generator.cutFullWithFeed(feedBeforeCut);
    } else if (cut === "partial" || cut === true) {
      generator.cutPartialWithFeed(feedBeforeCut);
    }
  }

  // Step 6: Get final buffer
  const buffer = generator.getBuffer();

  return buffer;
}

// Export all types and utilities for advanced usage
export { ESCPOSGenerator } from "./generator";
export { renderToElementTree } from "./renderer";
export * from "./styles";
export { TreeTraverser } from "./traverser";
export * from "./types";
export * from "./encodings/cp860";
export * from "./commands/escpos";
export * from "./adapters";
export * from "./command-adapters";
