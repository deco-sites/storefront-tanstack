import { createRootRouteWithContext } from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { DecoRootLayout } from "@decocms/start/hooks";
import { CART_QUERY_KEY, getCartServerFn } from "../platform/cart";
// @ts-ignore Vite ?url import
import appCss from "../styles/app.css?url";

// Compat stub for header/minicart/wishlist components still reading
// `window.STOREFRONT.*` during hydration. The PDP's real cart (TanStack
// Query + platform/cart/) ignores this. Follow-up: migrate Bag/Minicart/
// useWishlist, then delete.
const STOREFRONT_STUB = `
(function(){
  if (window.STOREFRONT) return;
  var noop = function(){};
  var mkChan = function(emptyValue) {
    return {
      getCart: function(){ return emptyValue; },
      getUser: function(){ return emptyValue; },
      getWishlist: function(){ return emptyValue; },
      getQuantity: function(){ return 0; },
      inWishlist: function(){ return false; },
      addToCart: noop, setQuantity: noop, dispatch: noop, toggle: noop,
      subscribe: function(cb){ try { cb(this); } catch(e){} }
    };
  };
  window.STOREFRONT = { CART: mkChan(null), USER: mkChan(null), WISHLIST: mkChan(null) };
})();`;

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async ({ context }) => {
    if (context.queryClient.getQueryData(CART_QUERY_KEY)) return;
    try {
      const cart = await getCartServerFn();
      context.queryClient.setQueryData(CART_QUERY_KEY, cart);
    } catch {
      // No cart cookie yet (first-time visitor) — useCart() falls back to EMPTY_CART.
    }
  },
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Storefront-tanstack" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
    ],
    scripts: [
      { children: STOREFRONT_STUB },
    ],
  }),
  component: RootLayout,
});

function RootLayout() {
  return (
    <DecoRootLayout
      lang="pt-BR"
      siteName="storefront-tanstack"
    />
  );
}
