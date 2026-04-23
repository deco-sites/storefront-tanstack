# Product Details Page (PDP) — component pattern reference

This folder is the reference implementation for TanStack-native storefront sections.
Copy this pattern when you build or refactor other high-value sections (PLP, cart, account).

## Three goals

1. **Feel instant.** Hover a variant → it pre-fetches. Click → only what changed re-renders.
2. **Stay editable.** Every knob that a merchant might touch lives on the section `Props` with a typed default and an English label.
3. **Stay composable.** Each file is a small, focused piece that takes the narrowest prop surface it can.

## Files

```
pdp/
├── ProductHero.tsx            ← Grid + composition point (gallery | info column)
├── ProductGallery.tsx         ← Image slider + zoom + subtle route-load pulse
├── ProductTitle.tsx           ← <h1>
├── ProductPrice.tsx           ← Price + list-price strikethrough
├── ProductDiscountBadge.tsx   ← "% off" pill (editable colors + label format)
├── ProductVariantSelector.tsx ← <Link preload="intent"> swatches (no HTMX)
├── ProductActions.tsx         ← AddToCart mutation + Wishlist + OOS fallback
├── ProductShipping.tsx        ← Shipping simulation wrapper
└── ProductDescription.tsx     ← <details>/<summary> long-form copy
```

The section file `src/sections/Product/ProductDetails.tsx` is the external entry point.
It declares the editable `Props` and delegates rendering to `ProductHero`.

## How the "instant variant swap" works

`@decocms/start`'s `createDecoRouter` ships with `defaultPreload: "intent"`. Every
`<Link>` in the app fires the route loader ~50 ms after the pointer lands on it.
The TanStack catch-all route already resolves a product URL server-side, so by the
time the user clicks a variant swatch the data is already in the router cache — the
swap is just React re-rendering with new data.

Each Shopify variant is its own URL (`/{slug}-{skuId}`). We do **not** introduce
`?variant=` search params — URL-based variants give deep linking, SEO and
back/forward navigation for free, and match how the catch-all already resolves pages.

```tsx
// ProductVariantSelector.tsx — the hot path
<Link to={href} preload="intent" activeOptions={{ exact: true }}>
  <Swatch value={value} checked={checked} />
</Link>
```

Partial re-render comes from narrow prop surfaces, not `React.memo`. React Compiler
is enabled, so a child that receives `name: string` only re-renders when `name`
actually changes. Keep children consuming the smallest slice of data they can —
pass `price`, not the whole `product`.

## The "subtle pulse" transition

On cold cache (first variant click, or slow network) the route load isn't instant.
`ProductGallery` reads `useRouterState({ select: s => s.isLoading })` and applies a
`data-loading="true"` attribute; CSS fades opacity to `0.6` over 150 ms. When
preload kept the cache warm, `isLoading` stays `false` and the pulse is invisible.

```tsx
const isLoading = useRouterState({ select: (s) => s.isLoading });
<div
  data-loading={isLoading ? "true" : undefined}
  className="transition-opacity duration-150 data-[loading=true]:opacity-60"
/>;
```

## Cart — TanStack Query, not TanStack Store

AddToCart uses `useMutation` wrapping a `createServerFn` that calls the Shopify
action. The server fn reads/writes the cart cookie via request/response headers,
so session state lives where Shopify expects it. The response is pushed into the
`["cart"]` query cache via `queryClient.setQueryData`, and `__root.tsx` primes the
same key during SSR so the mini-cart renders hydrated.

We do **not** use a module-level `@tanstack/store` for cart state: module scope
on a Worker is shared across requests, and cart is per-user. See
`src/platform/cart/` for the full implementation.

## Props convention — the editable surface is also the docs

Every section's `Props` interface is read by the admin to generate the editing UI.
Treat it as documentation:

- **Order matters.** The field you expect to edit most often goes first.
  `page` (integration) is always on top; then tweak-groups in rough order of
  editing frequency.
- **Group thematically.** Create nested `*Config` interfaces for each theme
  (`GalleryConfig`, `DiscountBadgeConfig`, `VariantSelectorConfig`, `CopyConfig`).
  Inside a group, the data field comes first (e.g. `images` before `aspectRatio`),
  then the presentation knobs.
- **Every field gets English JSDoc.**
  - `@title` — short, human label shown in the admin form.
  - `@description` — one sentence on what the knob does.
  - `@default` — the value used when unset. Match the code-level default exactly.
  - `@format color-input` for color pickers, `@format textarea` for long strings.
- **All config fields are optional.** Components merge with typed defaults. A site
  that drops in the section with zero configuration still renders correctly.

### Example

```ts
export interface DiscountBadgeConfig {
  /**
   * @title Show badge
   * @default true
   */
  show?: boolean;
  /**
   * @title Label format
   * @description Use {percent} as the placeholder (e.g. "{percent}% OFF")
   * @default "{percent} % off"
   */
  labelFormat?: string;
  /**
   * @title Text color
   * @format color-input
   * @default "#000000"
   */
  textColor?: string;
  /**
   * @title Background color
   * @format color-input
   * @default "#FFD70033"
   */
  backgroundColor?: string;
}
```

### Section-level Props

```ts
export interface Props {
  /**
   * @title Integration
   * @description Product details data returned by the commerce platform loader
   */
  page: ProductDetailsPage | null;

  /** @title Gallery */
  galleryConfig?: GalleryConfig;

  /** @title Discount badge */
  discountBadgeConfig?: DiscountBadgeConfig;

  /** @title Variant selector */
  variantSelectorConfig?: VariantSelectorConfig;

  /** @title Copy */
  copy?: CopyConfig;
}
```

Run `npm run generate:schema` after changing `Props` so the admin picks up the
new fields.

## Decomposition rules

- One file, one responsibility. `ProductTitle` renders an `<h1>` — nothing else.
- Take the narrowest prop surface you can. `ProductPrice` takes
  `{ price, listPrice, currencyCode }`, not `{ product }`.
- If rendering order matters for composition (badge above title, title above
  price), split into separate components instead of bundling. That's why
  `ProductDiscountBadge` is a sibling of `ProductPrice`, not a child.
- Side effects (analytics events, cart mutations) live one level up from the
  leaves. `ProductHero` owns `useSendEvent("view_item")`; `ProductActions` owns
  the AddToCart mutation.
- Named exports for tiny configuration types (`GalleryConfig`, `DiscountBadgeConfig`).
  The section file re-composes them in its own `Props`.

## Copy-paste checklist for a new section

1. Create `src/components/<area>/<section-slug>/` — one folder, one section.
2. Write focused leaf components with typed `Props` + optional `*Config` sub-interfaces.
3. Write a composition component (`<Area>Hero` here) that handles analytics and layout.
4. Write the section file in `src/sections/<Area>/` that declares the admin-facing
   `Props` with English JSDoc and delegates to the composition.
5. Export `LoadingFallback` from the section file when the section is async.
6. `npm run generate:schema && npm run typecheck && npm run build`.
7. Verify in the admin preview that the new `Props` groups render.
