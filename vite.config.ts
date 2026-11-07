import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { decoTanstack } from "@decocms/tanstack/vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import path from "path";

const srcDir = path.resolve(__dirname, "src");

export default defineConfig({
  server: {
    allowedHosts: [".decocdn.com", ".trycloudflare.com", ".preview-studio.decocms.com"],
    // Shopify Storefront API is called server-side from loaders — no dev
    // proxy is needed. Checkout happens on Shopify's hosted checkout (or
    // the store's custom domain).
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tanstackStart({ server: { entry: "server" } }),
    react({
      babel: {
        plugins: [
          ["babel-plugin-react-compiler", { target: "19" }],
        ],
      },
    }),
    tailwindcss(),
    // decoContent(), __BUILD_HASH__ (the CI's commit, else git's) and one copy of React and TanStack.
    decoTanstack({ buildHash: process.env.WORKERS_CI_COMMIT_SHA }),
    {
      name: "site-manual-chunks",
      config(_cfg, { command }) {
        if (command !== "build") return;
        return {
          build: {
            rollupOptions: {
              output: {
                manualChunks(id: string) {
                  if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/"))
                    return "vendor-react";
                  if (id.includes("@tanstack/react-router") || id.includes("@tanstack/start"))
                    return "vendor-router";
                  if (id.includes("@tanstack/react-query")) return "vendor-query";
                },
              },
            },
          },
        };
      },
    },
  ],
  build: {
    sourcemap: "hidden",
    rollupOptions: {
      onLog(level, log, handler) {
        if (
          log.code === "PLUGIN_WARNING" &&
          log.plugin === "vite:reporter" &&
          log.message?.includes("dynamic import will not move module")
        ) {
          return;
        }
        handler(level, log);
      },
    },
  },
  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  resolve: {
    dedupe: [
      "@tanstack/react-start",
      "@tanstack/react-router",
      "@tanstack/react-start-server",
      "@tanstack/start-server-core",
      "@tanstack/start-client-core",
      "@tanstack/start-plugin-core",
      "@tanstack/start-storage-context",
      "react",
      "react-dom",
    ],
    alias: {
      "~": srcDir,
    },
  },
});
