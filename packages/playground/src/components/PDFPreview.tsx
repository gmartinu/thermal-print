import React, { useState, useEffect, useRef, ReactElement } from "react";
import { convertToPrintNodes } from "@thermal-print/react";
import { printNodesToPDF } from "@thermal-print/pdf";

export interface PDFPreviewProps {
  /** React element to render as PDF */
  element: ReactElement | null;
  /** Paper width in characters */
  paperWidth?: number;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({
  element,
  paperWidth = 48,
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Cleanup previous URL
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    if (!element) {
      setPdfUrl(null);
      return;
    }

    const generatePDF = async () => {
      setLoading(true);
      setError(null);

      try {
        // Convert React element to PrintNode
        const printNode = convertToPrintNodes(element as any);

        if (!printNode) {
          throw new Error("Failed to convert element to PrintNode");
        }

        // Convert paper width in characters to points
        // 48 chars ≈ 80mm ≈ 227pt for thermal printers
        const paperWidthPt = (paperWidth / 48) * 227;

        // Generate PDF (height is read from Page component's size prop)
        const result = await printNodesToPDF(printNode, {
          paperWidth: paperWidthPt,
        });

        setPdfUrl(result.url);
        cleanupRef.current = result.cleanup;
      } catch (err) {
        console.error("PDF generation error:", err);
        setError(err instanceof Error ? err.message : String(err));
        setPdfUrl(null);
      } finally {
        setLoading(false);
      }
    };

    generatePDF();

    // Cleanup on unmount
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [element, paperWidth]);

  if (!element) {
    return (
      <div style={styles.placeholder}>
        <span style={styles.placeholderText}>
          No component to preview
        </span>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.placeholder}>
        <div style={styles.spinner} />
        <span style={styles.placeholderText}>Generating PDF...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>!</div>
        <div style={styles.errorText}>
          <strong>PDF Generation Error</strong>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div style={styles.placeholder}>
        <span style={styles.placeholderText}>
          Unable to generate PDF
        </span>
      </div>
    );
  }

  return (
    <iframe
      src={pdfUrl}
      style={styles.iframe}
      title="PDF Preview"
    />
  );
};

const styles: Record<string, React.CSSProperties> = {
  placeholder: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: "12px",
    color: "#666",
  },
  placeholderText: {
    fontSize: "13px",
  },
  spinner: {
    width: "24px",
    height: "24px",
    border: "2px solid #444",
    borderTopColor: "#0e639c",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  iframe: {
    width: "100%",
    height: "100%",
    border: "none",
    backgroundColor: "#525252",
  },
  errorContainer: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "16px",
    backgroundColor: "#3c1f1f",
    color: "#ff8080",
    margin: "12px",
    borderRadius: "6px",
  },
  errorIcon: {
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff4444",
    color: "#fff",
    borderRadius: "50%",
    fontWeight: "bold",
    flexShrink: 0,
  },
  errorText: {
    fontSize: "13px",
    lineHeight: 1.5,
  },
};
