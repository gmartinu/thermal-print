/**
 * Snapshot helpers for the ESC/POS golden tests.
 *
 * A golden file holds, per fixture, the full output as hex (the thing that is
 * compared) plus a decoded rendering (for humans reading the diff). Only the
 * hex is asserted; the decoding is derived from the same bytes.
 *
 * Regenerate with: UPDATE_GOLDENS=1 pnpm --filter @thermal-print/escpos test
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const GOLDEN_DIR = join(HERE, "goldens");

export const shouldUpdate = process.env.UPDATE_GOLDENS === "1";

const ESC = 0x1b;
const GS = 0x1d;

/** ESC/POS + ESC/Bematech sequences we care about, as prefix -> [label, extraArgBytes]. */
const ESC_SEQUENCES: Record<number, [string, number]> = {
  0x40: ["ESC @", 0],
  0x21: ["ESC !", 1],
  0x61: ["ESC a", 1],
  0x45: ["ESC E", 1],
  0x2d: ["ESC -", 1],
  0x32: ["ESC 2", 0],
  0x33: ["ESC 3", 1],
  0x64: ["ESC d", 1],
  0x69: ["ESC i", 0],
  0x6d: ["ESC m", 0],
  0x4a: ["ESC J", 1],
  0x74: ["ESC t", 1],
  0x2a: ["ESC *", 3],
  0x56: ["ESC V", 0],
  0x57: ["ESC W", 1],
};

const GS_SEQUENCES: Record<number, [string, number]> = {
  0x21: ["GS !", 1],
  0x56: ["GS V", 1],
  0x42: ["GS B", 1],
};

/**
 * Renders a buffer as a line-oriented, human-readable transcript.
 * Control sequences become <ESC ! 00> tokens; text stays text.
 */
export function decodeForHumans(buffer: Buffer): string {
  const out: string[] = [];
  let line = "";
  let i = 0;

  const flush = () => {
    out.push(line);
    line = "";
  };

  while (i < buffer.length) {
    const byte = buffer[i];

    if (byte === 0x0a) {
      line += "<LF>";
      flush();
      i += 1;
      continue;
    }

    const table = byte === ESC ? ESC_SEQUENCES : byte === GS ? GS_SEQUENCES : undefined;
    if (table && i + 1 < buffer.length) {
      const entry = table[buffer[i + 1]];
      if (entry) {
        const [label, argCount] = entry;
        const args = Array.from(buffer.subarray(i + 2, i + 2 + argCount))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join(" ");
        line += `<${label}${args ? " " + args : ""}>`;
        i += 2 + argCount;
        continue;
      }
    }

    if (byte >= 0x20 && byte <= 0x7e) {
      line += String.fromCharCode(byte);
    } else {
      line += `<${byte.toString(16).padStart(2, "0")}>`;
    }
    i += 1;
  }

  if (line) flush();
  return out.join("\n");
}

export interface SnapshotEntry {
  name: string;
  buffer: Buffer;
}

function render(entries: SnapshotEntry[]): string {
  const blocks = entries.map(({ name, buffer }) => {
    const hex = buffer.toString("hex");
    const chunks = hex.match(/.{1,64}/g) ?? [];
    return [
      `### ${name}`,
      `bytes: ${buffer.length}`,
      "hex:",
      ...chunks,
      "decoded:",
      decodeForHumans(buffer),
      "",
    ].join("\n");
  });
  return blocks.join("\n");
}

/** Extracts the hex payload of each fixture from a rendered snapshot file. */
export function parseHex(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  let current: string | null = null;
  let collecting = false;

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trimEnd();
    if (line.startsWith("### ")) {
      current = line.slice(4).trim();
      result[current] = "";
      collecting = false;
    } else if (line === "hex:") {
      collecting = true;
    } else if (line === "decoded:" || line.startsWith("bytes:")) {
      collecting = false;
    } else if (collecting && current && /^[0-9a-f]*$/.test(line)) {
      result[current] += line;
    }
  }

  return result;
}

/**
 * Compares `entries` against the golden file, or writes it when UPDATE_GOLDENS=1.
 * Returns the golden hex keyed by fixture name.
 */
export function loadOrWriteGolden(
  fileName: string,
  entries: SnapshotEntry[]
): Record<string, string> {
  const path = join(GOLDEN_DIR, fileName);

  if (shouldUpdate || !existsSync(path)) {
    mkdirSync(GOLDEN_DIR, { recursive: true });
    writeFileSync(path, render(entries), "utf8");
  }

  return parseHex(readFileSync(path, "utf8"));
}
