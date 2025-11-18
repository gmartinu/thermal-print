# Styling Reference

This document provides a comprehensive reference of all CSS-like style properties supported by react-escpos, their ESC/POS command mappings, and limitations imposed by thermal printer hardware.

## Overview

react-escpos converts React styles to ESC/POS printer commands. Due to thermal printer hardware constraints, only a subset of CSS properties are supported. This document clarifies what works, what doesn't, and why.

## Paper Width Configuration

Default: **48 characters** (80mm thermal printers)

Common configurations:
- **58mm paper** = 32 characters
- **80mm paper** = 48 characters (default)
- **112mm paper** = 64 characters

Configure via `convertToESCPOS()` options.

---

## Supported Properties

### Text Styling

| Property | Type | ESC/POS Command | Implementation | Limitations |
|----------|------|-----------------|----------------|-------------|
| `fontSize` | `number` | ESC ! (0x1B 0x21) | 4 discrete sizes based on pixel ranges | Max 2x2 character size |
| `fontWeight` | `string \| number` | ESC ! (0x1B 0x21) | Bold emphasis bit in ESC ! command | Only bold/normal (no medium, light, etc.) |
| `fontFamily` | `string` | N/A | Only used for bold detection (`'Helvetica-Bold'`) | Cannot change physical font |
| `textAlign` | `'left' \| 'center' \| 'right'` | ESC a n (0x1B 0x61 n) | Sets printer alignment mode | Applied globally per line |

#### `fontSize` Size Mapping

Implemented in `src/styles.ts:73-87`, applied in `src/generator.ts:322`

| Pixel Range | Output Size | ESC ! Value | Description |
|-------------|-------------|-------------|-------------|
| 8-12px | 1x1 | 0x00 | Normal width, normal height |
| 13-18px | 1x2 | 0x10 | Normal width, double height |
| 19-24px | 2x1 | 0x20 | Double width, normal height |
| 25+px | 2x2 | 0x30 | Double width, double height (MAX) |

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
| `'space-between'` | Two columns with maximized gap | 2 children, no explicit widths | Payment summaries (label: price) |
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

Implemented in `src/traverser.ts:150-154`

**Only used as text alignment fallback** when child Text nodes don't specify `textAlign`.

Does NOT control:
- Vertical centering (no concept in line-by-line thermal printing)
- Row-level horizontal alignment (use `justifyContent` instead)

---

### Spacing Properties

| Property | Supported | Conversion | Implementation | Limitations |
|----------|-----------|------------|----------------|-------------|
| `padding` | Top/Bottom only | ~20px = 1 line feed | `src/generator.ts:329-343` | Left/right padding not supported |
| `paddingTop` | ✅ Yes | ~20px = 1 line feed | Via ESC 3 n line spacing | Approximate conversion |
| `paddingBottom` | ✅ Yes | ~20px = 1 line feed | Via ESC 3 n line spacing | Approximate conversion |
| `paddingLeft` | ❌ No | N/A | Extracted but ignored | No horizontal margin on thermal printers |
| `paddingRight` | ❌ No | N/A | Extracted but ignored | No horizontal margin on thermal printers |
| `margin` | Top/Bottom only | ~20px = 1 line feed | Same as padding | Left/right margin not supported |
| `marginTop` | ✅ Yes | ~20px = 1 line feed | Via line feeds | Approximate conversion |
| `marginBottom` | ✅ Yes | ~20px = 1 line feed | Via line feeds | Approximate conversion |
| `marginLeft` | ❌ No | N/A | Extracted but ignored | No horizontal margin on thermal printers |
| `marginRight` | ❌ No | N/A | Extracted but ignored | No horizontal margin on thermal printers |

**Conversion Formula:** `src/styles.ts:105`
```typescript
lines = Math.round(pixels / 20)
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

Implemented in `src/styles.ts:134-147`, used in `src/traverser.ts:135`

| Input Format | Parsing | Example |
|--------------|---------|---------|
| `'50%'` | Percentage of paper width | `width: '50%'` → 24 chars (on 48-char paper) |
| `25` | Absolute character count | `width: 25` → 25 chars |
| `undefined` | Auto-calculated | Equal distribution among columns |

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
6. **Horizontal margins impossible**: Printers can only align (left/center/right) or add leading spaces in content.

### Common Misconceptions

| Expectation | Reality | Alternative |
|-------------|---------|-------------|
| "I want this div centered vertically" | No vertical centering exists | Add `paddingTop` to push content down |
| "I want 20px left margin" | No left margin support | Add leading spaces to text content |
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
  padding-top: 20px;
  padding-bottom: 40px;
}
```

**react-escpos:**
```typescript
<View style={{ paddingTop: 20, paddingBottom: 40 }}>
  {/* Content */}
</View>
// Converts to ~1 line feed top, ~2 line feeds bottom
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
| Padding not working | Using left/right padding | Only top/bottom padding supported |
| Columns overlapping | Total width > paper width | Reduce column widths or use percentages |
| Text cut off | Content longer than column width | Text is truncated (no wrapping in row layouts) |

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
