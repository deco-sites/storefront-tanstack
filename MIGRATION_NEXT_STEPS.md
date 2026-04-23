# Storefront migration — what's left

Reference patterns that landed in PR #1 + PR #2. Every item below should follow
one of these:

| Pattern | Canonical file | Use for |
|---|---|---|
| Grouped `*Config` Props with JSDoc | `src/sections/Product/ProductDetails.tsx` | Any section Props interface |
| Narrow-prop leaf components | `src/components/product/pdp/ProductTitle.tsx`, `ProductPrice.tsx` | Splitting god-components |
| TanStack Query hook + `createServerFn` | `src/platform/cart/` | Replacing `window.STOREFRONT.*` data channels |
| `<Link preload="intent">` | `src/components/product/pdp/ProductVariantSelector.tsx` | Replacing `<a href>` on internal nav |
| Peer-checked slide-over | `src/components/minicart/MinicartDrawer.tsx` | Drawers/sheets mounted at root |
| Scoped skeletons on changing parts only | `pdp/ProductTitle.tsx` (`isLoading?` + `skeleton`) | Loading UX for variant/route transitions |
| Section pattern guide | `src/components/product/pdp/README.md` | Starting any new section |

---

## Quick wins — no Phase 6 blocker

### 1. PLP → PDP uses `<Link preload="intent">`
PLP→PDP navigation is currently a plain anchor — we lose the intent-preload window.

- `src/components/product/ProductCard.tsx` — 4 `<a href>` at lines 133, 205, 225, 261 (image, title, variant swatches, OOS fallback)
- `src/sections/Category/CategoryGrid.tsx` — Card lines 21–22
- `src/sections/Links/LinkTree.tsx` — grid link line 21
- `src/components/ui/Breadcrumb.tsx` — audit all segments
- `src/components/search/Sort.tsx`, `src/components/search/Filters.tsx` — internal nav

Pattern: `import { Link } from "@tanstack/react-router"` + `preload="intent"`.

### 2. Group flat section Props into `*Config` sub-interfaces
Sections with flat Props clutter the admin form. Convert to the PDP grouping convention.

- `src/sections/Miscellaneous/CookieConsent.tsx` — lines 26–41: group `LayoutConfig`, `PolicyConfig`, `ActionsConfig`
- `src/sections/Newsletter/Newsletter.tsx` — lines 8–22: group empty/success/failed notices under `NoticeConfig`
- `src/sections/Miscellaneous/CampaignTimer.tsx` — audit + group
- `src/sections/Animation/Animation.tsx` — audit + group
- `src/sections/Content/Faq.tsx` — audit + group

Reference: `ProductDetails.tsx` Props ordering = integration first (`page`), then grouped `*Config`s (all optional), English JSDoc on every field.

### 3. Add scoped skeletons where route transitions actually change the UI
Pattern: only the parts that *change* during the transition get a skeleton; everything else stays stable. `useRouterState({ select: s => s.isLoading })` at the parent, pass `isLoading?: boolean` to leaves.

- PLP pagination on `src/components/search/SearchResult.tsx` — lines 61–67 use `useSection()` for partial re-fetch; replace with TanStack Query `keepPreviousData` + skeleton per product card
- Search suggestions dropdown
- Shipping simulator form while quote is loading

### 4. Delete dead files
Confirmed unreferenced after cart migration — safe to delete once Bag + Minicart are stable in prod.

- `src/components/product/AddToCartButton.tsx` (151 lines — Fresh `window.STOREFRONT.CART.addToCart`) once `ProductCard` moves to `useAddToCart()`

---

## Migrate off `window.STOREFRONT.*` (same pattern as cart)

The compat stub in `src/routes/__root.tsx` exists only for USER + WISHLIST now.
Migrate each channel using the **exact** shape of `src/platform/cart/`:

```
src/platform/<domain>/
├── <domain>.types.ts     # platform-agnostic state shape
├── <domain>.actions.ts   # createServerFn wrappers
├── <domain>.hooks.ts     # useQuery + useMutation
├── <domain>.shopify.ts   # adapter: Shopify response → state shape
└── index.ts              # barrel
```

### Wishlist
- `src/components/wishlist/Provider.tsx` — kill `window.STOREFRONT.WISHLIST.dispatch()` (line 20); replace with `useWishlist()` hook
- `src/components/wishlist/WishlistButton.tsx` — the `data-loading` Fresh hack becomes `useToggleWishlist()` mutation with optimistic update
- `src/actions/wishlist/submit.ts` — delete; logic moves into `platform/wishlist/wishlist.actions.ts`
- `src/loaders/wishlist.ts` — delete; loader becomes `getWishlistServerFn()`

### User
- `src/components/user/Provider.tsx` — replace `window.STOREFRONT.USER.dispatch()` (line 6) + `useScript` onLoad (line 21) with `useUser()` hook
- `src/components/header/SignIn.tsx` — read user from `useUser()` instead of global channel
- `src/loaders/user.ts` — delete; becomes `getUserServerFn()`

Once both channels are migrated, delete `STOREFRONT_STUB` from `src/routes/__root.tsx` entirely.

---

## Decompose god-components into narrow leaves

React Compiler auto-memoizes when inputs are narrow. Split these the same way the PDP split `ProductInfo` into `ProductTitle` / `ProductPrice` / `ProductDescription` / `ProductActions`.

### `src/components/search/SearchResult.tsx` — 320 lines
Mixes data fetch, grid, pagination, mobile filter drawer, analytics.

Split into:
- `SearchResultGrid` (takes `products: Product[]`, nothing else)
- `SearchPagination` (takes `{ currentPage, totalPages, prevUrl, nextUrl }` — use `<Link preload="intent">`, not `useSection`)
- `SearchFilterDrawer` (peer-checked pattern like `MinicartDrawer`)
- Keep the top-level section as composition-only

### `src/components/product/ProductCard.tsx` — 279 lines
Mixes card, analytics, variant routing, ATC, OOS.

Split into:
- `ProductCard` (thumbnail + title + price; accepts narrow props)
- `ProductCardVariants` (swatches only — takes `variants: SiblingVariant[]`)
- `ProductCardActions` (uses `useAddToCart()` mutation — replaces `AddToCartButton.tsx`)

---

## Replace HTMX-era form hydration

Fresh-era forms use `hx-post` + `hx-target` or `useSection` for partial re-fetch. Replace with `createServerFn` + React state or `useMutation`.

- `src/sections/Newsletter/Newsletter.tsx` — form action → `createServerFn({ method: "POST" })`; remove `usePlatform()` branch
- `src/components/shipping/Form.tsx` — HTMX form → `useMutation`
- `src/components/search/Searchbar/Form.tsx` — audit `useScript` usage; move to controlled input if it's just suggestion-debounce

---

## Blocked by Phase 6 (real platform wiring)

The `usePlatform()` stub in `src/apps/site.ts` hardcodes `"shopify"`. Dependent files:

- `src/sections/Newsletter/Newsletter.tsx` — line 26 branches on platform for newsletter signup
- `src/components/search/Searchbar/Suggestions.tsx`
- `src/components/product/OutOfStock.tsx`
- `src/components/shipping/Results.tsx`

Resolution: the `platform/cart/` pattern demonstrates the right model — each platform ships its own adapter file (`cart.shopify.ts`). Extend that to the other domains. After Phase 6 is merged, delete `src/apps/site.ts`.

---

## Drawer/Modal consolidation (optional)

`src/components/ui/Drawer.tsx` (88 lines) and `src/components/ui/Modal.tsx` wrap DaisyUI. `MinicartDrawer.tsx` (27 lines) shows the inline peer-checked pattern works fine without a wrapper.

- Audit whether `Drawer.tsx` / `Modal.tsx` earn their complexity. If the only callers are `Header.tsx` + `SearchResult.tsx` + `ProductImageZoom.tsx`, inline the peer-checked pattern in each and delete the wrappers.
- Worth doing only if the footprint stays that small.

---

## Execution order suggestion

1. **This week** — quick wins: PLP Link, Newsletter/CookieConsent Props grouping, delete `AddToCartButton.tsx` after migrating ProductCard.
2. **Next** — wishlist platform (template for phase 6), then user platform.
3. **After Phase 6 merges** — kill `usePlatform()` stub, finish SearchResult + ProductCard decomposition.
4. **Polish pass** — drawer consolidation, skeleton coverage, orphan cleanup.
