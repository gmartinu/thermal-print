import { transform } from "@babel/standalone";
import React, { ReactElement } from "react";
import { Document, Page, View, Text, Image, StyleSheet } from "@thermal-print/react";

/**
 * Transpile and execute JSX code to produce a React element
 *
 * @param code - JSX/TSX code string
 * @returns React element
 * @throws Error if transpilation or execution fails
 */
export function transpileAndExecute(code: string): ReactElement {
  let sourceCode = code.trim();

  // Remove trailing semicolons that Prettier might add
  while (sourceCode.endsWith(";")) {
    sourceCode = sourceCode.slice(0, -1).trim();
  }

  // Check if the code is a simple JSX expression (like <Document>...</Document>)
  // If so, wrap it in an IIFE with return
  if (sourceCode.startsWith("<")) {
    sourceCode = `(function() { return (${sourceCode}); })()`;
  }

  // Transpile JSX to JavaScript
  const result = transform(sourceCode, {
    presets: ["react", "typescript"],
    filename: "receipt.tsx",
  });

  if (!result.code) {
    throw new Error("Transpilation produced no output");
  }

  // Create a function that has access to React and thermal-print components
  const scope = {
    React,
    Document,
    Page,
    View,
    Text,
    Image,
    StyleSheet,
    // Also expose createElement for compiled JSX
    createElement: React.createElement,
  };

  // Build function with scope variables
  const scopeKeys = Object.keys(scope);
  const scopeValues = Object.values(scope);

  // The transpiled code will use React.createElement
  // The code is an IIFE that returns the element, so we need to return its result
  const fn = new Function(...scopeKeys, `return ${result.code}`);

  // Execute and get the element
  const element = fn(...scopeValues);

  if (!React.isValidElement(element)) {
    throw new Error("Code did not produce a valid React element");
  }

  return element;
}

/**
 * Generate default receipt code for the editor
 */
export function getDefaultReceiptCode(): string {
  return `<Document>
  <Page>
    <Text style={{ textAlign: 'center', fontSize: 20, fontWeight: 'bold' }}>
      MY STORE
    </Text>
    <Text style={{ textAlign: 'center', fontSize: 12 }}>
      123 Main Street
    </Text>
    <Text style={{ textAlign: 'center', fontSize: 12 }}>
      Tel: (11) 1234-5678
    </Text>

    <View style={{ borderBottom: '1px solid black', marginTop: 10, marginBottom: 10 }} />

    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text>Coffee</Text>
      <Text>R$ 5.00</Text>
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text>Sandwich</Text>
      <Text>R$ 12.00</Text>
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text>Water</Text>
      <Text>R$ 3.00</Text>
    </View>

    <View style={{ borderTop: '1px dashed black', marginTop: 10, marginBottom: 10 }} />

    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text style={{ fontWeight: 'bold' }}>TOTAL</Text>
      <Text style={{ fontWeight: 'bold', fontSize: 18 }}>R$ 20.00</Text>
    </View>

    <View style={{ marginTop: 20 }}>
      <Text style={{ textAlign: 'center', fontSize: 12 }}>
        Thank you for your purchase!
      </Text>
    </View>
  </Page>
</Document>`;
}
