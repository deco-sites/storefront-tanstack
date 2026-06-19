import { type QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addItemServerFn,
  getCartServerFn,
  removeItemServerFn,
  updateItemQuantityServerFn,
} from "./cart.actions";
import { type CartItem, EMPTY_CART, type CartState } from "./cart.types";

export const CART_QUERY_KEY = ["cart"] as const;

interface OptimisticContext {
  prev: CartState;
}

/**
 * Applies new line items to a cart, re-deriving only the fields we can compute
 * client-side: `subtotal` (Σ price × qty) and `totalQuantity`. `total` is left
 * untouched on purpose — it may include discounts/shipping/tax we don't know
 * here — and is reconciled from the server cart in `onSuccess`.
 */
function applyOptimisticItems(cart: CartState, items: CartItem[]): CartState {
  return {
    ...cart,
    items,
    totalQuantity: items.reduce((n, i) => n + i.quantity, 0),
    subtotal: {
      amount: items.reduce((sum, i) => sum + i.price.amount * i.quantity, 0),
      currencyCode: cart.subtotal.currencyCode,
    },
  };
}

/**
 * Shared optimistic-mutation plumbing: cancel in-flight cart fetches, snapshot
 * the current cart for rollback, and write the transformed items to the cache.
 */
async function optimisticCartUpdate(
  qc: QueryClient,
  transform: (items: CartItem[]) => CartItem[],
): Promise<OptimisticContext> {
  await qc.cancelQueries({ queryKey: CART_QUERY_KEY });
  const prev = qc.getQueryData<CartState>(CART_QUERY_KEY) ?? EMPTY_CART;
  qc.setQueryData(CART_QUERY_KEY, applyOptimisticItems(prev, transform(prev.items)));
  return { prev };
}

function rollbackCart(qc: QueryClient, ctx: OptimisticContext | undefined) {
  if (ctx?.prev) qc.setQueryData(CART_QUERY_KEY, ctx.prev);
}

export function useCart() {
  const query = useQuery({
    queryKey: CART_QUERY_KEY,
    queryFn: () => getCartServerFn(),
    staleTime: 60_000,
    placeholderData: EMPTY_CART,
  });
  return {
    cart: query.data ?? EMPTY_CART,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    // Serialize all cart mutations (same scope id) so rapid actions run in
    // order — the server sets absolute quantities, so out-of-order responses
    // would otherwise clobber the cache. mutationKey lets useMutationState
    // surface a global "cart busy" indicator.
    scope: { id: "cart" },
    mutationKey: ["cart", "add"],
    mutationFn: (input: { merchandiseId: string; quantity?: number }) =>
      addItemServerFn({ data: input }),
    // NOTE(DECO-5278): optimistic add is deferred — building an optimistic
    // line needs a product snapshot (title/image/price). It should come from a
    // neutral `productToCartItem` mapping over commerce types, tracked as a
    // remaining sub-item. Add already shows button feedback while in flight.
    onSuccess: (cart: CartState) => {
      qc.setQueryData(CART_QUERY_KEY, cart);
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    scope: { id: "cart" },
    mutationKey: ["cart", "update"],
    mutationFn: (input: { lineId: string; quantity: number }) =>
      updateItemQuantityServerFn({ data: input }),
    onMutate: ({ lineId, quantity }) =>
      optimisticCartUpdate(qc, (items) =>
        items.map((i) => (i.lineId === lineId ? { ...i, quantity: Math.max(1, quantity) } : i)),
      ),
    onError: (_err, _input, ctx) => rollbackCart(qc, ctx),
    onSuccess: (cart: CartState) => {
      qc.setQueryData(CART_QUERY_KEY, cart);
    },
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    scope: { id: "cart" },
    mutationKey: ["cart", "remove"],
    mutationFn: (input: { lineId: string }) => removeItemServerFn({ data: input }),
    onMutate: ({ lineId }) =>
      optimisticCartUpdate(qc, (items) => items.filter((i) => i.lineId !== lineId)),
    onError: (_err, _input, ctx) => rollbackCart(qc, ctx),
    onSuccess: (cart: CartState) => {
      qc.setQueryData(CART_QUERY_KEY, cart);
    },
  });
}
