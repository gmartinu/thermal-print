# @thermal-print/core

Core type definitions for thermal printer libraries.

## 📦 Installation

```bash
pnpm add @thermal-print/core
```

## 🎯 Purpose

This package defines the **universal intermediate representation (IR)** for thermal printing. The `PrintNode` type is the bridge between renderers (React, Vue, etc.) and printer formats (ESC/POS, Star, ZPL, etc.).

## 📖 Exports

### PrintNode

The core data structure representing a thermal printer document.

```typescript
interface PrintNode {
  type: string; // 'document', 'page', 'view', 'text', 'image'
  props: any; // Component props
  children: PrintNode[]; // Child nodes
  style?: any; // Styling information
}
```

### StandardElementType

Enum of standard element types.

```typescript
enum StandardElementType {
  DOCUMENT = "document",
  PAGE = "page",
  VIEW = "view",
  TEXT = "text",
  IMAGE = "image",
  TEXTNODE = "textnode",
}
```

### TextStyle

Text styling properties.

```typescript
interface TextStyle {
  fontSize?: number;
  fontWeight?: string | number;
  fontFamily?: string;
  textAlign?: "left" | "center" | "right";
}
```

### ViewStyle

Layout and container styling properties.

```typescript
interface ViewStyle {
  flexDirection?: "row" | "column";
  justifyContent?: string;
  alignItems?: string;
  padding?: number;
  paddingTop?: number;
  paddingBottom?: number;
  margin?: number;
  marginTop?: number;
  marginBottom?: number;
  borderTop?: string;
  borderBottom?: string;
  width?: string | number;
}
```

## 🔧 Usage

This package is typically used indirectly through higher-level packages like `@thermal-print/react` or `@thermal-print/escpos`.

### Direct Usage

```typescript
import { PrintNode } from "@thermal-print/core";

const printNode: PrintNode = {
  type: "document",
  props: {},
  children: [
    {
      type: "text",
      props: { children: "Hello World" },
      children: [],
      style: { textAlign: "center", fontSize: 20 },
    },
  ],
  style: {},
};
```

## 📄 License

MIT © Gabriel Martinusso
