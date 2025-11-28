import React, { useState, useCallback, useEffect, ReactElement } from "react";
import { CodeEditor } from "./CodeEditor";
import { PDFPreview } from "./PDFPreview";
import { HexDumpPanel } from "./HexDumpPanel";
import { transpileAndExecute } from "../utils/transpiler";

export interface PlaygroundLayoutProps {
  /** Initial JSX code to display in the editor */
  initialCode: string;
  /** Paper width in characters (default: 48 for 80mm printer) */
  paperWidth?: number;
  /** Paper cut mode */
  cut?: boolean | "full" | "partial";
}

export const PlaygroundLayout: React.FC<PlaygroundLayoutProps> = ({
  initialCode,
  paperWidth = 48,
  cut = "full",
}) => {
  const [code, setCode] = useState(initialCode);
  const [element, setElement] = useState<ReactElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [protocol, setProtocol] = useState<"escpos" | "escbematech">("escpos");

  // Transpile and execute code to get React element
  const updateElement = useCallback((sourceCode: string) => {
    try {
      const result = transpileAndExecute(sourceCode);
      setElement(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setElement(null);
    }
  }, []);

  // Initial render
  useEffect(() => {
    updateElement(code);
  }, []);

  // Debounced update on code change
  useEffect(() => {
    const timer = setTimeout(() => {
      updateElement(code);
    }, 500);
    return () => clearTimeout(timer);
  }, [code, updateElement]);

  return (
    <div style={styles.container}>
      <div style={styles.panels}>
        {/* Panel 1: Code Editor */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <span style={styles.panelTitle}>Code Editor</span>
          </div>
          <div style={styles.panelContent}>
            <CodeEditor
              value={code}
              onChange={setCode}
            />
            {error && (
              <div style={styles.errorBox}>
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>
        </div>

        {/* Panel 2: PDF Preview */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <span style={styles.panelTitle}>PDF Preview</span>
          </div>
          <div style={styles.panelContent}>
            <PDFPreview
              element={element}
              paperWidth={paperWidth}
            />
          </div>
        </div>

        {/* Panel 3: Hex Dump */}
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <span style={styles.panelTitle}>ESC/POS Hex Dump</span>
            <div style={styles.protocolToggle}>
              <button
                style={{
                  ...styles.toggleButton,
                  ...(protocol === "escpos" ? styles.toggleButtonActive : {}),
                }}
                onClick={() => setProtocol("escpos")}
              >
                ESC/POS
              </button>
              <button
                style={{
                  ...styles.toggleButton,
                  ...(protocol === "escbematech" ? styles.toggleButtonActive : {}),
                }}
                onClick={() => setProtocol("escbematech")}
              >
                Bematech
              </button>
            </div>
          </div>
          <div style={styles.panelContent}>
            <HexDumpPanel
              element={element}
              protocol={protocol}
              paperWidth={paperWidth}
              cut={cut}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    backgroundColor: "#1e1e1e",
    color: "#fff",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  panels: {
    display: "flex",
    flex: 1,
    overflow: "hidden",
  },
  panel: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    borderRight: "1px solid #404040",
    minWidth: 0,
  },
  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "8px 12px",
    backgroundColor: "#252526",
    borderBottom: "1px solid #404040",
  },
  panelTitle: {
    fontSize: "12px",
    fontWeight: 600,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    color: "#888",
  },
  panelContent: {
    flex: 1,
    overflow: "auto",
    position: "relative",
  },
  protocolToggle: {
    display: "flex",
    gap: "4px",
  },
  toggleButton: {
    padding: "4px 10px",
    fontSize: "11px",
    backgroundColor: "#3c3c3c",
    color: "#aaa",
    border: "1px solid #555",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  toggleButtonActive: {
    backgroundColor: "#0e639c",
    color: "#fff",
    borderColor: "#0e639c",
  },
  errorBox: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "10px 12px",
    backgroundColor: "#5a1d1d",
    color: "#ff8080",
    fontSize: "12px",
    borderTop: "1px solid #6b2222",
  },
};
