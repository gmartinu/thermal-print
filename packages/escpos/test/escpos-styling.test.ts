/**
 * DEV-2390: styling parity between the ESC/POS and the PDF renderer.
 *
 * Two kinds of test live here:
 *
 * 1. Layout BUGS, fixed in both style modes — alignItems that never reached
 *    the children, empty Views with a height, rows of three or more columns,
 *    cells truncated instead of wrapped, images ignoring the parent's width.
 * 2. The richer styling behind `styleMode: "rico"` — fontSize, vertical
 *    margin/padding, horizontal padding, Page margins, per-column styles.
 *
 * The promise that `legacy` output does not move lives in escpos-golden.test.ts.
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";

import { printNodesToESCPOS, type PrintNodeToESCPOSOptions } from "../src/converter";
import {
  columnsForLevel,
  distributeColumnWidths,
  distributeGaps,
  fontSizeLevelDelta,
  mapFontSizeToESCPOS,
  resolveFontLevel,
  calculateSpacing,
  wrapText,
} from "../src/styles";
import {
  cafe58mm,
  doc,
  image,
  page,
  richStyles,
  simpleReceipt,
  text,
  view,
  wideImageInNarrowView,
  WIDE_PNG,
} from "./fixtures";
import { decodeForHumans, loadOrWriteGolden } from "./snapshot";

const RICO: PrintNodeToESCPOSOptions = { styleMode: "rico" };

/**
 * The printed lines, with control sequences stripped. The solid divider is a
 * box-drawing character that CP860 encodes as 0xc4, so it is folded back into
 * a dash to keep the assertions readable.
 */
async function printedLines(node: any, options: PrintNodeToESCPOSOptions = {}): Promise<string[]> {
  const buffer = await printNodesToESCPOS(node, options);
  return decodeForHumans(buffer)
    .split("\n")
    .map((line) => line.replace(/<c4>/g, "-").replace(/<[^>]*>/g, ""));
}

/** Every ESC ! payload byte emitted, in order. */
async function printModes(node: any, options: PrintNodeToESCPOSOptions = {}): Promise<number[]> {
  const buffer = await printNodesToESCPOS(node, options);
  const modes: number[] = [];
  for (let i = 0; i + 2 < buffer.length; i++) {
    if (buffer[i] === 0x1b && buffer[i + 1] === 0x21) modes.push(buffer[i + 2]);
  }
  return modes;
}

const ESC_BANG_FONT_B = 0x01;
const ESC_BANG_BOLD = 0x08;
const ESC_BANG_DOUBLE_HEIGHT = 0x10;
const ESC_BANG_DOUBLE_WIDTH = 0x20;
const DOUBLE_SIZE = ESC_BANG_DOUBLE_HEIGHT | ESC_BANG_DOUBLE_WIDTH;

describe("style helpers", () => {
  it("reads fontSize as a step relative to the document body, not an absolute size", () => {
    assert.equal(fontSizeLevelDelta(8), -1);
    assert.equal(fontSizeLevelDelta(14), 0);
    assert.equal(fontSizeLevelDelta(undefined), 0);
    assert.equal(fontSizeLevelDelta("22px"), 1);

    // medium (Font A) is level 1, so a big fontSize reaches 2x2...
    assert.equal(resolveFontLevel(1, 24), 2);
    // ...while a small (Font B) document only steps up to Font A 1x1
    assert.equal(resolveFontLevel(0, 24), 1);
    // and cannot step below the condensed font
    assert.equal(resolveFontLevel(0, 8), 0);
  });

  it("maps a fontSize straight to the ESC ! font and multipliers of its level", () => {
    assert.deepEqual(mapFontSizeToESCPOS(24, 1), { font: 0, width: 2, height: 2 });
    assert.deepEqual(mapFontSizeToESCPOS(14, 1), { font: 0, width: 1, height: 1 });
    assert.deepEqual(mapFontSizeToESCPOS(8, 1), { font: 1, width: 1, height: 1 });
    // no fontSize means the document's base level, whatever fontMode chose
    assert.deepEqual(mapFontSizeToESCPOS(undefined, 0), { font: 1, width: 1, height: 1 });
  });

  it("derives the columns of every level from the calibrated paper width", () => {
    // 80mm MP-4200 TH: Font A fits 42, Font B fits 56, 2x2 fits half of Font A
    assert.equal(columnsForLevel(42, 1, 1), 42);
    assert.equal(columnsForLevel(42, 1, 0), 56);
    assert.equal(columnsForLevel(42, 1, 2), 21);
    // A document configured in Font B describes the same paper
    assert.equal(columnsForLevel(56, 0, 1), 42);
    assert.equal(columnsForLevel(56, 0, 0), 56);
    // 58mm paper
    assert.equal(columnsForLevel(32, 1, 2), 16);
    // horizontal padding comes off the top, in Font A columns
    assert.equal(columnsForLevel(42, 1, 1, 4), 38);
  });

  it("shares the row width with the columns that did not ask for one", () => {
    assert.deepEqual(distributeColumnWidths([undefined, undefined, undefined], 42), [14, 14, 14]);
    assert.deepEqual(distributeColumnWidths(["50%", undefined, undefined], 40), [20, 10, 10]);
    // the leftover goes to the leftmost columns so the row still fills the line
    assert.deepEqual(distributeColumnWidths([undefined, undefined], 41), [21, 20]);
    assert.deepEqual(distributeColumnWidths(["50%", "20%", "30%"], 42), [21, 8, 13]);
  });

  it("keeps at least one space in every gap of a space-between row", () => {
    assert.deepEqual(distributeGaps(3, 42, 2), [20, 19]);
    assert.deepEqual(distributeGaps(10, 20, 1), [10]);
    // content wider than the paper still separates the columns
    assert.deepEqual(distributeGaps(60, 42, 2), [1, 1]);
  });

  it("breaks a word that is wider than the column instead of overflowing it", () => {
    assert.deepEqual(wrapText("abcdefghij", 4), ["abcd", "efgh", "ij"]);
    assert.deepEqual(wrapText("ab cdefghij", 4), ["ab", "cdef", "ghij"]);
    assert.deepEqual(wrapText("short", 10), ["short"]);
  });

  it("converts vertical spacing from points to line feeds", () => {
    assert.equal(calculateSpacing(undefined), 0);
    assert.equal(calculateSpacing(5), 0); // less than half a line prints nothing
    assert.equal(calculateSpacing(12), 1);
    assert.equal(calculateSpacing("24pt"), 2);
    assert.equal(calculateSpacing(4000), 6); // capped: never eject a page of paper
  });
});

describe("layout fixes (both style modes)", () => {
  it("passes a column View's alignItems down to its children", async () => {
    const tree = doc([
      page({}, [
        view({ alignItems: "center" }, [text({}, "CENTERED")]),
        view({ alignItems: "flex-end" }, [text({}, "RIGHT")]),
        view({ alignItems: "center" }, [text({ textAlign: "left" }, "OWN ALIGN WINS")]),
      ]),
    ]);

    const buffer = await printNodesToESCPOS(tree);
    const hex = buffer.toString("hex");
    assert.ok(hex.includes("1b6101"), "expected ESC a 1 (center) from alignItems: center");
    assert.ok(hex.includes("1b6102"), "expected ESC a 2 (right) from alignItems: flex-end");

    // The child's own textAlign still wins over the inherited one
    const lines = await printedLines(tree);
    assert.equal(lines[2], "OWN ALIGN WINS");
  });

  it("treats an empty View with a height as a vertical spacer", async () => {
    const tree = doc([page({}, [text({}, "A"), view({ height: 24 }), text({}, "B")])]);
    const lines = await printedLines(tree);
    assert.deepEqual(lines.slice(0, 4), ["A", "", "", "B"]);
  });

  it("splits a three-column row instead of giving each column the whole line", async () => {
    const tree = doc([
      page({}, [view({ flexDirection: "row" }, [text({}, "A"), text({}, "B"), text({}, "C")])]),
    ]);
    const [line] = await printedLines(tree);
    assert.equal(line.length, 42);
    assert.equal(line.indexOf("B"), 14);
    assert.equal(line.indexOf("C"), 28);
  });

  it("spreads a space-between row across three columns", async () => {
    const tree = doc([
      page({}, [
        view({ flexDirection: "row", justifyContent: "space-between" }, [
          text({}, "L"),
          text({}, "M"),
          text({}, "R"),
        ]),
      ]),
    ]);
    const [line] = await printedLines(tree);
    assert.equal(line.length, 42);
    assert.equal(line[0], "L");
    assert.equal(line[41], "R");
    assert.equal(line.indexOf("M"), 21);
  });

  it("wraps a cell that is wider than its column instead of cutting it", async () => {
    const tree = doc([
      page({}, [
        view({ flexDirection: "row" }, [
          view({ width: "50%" }, [text({}, "Refrigerante lata zero acucar 350ml")]),
          view({ width: "50%" }, [text({ textAlign: "right" }, "9,90")]),
        ]),
      ]),
    ]);
    const lines = await printedLines(tree);
    assert.equal(lines[0].trimEnd(), "Refrigerante lata                     9,90");
    assert.equal(lines[1].trim(), "zero acucar 350ml");
    assert.ok(lines[0].endsWith("9,90"), "the value stays anchored to the right column");
  });

  it("caps an image at the width its parent View allows and centers it", async () => {
    const buffer = await printNodesToESCPOS(wideImageInNarrowView());
    const marker = buffer.indexOf(Buffer.from([0x1d, 0x76, 0x30]));
    assert.ok(marker >= 0, "expected a GS v 0 raster command");

    // 30% of 42 columns = 12 columns = 96 dots = 12 bytes per raster line
    assert.equal(buffer[marker + 4], 12, "image should be resized to the column budget");

    const unconstrained = await printNodesToESCPOS(
      doc([page({}, [view({}, [image({}, WIDE_PNG)])])])
    );
    const wideMarker = unconstrained.indexOf(Buffer.from([0x1d, 0x76, 0x30]));
    assert.equal(unconstrained[wideMarker + 4], 20, "without a constraint it keeps its 160px");
  });
});

describe("styleMode: rico — fontSize", () => {
  it("is ignored in legacy, so a fontSize cannot change bytes by accident", async () => {
    const withSize = await printNodesToESCPOS(
      doc([page({}, [text({ fontSize: 24 }, "TOTAL")])])
    );
    const withoutSize = await printNodesToESCPOS(doc([page({}, [text({}, "TOTAL")])]));
    assert.equal(withSize.toString("hex"), withoutSize.toString("hex"));
  });

  it("composes with fontMode: the base is the document, fontSize is a step", async () => {
    const big = doc([page({}, [text({ fontSize: 24 }, "TOTAL")])]);
    const small = doc([page({}, [text({ fontSize: 8 }, "note")])]);

    // medium (Font A) + one step up = Font A 2x2
    assert.ok((await printModes(big, RICO)).includes(DOUBLE_SIZE));
    // small (Font B) + one step up = Font A 1x1, NOT 2x2
    const fromSmall = await printModes(big, { ...RICO, fontMode: "small" });
    assert.ok(!fromSmall.some((mode) => mode & DOUBLE_SIZE));
    assert.ok(fromSmall.includes(0x00), "expected Font A 1x1");
    // medium + one step down = Font B 1x1
    assert.ok((await printModes(small, RICO)).includes(ESC_BANG_FONT_B));
    // small + one step down stays at the condensed font
    const clamped = await printModes(small, { ...RICO, fontMode: "small" });
    assert.ok(clamped.every((mode) => mode === ESC_BANG_FONT_B));
  });

  it("re-measures the line for the font it just selected", async () => {
    const tree = doc([
      page({}, [
        text({ fontSize: 8 }, "x".repeat(56)),
        text({ fontSize: 14 }, "y".repeat(42)),
      ]),
    ]);
    const lines = await printedLines(tree, RICO);
    // Font B fits 56 columns, Font A 42 — neither should wrap
    assert.equal(lines[0], "x".repeat(56));
    assert.equal(lines[1], "y".repeat(42));

    // one character more and each wraps at its own width
    const overflow = doc([page({}, [text({ fontSize: 8 }, "x".repeat(57))])]);
    const overflowLines = await printedLines(overflow, RICO);
    assert.equal(overflowLines[0].length, 56);
    assert.equal(overflowLines[1], "x");
  });

  it("drops a double-size line to normal instead of wrapping it on 58mm paper", async () => {
    const options = { ...RICO, paperWidth: 32 };

    // 16 columns is all a 2x2 line has on 32-column paper
    const short = doc([page({}, [text({ fontSize: 24 }, "TOTAL 20,00")])]);
    assert.ok((await printModes(short, options)).includes(DOUBLE_SIZE));

    const long = doc([page({}, [text({ fontSize: 24 }, "TOTAL A PAGAR R$ 1.234,56")])]);
    const modes = await printModes(long, options);
    assert.ok(!modes.some((mode) => mode & DOUBLE_SIZE), "should fall back to 1x1");
    const lines = await printedLines(long, options);
    assert.equal(lines[0], "TOTAL A PAGAR R$ 1.234,56".slice(0, 25));
  });
});

describe("styleMode: rico — spacing", () => {
  it("turns vertical margin and padding into line feeds, in box model order", async () => {
    const tree = doc([
      page({}, [
        text({}, "BEFORE"),
        view({ marginTop: 24, paddingBottom: 12, borderBottom: "1px solid black" }, [
          text({}, "INSIDE"),
        ]),
        text({}, "AFTER"),
      ]),
    ]);
    const lines = await printedLines(tree, RICO);
    assert.deepEqual(lines.slice(0, 4), ["BEFORE", "", "", "INSIDE"]);
    // padding-bottom feeds BEFORE the bottom border is drawn
    assert.equal(lines[4], "");
    assert.ok(lines[5].length === 42 && lines[5].trim().length > 0, "expected the divider");
    assert.equal(lines[6], "AFTER");
  });

  it("indents every line by the horizontal padding and shrinks the line with it", async () => {
    const tree = doc([
      page({}, [
        view({ paddingLeft: 16, paddingRight: 16 }, [
          text({}, "z".repeat(60)),
          view({ borderBottom: "1px solid black" }),
        ]),
      ]),
    ]);
    const lines = await printedLines(tree, RICO);
    // 16pt ~ 3 columns each side: 42 - 6 = 36 columns of content, indented by 3
    assert.equal(lines[0], "   " + "z".repeat(36));
    assert.equal(lines[1], "   " + "z".repeat(24));
    assert.equal(lines[2].length, 39, "the divider spans the padded line, not the paper");
  });

  it("applies Page padding as the receipt margin", async () => {
    const tree = doc([page({ padding: 11 }, [text({}, "w".repeat(60))])]);
    const lines = await printedLines(tree, RICO);
    // 11pt ~ 2 columns each side, and a paddingTop line feed before the content
    assert.equal(lines[0], "");
    assert.equal(lines[1], "  " + "w".repeat(38));
  });

  it("never lets a Page margin eat more than half the paper", async () => {
    const tree = doc([page({ padding: 400 }, [text({}, "TOTAL")])]);
    const lines = await printedLines(tree, RICO);
    const contentLine = lines.find((line) => line.includes("TOTAL")) ?? "";
    assert.ok(contentLine.length <= 42, "line must still fit the paper");
    assert.ok(contentLine.includes("TOTAL"), "content must survive an absurd margin");
  });
});

describe("styleMode: rico — rows", () => {
  it("gives each column of a row its own emphasis", async () => {
    const tree = doc([
      page({}, [
        view({ flexDirection: "row" }, [
          view({ width: "50%" }, [text({}, "TOTAL")]),
          view({ width: "50%" }, [
            text({ textAlign: "right", fontWeight: "bold" }, "R$ 20,00"),
          ]),
        ]),
      ]),
    ]);

    const modes = await printModes(tree, RICO);
    assert.ok(modes.includes(ESC_BANG_BOLD), "the value column must turn emphasis on");

    const [line] = await printedLines(tree, RICO);
    assert.equal(line.length, 42, "per-column styling must not break the grid");
    assert.ok(line.startsWith("TOTAL"));
    assert.ok(line.endsWith("R$ 20,00"));
  });

  it("shrinks a double-size cell to the columns it actually occupies", async () => {
    const tree = doc([
      page({}, [
        view({ flexDirection: "row" }, [
          view({ width: "50%" }, [text({}, "TOTAL")]),
          view({ width: "50%" }, [text({ textAlign: "right", fontSize: 24 }, "20,00")]),
        ]),
      ]),
    ]);

    const modes = await printModes(tree, RICO);
    assert.ok(modes.includes(DOUBLE_SIZE), "the value column prints double size");

    const [line] = await printedLines(tree, RICO);
    // 21 normal columns + 10 double-size characters ~ 21 columns = one full line
    assert.equal(line.length, 31);
    assert.ok(line.endsWith("20,00"));
  });
});

describe("ESC/Bematech font", () => {
  const bematech: PrintNodeToESCPOSOptions = { commandAdapter: "escbematech" };
  const tree = () => doc([page({}, [text({}, "TOTAL")])]);

  it("keeps printing in Font B in legacy, as it hardcoded before", async () => {
    const modes = await printModes(tree(), bematech);
    assert.ok(modes.length > 0);
    assert.ok(modes.every((mode) => mode & ESC_BANG_FONT_B), "legacy Bematech stays on Font B");
  });

  it("follows fontMode in rico, like the plain ESC/POS adapter does", async () => {
    const medium = await printModes(tree(), { ...bematech, ...RICO });
    assert.ok(medium.every((mode) => !(mode & ESC_BANG_FONT_B)), "medium means Font A");

    const small = await printModes(tree(), { ...bematech, ...RICO, fontMode: "small" });
    assert.ok(small.every((mode) => mode & ESC_BANG_FONT_B), "small means Font B");
  });
});

describe("rico snapshots", () => {
  const RICO_VARIANTS = [
    { file: "rico-medium-80mm.snap", options: RICO },
    { file: "rico-medium-58mm.snap", options: { ...RICO, paperWidth: 32 } },
  ];

  for (const variant of RICO_VARIANTS) {
    it(`records the rich rendering — ${variant.file}`, async () => {
      const entries = [];
      for (const fixture of [
        { name: "simple-receipt", node: simpleReceipt },
        { name: "cafe-58mm", node: cafe58mm },
        { name: "rich-styles", node: richStyles },
      ]) {
        entries.push({
          name: fixture.name,
          buffer: await printNodesToESCPOS(fixture.node(), variant.options),
        });
      }

      const golden = loadOrWriteGolden(variant.file, entries);
      for (const entry of entries) {
        assert.equal(entry.buffer.toString("hex"), golden[entry.name], `${entry.name} changed`);
      }
    });
  }
});
