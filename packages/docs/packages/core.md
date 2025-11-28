# @thermal-print/core

Core type definitions and the universal PrintNode intermediate representation (IR).

::: tip API Reference
For detailed type documentation, see the [@thermal-print/core API Reference](/api/core/).
:::

## Installation

```bash
pnpm add @thermal-print/core
```

::: tip
You typically don't need to install this directly. It's included as a dependency of `@thermal-print/react` and `@thermal-print/escpos`.
:::

## Exports

### Types

- `PrintNode` - Universal intermediate representation
- `TextStyle` - Text styling properties
- `ViewStyle` - View/layout styling properties

### Constants

- `StandardElementType` - Standard element type constants

## PrintNode Structure

The `PrintNode` is the universal IR that bridges renderers (React, Vue, etc.) and printer formats (ESC/POS, Star, ZPL, etc.).

```tsx
interface PrintNode {
  type: string;           // 'document', 'page', 'view', 'text', 'image', 'textnode'
  props: any;             // Component props
  children: PrintNode[];  // Child nodes
  style?: any;            // Computed styles
}
```

## Standard Element Types

```tsx
const StandardElementType = {
  DOCUMENT: 'document',
  PAGE: 'page',
  VIEW: 'view',
  TEXT: 'text',
  IMAGE: 'image',
  TEXTNODE: 'textnode',
} as const;
```

## TextStyle Properties

```tsx
interface TextStyle {
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  // ... more properties
}
```

## ViewStyle Properties

```tsx
interface ViewStyle {
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between';
  alignItems?: 'flex-start' | 'center' | 'flex-end';
  padding?: number;
  margin?: number;
  borderTop?: string;
  borderBottom?: string;
  width?: number | string;
  // ... more properties
}
```

## Building Custom Adapters

If you're building a custom renderer or printer format:

```tsx
import { PrintNode, StandardElementType } from '@thermal-print/core';

function myCustomRenderer(node: PrintNode): Buffer {
  switch (node.type) {
    case StandardElementType.TEXT:
      return renderText(node);
    case StandardElementType.VIEW:
      return renderView(node);
    // ... handle other types
  }
}
```
