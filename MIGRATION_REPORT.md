# Migration Report

**Site:** storefront-tanstack
**Platform:** vtex
**GTM ID:** none
**Date:** 2026-04-22
**Mode:** EXECUTED

## Summary

| Metric | Count |
|--------|-------|
| Files analyzed | 112 |
| Files scaffolded | 43 |
| Files transformed | 75 |
| Files deleted | 30 |
| Files moved | 12 |
| Manual review items | 21 |

## Scaffolded Files (new)

- `package.json`
- `tsconfig.json`
- `vite.config.ts`
- `wrangler.jsonc`
- `knip.config.ts`
- `.gitignore`
- `.prettierrc`
- `src/server.ts`
- `src/worker-entry.ts`
- `src/router.tsx`
- `src/runtime.ts`
- `src/context.ts`
- `src/routes/__root.tsx`
- `src/routes/index.tsx`
- `src/routes/$.tsx`
- `src/routes/deco/meta.ts`
- `src/routes/deco/invoke.$.ts`
- `src/routes/deco/render.ts`
- `src/setup.ts`
- `src/cache-config.ts`
- `src/setup/commerce-loaders.ts`
- `src/setup/section-loaders.ts`
- `src/styles/app.css`
- `src/types/widgets.ts`
- `src/types/deco.ts`
- `src/types/commerce-app.ts`
- `src/types/website.ts`
- `src/types/vtex-app.ts`
- `src/types/vtex-loaders.ts`
- `src/types/vtex-actions.ts`
- `src/components/ui/Image.tsx`
- `src/components/ui/Picture.tsx`
- `src/components/ui/Video.tsx`
- `src/hooks/useCart.ts`
- `src/hooks/useUser.ts`
- `src/hooks/useWishlist.ts`
- `src/sdk/signal.ts`
- `src/sdk/clx.ts`
- `src/sdk/debounce.ts`
- `src/sdk/deviceServer.ts`
- `src/sdk/logger.ts`
- `src/apps/site.ts`
- `src/components/ui/Theme.tsx`

## Transformed Files

- `src/Dockerfile`
- `src/_deno.serve.ts`
- `src/actions/minicart/submit.ts`
- `src/actions/wishlist/submit.ts`
- `src/components/header/Alert.tsx`
- `src/components/header/Bag.tsx`
- `src/components/header/Menu.tsx`
- `src/components/header/NavItem.tsx`
- `src/components/header/SignIn.tsx`
- `src/components/minicart/Coupon.tsx`
- `src/components/minicart/FreeShippingProgressBar.tsx`
- `src/components/minicart/Item.tsx`
- `src/components/minicart/Minicart.tsx`
- `src/components/product/AddToCartButton.tsx`
- `src/components/product/Gallery.tsx`
- `src/components/product/OutOfStock.tsx`
- `src/components/product/ProductCard.tsx`
- `src/components/product/ProductImageZoom.tsx`
- `src/components/product/ProductInfo.tsx`
- `src/components/product/ProductSlider.tsx`
- `src/components/product/ProductVariantSelector.tsx`
- `src/components/search/Filters.tsx`
- `src/components/search/SearchResult.tsx`
- `src/components/search/Searchbar/Form.tsx`
- `src/components/search/Searchbar/Suggestions.tsx`
- `src/components/search/Sort.tsx`
- `src/components/shipping/Form.tsx`
- `src/components/shipping/Results.tsx`
- `src/components/ui/Avatar.tsx`
- `src/components/ui/Breadcrumb.tsx`
- `src/components/ui/CategoryBanner.tsx`
- `src/components/ui/Drawer.tsx`
- `src/components/ui/Icon.tsx`
- `src/components/ui/Modal.tsx`
- `src/components/ui/QuantitySelector.tsx`
- `src/components/ui/Section.tsx`
- `src/components/ui/Slider.tsx`
- `src/components/user/Provider.tsx`
- `src/components/wishlist/Provider.tsx`
- `src/components/wishlist/WishlistButton.tsx`
- `src/components/wishlist/WishlistGallery.tsx`
- `src/deploy/argocd-application.yaml`
- `src/deploy/values-custom.yaml`
- `src/loaders/minicart.ts`
- `src/loaders/user.ts`
- `src/loaders/wishlist.ts`
- `src/sdk/url.ts`
- `src/sdk/useSendEvent.ts`
- `src/sections/Animation/Animation.tsx`
- `src/sections/Category/CategoryBanner.tsx`
- `src/sections/Category/CategoryGrid.tsx`
- `src/sections/Component.tsx`
- `src/sections/Content/Faq.tsx`
- `src/sections/Content/Hero.tsx`
- `src/sections/Content/Intro.tsx`
- `src/sections/Content/Logos.tsx`
- `src/sections/Footer/Footer.tsx`
- `src/sections/Header/Header.tsx`
- `src/sections/Images/Banner.tsx`
- `src/sections/Images/Carousel.tsx`
- `src/sections/Images/ImageGallery.tsx`
- `src/sections/Images/ShoppableBanner.tsx`
- `src/sections/Links/LinkTree.tsx`
- `src/sections/Miscellaneous/CampaignTimer.tsx`
- `src/sections/Miscellaneous/CookieConsent.tsx`
- `src/sections/Newsletter/Newsletter.tsx`
- `src/sections/Product/ProductDetails.tsx`
- `src/sections/Product/ProductShelf.tsx`
- `src/sections/Product/ProductShelfTabbed.tsx`
- `src/sections/Product/SearchResult.tsx`
- `src/sections/Product/ShelfWithImage.tsx`
- `src/sections/Product/Wishlist.tsx`
- `src/sections/Social/InstagramPosts.tsx`
- `src/sections/Social/WhatsApp.tsx`
- `src/sections/Theme/Theme.tsx`

## Deleted Files

- `main.ts`
- `dev.ts`
- `deno.json`
- `tailwind.css`
- `tailwind.config.ts`
- `runtime.ts`
- `constants.ts`
- `fresh.gen.ts`
- `manifest.gen.ts`
- `fresh.config.ts`
- `browserslist`
- `bw_stats.json`
- `sdk/clx.ts`
- `sdk/useId.ts`
- `sdk/useOffer.ts`
- `sdk/useVariantPossiblities.ts`
- `sdk/usePlatform.tsx`
- `components/Session.tsx`
- `sections/Session.tsx`
- `loaders/availableIcons.ts`
- `loaders/icons.ts`
- `routes/`
- `apps/deco/`
- `sdk/cart/`
- `sections/`
- `components/`
- `sdk/`
- `loaders/`
- `actions/`
- `apps/`

## Moved Files

- `static/.well-known/assetlinks.json` → `public/.well-known/assetlinks.json`
- `static/browserconfig.xml` → `public/browserconfig.xml`
- `static/favicon-16x16.png` → `public/favicon-16x16.png`
- `static/favicon-32x32.png` → `public/favicon-32x32.png`
- `static/favicon.ico` → `public/favicon.ico`
- `static/image/app-android.png` → `public/image/app-android.png`
- `static/image/app-apple.png` → `public/image/app-apple.png`
- `static/image/placeholder-instagram.jpg` → `public/image/placeholder-instagram.jpg`
- `static/robots.txt` → `public/robots.txt`
- `static/site.webmanifest` → `public/site.webmanifest`
- `static/sprites.svg` → `public/sprites.svg`
- `static/sw.js` → `public/sw.js`

## Manual Review Required

🟡 **`src/components/minicart/Coupon.tsx`**: HTMX attributes (hx-*) found — needs manual migration to React state/effects. HTMX server-side rendering (hx-get/hx-post with useSection) must be converted to React components with useState/useEffect or server functions.
🟡 **`src/components/minicart/Coupon.tsx`**: hx-on:click with useScript found — convert to onClick with React event handler. The useScript serialization won't work as onClick value.
🟡 **`src/components/minicart/Item.tsx`**: HTMX attributes (hx-*) found — needs manual migration to React state/effects. HTMX server-side rendering (hx-get/hx-post with useSection) must be converted to React components with useState/useEffect or server functions.
🟡 **`src/components/minicart/Item.tsx`**: hx-on:click with useScript found — convert to onClick with React event handler. The useScript serialization won't work as onClick value.
🟡 **`src/components/minicart/Minicart.tsx`**: HTMX attributes (hx-*) found — needs manual migration to React state/effects. HTMX server-side rendering (hx-get/hx-post with useSection) must be converted to React components with useState/useEffect or server functions.
🟡 **`src/components/minicart/Minicart.tsx`**: hx-on:click with useScript found — convert to onClick with React event handler. The useScript serialization won't work as onClick value.
🟡 **`src/components/product/AddToCartButton.tsx`**: HTMX attributes (hx-*) found — needs manual migration to React state/effects. HTMX server-side rendering (hx-get/hx-post with useSection) must be converted to React components with useState/useEffect or server functions.
🟡 **`src/components/product/AddToCartButton.tsx`**: hx-on:click with useScript found — convert to onClick with React event handler. The useScript serialization won't work as onClick value.
🟡 **`src/components/product/OutOfStock.tsx`**: HTMX attributes (hx-*) found — needs manual migration to React state/effects. HTMX server-side rendering (hx-get/hx-post with useSection) must be converted to React components with useState/useEffect or server functions.
🟡 **`src/components/product/ProductVariantSelector.tsx`**: HTMX attributes (hx-*) found — needs manual migration to React state/effects. HTMX server-side rendering (hx-get/hx-post with useSection) must be converted to React components with useState/useEffect or server functions.
🟡 **`src/components/search/SearchResult.tsx`**: HTMX attributes (hx-*) found — needs manual migration to React state/effects. HTMX server-side rendering (hx-get/hx-post with useSection) must be converted to React components with useState/useEffect or server functions.
🟡 **`src/components/search/Searchbar/Form.tsx`**: HTMX attributes (hx-*) found — needs manual migration to React state/effects. HTMX server-side rendering (hx-get/hx-post with useSection) must be converted to React components with useState/useEffect or server functions.
🟡 **`src/components/search/Sort.tsx`**: HTMX attributes (hx-*) found — needs manual migration to React state/effects. HTMX server-side rendering (hx-get/hx-post with useSection) must be converted to React components with useState/useEffect or server functions.
🟡 **`src/components/shipping/Form.tsx`**: HTMX attributes (hx-*) found — needs manual migration to React state/effects. HTMX server-side rendering (hx-get/hx-post with useSection) must be converted to React components with useState/useEffect or server functions.
🟡 **`src/components/ui/QuantitySelector.tsx`**: HTMX attributes (hx-*) found — needs manual migration to React state/effects. HTMX server-side rendering (hx-get/hx-post with useSection) must be converted to React components with useState/useEffect or server functions.
🟡 **`src/components/ui/QuantitySelector.tsx`**: hx-on:click with useScript found — convert to onClick with React event handler. The useScript serialization won't work as onClick value.
🟡 **`src/components/wishlist/Provider.tsx`**: HTMX attributes (hx-*) found — needs manual migration to React state/effects. HTMX server-side rendering (hx-get/hx-post with useSection) must be converted to React components with useState/useEffect or server functions.
🟡 **`src/components/wishlist/WishlistButton.tsx`**: HTMX attributes (hx-*) found — needs manual migration to React state/effects. HTMX server-side rendering (hx-get/hx-post with useSection) must be converted to React components with useState/useEffect or server functions.
🟡 **`src/components/wishlist/WishlistButton.tsx`**: hx-on:click with useScript found — convert to onClick with React event handler. The useScript serialization won't work as onClick value.
🟡 **`src/sections/Component.tsx`**: [deno-isms] MANUAL: Deno.* API usage found — needs Node.js equivalent
🟡 **`src/sections/Newsletter/Newsletter.tsx`**: HTMX attributes (hx-*) found — needs manual migration to React state/effects. HTMX server-side rendering (hx-get/hx-post with useSection) must be converted to React components with useState/useEffect or server functions.

## Section Analysis

- **27** sections analyzed
- **3** have loaders (extracted to `setup/section-loaders.ts`)
- **3** are layout sections (eager + sync + layout)
- **2** are listing sections (cache = "listing")

## Loader Inventory

- **3** loaders inventoried
- **0** mapped to `@decocms/apps` equivalents
- **3** custom (included in `setup/commerce-loaders.ts`)

## Always Check (site-specific)

- [ ] `src/setup/commerce-loaders.ts` — verify each loader mapping is correct
- [ ] `src/setup/section-loaders.ts` — verify extracted loaders work correctly
- [ ] `src/hooks/useCart.ts` — wire to actual server functions for your platform
- [ ] `src/worker-entry.ts` — verify CSP, proxy, and segment builder
- [ ] DaisyUI v4 to v5 class name changes
- [ ] Tailwind v3 to v4: verify all utility classes still work
- [ ] Check `src/styles/app.css` theme colors match the original design
- [ ] Run `npm run generate:blocks` and `npm run generate:schema` after migration

## Known Issues (Tailwind v3 → v4 + React)

### Negative z-index on background images

The migration script automatically converts `-z-{n}` to `z-0` on `<img>` and `<Image>` elements.
However, if you have **non-image elements** with negative z-index (e.g. `-z-10` on a `<div>` used as a background layer), they may become invisible.

**Why it breaks:** In TanStack Start/React, section wrappers (`<section>`) or parent elements can create
CSS stacking contexts (via `animation`, `transform`, `will-change`, `filter`, `isolation`, etc.).
A child with negative z-index gets trapped inside that stacking context and renders behind the parent's background — making it invisible.

**How to fix:**
1. Replace `-z-{n}` with `z-0` on the background element
2. Content siblings render on top naturally via DOM order (they come after in the HTML)
3. If needed, add `relative z-10` to content siblings to ensure they stay above

**How to detect:** Search for remaining negative z-index: `grep -rn '\-z-' src/ --include='*.tsx'`

### Opacity utility classes

Tailwind v4 removed `bg-opacity-{n}`, `text-opacity-{n}`, etc. The script converts them to
the modifier syntax (e.g. `bg-black bg-opacity-20` → `bg-black/20`). If a color and its opacity
are not in the same className string (e.g. set via different conditional branches), the script
flags them for manual review.

**How to detect:** `grep -rn 'opacity-' src/ --include='*.tsx'`

## Framework Findings

> These are patterns found during migration that should eventually be handled by `@decocms/start` instead of being duplicated in every site.

- Session/analytics SDK is boilerplate duplicated across all sites — should be a single framework function
- GTM event system (useGTMEvent, data-gtm-* listeners) is universal pattern — should be in @decocms/start
- Route files (__root.tsx, index.tsx, $.tsx, deco/*) are near-identical across sites — should be generated by framework
- server.ts, worker-entry.ts, router.tsx are pure boilerplate — should be a single createSite() call
- setup.ts section registration via import.meta.glob is 100% boilerplate — framework should handle this
- runtime.ts invoke proxy is identical across sites — already in @decocms/start but sites still have local copies
- apps/site.ts is mostly empty after migration — platform config should be in a config file, not code

## Next Steps

```bash
# 1. Install dependencies
npm install

# 2. Generate CMS blocks and schema
npm run generate:blocks
npm run generate:schema

# 3. Generate routes
npx tsr generate

# 4. Type check
npx tsc --noEmit

# 5. Find unused code
npm run knip

# 6. Run dev server
npm run dev
```
