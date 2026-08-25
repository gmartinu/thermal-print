# PDF text wrapping (DEV-2510)

## The bug it fixes

`@thermal-print/pdf` used to draw every string on a single line. jsPDF happily
accepts text wider than the media box and simply paints it past the edge, where
the printer clips it — receipts came out **cut off on the right**, silently, and
the missing text never appeared anywhere.

The ESC/POS renderer (`@thermal-print/escpos`) has always wrapped
(`wrapText()` in `packages/escpos/src/traverser.ts`), which is why the same
receipt printed correctly in ESC/POS mode and truncated in PDF mode. The real
difference between the two modes was **wrap vs clip**, not fonts or geometry.

`addWrappedText()` existed but was dead code: the traverser never called it.

## The rule

**Text in the PDF renderer wraps. Nothing is ever drawn past the content
width.** Two entry points enforce it, and new code must go through one of them:

| Situation | Use | Behavior |
| --- | --- | --- |
| Block text (`<Text>`, orphan text nodes) | `PDFGenerator.addText()` | Wraps to `contentWidth` (already net of page margins and nested padding). Advances Y between wrapped lines; the **caller still owns the trailing newline**. |
| One cell of a `flexDirection: "row"` View | `PDFGenerator.addTextBlockAtX(text, xOffset, maxWidth, align)` | Wraps inside the column box, stacks lines downward **without moving the cursor**, and returns the line count. |

`addTextAtX()` / `addTextAtPosition()` (no wrapping, no width) survive only for
the single-line fast path in `space-between` rows that already fit. Do not use
them for content that can be long.

## Row height

A wrapped cell must not be overlapped by the next row. `PDFTraverser`
accumulates, per row:

```
extraHeight = max over columns of (lines - 1) * generator.getLineAdvance()
```

measured **while that column's font is still applied**, and then does
`addNewline()` (row font, exactly as before) followed by
`addSpacing(extraHeight)`. When nothing wraps, `extraHeight` is 0 and the
vertical rhythm is byte-identical to the previous behavior — that is deliberate,
so existing receipts do not shift.

## Two-pass rendering

Dynamic height (`wrap=true`) renders twice: a measurement pass computes the
height, then the real pass draws into a page of that height. **Both passes must
wrap identically**, so the wrapping and line counting run in measurement mode
too (only the drawing is skipped). `splitTextToSize` needs real font metrics,
and the measurement generator does construct a jsPDF instance, so this works.

The test `measures the same height it renders (two-pass consistency)` in
`packages/pdf/test/pdf-wrap.test.ts` guards this. If a future change makes
layout depend on `measurementMode`, that test is the one that will catch it.

## Overflow fallbacks in row layouts

- **Explicit widths (`width: "20%"`)** — each cell wraps inside its own box
  (minus a 2pt gutter), clamped to the space actually remaining on the paper.
- **`justifyContent: "space-between"`** — if the natural widths fit on one line,
  the exact previous placement is kept. If not, the trailing column (typically a
  value) keeps its natural width, capped at 50% of the row, and the leading
  columns wrap into what is left.
- **`justifyContent: "center"`** — if the group is wider than the paper, the
  columns are stacked as centered wrapped blocks instead of spilling sideways.

## Caveat: the layout is still not flexbox

Wrapping fixes truncation; it does not turn the traverser into a flex engine.
A row whose columns are *all* long will grow tall rather than balance widths,
and column widths are still taken verbatim from the `width` percentages. If
receipt layouts start needing real measurement-driven column sizing, that is a
larger change than this one.
