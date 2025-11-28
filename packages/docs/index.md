---
layout: home

hero:
  name: "@thermal-print"
  text: Thermal Printing for React
  tagline: A modular TypeScript library suite for thermal printing with clean, standalone architecture.
  image:
    src: /demo.webp
    alt: thermal-print demo

features:
  - icon: ⚛️
    title: React Components
    details: Familiar React components (Document, Page, View, Text, Image) optimized for thermal printers.
  - icon: 🖨️
    title: ESC/POS Native
    details: Direct conversion to ESC/POS commands. No PDF intermediate step needed.
  - icon: 📄
    title: PDF Export
    details: Vector PDF generation for browser printing when you need it.
  - icon: 🧩
    title: Modular Architecture
    details: Use only what you need. Clean separation between React, ESC/POS, and PDF packages.
  - icon: 🎯
    title: Universal IR
    details: PrintNode intermediate representation works with any printer format.
  - icon: 🚀
    title: TypeScript First
    details: Full TypeScript support with complete type definitions.
---

## Quick Example

```tsx
import {
  Document,
  Page,
  Text,
  View,
  convertToESCPOS,
} from "@thermal-print/react";

function Receipt() {
  return (
    <Document>
      <Page>
        <Text style={{ fontSize: 20, textAlign: "center", fontWeight: "bold" }}>
          MY STORE
        </Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text>Coffee</Text>
          <Text>$3.50</Text>
        </View>
      </Page>
    </Document>
  );
}

// Convert to ESC/POS and print
const buffer = await convertToESCPOS(<Receipt />, { paperWidth: 48 });
await printer.write(buffer);
```
