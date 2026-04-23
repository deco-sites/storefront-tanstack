// Global ambient types for the storefront runtime.
//
// The old Deco Fresh storefront injected `window.STOREFRONT` and `window.DECO`
// at boot for cart/user/analytics access. The TanStack port will replace this
// with TanStack Store-backed hooks in Phase 6; the shapes below keep existing
// HTMX-era inline scripts type-safe until they are ported.

interface StorefrontCartSdk {
  getCart: () => { items: unknown[]; coupon?: string | null } | null;
  getQuantity: (id: string) => number;
  addToCart: (item: unknown, platformProps: unknown) => void;
  setQuantity: (id: string, qty: number) => void;
  dispatch: (form: HTMLFormElement) => void;
}

interface StorefrontUserSdk {
  getUser: () => { email?: string; name?: string } | null;
  dispatch: (user: unknown) => void;
}

interface StorefrontWishlistSdk {
  toggle: (productID: string, productGroupID: string) => void;
  getWishlist: () => { productIDs?: string[] } | null;
  inWishlist: (productID: string) => boolean;
  dispatch: (wishlist: unknown) => void;
}

declare global {
  interface Window {
    STOREFRONT: {
      CART: StorefrontCartSdk & {
        subscribe: (cb: (sdk: StorefrontCartSdk) => void) => void;
      };
      USER: StorefrontUserSdk & {
        subscribe: (cb: (sdk: StorefrontUserSdk) => void) => void;
      };
      WISHLIST: StorefrontWishlistSdk & {
        subscribe: (cb: (sdk: StorefrontWishlistSdk) => void) => void;
      };
    };
    DECO: {
      events: {
        subscribe: (cb: (ev: unknown) => void) => void;
        dispatch: (ev: unknown) => void;
      };
    };
  }
}

export {};
