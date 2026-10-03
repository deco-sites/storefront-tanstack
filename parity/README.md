# Parity harness

Deterministic pixel and snapshot baseline of this storefront. It exists so the v8 (`feat/next-major`) port can be shown to be 100% pixel-identical with the same features. Comparison uses Playwright (Chromium) and pixelmatch at threshold 0, with `includeAA`, so every differing pixel counts.

## Run it

```sh
bun install                         # or npm install
npx playwright install chromium     # once; playwright is pinned to 1.59.0 (Chromium 147)

npm run parity:build                # site codegen + vite build with the parity shim (see below)
npm run parity:record               # record fixtures + baseline into parity/baseline/
npm run parity:compare              # serve the local build in replay mode, diff against the baseline
npm run parity:compare -- --target http://localhost:3000 --label v8
```

`parity:record` and `parity:compare` build automatically when `dist/` is missing or wasn't produced by `parity:build`. Pass `--rebuild` to force a build.

Other flags:

- `--only a,b` filters cases by id substring. Works with compare and probe only.
- `--label` names the run directory.
- `--upstream-passthrough` sends server-side requests that have no recording to the live upstream instead of returning an HTTP 599.
- `--strict-upstream` fails the run when any server-side request has no recording.

`node parity/run.mjs probe --only <ids>` runs cases live into `parity/runs/probe/` without touching the baseline. Use it while writing new flows. `node parity/serve.mjs [--record]` keeps the parity server running so you can debug by hand.

Compare output goes to `parity/runs/<label>/`, which git ignores. It contains:

- `actual/`: the new captures.
- `diff/`: a red-pixel PNG per differing screenshot and a `.snapshot.diff` per differing JSON snapshot.
- `summary.json` and `summary.md`.

Compare exits non-zero on any pixel difference, any size difference, any snapshot difference, or any missing capture.

## What is captured (`parity/pages.json`)

- **pages × viewports.** Viewports are mobile 390×844 (iPhone UA, touch) and desktop 1440×900, both at DPR 1. Each page gets a full-page PNG and a snapshot JSON with:
  - HTTP status and response headers, minus volatile ones.
  - SEO `<head>` from the SSR HTML and from the hydrated DOM: title, meta, canonical/alternate/icon links, `lang`, `data-theme`.
  - JSON-LD from both sources.
  - The final URL.
  - The sorted set of third-party request URLs, which shows which analytics/CDN calls happen.
- **flows × viewports.** A small step language: `goto`, `click`, `fill`, `type`, `press`, `select`, `check`, `hover`, `waitFor`, `waitForURL`, `settle`, `capture`, `url`, `attr`, `text`, `count`. Steps can be limited with `viewports`. Each `capture` writes a PNG, and `url`/`attr`/`text` values go into the snapshot. Two examples:
  - The checkout handoff URL is snapshotted as the minicart's Begin Checkout `href`.
  - SPA navigations are covered too, so request scope on client-side navigation is exercised.
- **texts.** Raw responses such as `robots.txt` and `sitemap.xml`. Status, headers and body are stored, except that HTML bodies are omitted.

The app origin is replaced with `{origin}` in every snapshot, so a target on another host/port compares cleanly.

## How determinism is achieved

| Source of noise | Control |
|---|---|
| Server-side upstream data (Shopify Storefront GraphQL, etc.) | `parity/runtime/worker-shim.js` is prepended to `src/worker-entry.ts` by `parity/vite.config.ts`. When `PARITY_UPSTREAM` is set, it rewrites every non-local `fetch()` in the worker to the record/replay proxy (`parity/lib/upstream.mjs`). Recordings live in `parity/baseline/upstream.json` and are keyed by method + URL + body hash, per case, in order. That ordering lets stateful sequences replay exactly, e.g. cart create → add line → cart query. |
| Browser third-party requests (Shopify CDN images, decoims assets, fonts) | One HAR per case, `parity/baseline/har/<case>.har`, replayed with `routeFromHAR` (`notFound: fallback`). A catch-all route aborts any third-party request the HAR does not have and lists it under `harMisses` in the snapshot. Two Playwright 1.59 problems shape this: with `notFound: abort` an unmatched request hangs instead of failing, and `.har.zip` archives hang `routeFromHAR` on Node 26. That is why the HARs are plain JSON. Requests to the app origin are never served from the HAR. |
| Analytics beacons (`*.lilstts.com`) | Aborted on both sides (`thirdParty.block`). |
| Server clock / randomness | The shim freezes `Date` to `fixedTime` and seeds `Math.random` (`PARITY_NOW`, `PARITY_SEED`). |
| Browser clock / randomness | `context.clock.setFixedTime(fixedTime)`. A seeded `Math.random` is injected through `addInitScript`. |
| Carousel autoplay / countdown ticks | `setInterval` with a delay of 1s or more never fires (`parity/lib/determinism.js`). |
| Animations, transitions, caret | `parity/lib/determinism.js` puts `animation:none; transition:none` (`!important`) inside `@layer parity`, as the first node of `<head>`. It re-inserts that style after hydration removes it, because only an earlier cascade layer can override `!important` rules inside Tailwind v4 / DaisyUI 5 layers. Any animation that still starts is finished immediately, or cancelled if it is infinite or scroll-driven. Screenshots use `animations: "disabled"` and `caret: "hide"`, plus `reducedMotion: reduce`. Each capture repeats until two consecutive frames are byte-identical. |
| Lazy / deferred sections and lazy images | Before every full-page capture the harness scrolls the page in 80% steps until its height stops growing. It then waits for the network to go quiet, `document.fonts.ready`, every `<img>` to finish loading and `decode()`, and a stable layout height over consecutive frames. |
| Network idle | The harness uses its own quiet tracker: a request counts as done once its headers arrive. Playwright's `networkidle` never fires on this site, because the wishlist invoke returns 404 bodies that are never read (live bug, D13). |
| Edge cache / KV state | `.wrangler/state` is wiped on every server start. `DECO_FAST_DEPLOY=0` makes the content the bundled `.deco/blocks` at the recorded git sha, which is the pinned content revision. `DECO_OTEL=off` stops local runs from sending telemetry to production ingest. |
| Rendering | Chromium is pinned through `playwright@1.59.0` (headless shell). It runs software-only, with no GPU raster and no threaded animation or scrolling (`chromiumArgs` in `pages.json`). It also uses sRGB, `--font-render-hinting=none`, `--disable-lcd-text`, a fixed locale (en-US), timezone (UTC) and color scheme (light). Baselines are platform-specific: this one was recorded on macOS arm64 (see `baseline/meta.json`), so compare on the same OS/arch. |

`fixedTime` must be in the future relative to the wall clock. The worker dates the 7-day cart cookie from the frozen clock, but Chromium's cookie jar uses real time, so a past `fixedTime` silently drops the cart cookie and add to cart fails. The current value is `2030-01-01T12:00Z`, so re-record before 2030-01-08.

`record` makes two passes:

1. A live pass that writes the upstream recordings and the HARs.
2. A replay pass that writes the baseline PNGs and snapshots.

The baseline is therefore itself a replayed run, captured under exactly the conditions `compare` uses.

## Comparing the v8 port

The v8 site must:

1. Load `parity/runtime/worker-shim.js` first in its worker entry, for example through the same Vite plugin. Without it, the target fetches live data instead of the recorded fixtures.
2. Run with `PARITY_UPSTREAM=http://127.0.0.1:4280`, `PARITY_NOW` and `PARITY_SEED` from `pages.json`, `DECO_OTEL=off`, and the same content revision.

Then run `npm run parity:compare -- --target <url>`. While compare runs, it serves the replay proxy on port 4280.

Expected, approved differences go through D9/D13 and are not baked into the harness. For example, the `x-powered-by: deco@7.x` header will differ. Add such headers to `ignoreHeaders` only once they are approved.
