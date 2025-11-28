import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { Buffer } from "buffer";

// Polyfill Buffer for browser environment (needed for ESC/POS generation)
globalThis.Buffer = Buffer;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
