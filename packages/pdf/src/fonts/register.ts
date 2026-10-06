import type { jsPDF } from "jspdf";

import {
  THERMAL_SANS_BOLD_BASE64,
  THERMAL_SANS_REGULAR_BASE64,
} from "./thermal-sans";

/**
 * `fontFamily` value that selects the embedded Unicode font. jsPDF's built-in
 * fonts are WinAnsi-only and silently drop accents on some viewers/printers.
 */
export const UNICODE_FONT_FAMILY = "ThermalSans";

/**
 * Register the embedded Unicode font (regular + bold) on a jsPDF instance when
 * `fontFamily` asks for it. A no-op for every other family, so documents that
 * keep the default pay nothing for the font data.
 */
export function registerUnicodeFont(pdf: jsPDF, fontFamily: string): void {
  if (fontFamily !== UNICODE_FONT_FAMILY) return;
  const faces = [
    ["ThermalSans-Regular.ttf", THERMAL_SANS_REGULAR_BASE64, "normal"],
    ["ThermalSans-Bold.ttf", THERMAL_SANS_BOLD_BASE64, "bold"],
  ] as const;
  for (const [file, data, style] of faces) {
    pdf.addFileToVFS(file, data);
    pdf.addFont(file, UNICODE_FONT_FAMILY, style, undefined, "Identity-H");
  }
}
