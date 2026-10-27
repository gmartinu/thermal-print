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
  // 0x80-0xAF follow the official IBM CP860 (Portuguese) table.
  Ç: 0x80,
  ü: 0x81,
  é: 0x82,
  â: 0x83,
  ã: 0x84,
  à: 0x85,
  Á: 0x86,
  ç: 0x87,
  ê: 0x88,
  Ê: 0x89,
  è: 0x8a,
  Í: 0x8b,
  Ô: 0x8c,
  ì: 0x8d,
  Ã: 0x8e,
  Â: 0x8f,

  É: 0x90,
  À: 0x91,
  È: 0x92,
  ô: 0x93,
  õ: 0x94,
  ò: 0x95,
  Ú: 0x96,
  ù: 0x97,
  Ì: 0x98,
  Õ: 0x99,
  Ü: 0x9a,
  "¢": 0x9b,
  "£": 0x9c,
  Ù: 0x9d,
  "₧": 0x9e,
  Ó: 0x9f,

  á: 0xa0,
  í: 0xa1,
  ó: 0xa2,
  ú: 0xa3,
  ñ: 0xa4,
  Ñ: 0xa5,
  ª: 0xa6,
  º: 0xa7,
  "¿": 0xa8,
  Ò: 0xa9,
  "¬": 0xaa,
  "½": 0xab,
  "¼": 0xac,
  "¡": 0xad,
  "«": 0xae,
  "»": 0xaf,

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
  "\u00A0": 0xff, // Non-breaking space (CP860 0xFF)
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
