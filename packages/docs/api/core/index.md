# @thermal-print/core

Core types and interfaces for thermal printing.

The `@thermal-print/core` package provides the universal intermediate representation (IR) that bridges renderers (React, Vue, etc.) and printer formats (ESC/POS, Star, ZPL, etc.).

---

## PrintNode

The core data structure representing a thermal print document tree.

```typescript
interface PrintNode {
  type: string;
  props: any;
  children: PrintNode[];
  style?: any;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `type` | `string` | Element type (document, page, view, text, image, textnode) |
| `props` | `any` | Component props |
| `children` | `PrintNode[]` | Child nodes |
| `style` | `any` | Style object (TextStyle or ViewStyle) |

**Example:**

```typescript
const printNode: PrintNode = {
  type: 'document',
  props: {},
  children: [
    {
      type: 'page',
      props: {},
      children: [
        {
          type: 'text',
          props: {},
          children: [],
          style: { fontSize: 24, fontWeight: 'bold', textAlign: 'center' }
        }
      ]
    }
  ]
};
```

---

## ElementNode

::: warning Deprecated
`ElementNode` is deprecated. Use `PrintNode` instead. Will be removed in v1.0.
:::

```typescript
type ElementNode = PrintNode;
```

---

## StandardElementType

Standard element types that all adapters must normalize to.

```typescript
const StandardElementType = {
  DOCUMENT: 'document',
  PAGE: 'page',
  VIEW: 'view',
  TEXT: 'text',
  IMAGE: 'image',
  TEXTNODE: 'textnode',
} as const;
```

| Constant | Value | Description |
|----------|-------|-------------|
| `DOCUMENT` | `'document'` | Root document container |
| `PAGE` | `'page'` | Page element (maps to receipt page) |
| `VIEW` | `'view'` | Container/layout element |
| `TEXT` | `'text'` | Text element |
| `IMAGE` | `'image'` | Image element |
| `TEXTNODE` | `'textnode'` | Raw text node (string children) |

**Example:**

```typescript
import { StandardElementType } from '@thermal-print/core';

if (node.type === StandardElementType.TEXT) {
  // Handle text node
}
```

---

## TextStyle

Text styling properties that map to printer commands.

```typescript
interface TextStyle {
  fontSize?: number;
  fontWeight?: string | number;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  paddingLeft?: number;
  paddingRight?: number;
}
```

### Properties

| Property | Type | ESC/POS | PDF | Description |
|----------|------|---------|-----|-------------|
| `fontSize` | `number` | Mapped to 4 sizes | Direct | Font size in pixels |
| `fontWeight` | `string \| number` | Bold detection | Direct | 'bold' or 700+ for bold |
| `fontFamily` | `string` | Bold only | Direct | Only 'Helvetica-Bold' recognized |
| `textAlign` | `'left' \| 'center' \| 'right'` | Yes | Yes | Text alignment |
| `paddingLeft` | `number` | Ignored | Yes | Left padding (PDF only) |
| `paddingRight` | `number` | Ignored | Yes | Right padding (PDF only) |

### Font Size Mapping (ESC/POS)

Thermal printers only support 4 discrete character sizes:

| Font Size | ESC/POS Size | Description |
|-----------|--------------|-------------|
| 8-12px | 1x1 | Normal size |
| 13-18px | 1x2 | Double height |
| 19-24px | 2x1 | Double width |
| 25+px | 2x2 | Double size (maximum) |

**Example:**

```typescript
const textStyle: TextStyle = {
  fontSize: 24,           // → 2x1 (double width)
  fontWeight: 'bold',     // → ESC E 1 (emphasized)
  textAlign: 'center'     // → ESC a 1
};
```

### Bold Detection

Text is rendered as bold when any of these conditions are met:
- `fontWeight: 'bold'`
- `fontWeight: 700` (or higher)
- `fontFamily: 'Helvetica-Bold'`

---

## ViewStyle

Container/layout styling properties.

```typescript
interface ViewStyle {
  display?: string;
  flexDirection?: 'row' | 'column';
  justifyContent?: string;
  alignItems?: string;
  padding?: number;
  paddingTop?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  paddingRight?: number;
  margin?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  borderTop?: string;
  borderBottom?: string;
  width?: string | number;
  height?: string | number;
}
```

### Layout Properties

| Property | Type | ESC/POS | Description |
|----------|------|---------|-------------|
| `flexDirection` | `'row' \| 'column'` | Yes | Layout direction (default: 'column') |
| `justifyContent` | `string` | Partial | Main axis alignment |
| `alignItems` | `string` | Partial | Cross axis alignment (text fallback only) |
| `width` | `string \| number` | Yes | Column width ('50%' or character count) |

#### flexDirection

| Value | Effect |
|-------|--------|
| `'column'` | Stacks children vertically (default) |
| `'row'` | Side-by-side columns |

#### justifyContent (row layouts only)

| Value | ESC/POS Support | Effect |
|-------|-----------------|--------|
| `'space-between'` | Yes | Two-column layout with maximum gap |
| `'center'` | Yes | Centers entire row |
| `'flex-start'` | Default | No special handling |
| `'flex-end'` | No | Not implemented |
| `'space-around'` | No | Not implemented |
| `'space-evenly'` | No | Not implemented |

#### alignItems

::: warning Limited Support
Only used as text alignment fallback, NOT for vertical positioning.
:::

| Value | Effect |
|-------|--------|
| `'center'` | Sets text alignment to center |
| `'flex-end'` | Sets text alignment to right |

### Spacing Properties

Spacing is converted to line feeds: **~20 pixels = 1 line feed**

| Property | Type | ESC/POS | PDF | Description |
|----------|------|---------|-----|-------------|
| `padding` | `number` | Top/bottom only | Yes | Shorthand (all sides for PDF) |
| `paddingTop` | `number` | Yes | Yes | Top padding |
| `paddingBottom` | `number` | Yes | Yes | Bottom padding |
| `paddingLeft` | `number` | Ignored | Yes | Left padding (PDF only) |
| `paddingRight` | `number` | Ignored | Yes | Right padding (PDF only) |
| `margin` | `number` | Top/bottom only | Yes | Shorthand |
| `marginTop` | `number` | Yes | Yes | Top margin |
| `marginBottom` | `number` | Yes | Yes | Bottom margin |
| `marginLeft` | `number` | Ignored | Yes | Left margin (PDF only) |
| `marginRight` | `number` | Ignored | Yes | Right margin (PDF only) |

**Example:**

```typescript
const viewStyle: ViewStyle = {
  paddingTop: 40,    // ~2 line feeds before content
  paddingBottom: 20  // ~1 line feed after content
};
```

### Border Properties

| Property | Type | ESC/POS | Description |
|----------|------|---------|-------------|
| `borderTop` | `string` | Yes | Top divider line |
| `borderBottom` | `string` | Yes | Bottom divider line |

**Border Style Detection:**

| Style Contains | Renders As |
|----------------|------------|
| `'dashed'` | `-` characters |
| Any other | `─` characters (solid) |

::: info
Borders always render full-width across the paper. Border width and color are ignored (thermal printers are monochrome).
:::

**Example:**

```typescript
const viewStyle: ViewStyle = {
  borderBottom: '1px solid black',  // Solid line: ────────────
  borderTop: '1px dashed gray'      // Dashed line: ------------
};
```

### Size Properties

| Property | Type | ESC/POS | PDF | Description |
|----------|------|---------|-----|-------------|
| `width` | `string \| number` | Yes | Yes | Column width |
| `height` | `string \| number` | Ignored | Yes | Fixed height (PDF only) |

#### width

| Format | Example | Description |
|--------|---------|-------------|
| Percentage | `'50%'` | 50% of paper width |
| Number | `20` | Fixed 20 characters |
| undefined | - | Auto-calculated |

### Deprecated Properties

| Property | Status |
|----------|--------|
| `display` | Extracted but not implemented |
| `marginLeft` | Extracted but ignored |
| `marginRight` | Extracted but ignored |

---

## Thermal Printer Limitations

When designing for thermal printers, keep these constraints in mind:

### Not Supported on Thermal Printers

| Feature | Reason |
|---------|--------|
| Left/right margins | Hardware limitation |
| Left/right padding | Hardware limitation |
| Horizontal centering of elements | Use `textAlign` instead |
| Variable fonts | Single built-in font |
| Font colors | Monochrome only |
| Fine-grained font sizes | Only 4 sizes (1x1, 1x2, 2x1, 2x2) |
| Fixed heights | Paper expands to fit content |

### Works Differently

| Feature | ESC/POS Behavior |
|---------|------------------|
| Padding/margin | Top/bottom only, converted to line feeds |
| Borders | Full-width divider lines only |
| Font size | Mapped to 4 discrete sizes |
| Bold | Uses emphasis mode (ESC E) |

### Best Practices

1. **Use `flexDirection: 'row'`** for multi-column layouts
2. **Use `justifyContent: 'space-between'`** for receipt-style layouts (label + value)
3. **Use `textAlign`** instead of `alignItems` for text alignment
4. **Use borders** for visual separation (they render as full-width dividers)
5. **Test with actual printers** - emulators may not show all limitations
