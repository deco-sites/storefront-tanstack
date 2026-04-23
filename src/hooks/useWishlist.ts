/**
 * Wishlist Hook — wire to invoke.site.loaders/actions for your platform.
 *
 * For VTEX: use invoke.site.loaders.getWishlistItems and
 *           invoke.site.actions.addWishlistItem / removeWishlistItem.
 */
import { signal } from "~/sdk/signal";

const loading = signal(false);

export function useWishlist() {
  return {
    loading,
    async addItem(_productId: string, _productGroupId: string) {
      // TODO: Implement
    },
    async removeItem(_productId: string) {
      // TODO: Implement
    },
    getItem(_productId: string): boolean {
      return false;
    },
  };
}

export default useWishlist;
