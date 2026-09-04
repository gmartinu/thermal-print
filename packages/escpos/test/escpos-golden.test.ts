/**
 * Golden tests for the ESC/POS renderer (DEV-2390).
 *
 * The point of this file is a promise: for a document that does not exercise
 * one of the layout bugs DEV-2390 fixes, the bytes we send to the ~80 printers
 * already in the field must not move. Every richer-styling feature added by
 * DEV-2390 lives behind `styleMode: "rico"`; these goldens are all recorded in
 * the default `legacy` mode and are expected to stay frozen.
 *
 * Run with:      pnpm --filter @thermal-print/escpos test
 * Regenerate:    UPDATE_GOLDENS=1 pnpm --filter @thermal-print/escpos test
 * NEVER regenerate a parity golden to make a test pass — a diff there means a
 * change leaked out of the `rico` flag.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { printNodesToESCPOS, type PrintNodeToESCPOSOptions } from "../src/converter";
import { PARITY_FIXTURES, PROBE_FIXTURES, type Fixture } from "./fixtures";
import { loadOrWriteGolden, type SnapshotEntry } from "./snapshot";

interface Variant {
  file: string;
  label: string;
  options: PrintNodeToESCPOSOptions;
}

/** The four output shapes the PDV actually asks for. */
const LEGACY_VARIANTS: Variant[] = [
  { file: "legacy-medium-80mm.snap", label: "Font A / 42 cols", options: {} },
  { file: "legacy-small-80mm.snap", label: "Font B / 56 cols", options: { fontMode: "small" } },
  { file: "legacy-medium-58mm.snap", label: "58mm / 32 cols", options: { paperWidth: 32 } },
  {
    file: "legacy-bematech-80mm.snap",
    label: "ESC/Bematech",
    options: { commandAdapter: "escbematech" },
  },
];

async function renderAll(
  fixtures: Fixture[],
  options: PrintNodeToESCPOSOptions
): Promise<SnapshotEntry[]> {
  const entries: SnapshotEntry[] = [];
  for (const fixture of fixtures) {
    entries.push({ name: fixture.name, buffer: await printNodesToESCPOS(fixture.node(), options) });
  }
  return entries;
}

describe("legacy byte parity", () => {
  for (const variant of LEGACY_VARIANTS) {
    it(`keeps every parity document byte-identical — ${variant.label}`, async () => {
      const entries = await renderAll(PARITY_FIXTURES, variant.options);
      const golden = loadOrWriteGolden(variant.file, entries);

      for (const entry of entries) {
        assert.equal(
          entry.buffer.toString("hex"),
          golden[entry.name],
          `${variant.file}: ${entry.name} changed bytes in legacy mode`
        );
      }
      assert.equal(Object.keys(golden).length, entries.length);
    });
  }
});

describe("layout probes", () => {
  it("records the output of each bug-probe document", async () => {
    const entries = await renderAll(PROBE_FIXTURES, {});
    const golden = loadOrWriteGolden("probes-legacy.snap", entries);

    for (const entry of entries) {
      assert.equal(
        entry.buffer.toString("hex"),
        golden[entry.name],
        `probes-legacy.snap: ${entry.name} changed bytes`
      );
    }
  });
});
