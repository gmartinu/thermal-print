/**
 * DEV-2803: per-printer "print accents". Off must not move a single byte;
 * on selects CP860 with ESC t and encodes with the official IBM CP860 table.
 */
import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { printNodesToESCPOS } from "../src/converter";
import { encodeCP860 } from "../src/encodings/cp860";
import { doc, page, text } from "./fixtures";
import { indexOfBytes } from "./snapshot";

const receipt = (content: string) => doc([page({}, [text({}, content)])]);
const SAMPLE = "AÇÃO São José Ônibus Água Íntimo";

describe("CP860 table (official IBM)", () => {
  const cases: Array<[string, number]> = [
    ["Ç", 0x80], ["ü", 0x81], ["é", 0x82], ["â", 0x83], ["ã", 0x84], ["à", 0x85],
    ["Á", 0x86], ["ç", 0x87], ["ê", 0x88], ["Ê", 0x89], ["è", 0x8a], ["Í", 0x8b],
    ["Ô", 0x8c], ["Ã", 0x8e], ["Â", 0x8f], ["É", 0x90], ["À", 0x91], ["ô", 0x93],
    ["õ", 0x94], ["Ú", 0x96], ["Õ", 0x99], ["Ó", 0x9f], ["á", 0xa0], ["í", 0xa1],
    ["ó", 0xa2], ["ú", 0xa3], ["ª", 0xa6], ["º", 0xa7],
  ];
  for (const [ch, byte] of cases) {
    it(`${ch} -> 0x${byte.toString(16)}`, () => {
      assert.deepEqual(encodeCP860(ch), [byte]);
    });
  }
  it("keeps ASCII untouched and falls back to ? for unmapped", () => {
    assert.deepEqual(encodeCP860("Az9 "), [0x41, 0x7a, 0x39, 0x20]);
    assert.deepEqual(encodeCP860("€"), [0x3f]);
  });
});

describe("printAccents", () => {
  for (const adapter of ["escpos", "escbematech"] as const) {
    const codePage = adapter === "escpos" ? 3 : 4;

    it(`${adapter}: off adds no ESC t and equals the default`, async () => {
      const def = await printNodesToESCPOS(receipt("Cafe"), { commandAdapter: adapter });
      const off = await printNodesToESCPOS(receipt("Cafe"), {
        commandAdapter: adapter,
        printAccents: false,
      });
      assert.deepEqual(Array.from(off), Array.from(def));
      assert.equal(indexOfBytes(off, [0x1b, 0x74]), -1);
    });

    it(`${adapter}: on sends ESC t ${codePage} right after init and encodes accents`, async () => {
      const off = await printNodesToESCPOS(receipt("Cafe"), { commandAdapter: adapter });
      const on = await printNodesToESCPOS(receipt(SAMPLE), {
        commandAdapter: adapter,
        printAccents: true,
      });
      const escT = indexOfBytes(on, [0x1b, 0x74, codePage]);
      const init = indexOfBytes(on, [0x1b, 0x40]);
      assert.equal(escT, init + 2);
      assert.equal(on.length > off.length, true);
      assert.notEqual(indexOfBytes(on, encodeCP860(SAMPLE)), -1);
    });
  }
});
