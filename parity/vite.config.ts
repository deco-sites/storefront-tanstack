/**
 * Parity build config: the site's own vite.config.ts plus one plugin that
 * prepends parity/runtime/worker-shim.js to the worker entry. The shim is
 * inert unless PARITY_* env vars are set, so this build behaves exactly like
 * the production build when served without them. Site source is untouched.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mergeConfig, type Plugin, type UserConfig } from "vite";
import siteConfig from "../vite.config";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const shim = path.join(here, "runtime/worker-shim.js");
const workerEntry = path.join(root, "src/worker-entry.ts");

const injectShim: Plugin = {
  name: "parity-worker-shim",
  enforce: "pre",
  transform(code, id) {
    if (id.split("?")[0] !== workerEntry) return;
    return { code: `import ${JSON.stringify(shim)};\n${code}`, map: null };
  },
};

export default mergeConfig(siteConfig as UserConfig, {
  root,
  plugins: [injectShim],
});
