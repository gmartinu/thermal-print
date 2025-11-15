/**
 * CP860 (Portuguese) Character Encoding Map
 *
 * Maps Unicode characters to CP860 byte values for Brazilian Portuguese support.
 * CP860 is the standard codepage for Portuguese thermal printers.
 *
 * Includes special characters: ç Ç á é í ó ú à ã õ â ê ô
 */

// CP860 character map (0x80-0xFF)
// 0x00-0x7F are standard ASCII (unchanged)
const CP860_MAP: { [key: string]: number } = {
  // Portuguese special characters
  ç: 0x87, // Latin small letter c with cedilla
  Ç: 0x80, // Latin capital letter C with cedilla
  ü: 0x81, // Latin small letter u with diaeresis
  é: 0x82, // Latin small letter e with acute
  â: 0x83, // Latin small letter a with circumflex
  ã: 0x84, // Latin small letter a with tilde
  à: 0x85, // Latin small letter a with grave
  // á: 0x86, // REMOVED: Wrong CP860 mapping. Correct mapping is 0xa0 (see below)
  ê: 0x88, // Latin small letter e with circumflex
  ë: 0x89, // Latin small letter e with diaeresis
  è: 0x8a, // Latin small letter e with grave
  ï: 0x8b, // Latin small letter i with diaeresis
  î: 0x8c, // Latin small letter i with circumflex
  ì: 0x8d, // Latin small letter i with grave
  Ã: 0x8e, // Latin capital letter A with tilde
  Á: 0x8f, // Latin capital letter A with acute

  É: 0x90, // Latin capital letter E with acute
  æ: 0x91, // Latin small letter ae
  Æ: 0x92, // Latin capital letter AE
  ô: 0x93, // Latin small letter o with circumflex
  ö: 0x94, // Latin small letter o with diaeresis
  ò: 0x95, // Latin small letter o with grave
  û: 0x96, // Latin small letter u with circumflex
  ù: 0x97, // Latin small letter u with grave
  ÿ: 0x98, // Latin small letter y with diaeresis
  Ö: 0x99, // Latin capital letter O with diaeresis
  Ü: 0x9a, // Latin capital letter U with diaeresis
  ø: 0x9b, // Latin small letter o with stroke
  "£": 0x9c, // Pound sign
  Ø: 0x9d, // Latin capital letter O with stroke
  "×": 0x9e, // Multiplication sign
  ƒ: 0x9f, // Latin small letter f with hook

  á: 0xa0, // Latin small letter a with acute
  í: 0xa1, // Latin small letter i with acute
  ó: 0xa2, // Latin small letter o with acute
  ú: 0xa3, // Latin small letter u with acute
  ñ: 0xa4, // Latin small letter n with tilde
  Ñ: 0xa5, // Latin capital letter N with tilde
  ª: 0xa6, // Feminine ordinal indicator
  º: 0xa7, // Masculine ordinal indicator
  // NOTE: Capital Ú doesn't exist in CP860, map to regular U
  Ú: 0x55, // Latin capital U (fallback - CP860 doesn't have Ú)
  "¿": 0xa8, // Inverted question mark
  "®": 0xa9, // Registered sign
  "¬": 0xaa, // Not sign
  "½": 0xab, // Vulgar fraction one half
  "¼": 0xac, // Vulgar fraction one quarter
  "¡": 0xad, // Inverted exclamation mark
  "«": 0xae, // Left-pointing double angle quotation mark
  "»": 0xaf, // Right-pointing double angle quotation mark

  "░": 0xb0, // Light shade
  "▒": 0xb1, // Medium shade
  "▓": 0xb2, // Dark shade
  "│": 0xb3, // Box drawings light vertical
  "┤": 0xb4, // Box drawings light vertical and left
  "╡": 0xb5, // Box drawings vertical single and left double
  "╢": 0xb6, // Box drawings vertical double and left single
  "╖": 0xb7, // Box drawings down double and left single
  "╕": 0xb8, // Box drawings down single and left double
  "╣": 0xb9, // Box drawings double vertical and left
  "║": 0xba, // Box drawings double vertical
  "╗": 0xbb, // Box drawings double down and left
  "╝": 0xbc, // Box drawings double up and left
  "╜": 0xbd, // Box drawings up double and left single
  "╛": 0xbe, // Box drawings up single and left double
  "┐": 0xbf, // Box drawings light down and left

  "└": 0xc0, // Box drawings light up and right
  "┴": 0xc1, // Box drawings light up and horizontal
  "┬": 0xc2, // Box drawings light down and horizontal
  "├": 0xc3, // Box drawings light vertical and right
  "─": 0xc4, // Box drawings light horizontal
  "┼": 0xc5, // Box drawings light vertical and horizontal
  "╞": 0xc6, // Box drawings vertical single and right double
  "╟": 0xc7, // Box drawings vertical double and right single
  "╚": 0xc8, // Box drawings double up and right
  "╔": 0xc9, // Box drawings double down and right
  "╩": 0xca, // Box drawings double up and horizontal
  "╦": 0xcb, // Box drawings double down and horizontal
  "╠": 0xcc, // Box drawings double vertical and right
  "═": 0xcd, // Box drawings double horizontal
  "╬": 0xce, // Box drawings double vertical and horizontal
  "╧": 0xcf, // Box drawings up single and horizontal double

  "╨": 0xd0, // Box drawings up double and horizontal single
  "╤": 0xd1, // Box drawings down single and horizontal double
  "╥": 0xd2, // Box drawings down double and horizontal single
  "╙": 0xd3, // Box drawings up double and right single
  "╘": 0xd4, // Box drawings up single and right double
  "╒": 0xd5, // Box drawings down single and right double
  "╓": 0xd6, // Box drawings down double and right single
  "╫": 0xd7, // Box drawings vertical double and horizontal single
  "╪": 0xd8, // Box drawings vertical single and horizontal double
  "┘": 0xd9, // Box drawings light up and left
  "┌": 0xda, // Box drawings light down and right
  "█": 0xdb, // Full block
  "▄": 0xdc, // Lower half block
  "▌": 0xdd, // Left half block
  "▐": 0xde, // Right half block
  "▀": 0xdf, // Upper half block

  α: 0xe0, // Greek small letter alpha
  β: 0xe1, // Greek small letter beta (German eszett)
  Γ: 0xe2, // Greek capital letter gamma
  π: 0xe3, // Greek small letter pi
  Σ: 0xe4, // Greek capital letter sigma
  σ: 0xe5, // Greek small letter sigma
  µ: 0xe6, // Micro sign
  τ: 0xe7, // Greek small letter tau
  Φ: 0xe8, // Greek capital letter phi
  Θ: 0xe9, // Greek capital letter theta
  Ω: 0xea, // Greek capital letter omega
  δ: 0xeb, // Greek small letter delta
  "∞": 0xec, // Infinity
  φ: 0xed, // Greek small letter phi
  ε: 0xee, // Greek small letter epsilon
  "∩": 0xef, // Intersection

  "≡": 0xf0, // Identical to
  "±": 0xf1, // Plus-minus sign
  "≥": 0xf2, // Greater-than or equal to
  "≤": 0xf3, // Less-than or equal to
  "⌠": 0xf4, // Top half integral
  "⌡": 0xf5, // Bottom half integral
  "÷": 0xf6, // Division sign
  "≈": 0xf7, // Almost equal to
  "°": 0xf8, // Degree sign
  "∙": 0xf9, // Bullet operator
  "·": 0xfa, // Middle dot
  "√": 0xfb, // Square root
  ⁿ: 0xfc, // Superscript n
  "²": 0xfd, // Superscript 2
  "■": 0xfe, // Black square
  "\u00A0": 0x20, // Non-breaking space (U+A0) -> regular space
  " ": 0xff, // Non-breaking space alternative
};

/**
 * Encode text to CP860 byte array
 * Converts JavaScript string (UTF-16) to CP860 encoding for thermal printers
 *
 * @param text - Text to encode
 * @returns Array of CP860 byte values
 */
export function encodeCP860(text: string): number[] {
  const bytes: number[] = [];

  for (let i = 0; i < text.length; i++) {
    const char = text.charAt(i);
    const charCode = text.charCodeAt(i);

    // ASCII characters (0x00-0x7F) are the same in CP860
    if (charCode < 0x80) {
      bytes.push(charCode);
    }
    // Special characters mapped in CP860_MAP
    else if (char in CP860_MAP) {
      bytes.push(CP860_MAP[char]);
    }
    // Unmapped character - use '?' as fallback
    else {
      bytes.push(0x3f); // '?'
    }
  }

  return bytes;
}

/**
 * Test if a character is supported in CP860
 */
export function isCP860Supported(char: string): boolean {
  const charCode = char.charCodeAt(0);
  return charCode < 0x80 || char in CP860_MAP;
}

/**
 * Common Portuguese words test string
 */
export const CP860_TEST_STRING = "Ação, Pão, Açúcar, Café, Atenção, Informação, São Paulo, João, José";
