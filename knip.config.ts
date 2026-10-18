import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: [
    "src/routes/**/*.{ts,tsx}",
    "src/router.tsx",
    "src/server.ts",
    "src/start.ts",
    "src/worker-entry.ts",
    "src/sections/**/*.{ts,tsx}",
    ".deco/index.ts",
    "vite.config.ts",
    "parity/**/*.{mjs,js,ts}",
  ],
  project: ["src/**/*.{ts,tsx}", ".deco/index.ts"],
  ignore: [
    "src/routeTree.gen.ts",
    ".deco/blocks.gen.ts",
  ],
  ignoreDependencies: [
    "babel-plugin-react-compiler",
    "@vitejs/plugin-react",
    "wrangler",
    // Workers runtime module, provided by workerd.
    "cloudflare",
  ],
};

export default config;
