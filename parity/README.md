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
  - `analytics`: every call the page makes to the analytics SDK (`window.stonks.view` pageviews, on load and on SPA navigation, and `stonks.event` for each forwarded `DECO.events` event such as `view_item_list`, `view_item`, `add_to_cart`, with its params). See the determinism table.
- **flows × viewports.** A small step language: `goto`, `click`, `fill`, `type`, `press`, `select`, `check`, `hover`, `waitFor`, `waitForURL`, `settle`, `capture`, `url`, `attr`, `text`, `count`. Steps can be limited with `viewports`. Each `capture` writes a PNG, and `url`/`attr`/`text` values go into the snapshot. Two examples:
  - The checkout handoff URL is snapshotted as the minicart's Begin Checkout `href`.
  - SPA navigations are covered too, so data loading on client-side navigation is exercised.
- **texts.** Raw responses such as `robots.txt` and `sitemap.xml`. Status, headers and body are stored, except that HTML bodies are omitted.

The app origin is replaced with `{origin}` in every snapshot, so a target on another host/port compares cleanly.

## How determinism is achieved

| Source of noise | Control |
|---|---|
| Server-side upstream data (Shopify Storefront GraphQL, etc.) | `parity/runtime/worker-shim.js` is prepended to `src/worker-entry.ts` by `parity/vite.config.ts`. When `PARITY_UPSTREAM` is set, it rewrites every non-local `fetch()` in the worker to the record/replay proxy (`parity/lib/upstream.mjs`). Recordings live in `parity/baseline/upstream.json` and are keyed by method + URL + body hash, per case, in order. That ordering lets stateful sequences replay exactly, e.g. cart create → add line → cart query. |
| Browser third-party requests (Shopify CDN images, decoims assets, fonts) | One HAR per case, `parity/baseline/har/<case>.har`, replayed with `routeFromHAR` (`notFound: fallback`). A catch-all route aborts any third-party request the HAR does not have and lists it under `harMisses` in the snapshot. Two Playwright 1.59 problems shape this: with `notFound: abort` an unmatched request hangs instead of failing, and `.har.zip` archives hang `routeFromHAR` on Node 26. That is why the HARs are plain JSON. Requests to the app origin are never served from the HAR. |
| Analytics (`*.lilstts.com`) | The SDK script (`analyticsStub.script`) is fulfilled with a recorder that exposes the same `window.stonks.{view,event}` API and appends each call to the snapshot's `analytics` array. Collector beacons are aborted on both sides (`thirdParty.block`), so nothing is sent. |
| Server clock / randomness | The shim freezes `Date` to `fixedTime` and seeds `Math.random` (`PARITY_NOW`, `PARITY_SEED`). |
| Browser clock / randomness | `context.clock.setFixedTime(fixedTime)`. A seeded `Math.random` is injected through `addInitScript`. |
| Carousel autoplay / countdown ticks | `setInterval` with a delay of 1s or more never fires (`parity/lib/determinism.js`). |
| Animations, transitions, caret | `parity/lib/determinism.js` puts `animation:none; transition:none` (`!important`) inside `@layer parity`, as the first node of `<head>`. It re-inserts that style after hydration removes it, because only an earlier cascade layer can override `!important` rules inside Tailwind v4 / DaisyUI 5 layers. Any animation that still starts is finished immediately, or cancelled if it is infinite or scroll-driven. Screenshots use `animations: "disabled"` and `caret: "hide"`, plus `reducedMotion: reduce`. Each capture repeats until two consecutive frames are byte-identical. |
| Lazy / deferred sections and lazy images | Before every full-page capture the harness scrolls the page in 80% steps until its height stops growing. It then waits for the network to go quiet, `document.fonts.ready`, every `<img>` to finish loading and `decode()`, and a stable layout height over consecutive frames. |
| Network idle | The harness uses its own quiet tracker: a request counts as done once its headers arrive. Playwright's `networkidle` never fires on this site, because the wishlist invoke returns 404 bodies that are never read (live bug, D13). |
| Edge cache / KV state | `.wrangler/state` is wiped on every server start. `DECO_FAST_DEPLOY=0` makes the content the bundled `.deco/blocks` at the recorded git sha, which is the pinned content revision. `DECO_OTEL=off` stops local runs from sending telemetry to production ingest. |
| Workers `request.cf` (region, city, colo) | The local Workers runtime fills `request.cf` from `node_modules/.mf/cf.json`, fetched for the machine's current network location (and refetched after 30 days). The region feeds the cache segment (`x-cache-segment: …\|r=SP`). `parity/lib/server.mjs` pins it instead: on every start it copies `parity/runtime/cf.json` (São Paulo, the location the baseline was recorded with) to `.wrangler/parity-cf.json` and points `CLOUDFLARE_CF_FETCH_PATH` at it. The fresh copy matters because the runtime also refetches a pinned file older than 30 days. |
| Rendering | Chromium is pinned through `playwright@1.59.0` (headless shell). It runs software-only, with no GPU raster and no threaded animation or scrolling (`chromiumArgs` in `pages.json`). It also uses sRGB, `--font-render-hinting=none`, `--disable-lcd-text`, a fixed locale (en-US), timezone (UTC) and color scheme (light). Baselines are platform-specific: `baseline/meta.json` records the OS/arch they were recorded on (the current baseline: linux-x64), so compare on the same OS/arch. |

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

Expected, approved differences go through D9/D13. Once approved, they are encoded in `pages.json`, never by editing the baseline:

- `ignoreHeaders` drops a header from both snapshots. `x-powered-by` is approved (it carried the framework version).
- `approvedDifferences` holds one rule per case list and snapshot field. Each rule names the `cases`, the field `path` (dotted; `[*]` pairs up array elements, e.g. `analytics.events[*].props.items`), and exactly what the new value must be: `actual` (an exact value, `"$absent"` for a dropped field), `actualSameAs` (equal to another field of the same capture), `addsOnly` (an array that is the baseline plus exactly these entries) or `mask` (a string equal to the baseline once the regex matches are blanked). `baseline` optionally pins the old value as well, and `approval` cites the sign-off. Where the capture matches, compare resets that field to the baseline value; any other change to the field still fails. The summary lists the rules applied per case.

Both are applied to the baseline and the new capture at compare time, so approving a difference needs no re-record.

## Tailwind and the harness

Tailwind v4 detects class names in every non-ignored file of the repo, so text in `parity/` (selectors, step names) would otherwise add CSS to the site build and change pixels. `src/styles/app.css` therefore has `@source not "../../parity";`. The migrated site needs the same exclusion. `x-cache-version` (the git sha of the build) is snapshotted as `<build-id>`: its presence is checked, its value is not.

Analytics snapshot shape: `{ views, events }`. `views` lists pageviews in order. `events` is the sorted, de-duplicated set of `{name, path, props}`: view-triggered events (e.g. `view_item_list`) fire from IntersectionObservers, so their count and order vary with scroll timing, while which events fire with which payloads is stable.
