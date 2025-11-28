import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/thermal-print/playground/", // GitHub Pages base path (docs at root, playground in subdirectory)
  define: {
    global: "globalThis",
  },
  resolve: {
    alias: {
      buffer: "buffer/",
    },
  },
  optimizeDeps: {
    include: [
      "buffer",
      "@thermal-print/core",
      "@thermal-print/react",
      "@thermal-print/escpos",
      "@thermal-print/pdf",
    ],
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
