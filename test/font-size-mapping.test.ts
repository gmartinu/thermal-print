/**
 * Unit tests for the 6-level font size mapping.
 *
 * Validates that mapFontSize correctly maps CSS fontSize values
 * to ESC/POS font selection, character size multipliers, and effective columns.
 *
 * Run with: npx tsx test/font-size-mapping.test.ts
 */

import { mapFontSize, mapFontSizeToESCPOS } from '../packages/escpos/src/styles';
import { setCharacterSize, selectFontByName, setEmphasis, FONT_A, FONT_B } from '../packages/escpos/src/commands/escpos';
import { ESCPOSCommandAdapter } from '../packages/escpos/src/command-adapters/escpos-adapter';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

function assertDeepEqual(actual: any, expected: any, message: string): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  assert(a === e, `${message} — expected ${e}, got ${a}`);
}

// ============================================================================
// mapFontSize tests
// ============================================================================

console.log('--- mapFontSize: 6-level mapping ---');

// Level 1: fontSize <= 8 -> Font B, 1x1, 64 cols
assertDeepEqual(mapFontSize(1), { font: 'B', widthMultiplier: 1, heightMultiplier: 1, effectiveCols: 64 }, 'fontSize 1 -> Font B 1x1');
assertDeepEqual(mapFontSize(6), { font: 'B', widthMultiplier: 1, heightMultiplier: 1, effectiveCols: 64 }, 'fontSize 6 -> Font B 1x1');
assertDeepEqual(mapFontSize(8), { font: 'B', widthMultiplier: 1, heightMultiplier: 1, effectiveCols: 64 }, 'fontSize 8 -> Font B 1x1 (boundary)');

// Level 2: fontSize 9-16 -> Font A, 1x1, 48 cols
assertDeepEqual(mapFontSize(9), { font: 'A', widthMultiplier: 1, heightMultiplier: 1, effectiveCols: 48 }, 'fontSize 9 -> Font A 1x1 (boundary)');
assertDeepEqual(mapFontSize(12), { font: 'A', widthMultiplier: 1, heightMultiplier: 1, effectiveCols: 48 }, 'fontSize 12 -> Font A 1x1');
assertDeepEqual(mapFontSize(16), { font: 'A', widthMultiplier: 1, heightMultiplier: 1, effectiveCols: 48 }, 'fontSize 16 -> Font A 1x1 (boundary)');

// Level 3: fontSize 17-24 -> Font A, 2x1, 24 cols
assertDeepEqual(mapFontSize(17), { font: 'A', widthMultiplier: 2, heightMultiplier: 1, effectiveCols: 24 }, 'fontSize 17 -> Font A 2x1 (boundary)');
assertDeepEqual(mapFontSize(20), { font: 'A', widthMultiplier: 2, heightMultiplier: 1, effectiveCols: 24 }, 'fontSize 20 -> Font A 2x1');
assertDeepEqual(mapFontSize(24), { font: 'A', widthMultiplier: 2, heightMultiplier: 1, effectiveCols: 24 }, 'fontSize 24 -> Font A 2x1 (boundary)');

// Level 4: fontSize 25-32 -> Font A, 2x2, 24 cols
assertDeepEqual(mapFontSize(25), { font: 'A', widthMultiplier: 2, heightMultiplier: 2, effectiveCols: 24 }, 'fontSize 25 -> Font A 2x2 (boundary)');
assertDeepEqual(mapFontSize(28), { font: 'A', widthMultiplier: 2, heightMultiplier: 2, effectiveCols: 24 }, 'fontSize 28 -> Font A 2x2');
assertDeepEqual(mapFontSize(32), { font: 'A', widthMultiplier: 2, heightMultiplier: 2, effectiveCols: 24 }, 'fontSize 32 -> Font A 2x2 (boundary)');

// Level 5: fontSize 33-48 -> Font A, 3x3, 16 cols
assertDeepEqual(mapFontSize(33), { font: 'A', widthMultiplier: 3, heightMultiplier: 3, effectiveCols: 16 }, 'fontSize 33 -> Font A 3x3 (boundary)');
assertDeepEqual(mapFontSize(40), { font: 'A', widthMultiplier: 3, heightMultiplier: 3, effectiveCols: 16 }, 'fontSize 40 -> Font A 3x3');
assertDeepEqual(mapFontSize(48), { font: 'A', widthMultiplier: 3, heightMultiplier: 3, effectiveCols: 16 }, 'fontSize 48 -> Font A 3x3 (boundary)');

// Level 6: fontSize 49+ -> Font A, 4x4, 12 cols
assertDeepEqual(mapFontSize(49), { font: 'A', widthMultiplier: 4, heightMultiplier: 4, effectiveCols: 12 }, 'fontSize 49 -> Font A 4x4 (boundary)');
assertDeepEqual(mapFontSize(60), { font: 'A', widthMultiplier: 4, heightMultiplier: 4, effectiveCols: 12 }, 'fontSize 60 -> Font A 4x4');
assertDeepEqual(mapFontSize(100), { font: 'A', widthMultiplier: 4, heightMultiplier: 4, effectiveCols: 12 }, 'fontSize 100 -> Font A 4x4');

// Edge cases
console.log('\n--- mapFontSize: edge cases ---');
assertDeepEqual(mapFontSize(undefined), { font: 'A', widthMultiplier: 1, heightMultiplier: 1, effectiveCols: 48 }, 'undefined -> default Font A 1x1');
assertDeepEqual(mapFontSize('12px'), { font: 'A', widthMultiplier: 1, heightMultiplier: 1, effectiveCols: 48 }, 'string "12px" -> Font A 1x1');
assertDeepEqual(mapFontSize('8'), { font: 'B', widthMultiplier: 1, heightMultiplier: 1, effectiveCols: 64 }, 'string "8" -> Font B 1x1');
assertDeepEqual(mapFontSize('50px'), { font: 'A', widthMultiplier: 4, heightMultiplier: 4, effectiveCols: 12 }, 'string "50px" -> Font A 4x4');
assertDeepEqual(mapFontSize('invalid'), { font: 'A', widthMultiplier: 1, heightMultiplier: 1, effectiveCols: 48 }, 'NaN string -> default');

// ============================================================================
// mapFontSizeToESCPOS backward compat tests
// ============================================================================

console.log('\n--- mapFontSizeToESCPOS: backward compatibility ---');
assertDeepEqual(mapFontSizeToESCPOS(undefined), { width: 1, height: 1 }, 'compat: undefined -> 1x1');
assertDeepEqual(mapFontSizeToESCPOS(8), { width: 1, height: 1 }, 'compat: 8 -> 1x1 (Font B)');
assertDeepEqual(mapFontSizeToESCPOS(12), { width: 1, height: 1 }, 'compat: 12 -> 1x1');
assertDeepEqual(mapFontSizeToESCPOS(20), { width: 2, height: 1 }, 'compat: 20 -> 2x1');
assertDeepEqual(mapFontSizeToESCPOS(30), { width: 2, height: 2 }, 'compat: 30 -> 2x2');
assertDeepEqual(mapFontSizeToESCPOS(40), { width: 3, height: 3 }, 'compat: 40 -> 3x3');
assertDeepEqual(mapFontSizeToESCPOS(60), { width: 4, height: 4 }, 'compat: 60 -> 4x4');

// ============================================================================
// ESC/POS command byte tests
// ============================================================================

console.log('\n--- ESC/POS commands: GS ! byte generation ---');

// GS ! n - byte format: bits 4-7 = width-1, bits 0-3 = height-1
assertDeepEqual(setCharacterSize(1, 1), [0x1D, 0x21, 0x00], 'GS ! 1x1 -> 0x00');
assertDeepEqual(setCharacterSize(2, 1), [0x1D, 0x21, 0x10], 'GS ! 2x1 -> 0x10');
assertDeepEqual(setCharacterSize(1, 2), [0x1D, 0x21, 0x01], 'GS ! 1x2 -> 0x01');
assertDeepEqual(setCharacterSize(2, 2), [0x1D, 0x21, 0x11], 'GS ! 2x2 -> 0x11');
assertDeepEqual(setCharacterSize(3, 3), [0x1D, 0x21, 0x22], 'GS ! 3x3 -> 0x22');
assertDeepEqual(setCharacterSize(4, 4), [0x1D, 0x21, 0x33], 'GS ! 4x4 -> 0x33');

console.log('\n--- ESC/POS commands: font selection ---');
assertDeepEqual(selectFontByName('A'), [0x1B, 0x4D, 0x00], 'ESC M 0 -> Font A');
assertDeepEqual(selectFontByName('B'), [0x1B, 0x4D, 0x01], 'ESC M 1 -> Font B');
assertDeepEqual(FONT_A, [0x1B, 0x4D, 0x00], 'FONT_A constant');
assertDeepEqual(FONT_B, [0x1B, 0x4D, 0x01], 'FONT_B constant');

console.log('\n--- ESC/POS commands: emphasis ---');
assertDeepEqual(setEmphasis(true), [0x1B, 0x45, 0x01], 'ESC E 1 (bold on)');
assertDeepEqual(setEmphasis(false), [0x1B, 0x45, 0x00], 'ESC E 0 (bold off)');

// ============================================================================
// ESCPOSCommandAdapter tests
// ============================================================================

console.log('\n--- ESCPOSCommandAdapter ---');
const adapter = new ESCPOSCommandAdapter();

assert(adapter.getName() === 'ESC/POS', 'adapter name');
assertDeepEqual(adapter.getMaxCharacterSize(), { width: 4, height: 4 }, 'max size 4x4');

// getCharacterSizeCommand should produce GS ! + ESC E
const sizeCmd = adapter.getCharacterSizeCommand(2, 2, true);
// Should contain GS ! 0x11 (2x2) then ESC E 1 (bold on)
assert(sizeCmd.includes(0x1D) && sizeCmd.includes(0x21), 'contains GS ! command');
assert(sizeCmd.includes(0x1B) && sizeCmd.includes(0x45), 'contains ESC E command');

// getFontCommand
const fontCmd = adapter.getFontCommand('B');
assertDeepEqual(fontCmd, [0x1B, 0x4D, 0x01], 'adapter getFontCommand B');

// getFullFontSizeCommand
const mapping = { font: 'B' as const, widthMultiplier: 1, heightMultiplier: 1, effectiveCols: 64 };
const fullCmd = adapter.getFullFontSizeCommand(mapping, false);
// Should contain: ESC M 1 (Font B), GS ! 0x00 (1x1), ESC E 0 (no bold)
assert(fullCmd.length >= 9, 'full font size command has expected length');

// ============================================================================
// Summary
// ============================================================================

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(50)}`);

if (failed > 0) {
  process.exit(1);
}
