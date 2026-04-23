import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addItemServerFn,
  getCartServerFn,
  removeItemServerFn,
  updateItemQuantityServerFn,
} from "./cart.actions";
import { EMPTY_CART, type CartState } from "./cart.types";

export const CART_QUERY_KEY = ["cart"] as const;

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
    mutationFn: (input: { merchandiseId: string; quantity?: number }) =>
      addItemServerFn({ data: input }),
    onSuccess: (cart: CartState) => {
      qc.setQueryData(CART_QUERY_KEY, cart);
    },
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { lineId: string; quantity: number }) =>
      updateItemQuantityServerFn({ data: input }),
    onSuccess: (cart: CartState) => {
      qc.setQueryData(CART_QUERY_KEY, cart);
    },
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { lineId: string }) => removeItemServerFn({ data: input }),
    onSuccess: (cart: CartState) => {
      qc.setQueryData(CART_QUERY_KEY, cart);
    },
  });
}
