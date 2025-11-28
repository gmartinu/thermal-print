import { defineConfig } from "vitepress";
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid(defineConfig({
  title: "@thermal-print",
  description: "A modular TypeScript library suite for thermal printing",
  base: "/thermal-print/",

  head: [
    [
      "link",
      { rel: "icon", type: "image/png", href: "/thermal-print/icon.png" },
    ],
    [
      "link",
      {
        rel: "preload",
        as: "image",
        href: "/thermal-print/demo.webp",
        type: "image/webp",
      },
    ],
  ],

  themeConfig: {
    logo: "/icon.png",
    siteTitle: "@thermal-print",

    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Packages", link: "/packages/react" },
      { text: "API", link: "/api/components" },
      {
        text: "Playground",
        link: "https://gmartinu.github.io/thermal-print/playground/",
      },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "Getting Started", link: "/guide/getting-started" },
            { text: "Installation", link: "/guide/installation" },
          ],
        },
        {
          text: "Migration",
          items: [
            { text: "From @react-pdf/renderer", link: "/guide/migration" },
          ],
        },
      ],
      "/packages/": [
        {
          text: "Packages",
          items: [
            { text: "@thermal-print/react", link: "/packages/react" },
            { text: "@thermal-print/escpos", link: "/packages/escpos" },
            { text: "@thermal-print/pdf", link: "/packages/pdf" },
            { text: "@thermal-print/core", link: "/packages/core" },
          ],
        },
      ],
      "/api/": [
        {
          text: "@thermal-print/react",
          items: [
            { text: "Overview", link: "/api/react/" },
          ],
        },
        {
          text: "@thermal-print/escpos",
          items: [
            { text: "Overview", link: "/api/escpos/" },
            { text: "ESC/POS Commands", link: "/api/escpos/escpos-commands" },
            {
              text: "ESC/Bematech Commands",
              link: "/api/escpos/escbematech-commands",
            },
          ],
        },
        {
          text: "@thermal-print/pdf",
          items: [
            { text: "Overview", link: "/api/pdf/" },
          ],
        },
        {
          text: "@thermal-print/core",
          items: [
            { text: "Types & Interfaces", link: "/api/core/" },
          ],
        },
        {
          text: "API Reference",
          items: [{ text: "Components", link: "/api/components" }],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/gmartinu/thermal-print" },
      { icon: "npm", link: "https://www.npmjs.com/org/thermal-print" },
    ],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2024 Gabriel Martinusso",
    },

    search: {
      provider: "local",
    },

    editLink: {
      pattern:
        "https://github.com/gmartinu/thermal-print/edit/main/packages/docs/:path",
      text: "Edit this page on GitHub",
    },
  },

  // Vite configuration to fix mermaid plugin issues
  vite: {
    optimizeDeps: {
      include: ["mermaid", "dayjs"],
    },
    ssr: {
      noExternal: ["mermaid"],
    },
  },

  // Mermaid configuration
  mermaid: {
    // https://mermaid.js.org/config/setup/modules/mermaidAPI.html#mermaidapi-configuration-defaults
  },
  mermaidPlugin: {
    class: "mermaid",
  },
}));
