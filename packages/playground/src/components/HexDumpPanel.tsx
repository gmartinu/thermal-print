import React, { useState, useEffect, ReactElement } from "react";
import { convertToPrintNodes } from "@thermal-print/react";
import { printNodesToESCPOS } from "@thermal-print/escpos";

/** View mode for the hex dump panel */
type ViewMode = "hex" | "text";

export interface HexDumpPanelProps {
  /** React element to convert to ESC/POS */
  element: ReactElement | null;
  /** Protocol to use */
  protocol: "escpos" | "escbematech";
  /** Paper width in characters */
  paperWidth?: number;
  /** Paper cut mode */
  cut?: boolean | "full" | "partial";
}

// ESC/POS command annotations
const COMMAND_ANNOTATIONS: Record<string, string> = {
  "1b40": "ESC @ - Initialize printer",
  "1b61": "ESC a - Set alignment",
  "1b6100": "ESC a 0 - Align left",
  "1b6101": "ESC a 1 - Align center",
  "1b6102": "ESC a 2 - Align right",
  "1b21": "ESC ! - Character size/style",
  "1b45": "ESC E - Bold on/off",
  "1b4500": "ESC E 0 - Bold off",
  "1b4501": "ESC E 1 - Bold on",
  "1b33": "ESC 3 - Line spacing",
  "1b69": "ESC i - Full cut",
  "1b6d": "ESC m - Partial cut",
  "1b64": "ESC d - Feed n lines",
  "1d56": "GS V - Paper cut",
  "1d28": "GS ( - Extended command",
  "0a": "LF - Line feed",
  "0d": "CR - Carriage return",
};

export const HexDumpPanel: React.FC<HexDumpPanelProps> = ({
  element,
  protocol,
  paperWidth = 48,
  cut = "full",
}) => {
  const [hexData, setHexData] = useState<Uint8Array | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("text");

  useEffect(() => {
    if (!element) {
      setHexData(null);
      return;
    }

    const generateESCPOS = async () => {
      setLoading(true);
      setError(null);

      try {
        // Convert React element to PrintNode
        const printNode = convertToPrintNodes(element as any);

        if (!printNode) {
          throw new Error("Failed to convert element to PrintNode");
        }

        // Generate ESC/POS buffer
        const buffer = await printNodesToESCPOS(printNode, {
          paperWidth,
          cut,
          commandAdapter: protocol,
        });

        setHexData(new Uint8Array(buffer));
      } catch (err) {
        console.error("ESC/POS generation error:", err);
        setError(err instanceof Error ? err.message : String(err));
        setHexData(null);
      } finally {
        setLoading(false);
      }
    };

    generateESCPOS();
  }, [element, protocol, paperWidth, cut]);

  if (!element) {
    return (
      <div style={styles.placeholder}>
        <span style={styles.placeholderText}>No component to convert</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.placeholder}>
        <span style={styles.placeholderText}>Generating ESC/POS...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (!hexData) {
    return (
      <div style={styles.placeholder}>
        <span style={styles.placeholderText}>Unable to generate ESC/POS</span>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.stats}>
        <span>Size: {hexData.length} bytes</span>
        <span>Protocol: {protocol === "escpos" ? "ESC/POS" : "ESC/Bematech"}</span>
        <div style={styles.viewToggle}>
          <button
            style={{
              ...styles.toggleButton,
              ...(viewMode === "hex" ? styles.toggleButtonActive : {}),
            }}
            onClick={() => setViewMode("hex")}
          >
            Hex Dump
          </button>
          <button
            style={{
              ...styles.toggleButton,
              ...(viewMode === "text" ? styles.toggleButtonActive : {}),
            }}
            onClick={() => setViewMode("text")}
          >
            Text
          </button>
        </div>
      </div>
      <div style={styles.hexContainer}>
        {viewMode === "hex" ? renderHexDump(hexData) : renderTextView(hexData)}
      </div>
    </div>
  );
};

function renderHexDump(data: Uint8Array): React.ReactNode[] {
  const rows: React.ReactNode[] = [];
  const bytesPerRow = 16;

  for (let offset = 0; offset < data.length; offset += bytesPerRow) {
    const rowBytes = data.slice(offset, offset + bytesPerRow);
    const hexParts: string[] = [];
    const asciiParts: string[] = [];

    for (let i = 0; i < bytesPerRow; i++) {
      if (i < rowBytes.length) {
        const byte = rowBytes[i];
        hexParts.push(byte.toString(16).padStart(2, "0"));
        // Show printable ASCII characters, dots for others
        asciiParts.push(byte >= 32 && byte < 127 ? String.fromCharCode(byte) : ".");
      } else {
        hexParts.push("  ");
        asciiParts.push(" ");
      }
    }

    // Check for command annotations
    const rowHex = Array.from(rowBytes).map(b => b.toString(16).padStart(2, "0")).join("");
    const annotation = findAnnotation(rowHex);

    rows.push(
      <div key={offset} style={styles.row}>
        <span style={styles.offset}>
          {offset.toString(16).padStart(8, "0")}
        </span>
        <span style={styles.hex}>
          {hexParts.slice(0, 8).join(" ")}
          {"  "}
          {hexParts.slice(8).join(" ")}
        </span>
        <span style={styles.ascii}>{asciiParts.join("")}</span>
        {annotation && (
          <span style={styles.annotation}>{annotation}</span>
        )}
      </div>
    );
  }

  return rows;
}

function findAnnotation(hexString: string): string | null {
  // Check for known command sequences at the start of the row
  for (const [pattern, annotation] of Object.entries(COMMAND_ANNOTATIONS)) {
    if (hexString.startsWith(pattern)) {
      return annotation;
    }
  }
  return null;
}

function renderTextView(data: Uint8Array): React.ReactNode {
  const parts: React.ReactNode[] = [];

  for (let i = 0; i < data.length; i++) {
    const byte = data[i];

    if (byte === 0x1b) {
      // ESC character - highlight as command
      parts.push(
        <span key={`esc-${i}`} style={styles.escCommand}>
          [ESC]
        </span>
      );
    } else if (byte === 0x0a) {
      // Line feed - show marker and newline
      parts.push(
        <span key={`lf-${i}`} style={styles.controlChar}>
          [LF]
        </span>
      );
      parts.push(<br key={`br-${i}`} />);
    } else if (byte === 0x0d) {
      // Carriage return
      parts.push(
        <span key={`cr-${i}`} style={styles.controlChar}>
          [CR]
        </span>
      );
    } else if (byte === 0x00) {
      // NUL character
      parts.push(
        <span key={`nul-${i}`} style={styles.hexByte}>
          [NUL]
        </span>
      );
    } else if (byte >= 32 && byte < 127) {
      // Printable ASCII
      parts.push(
        <span key={`char-${i}`} style={styles.printableChar}>
          {String.fromCharCode(byte)}
        </span>
      );
    } else {
      // Other control/non-printable - show hex value
      parts.push(
        <span key={`hex-${i}`} style={styles.hexByte}>
          [{byte.toString(16).padStart(2, "0").toUpperCase()}]
        </span>
      );
    }
  }

  return <div style={styles.textView}>{parts}</div>;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#1e1e1e",
  },
  stats: {
    display: "flex",
    gap: "16px",
    padding: "8px 12px",
    backgroundColor: "#252526",
    borderBottom: "1px solid #404040",
    fontSize: "11px",
    color: "#888",
    alignItems: "center",
  },
  viewToggle: {
    display: "flex",
    gap: "4px",
    marginLeft: "auto",
  },
  toggleButton: {
    padding: "4px 12px",
    fontSize: "11px",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    backgroundColor: "transparent",
    color: "#888",
    transition: "all 0.2s ease",
  },
  toggleButtonActive: {
    backgroundColor: "#0e639c",
    color: "#fff",
  },
  hexContainer: {
    flex: 1,
    overflow: "auto",
    padding: "8px 0",
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    fontSize: "12px",
    lineHeight: "1.6",
  },
  row: {
    display: "flex",
    alignItems: "center",
    padding: "0 12px",
    whiteSpace: "nowrap",
  },
  offset: {
    color: "#6a9955",
    marginRight: "16px",
    minWidth: "70px",
  },
  hex: {
    color: "#ce9178",
    marginRight: "16px",
    letterSpacing: "1px",
  },
  ascii: {
    color: "#569cd6",
    minWidth: "140px",
    marginRight: "16px",
    fontFamily: "monospace",
  },
  annotation: {
    color: "#6a9955",
    fontStyle: "italic",
    fontSize: "11px",
  },
  placeholder: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#666",
  },
  placeholderText: {
    fontSize: "13px",
  },
  errorContainer: {
    padding: "16px",
    backgroundColor: "#3c1f1f",
    color: "#ff8080",
    margin: "12px",
    borderRadius: "6px",
    fontSize: "13px",
  },
  // Text view styles
  textView: {
    padding: "12px",
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
    fontSize: "13px",
    lineHeight: "1.8",
    wordWrap: "break-word",
    whiteSpace: "pre-wrap",
  },
  escCommand: {
    color: "#4ec9b0",
    fontWeight: "bold",
  },
  controlChar: {
    color: "#dcdcaa",
  },
  hexByte: {
    color: "#808080",
    fontSize: "11px",
  },
  printableChar: {
    color: "#d4d4d4",
  },
};
