# Styling Reference

This document provides a comprehensive reference of all CSS-like style properties supported by react-escpos, their ESC/POS command mappings, and limitations imposed by thermal printer hardware.

## Overview

react-escpos converts React styles to ESC/POS printer commands. Due to thermal printer hardware constraints, only a subset of CSS properties are supported. This document clarifies what works, what doesn't, and why.

## Style Modes

Since DEV-2390 the ESC/POS renderer has two style modes, chosen with the
`styleMode` option of `printNodesToESCPOS()`:

| Mode | Meaning |
|------|---------|
| `'legacy'` (default) | Exactly the bytes shipped before DEV-2390. `fontSize`, vertical `margin`/`padding`, horizontal padding and Page margins are ignored. |
| `'rico'` | All of the above are honoured, bringing the output close to what `@thermal-print/pdf` draws from the same tree. |

Layout **bugs** (see the tables below) are fixed in both modes. The promise that
`legacy` never moves a byte is enforced by the goldens in
`packages/escpos/test/goldens/legacy-*.snap`.

## Paper Width Configuration

Default: **42 characters** — Font A on an 80mm printer, measured on a Bematech
MP-4200 TH. Fonts do not divide the paper into the same number of columns, so
the width is calibrated per font, not derived from a formula:

| Paper / font | Columns |
|--------------|---------|
| 58mm | 32 |
| 80mm, Font A (`fontMode: 'medium'`, default) | 42 |
| 80mm, Font B (`fontMode: 'small'`) | 56 |

Pass the measured value as `paperWidth`; the renderer derives the width of the
other font levels from it and never hardcodes a column count.

---

## Supported Properties

### Text Styling

| Property | Type | ESC/POS Command | Implementation | Limitations |
|----------|------|-----------------|----------------|-------------|
| `fontSize` | `number` | ESC ! (0x1B 0x21) | 3 levels, relative to `fontMode` | `styleMode: 'rico'` only; max 2x2 |
| `fontWeight` | `string \| number` | ESC ! (0x1B 0x21) | Bold emphasis bit in ESC ! command | Only bold/normal (no medium, light, etc.) |
| `fontFamily` | `string` | N/A | Only used for bold detection (`'Helvetica-Bold'`) | Cannot change physical font |
| `textAlign` | `'left' \| 'center' \| 'right'` | ESC a n (0x1B 0x61 n) | Sets printer alignment mode | Applied globally per line |

#### `fontSize` Size Mapping

Implemented in `packages/escpos/src/styles.ts` (`fontSizeLevelDelta`,
`resolveFontLevel`, `columnsForLevel`); honoured only with `styleMode: 'rico'`.

There are three levels, and `fontSize` picks one **relative to the document's
own base level**, which `fontMode` sets:

| Level | ESC ! | Columns on 80mm |
|-------|-------|-----------------|
| Font B 1x1 | `0x01` | 56 |
| Font A 1x1 | `0x00` | 42 |
| Font A 2x2 | `0x30` | 21 |

| `fontSize` | Step |
|------------|------|
| <= 10 | one level down |
| 11-19 | the document's own level |
| >= 20 | one level up |

So `fontSize: 24` in a `fontMode: 'medium'` document reaches Font A 2x2, and in
a `fontMode: 'small'` one it reaches Font A 1x1 — never two steps. A 2x2 line
that would not fit the paper (16 columns on 58mm) falls back one level instead
of wrapping.

**Note:** Uses ESC ! instead of GS ! for better compatibility with printers like Bematech MP-4200 TH.

#### `fontWeight` Detection

Implemented in `src/styles.ts:44-51`, applied in `src/generator.ts:318`

Recognized as bold:
- `fontWeight: 'bold'`
- `fontWeight: 700` (or higher)
- `fontFamily: 'Helvetica-Bold'`

#### `textAlign` Alignment Commands

Implemented in `src/styles.ts:92-96`, applied in `src/generator.ts:314`

| Value | ESC/POS | Bytes | Behavior |
|-------|---------|-------|----------|
| `'left'` | ESC a 0 | 0x1B 0x61 0x00 | Left-align text on paper |
| `'center'` | ESC a 1 | 0x1B 0x61 0x01 | Center text on paper |
| `'right'` | ESC a 2 | 0x1B 0x61 0x02 | Right-align text on paper |

---

### Layout Properties

| Property | Supported Values | Implementation | Limitations |
|----------|-----------------|----------------|-------------|
| `display` | Any | **Extracted but NOT used** | No effect on rendering |
| `flexDirection` | `'row'` \| `'column'` | Column (default) or row layout mode | Only 2 modes supported |
| `justifyContent` (column) | N/A | Not applicable in column layouts | Only affects row layouts |
| `justifyContent` (row) | `'space-between'` \| `'center'` | See table below | Only 2 modes implemented |
| `alignItems` | `'center'` \| `'flex-end'` | Text alignment fallback only | Does NOT control vertical positioning |

#### `flexDirection` Behavior

Implemented in `src/traverser.ts:81-108`

| Value | Behavior | Use Case |
|-------|----------|----------|
| `'column'` (default) | Stacks children vertically | Standard receipt layout |
| `'row'` | Side-by-side columns | Tables, payment summaries |

#### `justifyContent` for Row Layouts

Implemented in `src/traverser.ts:113-201`

| Value | Behavior | Requirements | Use Case |
|-------|----------|--------------|----------|
| `'space-between'` | Columns spread to the edges, free space split evenly between them | 2+ children, no explicit widths | Payment summaries (label: price) |
| `'center'` | Center entire row on paper | No explicit widths | Centered buttons, badges |
| `'flex-start'` | **Default behavior** (left-aligned) | N/A | Standard table layout |
| `'flex-end'` | ❌ **NOT SUPPORTED** | N/A | Would need trailing spaces implementation |
| `'space-around'` | ❌ **NOT SUPPORTED** | N/A | Equal spacing around columns |
| `'space-evenly'` | ❌ **NOT SUPPORTED** | N/A | Equal spacing including edges |

**Example: space-between (works)**
```typescript
<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
  <Text>Total</Text>
  <Text>$99.99</Text>
</View>
// Output: "Total                                        $99.99"
```

**Example: center (now works)**
```typescript
<View style={{ flexDirection: 'row', justifyContent: 'center' }}>
  <Text>PAID</Text>
</View>
// Output: "                      PAID                      "
```

#### `alignItems` Limitations

Implemented in `packages/escpos/src/traverser.ts` (`alignmentContext`).

**Only used as text alignment fallback** when child Text nodes don't specify
`textAlign` — but it now reaches every descendant Text and Image, not just the
direct children of a row. Applies in both style modes.

Does NOT control:
- Vertical centering (no concept in line-by-line thermal printing)
- Row-level horizontal alignment (use `justifyContent` instead)

---

### Spacing Properties

| Property | Supported | Conversion | Implementation | Limitations |
|----------|-----------|------------|----------------|-------------|
All of these need `styleMode: 'rico'`; in `legacy` they are extracted and ignored.

| Property | Supported | Conversion | Implementation | Limitations |
|----------|-----------|------------|----------------|-------------|
| `padding` | ✅ All four sides | 12pt = 1 line, 5.4pt = 1 column | `generator.applyViewSpacing` / `pushHorizontalPadding` | `rico` only |
| `paddingTop` | ✅ Yes | 12pt = 1 line feed | Line feeds, before the content | `rico` only |
| `paddingBottom` | ✅ Yes | 12pt = 1 line feed | Line feeds, before the bottom border | `rico` only |
| `paddingLeft` | ✅ Yes | 5.4pt = 1 column | Indents every line inside the element | `rico` only |
| `paddingRight` | ✅ Yes | 5.4pt = 1 column | Shrinks the usable width | `rico` only |
| `margin` | Top/Bottom only | 12pt = 1 line feed | Same as padding | Left/right margin not supported |
| `marginTop` | ✅ Yes | 12pt = 1 line feed | Via line feeds | `rico` only |
| `marginBottom` | ✅ Yes | 12pt = 1 line feed | Via line feeds | `rico` only |
| `marginLeft` | ❌ No | N/A | Extracted but ignored | Use `paddingLeft` on the parent View |
| `marginRight` | ❌ No | N/A | Extracted but ignored | Use `paddingRight` on the parent View |

**Conversion Formula:** `packages/escpos/src/styles.ts` (`calculateSpacing`,
`calculateHorizontalSpacing`). The constants are the PDF renderer's own
geometry — a 10pt body line is 12pt tall at the default 1.2 line height, and an
80mm page is 226pt wide for 42 Font A columns — which is why the same value
produces the same gap in the preview and on paper. Vertical spacing is capped at
6 lines so a stray `marginTop: 400` cannot eject a page of paper.

```typescript
lines = Math.min(6, Math.round(points / 12))
columns = Math.round(points / (226 / 42))
```

---

### Border Properties

| Property | Supported | Implementation | Limitations |
|----------|-----------|----------------|-------------|
| `borderTop` | ✅ Yes | Generates divider line | Full-width only (solid or dashed) |
| `borderBottom` | ✅ Yes | Generates divider line | Full-width only (solid or dashed) |
| `borderLeft` | ❌ No | N/A | Not supported |
| `borderRight` | ❌ No | N/A | Not supported |
| `border` | ❌ No | N/A | Not supported |
| `borderWidth` | ❌ No | N/A | Not supported |
| `borderColor` | ❌ No | N/A | Thermal printers are monochrome |

#### Border Style Detection

Implemented in `src/styles.ts:111-121`, applied in `src/generator.ts:334-341`

| Style Value | Character | Rendering |
|-------------|-----------|-----------|
| Contains "dashed" | `-` | `------------------------------------------------` |
| Any other value | `─` | `────────────────────────────────────────────────` |

**Example:**
```typescript
<View style={{ borderTop: '1px solid black' }}>
  {/* Renders: ──────────────────────── */}
</View>

<View style={{ borderBottom: '1px dashed gray' }}>
  {/* Renders: -------------------- */}
</View>
```

---

### Sizing Properties

| Property | Type | Implementation | Limitations |
|----------|------|----------------|-------------|
| `width` | `string` (percentage) or `number` | Column width in row layouts | Only used in `flexDirection: 'row'` |

#### `width` Parsing

Implemented in `packages/escpos/src/styles.ts` (`parseWidth`,
`distributeColumnWidths`), used in `traverser.handleRowLayout`. A `width` on a
View also caps the width of an Image drawn inside it.

| Input Format | Parsing | Example |
|--------------|---------|---------|
| `'50%'` | Percentage of paper width | `width: '50%'` → 21 chars (on 42-char paper) |
| `25` | Absolute character count | `width: 25` → 25 chars |
| `undefined` | Auto-calculated | The width left over by the sibling columns, split evenly |

A row can declare more than the line holds — three cells of `'50%'`, or a
`width: '100%'` cell with a sibling. There is no honest way to honour that, so
`distributeColumnWidths` falls back to an **even split across every column**.
Leaving the declared widths in place would give the leftover columns zero
characters, and a zero-width column wraps its text one letter per line: metres
of paper for a single row.

**Example: Table Layout**
```typescript
<View style={{ flexDirection: 'row' }}>
  <View style={{ width: '30%' }}><Text>SKU</Text></View>
  <View style={{ width: '50%' }}><Text>Product</Text></View>
  <View style={{ width: '20%' }}><Text>Price</Text></View>
</View>
```

---

## Unsupported Properties

### Flexbox Properties (Not Implemented)

| Property | Status | Reason |
|----------|--------|--------|
| `flex` | ❌ Not supported | No flex-grow/shrink in thermal printing |
| `flexGrow` | ❌ Not supported | Fixed character-width layout |
| `flexShrink` | ❌ Not supported | Fixed character-width layout |
| `flexBasis` | ❌ Not supported | Use explicit `width` instead |
| `flexWrap` | ❌ Not supported | No multi-line row wrapping |
| `gap` | ❌ Not supported | Use padding/margin instead |
| `alignSelf` | ❌ Not supported | No per-item vertical alignment |
| `alignContent` | ❌ Not supported | No multi-line flex container support |

### Positioning Properties

| Property | Status | Reason |
|----------|--------|--------|
| `position` | ❌ Not supported | Thermal printers render line-by-line sequentially |
| `top` / `bottom` / `left` / `right` | ❌ Not supported | No absolute/relative positioning |
| `zIndex` | ❌ Not supported | No overlapping content |

### Visual Properties

| Property | Status | Reason |
|----------|--------|--------|
| `backgroundColor` | ❌ Not supported | Monochrome thermal printers (no background) |
| `color` | ❌ Not supported | Monochrome thermal printers (black ink only) |
| `opacity` | ❌ Not supported | No transparency support |
| `boxShadow` | ❌ Not supported | No shadow rendering |
| `borderRadius` | ❌ Not supported | Character-based rendering (no rounded corners) |

### Typography Properties

| Property | Status | Reason |
|----------|--------|--------|
| `lineHeight` | ❌ Not supported | Fixed line spacing (ESC 3 n set globally) |
| `letterSpacing` | ❌ Not supported | Fixed character width |
| `textTransform` | ❌ Not supported | Transform manually before rendering |
| `textDecoration` | ❌ Not supported | No underline/strikethrough in ESC/POS |
| `textShadow` | ❌ Not supported | Monochrome output |
| `fontStyle` | ❌ Not supported | No italic support on most thermal printers |

### Other Properties

| Property | Status | Reason |
|----------|--------|--------|
| `overflow` | ❌ Not supported | Text is truncated in row layouts |
| `transform` | ❌ Not supported | No rotation/scaling/skew |
| `filter` | ❌ Not supported | No image filters |
| `cursor` | ❌ Not supported | Printed output (not interactive) |

---

## Thermal Printer Constraints

### Fundamental Limitations

1. **Line-by-line rendering**: Content is rendered sequentially, top to bottom. No absolute positioning or overlapping.
2. **Character-based layout**: Positioning is in character cells, not pixels.
3. **Monochrome output**: Black ink on white paper only (no colors, no backgrounds).
4. **Fixed character width**: Each character occupies 1 cell (or multiples with size modifiers).
5. **No vertical centering**: Content flows top-down only. `alignItems: 'center'` has no vertical meaning.
6. **Horizontal margins are leading spaces**: the printer only aligns
   (left/center/right); `paddingLeft`/`paddingRight` are implemented by
   indenting the line and shrinking the usable width, in `styleMode: 'rico'`.

### Common Misconceptions

| Expectation | Reality | Alternative |
|-------------|---------|-------------|
| "I want this div centered vertically" | No vertical centering exists | Add `paddingTop` to push content down |
| "I want a 16pt left margin" | `marginLeft` is ignored | Use `paddingLeft` on the parent View with `styleMode: 'rico'` |
| "I want red text" | Monochrome printers only | Use bold for emphasis |
| "I want rounded corners on this box" | Character-based rendering | Use border characters creatively |
| "I want this text rotated 90°" | No rotation support | Some printers support 90° via vendor-specific commands (not in ESC/POS standard) |

---

## Migration Guide: CSS → Thermal Printer

### Common Patterns

#### Centered Content Block

**CSS:**
```css
.container {
  display: flex;
  justify-content: center;
  align-items: center;
}
```

**react-escpos:**
```typescript
// For single text element:
<Text style={{ textAlign: 'center' }}>Centered Text</Text>

// For row layout with multiple elements (NOW SUPPORTED):
<View style={{ flexDirection: 'row', justifyContent: 'center' }}>
  <Text>Button</Text>
</View>
```

#### Two-Column Layout

**CSS:**
```css
.row {
  display: flex;
  justify-content: space-between;
}
```

**react-escpos:**
```typescript
<View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
  <Text>Label</Text>
  <Text>Value</Text>
</View>
```

#### Emphasized Text

**CSS:**
```css
.emphasis {
  font-weight: bold;
  font-size: 18px;
  color: red;
}
```

**react-escpos:**
```typescript
<Text style={{ fontWeight: 'bold', fontSize: 18 }}>
  Emphasized Text
</Text>
// Note: No color support, use bold only
```

#### Spacing/Padding

**CSS:**
```css
.section {
  padding-top: 12pt;
  padding-bottom: 24pt;
}
```

**react-escpos:**
```typescript
<View style={{ paddingTop: 12, paddingBottom: 24 }}>
  {/* Content */}
</View>
// styleMode: 'rico' → 1 line feed top, 2 line feeds bottom (12pt per line)
```

#### Table Layout

**CSS:**
```css
.table {
  display: table;
}
.row {
  display: table-row;
}
.cell {
  display: table-cell;
  width: 33%;
}
```

**react-escpos:**
```typescript
<View style={{ flexDirection: 'row' }}>
  <View style={{ width: '33%' }}><Text>Cell 1</Text></View>
  <View style={{ width: '33%' }}><Text>Cell 2</Text></View>
  <View style={{ width: '34%' }}><Text>Cell 3</Text></View>
</View>
```

---

## Debugging Tips

### Checking Rendered Output

1. **Character Count**: Ensure row content doesn't exceed paper width
2. **Alignment**: Check if `textAlign` is set on Text elements (not View containers)
3. **Bold Not Showing**: Verify `fontWeight: 'bold'` or `fontWeight: 700` (not `600`)
4. **Size Not Changing**: fontSize has only 4 discrete levels (use 10, 16, 22, 28 for clear distinctions)
5. **Row Layout Issues**: Ensure `flexDirection: 'row'` is set on parent View

### Common Mistakes

| Issue | Cause | Fix |
|-------|-------|-----|
| Text not centered | `textAlign` on View instead of Text | Move `textAlign: 'center'` to `<Text>` element |
| Row not centered | Using `alignItems` instead of `justifyContent` | Use `justifyContent: 'center'` on row View |
| Padding not working | Left/right padding in the default `legacy` mode | Pass `styleMode: 'rico'` — horizontal padding is honoured only there |
| Row split evenly, ignoring the widths | Declared widths add up to more than the line | Make them add up to 100% (or to the character count of the paper) |
| Product name broken across lines | Content longer than its column | Expected: a cell wraps onto the next line of the row instead of being cut |

---

## File References

- **Type Definitions**: `src/types.ts:32-57` (TextStyle, ViewStyle interfaces)
- **Style Extraction**: `src/styles.ts` (parsing and conversion logic)
- **Layout Logic**: `src/traverser.ts:113-201` (row/column layout handling)
- **ESC/POS Generation**: `src/generator.ts` (low-level command generation)
- **Command Definitions**: `src/commands/escpos.ts` (raw byte sequences)

---

## Version History

- **v1.2.0+**: Added `justifyContent: 'center'` support for row layouts
- **v1.0.0**: Initial release with `space-between` and column layouts
