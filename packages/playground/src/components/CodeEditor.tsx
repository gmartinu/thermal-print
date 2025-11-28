import React, { useRef, useCallback } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as prettier from "prettier/standalone";
import * as prettierPluginBabel from "prettier/plugins/babel";
import * as prettierPluginEstree from "prettier/plugins/estree";

export interface CodeEditorProps {
  /** Current code value */
  value: string;
  /** Callback when code changes */
  onChange: (value: string) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange }) => {
  const editorRef = useRef<any>(null);
  const formatCodeRef = useRef<(() => void) | null>(null);

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Add Ctrl+S keybinding for format
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      formatCodeRef.current?.();
    });

    // Configure TypeScript/JavaScript compiler options for JSX
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ESNext,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      noEmit: true,
      jsx: monaco.languages.typescript.JsxEmit.React,
      jsxFactory: "React.createElement",
      reactNamespace: "React",
      allowJs: true,
      typeRoots: ["node_modules/@types"],
    });

    // Add React type definitions for better IntelliSense
    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      `
      declare namespace React {
        interface ReactElement<P = any> {}
        function createElement(type: any, props?: any, ...children: any[]): ReactElement;
      }
      declare const Document: React.FC<any>;
      declare const Page: React.FC<any>;
      declare const View: React.FC<any>;
      declare const Text: React.FC<any>;
      declare const Image: React.FC<any>;
      `,
      "file:///node_modules/@types/thermal-print/index.d.ts"
    );

    // Disable some strict checks for playground experience
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      diagnosticCodesToIgnore: [
        2304, // Cannot find name 'xxx' - for global components
        2307, // Cannot find module - for imports we don't have
        7026, // JSX element implicitly has type 'any'
        7006, // Parameter implicitly has 'any' type
        1005, // ';' expected - for JSX expressions
      ],
    });
  };

  const formatCode = useCallback(async () => {
    if (!editorRef.current) return;

    try {
      const currentValue = editorRef.current.getValue();
      const formatted = await prettier.format(currentValue, {
        parser: "babel",
        plugins: [prettierPluginBabel, prettierPluginEstree as any],
        semi: false,
        singleQuote: false,
        tabWidth: 2,
        trailingComma: "es5",
        printWidth: 80,
        jsxSingleQuote: false,
      });

      // Remove trailing newline that Prettier adds
      const trimmed = formatted.trimEnd();
      onChange(trimmed);
    } catch (err) {
      console.error("Format error:", err);
    }
  }, [onChange]);

  // Keep ref updated with latest formatCode
  formatCodeRef.current = formatCode;

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <button style={styles.formatButton} onClick={formatCode} title="Format code (Prettier)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3 3h2v2H3V3zm4 0h2v2H7V3zm4 0h2v2h-2V3zm4 0h2v2h-2V3zm4 0h2v2h-2V3zM3 7h2v2H3V7zm4 0h14v2H7V7zM3 11h2v2H3v-2zm4 0h14v2H7v-2zM3 15h2v2H3v-2zm4 0h10v2H7v-2zM3 19h2v2H3v-2zm4 0h6v2H7v-2z"/>
          </svg>
          Format
        </button>
        <span style={styles.hint}>Ctrl+S to format</span>
      </div>
      <div style={styles.editorContainer}>
        <Editor
          height="100%"
          defaultLanguage="typescript"
          theme="vs-dark"
          value={value}
          onChange={(val) => onChange(val ?? "")}
          onMount={handleEditorMount}
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            wordWrap: "on",
            automaticLayout: true,
            tabSize: 2,
            formatOnPaste: false,
            formatOnType: false,
            padding: { top: 8 },
            scrollbar: {
              verticalScrollbarSize: 8,
              horizontalScrollbarSize: 8,
            },
          }}
        />
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
  },
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "6px 12px",
    backgroundColor: "#252526",
    borderBottom: "1px solid #404040",
  },
  formatButton: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "4px 10px",
    fontSize: "11px",
    backgroundColor: "#0e639c",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    transition: "background-color 0.15s",
  },
  hint: {
    fontSize: "10px",
    color: "#666",
  },
  editorContainer: {
    flex: 1,
    overflow: "hidden",
  },
};
