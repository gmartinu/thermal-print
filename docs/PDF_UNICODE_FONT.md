# PDF Unicode font (accents)

jsPDF's built-in fonts (Helvetica, Courier, Times) are WinAnsi-only and are not embedded, so accented text can be lost on paper. `fontFamily: UNICODE_FONT_FAMILY` ("ThermalSans") switches the PDF renderer to an embedded TrueType font.

```ts
import { printNodesToPDF, UNICODE_FONT_FAMILY } from "@thermal-print/pdf";

await printNodesToPDF(nodes, { fontFamily: UNICODE_FONT_FAMILY });
```

- Opt-in: the default stays `"Helvetica"`, and the font data is only registered on the jsPDF instance when requested. Both faces (regular + bold) are embedded in the output PDF, about 30 KB.
- The measurement pass and the render pass share the same options, so wrapping and dynamic height use the embedded font's metrics. Bold maps to the real bold face.
- "ThermalSans" is a Latin subset (Basic Latin, Latin-1, Latin Extended-A, common punctuation, euro) of Liberation Sans 2.1.5, SIL OFL 1.1 (`packages/pdf/src/fonts/LICENSE-LIBERATION.txt`, shipped in the npm package). Liberation Sans is metric-compatible with Helvetica/Arial, so column math tuned on Helvetica keeps holding. Renamed because the OFL reserves the "Liberation" name for unmodified fonts.
- Characters outside the subset (CJK, Cyrillic, emoji) are not covered.
- Regenerate with `pyftsubset` over the upstream TTFs using the same unicode ranges, then rename the family in the `name` table; `src/fonts/thermal-sans.ts` is generated.
- Tests: `packages/pdf/test/pdf-unicode-font.test.ts` checks the embedded font and that accented glyphs reach the PDF text layer (ToUnicode map).
- The ESC/POS renderer is unaffected: it keeps CP860 and `?` for unsupported characters.
