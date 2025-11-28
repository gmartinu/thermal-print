# Installation

## Package Manager

::: code-group

```bash [pnpm]
pnpm add @thermal-print/react
```

```bash [npm]
npm install @thermal-print/react
```

```bash [yarn]
yarn add @thermal-print/react
```

:::

## Additional Packages

For PDF generation (browser printing):

::: code-group

```bash [pnpm]
pnpm add @thermal-print/pdf
```

```bash [npm]
npm install @thermal-print/pdf
```

:::

For direct ESC/POS control:

::: code-group

```bash [pnpm]
pnpm add @thermal-print/escpos
```

```bash [npm]
npm install @thermal-print/escpos
```

:::

## Peer Dependencies

`@thermal-print/react` requires React 16.8+ as a peer dependency:

```bash
pnpm add react react-dom
```

## TypeScript

All packages include TypeScript definitions out of the box. No additional `@types` packages needed.

## Quick Start

```tsx
import { Document, Page, Text, convertToESCPOS } from '@thermal-print/react';

function Receipt() {
  return (
    <Document>
      <Page>
        <Text>Hello, Thermal Printer!</Text>
      </Page>
    </Document>
  );
}

// Convert to ESC/POS
const buffer = await convertToESCPOS(<Receipt />);

// Send to printer (implementation depends on your setup)
await printer.write(buffer);
```
