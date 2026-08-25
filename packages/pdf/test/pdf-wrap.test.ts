/**
 * Regression tests for DEV-2510: PDF output used to CLIP anything wider than
 * the paper (the ESC/POS renderer wrapped, PDF did not), so receipts printed
 * through the PDF path came out cut off on the right.
 *
 * Run with: pnpm --filter @thermal-print/pdf test
 */

import { strict as assert } from "node:assert";
import { describe, it, beforeEach } from "node:test";

import { PDFGenerator } from "../src/pdf-generator";
import { PDFTraverser } from "../src/pdf-traverser";

const PAPER_WIDTH = 205; // pt - the real Mister Rancho geometry (page_size 205)

interface DrawnText {
  text: string;
  x: number;
  y: number;
  align: string;
  /** width measured with the font that was active at draw time */
  width: number;
  /** font size (pt) active at draw time */
  fontSize: number;
}

/**
 * Capture every string jsPDF is asked to draw, with its anchor point.
 * Reaching into the private jsPDF instance is deliberate: it is the only
 * observable output of the generator short of parsing the PDF itself.
 */
function captureText(generator: PDFGenerator): DrawnText[] {
  const drawn: DrawnText[] = [];
  const pdf = (generator as any).pdf;
  const original = pdf.text.bind(pdf);
  pdf.text = (text: string, x: number, y: number, options: any = {}) => {
    drawn.push({
      text,
      x,
      y,
      align: options.align ?? "left",
      width: pdf.getTextWidth(text),
      fontSize: pdf.getFontSize(),
    });
    return original(text, x, y, options);
  };
  return drawn;
}

/** Left edge of a drawn string, whatever anchor jsPDF was given. */
function leftEdge(drawn: DrawnText): number {
  if (drawn.align === "center") return drawn.x - drawn.width / 2;
  if (drawn.align === "right") return drawn.x - drawn.width;
  return drawn.x;
}

function rightEdge(drawn: DrawnText): number {
  return leftEdge(drawn) + drawn.width;
}

const LONG_ITEM =
  "1x PICANHA NA CHAPA COM FRITAS ARROZ FAROFA E VINAGRETE PARA DOIS";

describe("PDFGenerator.addText wrapping", () => {
  let generator: PDFGenerator;
  let drawn: DrawnText[];

  beforeEach(() => {
    generator = new PDFGenerator({ paperWidth: PAPER_WIDTH });
    generator.initialize();
    drawn = captureText(generator);
  });

  it("wraps text wider than the paper instead of clipping it", () => {
    generator.setFontSize(10);
    generator.addText(LONG_ITEM);

    assert.ok(drawn.length > 1, "long text must produce more than one line");
    // Nothing may run past the right edge of the content area
    for (const line of drawn) {
      assert.ok(
        rightEdge(line) <= generator.getContentWidth() + 0.5,
        `line "${line.text}" overflows the content width`
      );
    }
    // No text is lost: every word survives the wrap
    const joined = drawn.map((d) => d.text).join(" ");
    for (const word of LONG_ITEM.split(" ")) {
      assert.ok(joined.includes(word), `word "${word}" was dropped`);
    }
  });

  it("advances Y once per wrapped line, leaving the last newline to the caller", () => {
    generator.setFontSize(10);
    const startY = generator.getCurrentY();
    generator.addText(LONG_ITEM);
    const advance = generator.getCurrentY() - startY;

    assert.equal(
      Math.round(advance * 100) / 100,
      Math.round((drawn.length - 1) * generator.getLineAdvance() * 100) / 100
    );
  });

  it("leaves short text on a single line and does not advance Y", () => {
    generator.setFontSize(10);
    const startY = generator.getCurrentY();
    generator.addText("TOTAL");

    assert.equal(drawn.length, 1);
    assert.equal(generator.getCurrentY(), startY);
  });

  it("keeps wrapped lines centered when alignment is center", () => {
    generator.setFontSize(10);
    generator.setAlign("center");
    generator.addText(LONG_ITEM);

    assert.ok(drawn.length > 1);
    const center = generator.getContentWidth() / 2;
    for (const line of drawn) {
      assert.equal(line.align, "center");
      assert.equal(line.x, Math.round(center * 100) / 100);
      assert.ok(rightEdge(line) <= generator.getContentWidth() + 0.5);
    }
  });

  it("respects nested horizontal padding when wrapping", () => {
    generator.setFontSize(10);
    generator.pushHorizontalPadding(20, 20);
    generator.addText(LONG_ITEM);
    const padded = generator.getContentWidth();
    generator.popHorizontalPadding(20, 20);

    for (const line of drawn) {
      assert.ok(
        line.width <= padded + 0.5,
        `line "${line.text}" ignores the padding-reduced width`
      );
    }
  });

  it("honors explicit newlines with a single advance between segments", () => {
    generator.setFontSize(10);
    const startY = generator.getCurrentY();
    generator.addText("LINHA A\nLINHA B");

    assert.deepEqual(
      drawn.map((d) => d.text),
      ["LINHA A", "LINHA B"]
    );
    assert.equal(
      Math.round((generator.getCurrentY() - startY) * 100) / 100,
      Math.round(generator.getLineAdvance() * 100) / 100
    );
  });

  it("breaks a single unbreakable word rather than letting it run off", () => {
    generator.setFontSize(14);
    generator.addText("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");

    assert.ok(drawn.length > 1);
    for (const line of drawn) {
      assert.ok(rightEdge(line) <= generator.getContentWidth() + 0.5);
    }
  });
});

describe("PDFGenerator.addTextBlockAtX", () => {
  let generator: PDFGenerator;
  let drawn: DrawnText[];

  beforeEach(() => {
    generator = new PDFGenerator({ paperWidth: PAPER_WIDTH });
    generator.initialize();
    drawn = captureText(generator);
  });

  it("wraps inside the column box and reports the line count", () => {
    generator.setFontSize(9);
    const boxWidth = 80;
    const lines = generator.addTextBlockAtX(LONG_ITEM, 20, boxWidth);

    assert.ok(lines > 1);
    assert.equal(drawn.length, lines);
    for (const line of drawn) {
      assert.ok(leftEdge(line) >= 20 - 0.5);
      assert.ok(rightEdge(line) <= 20 + boxWidth + 0.5);
    }
  });

  it("stacks the lines downward without moving the cursor", () => {
    generator.setFontSize(9);
    const startY = generator.getCurrentY();
    generator.addTextBlockAtX(LONG_ITEM, 0, 60);

    assert.equal(generator.getCurrentY(), startY, "Y must not advance");
    const advance = generator.getLineAdvance();
    drawn.forEach((line, index) => {
      assert.equal(
        line.y,
        Math.round((startY + index * advance) * 100) / 100
      );
    });
  });

  it("anchors a right-aligned column at the right edge of its box", () => {
    generator.setFontSize(9);
    generator.addTextBlockAtX("12,00", 100, 60, "right");

    assert.equal(drawn.length, 1);
    assert.equal(drawn[0].align, "right");
    assert.equal(drawn[0].x, 160);
  });

  it("falls back to the remaining width when the box width is unusable", () => {
    generator.setFontSize(9);
    const lines = generator.addTextBlockAtX(LONG_ITEM, 0, 0);
    assert.ok(lines >= 1);
    for (const line of drawn) {
      assert.ok(rightEdge(line) <= generator.getContentWidth() + 0.5);
    }
  });
});

/** Minimal PrintNode-shaped literals (structural typing keeps the test terse) */
function node(type: string, style: any, children: any[] = [], props: any = {}) {
  return { type, style, props, children } as any;
}

function textNode(content: string, style: any = {}) {
  return node("text", style, [], { children: content });
}

function receipt(body: any[]) {
  return node("document", {}, [
    node("page", { padding: 5 }, body, { size: { width: PAPER_WIDTH } }),
  ]);
}

async function render(tree: any, measurementMode = false) {
  const generator = measurementMode
    ? PDFGenerator.createForMeasurement({ paperWidth: PAPER_WIDTH })
    : new PDFGenerator({ paperWidth: PAPER_WIDTH });
  const drawn = captureText(generator);
  await new PDFTraverser(generator).traverse(tree);
  return { generator, drawn };
}

describe("PDFTraverser row layouts", () => {
  it("wraps a long cell inside its percentage column instead of over the neighbour", async () => {
    const row = node("view", { flexDirection: "row" }, [
      node("view", { width: "20%" }, [textNode("3x", { fontSize: 9 })]),
      node("view", { width: "80%" }, [textNode(LONG_ITEM, { fontSize: 9 })]),
    ]);
    const { generator, drawn } = await render(receipt([row]));

    assert.ok(drawn.length > 2, "the wide cell must wrap");
    for (const line of drawn) {
      assert.ok(
        rightEdge(line) <= PAPER_WIDTH + 0.5,
        `"${line.text}" runs off the paper`
      );
    }
  });

  it("grows the row height so the next line does not overlap the wrapped cell", async () => {
    const rows = [
      node("view", { flexDirection: "row" }, [
        node("view", { width: "20%" }, [textNode("3x", { fontSize: 9 })]),
        node("view", { width: "80%" }, [textNode(LONG_ITEM, { fontSize: 9 })]),
      ]),
      textNode("PROXIMA LINHA", { fontSize: 9 }),
    ];
    const { drawn } = await render(receipt(rows));

    const wrapped = drawn.filter((d) => d.text !== "PROXIMA LINHA");
    const next = drawn.find((d) => d.text === "PROXIMA LINHA");
    assert.ok(next, "next line must be rendered");
    const lowest = Math.max(...wrapped.map((d) => d.y));
    assert.ok(
      next!.y > lowest,
      `next line (y=${next!.y}) must sit below the wrapped cell (y=${lowest})`
    );
  });

  it("wraps space-between rows whose columns do not fit on one line", async () => {
    const row = node(
      "view",
      { flexDirection: "row", justifyContent: "space-between" },
      [
        node("view", {}, [textNode(LONG_ITEM, { fontSize: 9 })]),
        node("view", {}, [textNode("199,90", { fontSize: 9 })]),
      ]
    );
    const { generator, drawn } = await render(receipt([row]));

    assert.ok(drawn.length > 2);
    for (const line of drawn) {
      assert.ok(rightEdge(line) <= PAPER_WIDTH + 0.5);
    }
    const value = drawn.find((d) => d.text === "199,90");
    assert.ok(value, "the value column must still be printed");
  });

  it("does not leak the measured font size into a column without its own", async () => {
    // Regression: measureColumns() used to leave the LAST measured column's
    // fontSize applied, so a leading column without fontSize rendered at the
    // trailing column's size instead of the ambient default (10pt).
    const row = node(
      "view",
      { flexDirection: "row", justifyContent: "space-between" },
      [
        node("view", {}, [textNode("TOTAL")]),
        node("view", {}, [textNode("12,00", { fontSize: 14 })]),
      ]
    );
    const { drawn } = await render(receipt([row]));

    const total = drawn.find((d) => d.text === "TOTAL");
    const value = drawn.find((d) => d.text === "12,00");
    assert.ok(total && value);
    assert.equal(total!.fontSize, 10, "ambient column must keep the default size");
    assert.equal(value!.fontSize, 14);
  });

  it("keeps a short space-between row on one line (no layout change)", async () => {
    const row = node(
      "view",
      { flexDirection: "row", justifyContent: "space-between" },
      [
        node("view", {}, [textNode("TOTAL", { fontSize: 9 })]),
        node("view", {}, [textNode("12,00", { fontSize: 9 })]),
      ]
    );
    const { drawn } = await render(receipt([row]));

    assert.equal(drawn.length, 2);
    assert.equal(drawn[0].y, drawn[1].y);
  });

  it("stacks a centered row that is too wide for the paper", async () => {
    const row = node(
      "view",
      { flexDirection: "row", justifyContent: "center" },
      [
        node("view", {}, [textNode(LONG_ITEM, { fontSize: 10 })]),
        node("view", {}, [textNode(LONG_ITEM, { fontSize: 10 })]),
      ]
    );
    const { generator, drawn } = await render(receipt([row]));

    for (const line of drawn) {
      assert.ok(rightEdge(line) <= PAPER_WIDTH + 0.5);
    }
  });

  it("measures the same height it renders (two-pass consistency)", async () => {
    const tree = receipt([
      textNode(LONG_ITEM, { fontSize: 10 }),
      node("view", { flexDirection: "row" }, [
        node("view", { width: "20%" }, [textNode("3x", { fontSize: 9 })]),
        node("view", { width: "80%" }, [textNode(LONG_ITEM, { fontSize: 9 })]),
      ]),
      textNode("FIM", { fontSize: 9 }),
    ]);

    const measured = await render(tree, true);
    const rendered = await render(tree, false);

    assert.equal(
      Math.round(measured.generator.getCurrentY() * 100) / 100,
      Math.round(rendered.generator.getCurrentY() * 100) / 100
    );
  });
});
