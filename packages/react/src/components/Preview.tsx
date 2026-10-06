import React, { ReactElement, CSSProperties } from 'react';
import { convertToPrintNodes } from '../renderer';
import { PrintNode } from '@thermal-print/core';

/**
 * Preview component - Visual preview of thermal printer output
 *
 * Renders your thermal printer document as HTML/CSS for development and testing.
 * Shows paper width, monospace font, and thermal printer styling.
 *
 * @example
 * ```typescript
 * <Preview paperWidth={48} showRuler>
 *   <Document>
 *     <Page>
 *       <Text>My Receipt</Text>
 *     </Page>
 *   </Document>
 * </Preview>
 * ```
 */
export interface PreviewProps {
  children: ReactElement;
  paperWidth?: number; // Characters per line (default: 48)
  showRuler?: boolean; // Show character ruler at top
  scale?: number; // Scale factor (default: 1)
  style?: CSSProperties;
}

export function Preview({
  children,
  paperWidth = 48,
  showRuler = false,
  scale = 1,
  style
}: PreviewProps): ReactElement {
  // Render the tree (but we'll display the original React tree for preview)
  // This ensures the components are properly structured
  convertToPrintNodes(children);

  // Calculate paper width in pixels (approximately 8-9 pixels per character)
  const charWidth = 9 * scale;
  const paperWidthPx = paperWidth * charWidth;

  const containerStyle: CSSProperties = {
    fontFamily: '"Courier New", Courier, monospace',
    fontSize: `${12 * scale}px`,
    width: `${paperWidthPx}px`,
    backgroundColor: '#fff',
    color: '#000',
    padding: `${16 * scale}px`,
    border: '1px solid #ccc',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    margin: '20px auto',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    lineHeight: 1.2,
    ...style
  };

  const rulerStyle: CSSProperties = {
    fontSize: `${10 * scale}px`,
    color: '#999',
    borderBottom: '1px solid #ddd',
    marginBottom: `${8 * scale}px`,
    paddingBottom: `${4 * scale}px`,
    fontFamily: 'monospace'
  };

  // Generate ruler text
  const generateRuler = () => {
    let ruler = '';
    for (let i = 0; i < paperWidth; i++) {
      if (i % 10 === 0) {
        ruler += (i / 10).toString();
      } else if (i % 5 === 0) {
        ruler += '+';
      } else {
        ruler += '.';
      }
    }
    return ruler;
  };

  return (
    <div style={containerStyle}>
      {showRuler && (
        <div style={rulerStyle}>
          {generateRuler()}
        </div>
      )}
      <PreviewContent scale={scale}>
        {children}
      </PreviewContent>
    </div>
  );
}

/**
 * Internal component to render preview content with thermal printer styling
 */
function PreviewContent({ children, scale }: { children: ReactElement; scale: number }) {
  // Clone the children and apply thermal printer styling
  return React.cloneElement(children, {
    ...children.props,
    style: {
      ...children.props.style,
      // Override to ensure proper preview rendering
    }
  });
}

/**
 * Preview styles hook - converts thermal styles to CSS for preview
 */
function useThermalStyles(printNode: PrintNode, scale: number): CSSProperties {
  const style: CSSProperties = {};

  if (printNode.style) {
    // Map fontSize
    if (printNode.style.fontSize) {
      const size = printNode.style.fontSize;
      if (size >= 25) style.fontSize = `${24 * scale}px`; // 2x2
      else if (size >= 19) style.fontSize = `${20 * scale}px`; // 2x1
      else if (size >= 13) style.fontSize = `${16 * scale}px`; // 1x2
      else style.fontSize = `${12 * scale}px`; // 1x1
    }

    // Map textAlign
    if (printNode.style.textAlign) {
      style.textAlign = printNode.style.textAlign;
    }

    // Map fontWeight
    if (printNode.style.fontWeight === 'bold' || printNode.style.fontWeight >= 700) {
      style.fontWeight = 'bold';
    }

    // Map borders
    if (printNode.style.borderTop) {
      style.borderTop = printNode.style.borderTop.includes('dashed')
        ? '1px dashed #000'
        : '1px solid #000';
    }
    if (printNode.style.borderBottom) {
      style.borderBottom = printNode.style.borderBottom.includes('dashed')
        ? '1px dashed #000'
        : '1px solid #000';
    }

    // Map flexDirection
    if (printNode.style.flexDirection === 'row') {
      style.display = 'flex';
      style.flexDirection = 'row';

      if (printNode.style.justifyContent) {
        style.justifyContent = printNode.style.justifyContent;
      }
    }
  }

  return style;
}
