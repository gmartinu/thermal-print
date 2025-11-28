import React, { useState } from "react";
import { PlaygroundLayout } from "./components/PlaygroundLayout";
import { RECEIPT_EXAMPLES } from "./examples";
import faviconImg from "./assets/favicon.png";

export const App: React.FC = () => {
  const [selectedExample, setSelectedExample] = useState<string>("simple");
  const [paperWidth, setPaperWidth] = useState<number>(48);

  const currentExample =
    RECEIPT_EXAMPLES[selectedExample] || RECEIPT_EXAMPLES.simple;

  return (
    <div style={styles.app}>
      {/* Top Navigation */}
      <nav style={styles.nav}>
        <div style={styles.navBrand}>
          <img
            src={faviconImg}
            alt="Thermal Print"
            style={{ width: 24, height: 24 }}
          />
          <span style={styles.brandText}>Thermal Print Playground</span>
        </div>

        <div style={styles.navControls}>
          <label style={styles.controlLabel}>
            Example:
            <select
              style={styles.select}
              value={selectedExample}
              onChange={(e) => setSelectedExample(e.target.value)}
            >
              {Object.entries(RECEIPT_EXAMPLES).map(([key, example]) => (
                <option key={key} value={key}>
                  {example.name}
                </option>
              ))}
            </select>
          </label>

          <label style={styles.controlLabel}>
            Paper:
            <select
              style={styles.select}
              value={paperWidth}
              onChange={(e) => setPaperWidth(Number(e.target.value))}
            >
              <option value={32}>58mm (32 chars)</option>
              <option value={48}>80mm (48 chars)</option>
              <option value={64}>112mm (64 chars)</option>
            </select>
          </label>

          <a href="/thermal-print/" style={styles.docsLink}>
            Docs
          </a>

          <a
            href="https://github.com/gmartinu/thermal-print"
            target="_blank"
            rel="noopener noreferrer"
            style={styles.githubLink}
          >
            <svg height="20" viewBox="0 0 16 16" width="20" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
          </a>
        </div>
      </nav>

      {/* Main Content */}
      <main style={styles.main}>
        <PlaygroundLayout
          key={`${selectedExample}-${paperWidth}`}
          initialCode={currentExample.code}
          paperWidth={paperWidth}
          cut="full"
        />
      </main>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    backgroundColor: "#1e1e1e",
  },
  nav: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 20px",
    backgroundColor: "#252526",
    borderBottom: "1px solid #3c3c3c",
  },
  navBrand: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  brandText: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#fff",
  },
  navControls: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  controlLabel: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "13px",
    color: "#ccc",
  },
  select: {
    padding: "6px 10px",
    backgroundColor: "#3c3c3c",
    color: "#fff",
    border: "1px solid #555",
    borderRadius: "4px",
    fontSize: "13px",
    cursor: "pointer",
  },
  docsLink: {
    color: "#ccc",
    fontSize: "13px",
    textDecoration: "none",
    padding: "6px 12px",
    borderRadius: "4px",
    border: "1px solid #555",
    transition: "all 0.15s",
  },
  githubLink: {
    color: "#ccc",
    display: "flex",
    alignItems: "center",
    padding: "6px",
    borderRadius: "4px",
    transition: "background-color 0.15s",
  },
  main: {
    flex: 1,
    overflow: "hidden",
  },
};
