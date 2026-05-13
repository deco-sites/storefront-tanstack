---
name: deco-pdp-fast-navigation
description: Make PDP navigation feel instant in Deco TanStack Start storefronts. Combines TanStack Router intent prefetch with cache reuse, eager sections for atomic page swap, reserved-height LoadingFallback to eliminate CLS, and LRU caching for heavy loaders (360 thumbnails, Vimeo oEmbed). Use when product card click → PDP open feels slow, when there is visible flicker/skeleton flash on navigation, or when PDP loader has many parallel fetches and click feels several seconds slow.
---

# PDP Fast Navigation

Patterns for making product card → PDP navigation feel instant in Deco storefronts on TanStack Start. Discovered while optimizing `baggagio-tanstack` where each click had a multi-second delay caused by 7 parallel server fetches in the PDP loader and `<a href>` cards (no prefetch).

## When to Use This Skill

- Click on a product card → PDP open feels noticeably slow (>1s perceived)
- PDP shows a skeleton/empty shell that flashes before content arrives
- Footer "jumps" up to the header then down again when PDP content loads (CLS)
- Product cards use `<a href>` instead of TanStack's `<Link>`
- PDP loader has `Promise.all` with many parallel API calls
- HAR or Network tab shows repeated HEAD requests for thumbnail format detection
- `createDecoRouter` is used and there is no way to tune preload caching

---

## The Four Levers

These four optimizations compound — applying all of them is what makes PDP feel instant.

| Lever | What it solves | Effort |
|-------|----------------|--------|
| 1. `<Link preload="intent">` on cards | No prefetch at all | Drop-in replace `<a href>` |
| 2. `eager: true` on PDP sections | Avoids "empty shell flash" on navigation | Add export + regen sections |
| 3. `createTanStackRouter` direct + `defaultPreloadStaleTime` | Preload result is reused on click, not refetched | Replace `createDecoRouter` |
| 4. LRU cache on heavy loaders (360, Vimeo) | Repeated fetches across navigations | Module-scope `Map` |

If you only apply 1 and 2, navigation may still feel slow because the preload result is not reused on click. Levers 3 and 4 close that gap.

---

## Lever 1 — Replace `<a href>` with `<Link preload="intent">` in Product Cards

The default behavior of TanStack Router's `<Link preload="intent">` is to prefetch the target route on hover (desktop) and on touchstart (mobile) after a ~50ms debounce. This warms the route loader before the user even clicks.

### Before

```tsx
import { relative } from "@decocms/apps/commerce/sdk/url";

function ProductCard({ product }) {
  const relativeUrl = relative(product.url);
  return (
    <a href={relativeUrl} aria-label="view product" className="...">
      <Image src={...} />
    </a>
  );
}
```

### After

```tsx
import { Link } from "@tanstack/react-router";
import { relative } from "@decocms/apps/commerce/sdk/url";

function ProductCard({ product }) {
  const relativeUrl = relative(product.url);
  return (
    <Link to={relativeUrl} preload="intent" aria-label="view product" className="...">
      <Image src={...} />
    </Link>
  );
}
```

### Notes

- `<Link to={string}>` accepts a relative URL directly — TanStack handles the splat (`/$`) param parsing internally. No need to decompose into `{ to: "/$", params: { _splat } }`.
- `<Link>` renders an `<a href>` in the DOM, so SSR/SEO/no-JS still work.
- Apply to **every variant of the card**: main grid card, mini card in search dropdown, card on PDP shelves, etc. A single missed card means missed prefetch.

### How to Find All Cards

```bash
rg '<a href=\{relativeUrl\}|<a href=\{relative\(' src/components/product/ -l
```

---

## Lever 2 — Mark Critical PDP Sections as `eager`

By default, Deco sections that export `LoadingFallback` are treated as **deferred**: when the user navigates to the PDP, the framework renders the new URL immediately, shows the `LoadingFallback`, and replaces it with the real content when the loader resolves. This causes two visible "steps":

1. URL changes → user sees an empty shell (the `LoadingFallback`)
2. Loader resolves → content fills in, pushing the page layout around

Marking the section as `eager: true` changes the behavior to **atomic**:

1. URL changes → the **current page stays visible** until the new page's loader fully resolves
2. New page swaps in already-complete

This eliminates the "two-step" feel. Combined with `<Link preload="intent">` and `defaultPreloadStaleTime`, the swap can happen instantly because the data was already fetched on hover.

### How

Add this export at the bottom of each critical PDP section file:

```tsx
// src/sections/Product/ProductDetails.tsx (or ContainerPDP.tsx, etc.)

export function LoadingFallback() {
  // see Lever 5 below — reserve height even though eager hides it most of the time
  return <div className="min-h-[1100px] lg:min-h-[716px] w-full" />;
}

export const eager = true;
```

Then regenerate the sections registry:

```bash
bun run generate:sections
```

The output should confirm the `eager` flag:

```
"site/sections/Product/ProductDetails.tsx": { eager: true, hasLoadingFallback: true },
```

### When NOT to Mark as Eager

- **Below-the-fold sections** like related products, reviews, cross-sell shelves — these can stay deferred. Marking them eager makes the user wait for non-critical data before seeing the PDP.
- **Sections with truly optional data** — anything that the user does not see in the first viewport.

For the Baggaggio PDP, the eager set was: `ContainerPDP`, `ProductDetails` (mobile), `ShopTogether` (above the fold). All `ProductShelfPDP`, `Reviews`, etc. stayed deferred.

---

## Lever 3 — Replace `createDecoRouter` with `createTanStackRouter` Direct

This is the **highest-leverage change** for perceived speed.

### The Problem

`createDecoRouter` from `@decocms/start/sdk/router` only exposes a subset of TanStack Router options. Notably missing:

- `defaultPreloadStaleTime` — how long a prefetched route stays "fresh" (default ~30s in dev mode is too short and inconsistent)
- `defaultPreloadGcTime` — how long a prefetched route stays in memory
- `defaultPreloadDelay` — debounce before firing prefetch

Without `defaultPreloadStaleTime` set, the prefetch fired on hover may be considered stale by the time the user clicks, causing a **second fetch** on click. The hover prefetch becomes wasted work.

### The Fix

Replace `createDecoRouter` with `createTanStackRouter` directly, reusing the Deco search parsers (the only meaningful thing the wrapper added):

```tsx
// src/router.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import {
  decoParseSearch,
  decoStringifySearch,
} from "@decocms/start/sdk/router";
import { routeTree } from "./routeTree.gen";
import "./setup";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000 } },
});

export function getRouter() {
  return createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 60_000,
    defaultPreloadGcTime: 5 * 60_000,
    context: { queryClient } as any,
    Wrap: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    parseSearch: decoParseSearch,
    stringifySearch: decoStringifySearch,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
```

### What Changes

- **Hover** → prefetch fires after 50ms → result cached for 60s
- **Click within 60s** → router serves from cache → **navigation is instant**, no second fetch
- **Click after 60s** → router refetches (cache expired)

For e-commerce, 60s is a sweet spot: typical hover → click latency is <1s, but users may return to a category page and click a different product within a minute. The cache covers both flows.

### Risk

`createDecoRouter` is a thin wrapper. The only Deco-specific behavior was the search parser (URLSearchParams-style for VTEX filter URLs). Since we re-import `decoParseSearch` and `decoStringifySearch`, behavior is preserved. If future framework versions add more to `createDecoRouter`, we miss it — review when upgrading `@decocms/start`.

---

## Lever 4 — LRU Cache on Heavy Loaders

Even with prefetch and eager sections, the loader still has to complete at least once per worker lifetime per product. If the loader does multiple HTTP HEAD requests (thumbnail format detection) or external API calls (Vimeo oEmbed), these become the bottleneck.

### Pattern: Module-Scope LRU Cache

```ts
// src/loaders/checkAndReturnThumbnail360.ts
const CACHE_MAX = 500;
const formatCache = new Map<string, string | null>();

function cacheGet(key: string): string | null | undefined {
  const value = formatCache.get(key);
  if (value !== undefined) {
    // LRU: re-insert to move to most-recent end
    formatCache.delete(key);
    formatCache.set(key, value);
  }
  return value;
}

function cacheSet(key: string, value: string | null): void {
  if (formatCache.size >= CACHE_MAX) {
    const oldestKey = formatCache.keys().next().value;
    if (oldestKey !== undefined) formatCache.delete(oldestKey);
  }
  formatCache.set(key, value);
}

export default async function loader({ productID }: Props): Promise<string | null> {
  if (!productID) return null;

  const cached = cacheGet(productID);
  if (cached !== undefined) return cached;

  const validExtension = await findValidImageExtension(productID);
  cacheSet(productID, validExtension);
  return validExtension;
}
```

### Why Module-Scope and Not LRU Library

- Map's insertion order semantics give us free LRU with two extra lines
- No dependency added, no bundle size impact
- The cache lives for the worker lifetime — Cloudflare Workers recycle, but a single warm worker handles many requests

### What to Cache

| Loader | Cache key | Why cache |
|--------|-----------|-----------|
| `checkAndReturnThumbnail360` | productID | 6 HEAD requests to detect file extension — practically immutable per product |
| `vimeo` | contentUrl | Vimeo oEmbed metadata never changes for a published video |
| `accessories`/`attachments`/etc. | productID + variant | Only if profile shows them as hot |

### Also: Reduce Work, Not Just Cache It

The 360 thumbnail loader was checking 6 extensions (`.jpg`, `.webp`, `.png`, `.jpeg`, `.bmp`, `.tiff`). Production catalogs almost always use `.jpg` or `.webp`. Reducing the list to 2 cut first-load cost by 66% before the cache even kicks in:

```ts
const extensionImageList = [".jpg", ".webp"];
```

---

## Lever 5 — Reserved-Height LoadingFallback (Anti-CLS)

If you keep some sections deferred (Lever 2 only on a subset), the `LoadingFallback` must reserve approximate height — otherwise the footer flies up to the header, then content arrives and pushes everything down. This is a massive CLS hit.

### Bad

```tsx
export function LoadingFallback() {
  return null; // or <div className="h-0 w-0" />
}
```

### Good

```tsx
export function LoadingFallback() {
  // Reserve approximate PDP height for both mobile and desktop
  return <div className="min-h-[1100px] lg:min-h-[716px] w-full" />;
}
```

### How to Pick the Height

- Inspect the rendered PDP in DevTools, get the main container height
- Use `min-h-` not `h-` to allow for content larger than expected
- Use Tailwind responsive variants (`lg:min-h-[...]`) since mobile is usually taller (vertical stacked layout)
- For shelves, use the slider height (typically ~400-500px)

### When Combined with Eager

If a section is `eager: true`, the `LoadingFallback` is rarely shown (only during SSR streaming gaps). Reserving height is still good defense — it costs nothing and protects against edge cases like slow first-paint.

---

## End-to-End Verification

After applying all five levers, validate in DevTools:

1. **Prefetch fires on hover**
   - Open DevTools → Network tab → filter `_serverFn`
   - Hover a product card for ~100ms
   - You should see a request to the catch-all route fire within ~50ms

2. **Click within 60s uses cache**
   - After hovering, wait 1-2 seconds
   - Click the card
   - **No new request should fire** — the loader response is served from the router's preload cache
   - PDP appears already populated (eager + cache = atomic swap)

3. **No CLS on navigation**
   - Use Chrome's Performance tab → Web Vitals
   - Navigate to a PDP, observe CLS metric
   - Should be < 0.05 (Good range)
   - The footer should not visibly "jump"

4. **Cold worker first hit**
   - Open an incognito window (cold worker, empty cache)
   - Navigate to a PDP
   - Should still feel fast — the 360 loader does 2 HEADs instead of 6, Vimeo fetches once, etc.

5. **Second visit to same PDP**
   - Navigate to PDP A → back → PDP A again
   - Second navigation should be measurably faster than first (LRU caches hit)

---

## Trade-offs and Risks

| Choice | Trade-off |
|--------|-----------|
| `eager: true` on PDP | Page stays on current URL longer; relies on `NavigationProgress` for feedback. Acceptable if loader is <1s after prefetch hits cache. |
| `defaultPreloadStaleTime: 60_000` | Users on slow connections may see stale price/stock for up to 60s. Acceptable for retail; tune lower for flash sales. |
| LRU cache module-scope | Cache does not survive cold starts; warm workers serve from cache. Fine for Cloudflare Workers' typical lifetime. |
| Reducing thumbnail formats to 2 | Catalogs with legacy `.png`/`.tiff` 360 images break. Verify your catalog before applying. |
| Bypass `createDecoRouter` | Future Deco router improvements (e.g., custom middleware) require updating this site's `router.tsx` manually. Document with a comment. |

---

## Files Typically Modified

```
src/router.tsx                                   # Lever 3
src/sections/Product/ContainerPDP.tsx            # Lever 2 + 5
src/sections/Product/ProductDetails.tsx          # Lever 2 + 5
src/sections/Product/ShopTogether.tsx            # Lever 2
src/sections/Product/ProductShelfPDP.tsx         # Lever 5
src/components/product/card/ProductCard.tsx      # Lever 1
src/components/product/card/ProductCardImage.tsx # Lever 1
src/components/product/card/ProductCardActions.tsx # Lever 1
src/components/product/<other card variants>     # Lever 1
src/loaders/checkAndReturnThumbnail360.ts        # Lever 4
src/loaders/vimeo.ts                             # Lever 4
src/server/cms/sections.gen.ts                   # regenerated after Lever 2
```

---

## Next Steps If Still Slow

If after all five levers the PDP still feels slow, the bottleneck is now the loader itself. Profile the remaining parallel calls:

```ts
// Add timing logs to identify the slowest fetch
const start = Date.now();
const result = await someLoader();
console.log(`someLoader took ${Date.now() - start}ms`);
```

Common next-step optimizations:

- **Move non-critical loaders to separate deferred sections.** `accessories`, `attachments`, `productSuggestions`, `similars` can each become their own deferred section so they don't block the eager `ContainerPDP`.
- **Cache cross-sell results** (`vtexRelatedProducts`) the same way as Vimeo — by productID + crossSelling type.
- **Reduce simulate calls.** VTEX's simulate endpoint is slow; if you only need price/stock, fetch it less aggressively.

---

## Related Skills

| Skill | Purpose |
|-------|---------|
| `deco-variant-selection-perf` | Avoid double-fetch on variant clicks (related navigation pattern) |
| `deco-cms-layout-caching` | Cache Header/Footer to avoid layout re-resolution on every navigation |
| `deco-vtex-fetch-cache` | SWR-style in-flight dedup for VTEX API calls |
| `deco-loader-n-plus-1-detector` | Find loops doing N+1 API calls in section loaders |
| `deco-edge-caching` | Configure Cloudflare Worker cache for commerce pages |
| `deco-cms-route-config` | `cmsRouteConfig` + `ignoreSearchParams` for stable cache keys |
