/**
 * DEV-2627: jsPDF's built-in fonts are WinAnsi-only, so accented text was
 * lost on paper. `fontFamily: UNICODE_FONT_FAMILY` embeds a Unicode TTF.
 *
 * Run with: pnpm --filter @thermal-print/pdf test
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { PDFGenerator } from "../src/pdf-generator";
import { UNICODE_FONT_FAMILY } from "../src/index";

const ACCENTED = "ÁGUA TERÊ ç ã ÓLEO AÇÚCAR";
const PAPER_WIDTH = 205;

function render(fontFamily: string | undefined, text: string, bold = false) {
  const generator = new PDFGenerator({ paperWidth: PAPER_WIDTH, fontFamily });
  generator.initialize();
  generator.setBold(bold);
  generator.addText(text);
  const raw = Buffer.from(generator.getArrayBuffer()).toString("latin1");
  return { generator, raw };
}

/** Unicode code points the PDF's ToUnicode CMaps map glyphs back to. */
function textLayerCodePoints(raw: string): Set<number> {
  const found = new Set<number>();
  for (const m of raw.matchAll(/<[0-9A-Fa-f]{4}>\s*<([0-9A-Fa-f]{4})>/g)) {
    found.add(parseInt(m[1], 16));
  }
  return found;
}

describe("embedded Unicode font", () => {
  it("embeds a TrueType font and maps accented glyphs into the text layer", () => {
    const { raw } = render(UNICODE_FONT_FAMILY, ACCENTED);

    assert.match(raw, /\/FontFile2/, "font program must be embedded");
    assert.match(raw, /\/Identity-H/);
    const codePoints = textLayerCodePoints(raw);
    for (const ch of "ÁÊçãÓÇÚ") {
      assert.ok(
        codePoints.has(ch.codePointAt(0)!),
        `"${ch}" missing from the PDF text layer`
      );
    }
  });

  it("does not embed anything when the default font is used", () => {
    const { raw } = render(undefined, "AGUA");
    assert.doesNotMatch(raw, /\/FontFile2/);
  });

  it("maps bold to a real bold face, with its own metrics", () => {
    const regular = render(UNICODE_FONT_FAMILY, ACCENTED).generator;
    const bold = render(UNICODE_FONT_FAMILY, ACCENTED, true).generator;
    assert.ok(bold.getTextWidth(ACCENTED) > regular.getTextWidth(ACCENTED));

    // Both faces ship in the PDF, so bold is never synthesized
    const { raw } = render(UNICODE_FONT_FAMILY, "TOTAL", true);
    assert.equal(raw.match(/\/FontFile2/g)?.length, 2);
  });

  it("measures accented text with the same font it draws with", () => {
    const { generator } = render(UNICODE_FONT_FAMILY, "x");
    const plain = generator.getTextWidth("AGUA TERE c a");
    const accented = generator.getTextWidth("ÁGUA TERÊ ç ã");
    // Accents do not widen a glyph: width stays within a hair of the base letters
    assert.ok(Math.abs(accented - plain) < 0.5, `${accented} vs ${plain}`);
  });

  it("keeps Helvetica-class widths, so column math tuned on Helvetica holds", () => {
    const helvetica = render(undefined, "x").generator;
    const unicode = render(UNICODE_FONT_FAMILY, "x").generator;
    const sample = "1x PICANHA NA CHAPA COM FRITAS 0123456789 R$ 12,50";
    const ratio = unicode.getTextWidth(sample) / helvetica.getTextWidth(sample);
    assert.ok(ratio > 0.98 && ratio < 1.02, `width ratio ${ratio}`);
  });
});
