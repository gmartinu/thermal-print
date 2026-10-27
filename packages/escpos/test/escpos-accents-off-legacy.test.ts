/**
 * DEV-2803: with printAccents off the output must stay byte-identical to what
 * shipped before the IBM CP860 table fix (PR #13). The hex below was captured
 * from 048b53c^ (the pre-#13 tree), for non-ASCII input on both adapters.
 */
import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { printNodesToESCPOS } from "../src/converter";
import { encodeCP860 } from "../src/encodings/cp860";
import { encodeCP860Legacy } from "../src/encodings/cp860-legacy";
import { alignTextInColumn } from "../src/styles";
import { doc, page, text } from "./fixtures";

const GOLDENS: Array<[string, string, string]> = [
  ["escpos", "\u00c1GUA TER\u00ca S/G\u00c1S", "1b401b32051b21008f475541205445523f20532f478f530a0a0a1b64031b69"],
  ["escpos", "MACARR\u00c3O", "1b401b32051b21004d41434152528e4f0a0a0a1b64031b69"],
  ["escpos", "A\u00c7A\u00cd", "1b401b32051b21004180413f0a0a0a1b64031b69"],
  ["escpos", "P\u00c3O", "1b401b32051b2100508e4f0a0a0a1b64031b69"],
  ["escbematech", "\u00c1GUA TER\u00ca S/G\u00c1S", "1b401b321b21018f475541205445523f20532f478f530a0a0a0a0a0a1b69"],
  ["escbematech", "MACARR\u00c3O", "1b401b321b21014d41434152528e4f0a0a0a0a0a0a1b69"],
  ["escbematech", "A\u00c7A\u00cd", "1b401b321b21014180413f0a0a0a0a0a0a1b69"],
  ["escbematech", "P\u00c3O", "1b401b321b2101508e4f0a0a0a0a0a0a1b69"]
];

describe("printAccents off is byte-identical to pre-#13", () => {
  for (const [adapter, str, hex] of GOLDENS) {
    it(`${adapter}: ${str}`, async () => {
      const content = doc([page({}, [text({}, str)])]);
      const def = await printNodesToESCPOS(content, { commandAdapter: adapter as any });
      const off = await printNodesToESCPOS(content, { commandAdapter: adapter as any, printAccents: false });
      assert.equal(Buffer.from(def).toString("hex"), hex);
      assert.equal(Buffer.from(off).toString("hex"), hex);
    });
  }

  it("legacy encoder keeps Á at 0x8f; the corrected one uses 0x86", () => {
    assert.deepEqual(encodeCP860Legacy("Á"), [0x8f]);
    assert.deepEqual(encodeCP860("Á"), [0x86]);
  });

  it("column width math uses the selected encoder", () => {
    // Both maps give one byte per accented letter, so a width-3 cell is unchanged;
    // an unmapped char is 1 byte ('?') in both. Guard the injected-encoder path.
    assert.equal(alignTextInColumn("Á", 3, "left"), "Á  ");
    assert.equal(alignTextInColumn("Á", 3, "left", encodeCP860), "Á  ");
    // 2 bytes per char: "ABC" (6 bytes) is truncated to "AB" to fit width 4
    assert.equal(alignTextInColumn("ABC", 4, "left", (t) => [...t].flatMap(() => [1, 1])), "AB");
  });
});
