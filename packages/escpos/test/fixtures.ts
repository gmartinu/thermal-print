/**
 * PrintNode fixtures used by the ESC/POS golden tests.
 *
 * The first four mirror the playground receipts
 * (packages/playground/src/examples/index.ts) so the goldens describe output
 * a human has actually seen on paper. The remaining ones are narrow probes for
 * a single layout rule each.
 */

import type { PrintNode } from "@thermal-print/core";

export const doc = (children: PrintNode[]): PrintNode => ({
  type: "document",
  props: {},
  children,
  style: {},
});

export const page = (style: any, children: PrintNode[]): PrintNode => ({
  type: "page",
  props: {},
  children,
  style,
});

export const view = (style: any, children: PrintNode[] = []): PrintNode => ({
  type: "view",
  props: {},
  children,
  style,
});

export const text = (style: any, content: string): PrintNode => ({
  type: "text",
  props: { children: content },
  children: [],
  style,
});

export const image = (style: any, source: string): PrintNode => ({
  type: "image",
  props: { source },
  children: [],
  style,
});

const spaceBetween = (left: PrintNode, right: PrintNode): PrintNode =>
  view({ flexDirection: "row", justifyContent: "space-between" }, [left, right]);

/** 8x8 black PNG — small enough to keep the golden readable. */
export const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAAAAADhZOFXAAAAEElEQVR4nGNg+I8GGcgSAQB8BB/hEhcEHgAAAABJRU5ErkJggg==";

export const simpleReceipt = (): PrintNode =>
  doc([
    page({ padding: 10 }, [
      text({ textAlign: "center", fontSize: 20, fontWeight: "bold" }, "MY STORE"),
      text({ textAlign: "center", fontSize: 12 }, "123 Main Street"),
      text({ textAlign: "center", fontSize: 12 }, "Tel: (11) 1234-5678"),
      view({ borderBottom: "1px solid black", marginTop: 10, marginBottom: 10 }),
      spaceBetween(text({}, "Coffee"), text({}, "R$ 5.00")),
      spaceBetween(text({}, "Sandwich"), text({}, "R$ 12.00")),
      spaceBetween(text({}, "Water"), text({}, "R$ 3.00")),
      view({ borderTop: "1px dashed black", marginTop: 10, marginBottom: 10 }),
      spaceBetween(
        text({ fontWeight: "bold" }, "TOTAL"),
        text({ fontWeight: "bold", fontSize: 18 }, "R$ 20.00")
      ),
      view({ marginTop: 20 }, [
        text({ textAlign: "center", fontSize: 12 }, "Thank you for your purchase!"),
      ]),
    ]),
  ]);

export const restaurant = (): PrintNode =>
  doc([
    page({ padding: 10 }, [
      text({ textAlign: "center", fontSize: 24, fontWeight: "bold" }, "RESTAURANT XYZ"),
      text({ textAlign: "center" }, "Fine Dining Experience"),
      text({ textAlign: "center", fontSize: 12 }, "456 Gourmet Avenue"),
      view({ borderBottom: "1px solid black", marginTop: 10 }),
      text({ fontSize: 12, marginTop: 5 }, "Table: 12 | Server: Maria | 19:45"),
      view({ borderBottom: "1px dashed black", marginTop: 5, marginBottom: 10 }),
      spaceBetween(text({}, "1x Bruschetta"), text({}, "R$ 28.00")),
      spaceBetween(text({}, "2x Pasta Carbonara"), text({}, "R$ 96.00")),
      spaceBetween(text({}, "1x Tiramisu"), text({}, "R$ 32.00")),
      spaceBetween(text({}, "2x Wine Glass"), text({}, "R$ 60.00")),
      view({ borderTop: "1px solid black", marginTop: 10 }),
      spaceBetween(text({}, "Subtotal"), text({}, "R$ 216.00")),
      spaceBetween(text({}, "Service (10%)"), text({}, "R$ 21.60")),
      view({ borderTop: "1px solid black", marginTop: 5 }),
      spaceBetween(
        text({ fontWeight: "bold", fontSize: 20 }, "TOTAL"),
        text({ fontWeight: "bold", fontSize: 20 }, "R$ 237.60")
      ),
      view({ marginTop: 20 }, [
        text({ textAlign: "center", fontSize: 12 }, "Thank you for dining with us!"),
      ]),
    ]),
  ]);

export const minimal = (): PrintNode =>
  doc([
    page({ padding: 10 }, [
      text({ textAlign: "center", fontWeight: "bold" }, "QUICK MART"),
      view({ borderBottom: "1px solid black", marginTop: 5, marginBottom: 5 }),
      spaceBetween(text({}, "Item 1"), text({}, "R$ 10.00")),
      spaceBetween(text({}, "Item 2"), text({}, "R$ 15.00")),
      view({ borderTop: "1px solid black", marginTop: 5 }),
      spaceBetween(
        text({ fontWeight: "bold" }, "Total"),
        text({ fontWeight: "bold" }, "R$ 25.00")
      ),
    ]),
  ]);

export const cafe58mm = (): PrintNode =>
  doc([
    page({ padding: 10 }, [
      text({ textAlign: "center", fontWeight: "bold", fontSize: 18 }, "CAFE"),
      view({ borderBottom: "1px solid black", marginTop: 5 }),
      spaceBetween(text({}, "Espresso"), text({}, "R$5")),
      spaceBetween(text({}, "Croissant"), text({}, "R$8")),
      spaceBetween(text({}, "Latte"), text({}, "R$7")),
      view({ borderTop: "1px solid black", marginTop: 5 }),
      spaceBetween(text({ fontWeight: "bold" }, "Total"), text({ fontWeight: "bold" }, "R$20")),
    ]),
  ]);

/** Accented Portuguese text through the CP860 path, plus a table row with explicit widths. */
export const tableWithWidths = (): PrintNode =>
  doc([
    page({}, [
      view({ flexDirection: "row" }, [
        view({ width: "50%" }, [text({}, "Descricao")]),
        view({ width: "20%" }, [text({ textAlign: "center" }, "Qtd")]),
        view({ width: "30%" }, [text({ textAlign: "right" }, "Valor")]),
      ]),
      view({ borderBottom: "1px dashed black" }),
      view({ flexDirection: "row" }, [
        view({ width: "50%" }, [text({}, "Pao de queijo")]),
        view({ width: "20%" }, [text({ textAlign: "center" }, "2")]),
        view({ width: "30%" }, [text({ textAlign: "right" }, "12,00")]),
      ]),
    ]),
  ]);

// ---------------------------------------------------------------------------
// Bug probes — each exercises exactly one rule that DEV-2390 changes.
// ---------------------------------------------------------------------------

/** Item 7: a row of three columns with no explicit widths. */
export const rowThreeColumnsNoWidths = (): PrintNode =>
  doc([
    page({}, [
      view({ flexDirection: "row" }, [
        text({}, "A"),
        text({}, "B"),
        text({}, "C"),
      ]),
    ]),
  ]);

/** Item 7: space-between across three columns. */
export const rowSpaceBetweenThree = (): PrintNode =>
  doc([
    page({}, [
      view({ flexDirection: "row", justifyContent: "space-between" }, [
        text({}, "L"),
        text({}, "M"),
        text({}, "R"),
      ]),
    ]),
  ]);

/** Item 7: a cell whose content is wider than its column. */
export const rowCellOverflow = (): PrintNode =>
  doc([
    page({}, [
      view({ flexDirection: "row" }, [
        view({ width: "50%" }, [
          text({}, "Refrigerante lata zero acucar 350ml unidade"),
        ]),
        view({ width: "50%" }, [text({ textAlign: "right" }, "9,90")]),
      ]),
    ]),
  ]);

/** Item 5: alignItems on a column View must reach the children. */
export const alignItemsInheritance = (): PrintNode =>
  doc([
    page({}, [
      view({ alignItems: "center" }, [
        text({}, "CENTERED BY PARENT"),
        text({}, "ME TOO"),
      ]),
      view({ alignItems: "flex-end" }, [text({}, "RIGHT BY PARENT")]),
      view({ alignItems: "center" }, [
        text({ textAlign: "left" }, "OWN ALIGN WINS"),
      ]),
    ]),
  ]);

/** Item 4: an empty View with an explicit height is a vertical spacer. */
export const emptyViewHeight = (): PrintNode =>
  doc([
    page({}, [
      text({}, "ABOVE"),
      view({ height: 24 }),
      text({}, "BELOW"),
    ]),
  ]);

/** Item 8: an Image inside a 30%-wide View must be scaled and centered by the parent. */
export const imageInNarrowView = (): PrintNode =>
  doc([
    page({}, [
      view({ width: "30%", alignItems: "center" }, [image({}, TINY_PNG)]),
    ]),
  ]);

/** Items 1/2/3/10: every rich-mode style property in one document. */
export const richStyles = (): PrintNode =>
  doc([
    page({ paddingLeft: 16, paddingRight: 16, paddingTop: 12 }, [
      text({ textAlign: "center", fontSize: 24, fontWeight: "bold" }, "TOTAL"),
      text({ textAlign: "center", fontSize: 24 }, "R$ 20,00"),
      text({ fontSize: 8 }, "condensed footnote line that is fairly long"),
      view({ marginTop: 24, paddingLeft: 24, paddingBottom: 12 }, [
        text({}, "indented block"),
      ]),
      text({ fontSize: 14 }, "normal body"),
    ]),
  ]);

export interface Fixture {
  name: string;
  node: () => PrintNode;
}

/** Documents that must stay byte-identical in legacy mode, forever. */
export const PARITY_FIXTURES: Fixture[] = [
  { name: "simple-receipt", node: simpleReceipt },
  { name: "restaurant", node: restaurant },
  { name: "minimal", node: minimal },
  { name: "cafe-58mm", node: cafe58mm },
  { name: "table-with-widths", node: tableWithWidths },
  { name: "rich-styles", node: richStyles },
];

/** Documents that exercise a bug DEV-2390 fixes; their legacy bytes change on purpose. */
export const PROBE_FIXTURES: Fixture[] = [
  { name: "row-three-columns", node: rowThreeColumnsNoWidths },
  { name: "row-space-between-three", node: rowSpaceBetweenThree },
  { name: "row-cell-overflow", node: rowCellOverflow },
  { name: "align-items-inheritance", node: alignItemsInheritance },
  { name: "empty-view-height", node: emptyViewHeight },
  { name: "image-in-narrow-view", node: imageInNarrowView },
];
