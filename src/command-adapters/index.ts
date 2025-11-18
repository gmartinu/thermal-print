/**
 * Command Adapters
 *
 * Provides printer protocol abstraction for different command sets:
 * - ESC/POS: Standard thermal printer protocol
 * - ESC/Bematech: Bematech-specific protocol
 */

export { CommandAdapter, CharacterSize } from './types';
export { ESCPOSCommandAdapter } from './escpos-adapter';
export { ESCBematechCommandAdapter } from './escbematech-adapter';
