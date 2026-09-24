/**
 * DEV-2635: a space-between row wider than the paper.
 *
 * The payment line of a 58mm receipt ("1 - Cartao de Debito cartao" +
 * "R$ 4,50") used to go out with 35 columns on 32-column paper, and the
 * printer broke it at column 32 — "R$ 4" on one line, ",50" on the next.
 * Now the amount stays whole and right-aligned, and the label wraps by word in
 * the width the amount leaves free. A row that fits must not move a byte: the
 * legacy/rico goldens hold that for whole receipts, and the tests below hold
 * it for every width of the two parts.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { printNodesToESCPOS, type PrintNodeToESCPOSOptions } from "../src/converter";
import { distributeGaps, layoutSpaceBetweenLine, wrapText } from "../src/styles";
import { doc, page, text, view } from "./fixtures";
import { decodeForHumans } from "./snapshot";

const PHOTO_LABEL = "1 - Cartao de Debito cartao";

/** The layout every row got before DEV-2635. */
function previousLayout(parts: string[], totalWidth: number): string {
  const used = parts.reduce((sum, part) => sum + part.length, 0);
  const gaps = distributeGaps(used, totalWidth, parts.length - 1);
  let rowText = parts[0];
  for (let i = 1; i < parts.length; i++) {
    rowText += " ".repeat(gaps[i - 1]) + parts[i];
  }
  return rowText;
}

const paymentRow = (label: string, amount: string): any =>
  view({ flexDirection: "row", justifyContent: "space-between" }, [
    text({}, label),
    text({}, amount),
  ]);

const receipt = (...rows: any[]): any => doc([page({}, rows)]);

async function printedLines(node: any, options: PrintNodeToESCPOSOptions): Promise<string[]> {
  const buffer = await printNodesToESCPOS(node, options);
  return decodeForHumans(buffer)
    .split("\n")
    .map((line) => line.replace(/<[^>]*>/g, ""))
    .filter((line) => line.length > 0);
}

describe("DEV-2635: wrapText keeps an amount together", () => {
  it("never leaves R$ apart from the number after it", () => {
    assert.deepEqual(wrapText("Pago R$ 4,50", 9), ["Pago", "R$ 4,50"]);
    assert.deepEqual(wrapText("Total a pagar R$ 1.234,56", 16), [
      "Total a pagar",
      "R$ 1.234,56",
    ]);
  });

  it("keeps a + or - sign with the amount, also in front of R$", () => {
    assert.deepEqual(wrapText("Desconto - R$ 1,00", 10), ["Desconto", "- R$ 1,00"]);
    assert.deepEqual(wrapText("Acrescimo + 2,00", 10), ["Acrescimo", "+ 2,00"]);
    assert.deepEqual(wrapText("Troco R$ -3,00", 8), ["Troco", "R$ -3,00"]);
  });

  it("still breaks on a dash that is not followed by a number", () => {
    assert.deepEqual(wrapText(PHOTO_LABEL, 24), ["1 - Cartao de Debito", "cartao"]);
    assert.deepEqual(wrapText("1 - Cartao", 3), ["1 -", "Car", "tao"]);
  });

  it("breaks an amount wider than the column at its space first", () => {
    assert.deepEqual(wrapText("R$ 1.234,56", 6), ["R$", "1.234,", "56"]);
    assert.deepEqual(wrapText("R$ 1.234,56", 8), ["R$", "1.234,56"]);
  });

  it("does not touch text that fits", () => {
    assert.deepEqual(wrapText("R$ 4,50", 7), ["R$ 4,50"]);
    assert.deepEqual(wrapText("a  b", 10), ["a  b"]);
  });
});

describe("DEV-2635: layoutSpaceBetweenLine", () => {
  it("58mm: the photo case keeps R$ 4,50 whole, on the last line of the label", () => {
    const lines = layoutSpaceBetweenLine([PHOTO_LABEL, "R$ 4,50"], 32);
    assert.deepEqual(lines, ["1 - Cartao de Debito", "cartao" + " ".repeat(19) + "R$ 4,50"]);
    for (const line of lines) assert.ok(line.length <= 32, `${line.length} > 32`);
  });

  it("58mm: a large amount is still whole and right-aligned", () => {
    const lines = layoutSpaceBetweenLine([PHOTO_LABEL, "R$ 1.234,56"], 32);
    assert.deepEqual(lines, ["1 - Cartao de Debito", "cartao" + " ".repeat(15) + "R$ 1.234,56"]);
    assert.ok(lines.every((line) => line.length <= 32));
    assert.ok(lines[lines.length - 1].endsWith("R$ 1.234,56"));
  });

  it("80mm: the photo case fits in 42 columns and is laid out as before", () => {
    const parts = [PHOTO_LABEL, "R$ 4,50"];
    assert.deepEqual(layoutSpaceBetweenLine(parts, 42), [previousLayout(parts, 42)]);
    assert.deepEqual(layoutSpaceBetweenLine(parts, 42), [PHOTO_LABEL + " ".repeat(8) + "R$ 4,50"]);
  });

  it("80mm: a label too long for 42 columns wraps and keeps the amount whole", () => {
    const label = "2 - Cartao de Credito Mastercard parcelado em 3x";
    const lines = layoutSpaceBetweenLine([label, "R$ 1.234,56"], 42);
    assert.deepEqual(lines, [
      "2 - Cartao de Credito",
      "Mastercard parcelado em 3x" + " ".repeat(5) + "R$ 1.234,56",
    ]);
    assert.ok(lines.every((line) => line.length <= 42));
  });

  it("a row that fits comes out exactly as before, for every width of the two parts", () => {
    for (const totalWidth of [32, 42, 56]) {
      for (let labelLength = 0; labelLength <= totalWidth; labelLength++) {
        for (let amountLength = 0; labelLength + amountLength + 1 <= totalWidth; amountLength++) {
          const parts = ["L".repeat(labelLength), "9".repeat(amountLength)];
          assert.deepEqual(layoutSpaceBetweenLine(parts, totalWidth), [
            previousLayout(parts, totalWidth),
          ]);
        }
      }
    }
  });

  it("a three-part row that fits comes out exactly as before", () => {
    const parts = ["Qtd", "Descricao", "R$ 4,50"];
    assert.deepEqual(layoutSpaceBetweenLine(parts, 32), [previousLayout(parts, 32)]);
    // exactly paperWidth with the minimum one-space gaps still counts as fitting
    const tight = ["a".repeat(10), "b".repeat(10), "c".repeat(10)];
    assert.deepEqual(layoutSpaceBetweenLine(tight, 32), [previousLayout(tight, 32)]);
  });

  it("a three-part row that does not fit joins the labels and keeps the last cell whole", () => {
    const lines = layoutSpaceBetweenLine(["2x", "Cartao de Debito cartao", "R$ 4,50"], 32);
    assert.deepEqual(lines, ["2x Cartao de Debito", "cartao" + " ".repeat(19) + "R$ 4,50"]);
  });

  it("the label takes its own line when a label word does not fit beside the amount", () => {
    const amount = "R$ 12.345.678,90 (entrada)";
    const lines = layoutSpaceBetweenLine(["Pagamento Mastercard", amount], 32);
    assert.deepEqual(lines, ["Pagamento Mastercard", " ".repeat(32 - amount.length) + amount]);
  });

  it("an amount as wide as the paper goes out whole on its own line", () => {
    const amount = "R$ 9.999.999.999.999.999.999,99";
    assert.equal(amount.length, 31);
    const lines = layoutSpaceBetweenLine(["Total", amount], 32);
    assert.deepEqual(lines, ["Total", " " + amount]);
    const wider = amount + "99";
    assert.deepEqual(layoutSpaceBetweenLine(["Total", wider], 32), ["Total", wider]);
  });

  it("an empty amount only wraps the label, an empty label only aligns the amount", () => {
    const longLabel = "palavra ".repeat(6).trim();
    assert.deepEqual(layoutSpaceBetweenLine([longLabel, ""], 32), wrapText(longLabel, 32));
    const longAmount = "R$ " + "9".repeat(32);
    assert.deepEqual(layoutSpaceBetweenLine(["", longAmount], 32), [longAmount]);
  });
});

describe("DEV-2635: space-between rows printed", () => {
  for (const [mode, options] of [
    ["legacy", { paperWidth: 32 }],
    ["rico", { paperWidth: 32, styleMode: "rico" }],
  ] as const) {
    it(`${mode} 58mm: no printed line is wider than the paper and R$ 4,50 is whole`, async () => {
      const lines = await printedLines(receipt(paymentRow(PHOTO_LABEL, "R$ 4,50")), options);
      assert.deepEqual(lines, ["1 - Cartao de Debito", "cartao" + " ".repeat(19) + "R$ 4,50"]);
    });
  }

  it("a row that fits prints the same bytes as the pre-DEV-2635 layout", async () => {
    const options = { paperWidth: 42 };
    const printed = await printNodesToESCPOS(
      receipt(paymentRow(PHOTO_LABEL, "R$ 4,50"), paymentRow("Total", "R$ 20,00")),
      options
    );
    const lines = decodeForHumans(printed)
      .split("\n")
      .map((line) => line.replace(/<[^>]*>/g, ""))
      .filter((line) => line.length > 0);
    assert.deepEqual(lines, [
      previousLayout([PHOTO_LABEL, "R$ 4,50"], 42),
      previousLayout(["Total", "R$ 20,00"], 42),
    ]);
  });

  it("80mm: an overflowing row ends with the amount on the last line", async () => {
    const label = "2 - Cartao de Credito Mastercard parcelado em 3x";
    const lines = await printedLines(receipt(paymentRow(label, "R$ 1.234,56")), {
      paperWidth: 42,
    });
    assert.equal(lines.length, 2);
    assert.ok(lines.every((line) => line.length <= 42));
    assert.ok(lines[1].endsWith("R$ 1.234,56"));
  });
});
