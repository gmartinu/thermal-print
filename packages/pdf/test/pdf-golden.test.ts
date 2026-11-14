/**
 * DEV-2830: golden layout test that pins ABSOLUTE output of the PDF renderer
 * (text widths, line breaks, anchor points, image boxes and page height).
 *
 * The other suites only assert relative properties ("fits the paper", "wraps"),
 * so a jsPDF upgrade that shifts font metrics or breaks PNG embedding would pass
 * them silently. These values were captured on jspdf 2.5.2 and must not move
 * when jsPDF is upgraded. If one does, the upgrade changed what prints on paper:
 * investigate it, never re-capture the golden to make the test pass.
 *
 * To print the current values (e.g. to report a diff):
 *   GOLDEN_DUMP=1 pnpm --filter @thermal-print/pdf test
 *
 * Run with: pnpm --filter @thermal-print/pdf test
 */

import { strict as assert } from "node:assert";
import { describe, it, afterEach } from "node:test";
import { deflateSync } from "node:zlib";

import type { PrintNode } from "@thermal-print/core";

import { PDFGenerator } from "../src/pdf-generator";
import { printNodesToPDF, UNICODE_FONT_FAMILY } from "../src/index";

const PAPER_WIDTH = 205; // pt - the real Mister Rancho geometry (page_size 205)

/** Round so the golden is stable across float noise but catches real drift. */
const r = (n: number) => Math.round(n * 1000) / 1000;

// ---------------------------------------------------------------------------
// Deterministic PNG fixtures (no binary files in the repo)
// ---------------------------------------------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

/**
 * Encode an 8-bit PNG. colorType 0 = grayscale (1 channel), 6 = RGBA (4).
 */
function encodePng(
  width: number,
  height: number,
  colorType: 0 | 6,
  pixel: (x: number, y: number) => number[]
): string {
  const channels = colorType === 6 ? 4 : 1;
  const raw = Buffer.alloc(height * (1 + width * channels));
  let o = 0;
  for (let y = 0; y < height; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      for (const v of pixel(x, y)) raw[o++] = v;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = colorType;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  return `data:image/png;base64,${png.toString("base64")}`;
}

/** QR-like grayscale module grid (what pdv-web prints for PIX/NFC-e). */
const QR_PNG = encodePng(29, 29, 0, (x, y) => [
  ((x >> 1) + (y >> 1) + ((x * y) % 3)) % 2 ? 0 : 255,
]);

/** Logo with an alpha channel - the PNG path jsPDF 3.x rewrote. */
const LOGO_PNG = encodePng(40, 20, 6, (x, y) => [
  (x * 6) & 0xff,
  (y * 12) & 0xff,
  128,
  x < 4 || y < 2 ? 0 : 255,
]);

// ---------------------------------------------------------------------------
// Receipt fixtures (PrintNode trees, as @thermal-print/react produces them)
// ---------------------------------------------------------------------------

const text = (value: string, style: any = {}): PrintNode => ({
  type: "text",
  props: {},
  style,
  children: [{ type: "textnode", props: { children: value }, children: [] }],
});

const view = (children: PrintNode[], style: any = {}): PrintNode => ({
  type: "view",
  props: {},
  style,
  children,
});

const image = (src: string): PrintNode => ({
  type: "image",
  props: { src },
  children: [],
});

const doc = (children: PrintNode[]): PrintNode => ({
  type: "document",
  props: {},
  children: [
    {
      type: "page",
      props: { size: { width: PAPER_WIDTH }, wrap: true },
      style: { padding: 8 },
      children,
    },
  ],
});

const LONG_ITEM =
  "1x PICANHA NA CHAPA COM FRITAS ARROZ FAROFA E VINAGRETE PARA DOIS";

const RECEIPTS: Record<string, { node: PrintNode; fontFamily?: string }> = {
  plain: {
    node: doc([
      text("MISTER RANCHO", { fontSize: 14, fontWeight: "bold", textAlign: "center" }),
      text("CNPJ 12.345.678/0001-90", { fontSize: 8, textAlign: "center" }),
      view([text("2x Coca-Cola 350ml"), text("R$ 12,00")], {
        flexDirection: "row",
        justifyContent: "space-between",
      }),
      view([text("TOTAL", { fontWeight: "bold" }), text("R$ 12,00", { fontWeight: "bold" })], {
        flexDirection: "row",
        justifyContent: "space-between",
      }),
    ]),
  },
  wrapped: {
    node: doc([
      text(LONG_ITEM, { fontSize: 10 }),
      text(`Obs: ${LONG_ITEM} SEM CEBOLA BEM PASSADA`, { fontSize: 8 }),
      text("SUPERCALIFRAGILISTICEXPIALIDOCIOUSSUPERCALIFRAGILISTIC", { fontSize: 10 }),
    ]),
  },
  unicode: {
    fontFamily: UNICODE_FONT_FAMILY,
    node: doc([
      text("ÁGUA TERÊ ç ã ÓLEO AÇÚCAR", { fontSize: 10 }),
      text(`PÃO DE QUEIJO — ${LONG_ITEM}`, { fontSize: 9, fontWeight: "bold" }),
    ]),
  },
  images: {
    node: doc([
      view([image(LOGO_PNG)], { alignItems: "center", width: 80 }),
      text("PIX - aponte a câmera", { textAlign: "center" }),
      view([image(QR_PNG)], { alignItems: "center", width: 120 }),
      text("Obrigado pela preferência", { fontSize: 8, textAlign: "center" }),
    ]),
  },
};

// ---------------------------------------------------------------------------
// Capture
// ---------------------------------------------------------------------------

interface Snapshot {
  pageHeight: number;
  pageWidth: number;
  text: Array<[string, number, number, string, number, number]>;
  images: Array<[number, number, number, number]>;
  imageXObjects: number;
}

const originalCreate = PDFGenerator.createForRendering;
const originalError = console.error;

afterEach(() => {
  PDFGenerator.createForRendering = originalCreate;
  console.error = originalError;
});

async function snapshot(node: PrintNode, fontFamily?: string): Promise<Snapshot> {
  const snap: Snapshot = {
    pageHeight: 0,
    pageWidth: 0,
    text: [],
    images: [],
    imageXObjects: 0,
  };
  const errors: unknown[] = [];
  // addImage swallows jsPDF errors with console.error; a broken PNG decoder
  // must fail this test, not print an empty box.
  console.error = (...args: unknown[]) => errors.push(args);

  PDFGenerator.createForRendering = function (this: typeof PDFGenerator, ...args) {
    const generator = originalCreate.apply(this, args);
    const pdf = (generator as any).pdf;
    const origText = pdf.text.bind(pdf);
    pdf.text = (t: string, x: number, y: number, options: any = {}) => {
      snap.text.push([t, r(x), r(y), options.align ?? "left", r(pdf.getTextWidth(t)), r(pdf.getFontSize())]);
      return origText(t, x, y, options);
    };
    const origImage = pdf.addImage.bind(pdf);
    pdf.addImage = (src: string, fmt: string, x: number, y: number, w: number, h: number) => {
      snap.images.push([r(x), r(y), r(w), r(h)]);
      return origImage(src, fmt, x, y, w, h);
    };
    return generator;
  } as typeof PDFGenerator.createForRendering;

  const result = await printNodesToPDF(node, { fontFamily });
  result.cleanup();

  assert.deepEqual(errors, [], "renderer reported errors");

  const raw = Buffer.from(result.arrayBuffer).toString("latin1");
  const boxes = [...raw.matchAll(/\/MediaBox \[([^\]]+)\]/g)];
  assert.equal(boxes.length, 1, "receipt must be a single page");
  const [x0, y0, x1, y1] = boxes[0][1].trim().split(/\s+/).map(Number);
  snap.pageWidth = r(x1 - x0);
  snap.pageHeight = r(y1 - y0);
  snap.imageXObjects = [...raw.matchAll(/\/Subtype \/Image/g)].length;
  return snap;
}

// ---------------------------------------------------------------------------
// Golden values captured on jspdf 2.5.2 - DO NOT edit to make a test pass
// ---------------------------------------------------------------------------

const GOLDEN: Record<string, Snapshot> = {
  "plain": {
    "pageHeight": 205,
    "pageWidth": 98.4,
    "text": [
      [
        "MISTER RANCHO",
        102.5,
        8,
        "center",
        117.88,
        14
      ],
      [
        "CNPJ 12.345.678/0001-90",
        102.5,
        24.8,
        "center",
        94,
        8
      ],
      [
        "2x Coca-Cola 350ml",
        8,
        34.4,
        "left",
        90,
        10
      ],
      [
        "R$ 12,00",
        197,
        34.4,
        "right",
        40.3,
        10
      ],
      [
        "TOTAL",
        8,
        46.4,
        "left",
        32.4,
        10
      ],
      [
        "R$ 12,00",
        197,
        46.4,
        "right",
        40.3,
        10
      ]
    ],
    "images": [],
    "imageXObjects": 0
  },
  "wrapped": {
    "pageHeight": 205,
    "pageWidth": 136.8,
    "text": [
      [
        "1x PICANHA NA CHAPA COM FRITAS",
        8,
        8,
        "left",
        173,
        10
      ],
      [
        "ARROZ FAROFA E VINAGRETE PARA",
        8,
        20,
        "left",
        174.8,
        10
      ],
      [
        "DOIS",
        8,
        32,
        "left",
        24.4,
        10
      ],
      [
        "Obs: 1x PICANHA NA CHAPA COM FRITAS ARROZ",
        8,
        44,
        "left",
        187.68,
        8
      ],
      [
        "FAROFA E VINAGRETE PARA DOIS SEM CEBOLA",
        8,
        53.6,
        "left",
        185.36,
        8
      ],
      [
        "BEM PASSADA",
        8,
        63.2,
        "left",
        55.92,
        8
      ],
      [
        "SUPERCALIFRAGILISTICEXPIALIDOCIO",
        8,
        72.8,
        "left",
        188.1,
        10
      ],
      [
        "USSUPERCALIFRAGILISTIC",
        8,
        84.8,
        "left",
        131.6,
        10
      ]
    ],
    "images": [],
    "imageXObjects": 0
  },
  "unicode": {
    "pageHeight": 205,
    "pageWidth": 92.4,
    "text": [
      [
        "ÁGUA TERÊ ç ã ÓLEO AÇÚCAR",
        8,
        8,
        "left",
        149.478,
        10
      ],
      [
        "PÃO DE QUEIJO — 1x PICANHA NA CHAPA",
        8,
        20,
        "left",
        188.53,
        9
      ],
      [
        "COM FRITAS ARROZ FAROFA E",
        8,
        30.8,
        "left",
        138.99,
        9
      ],
      [
        "VINAGRETE PARA DOIS",
        8,
        41.6,
        "left",
        105.012,
        9
      ]
    ],
    "images": [],
    "imageXObjects": 0
  },
  "images": {
    "pageHeight": 258.6,
    "pageWidth": 205,
    "text": [
      [
        "PIX - aponte a câmera",
        102.5,
        102.5,
        "center",
        99.4,
        10
      ],
      [
        "Obrigado pela preferência",
        102.5,
        209,
        "center",
        91.76,
        8
      ]
    ],
    "images": [
      [
        55.25,
        8,
        94.5,
        94.5
      ],
      [
        55.25,
        114.5,
        94.5,
        94.5
      ]
    ],
    "imageXObjects": 3
  }
};

describe("PDF golden layout (jsPDF upgrade guard)", () => {
  for (const [name, { node, fontFamily }] of Object.entries(RECEIPTS)) {
    it(`${name} receipt renders byte-for-byte the same layout`, async () => {
      const actual = await snapshot(node, fontFamily);
      if (process.env.GOLDEN_DUMP) {
        console.log(`GOLDEN ${name} ${JSON.stringify(actual)}`);
      }
      assert.deepEqual(actual, GOLDEN[name]);
    });
  }

  it("embeds the logo and the QR code as real image XObjects", async () => {
    const actual = await snapshot(RECEIPTS.images.node);
    assert.equal(actual.images.length, 2);
    // RGBA logo adds an SMask image, so at least 3 image XObjects
    assert.ok(actual.imageXObjects >= 2, `got ${actual.imageXObjects} image XObjects`);
  });
});
