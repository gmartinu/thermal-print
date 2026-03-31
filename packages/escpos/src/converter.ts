import { PrintNode } from '@thermal-print/core';
import { ESCPOSGenerator } from './generator';
import { TreeTraverser } from './traverser';
import { CommandAdapter, ESCPOSCommandAdapter, ESCBematechCommandAdapter } from './command-adapters';

/**
 * Options for converting PrintNodes to ESC/POS commands
 */
/**
 * Font mode for ESC/POS output.
 * Controls which ESC/POS font is used globally, ignoring component fontSize.
 *
 * - "small": Font B 1x1 (56 columns on 80mm paper)
 * - "medium": Font A 1x1 (42 columns on 80mm paper) — default
 */
export type FontMode = 'small' | 'medium';

export interface PrintNodeToESCPOSOptions {
  paperWidth?: number; // Width in characters (default: 48 for 80mm thermal)
  encoding?: string; // Character encoding (default: 'utf-8')
  debug?: boolean; // Enable debug output
  cut?: boolean | 'full' | 'partial'; // Cut paper after printing (default: 'full')
  feedBeforeCut?: number; // Lines to feed before cutting (default: 3)
  commandAdapter?: CommandAdapter | 'escpos' | 'escbematech'; // Command protocol adapter (default: 'escpos')
  fontMode?: FontMode; // Global font mode — overrides fontSize-based font selection (default: 'medium')
  compact?: boolean; // Minimal line spacing (0 dots) — works with any fontMode (default: false)
}

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
 * Converts PrintNode tree to ESC/POS buffer
 *
 * This is the main entry point for @thermal-print/escpos.
 * Takes a universal PrintNode IR and converts it to ESC/POS commands.
 *
 * @param printNode - Root PrintNode of the tree to convert
 * @param options - Conversion options
 * @returns Buffer containing ESC/POS commands ready to be sent to printer
 *
 * @example
 * ```typescript
 * const printTree: PrintNode = {
 *   type: 'document',
 *   props: {},
 *   children: [
 *     {
 *       type: 'text',
 *       props: { children: 'Hello World' },
 *       children: [],
 *       style: { textAlign: 'center', fontSize: 20 }
 *     }
 *   ],
 *   style: {}
 * };
 *
 * const buffer = await printNodesToESCPOS(printTree, {
 *   paperWidth: 48,
 *   cut: 'full'
 * });
 * ```
 */
export async function printNodesToESCPOS(
  printNode: PrintNode,
  options?: PrintNodeToESCPOSOptions
): Promise<Buffer> {
  const {
    paperWidth: paperWidthOverride,
    encoding = "utf-8",
    debug = false,
    cut = "full", // Default to full cut
    feedBeforeCut = 3, // Default to 3 lines feed before cut
    commandAdapter: commandAdapterConfig, // Command protocol adapter
    fontMode = "medium", // Default to Font A 42 cols
    compact = false, // Minimal line spacing
  } = options || {};

  // Determine paperWidth based on fontMode (unless explicitly overridden)
  // Values calibrated for 80mm thermal printers (e.g., MP-4200 TH):
  //   Font A (medium): 42 chars per line
  //   Font B (small):  56 chars per line
  const fontModePaperWidths: Record<string, number> = {
    small: 56,
    medium: 42,
  };
  const paperWidth = paperWidthOverride ?? fontModePaperWidths[fontMode] ?? 42;

  // Create command adapter (defaults to ESC/POS if not provided)
  const commandAdapter = createCommandAdapter(commandAdapterConfig);

  if (debug) {
    console.log(`Using command adapter: ${commandAdapter.getName()}`);
    console.log(`Font mode: ${fontMode} (paperWidth: ${paperWidth})`);
    console.log("\n========== PRINT NODE TREE (JSON) ==========");
    console.log(JSON.stringify(printNode, null, 2));
    console.log("============================================\n");
  }

  // Create ESC/POS generator with command adapter, font mode and compact flag
  const generator = new ESCPOSGenerator(paperWidth, encoding, debug, commandAdapter, fontMode, compact);

  // Traverse tree and generate commands
  const traverser = new TreeTraverser(generator);
  await traverser.traverse(printNode);

  // Add cut command if requested
  if (cut !== false) {
    if (cut === "full") {
      generator.cutFullWithFeed(feedBeforeCut);
    } else if (cut === "partial" || cut === true) {
      generator.cutPartialWithFeed(feedBeforeCut);
    }
  }

  // Get final buffer
  const buffer = generator.getBuffer();

  return buffer;
}
