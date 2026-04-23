import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoke } from "../../runtime";
import { EMPTY_WISHLIST, type WishlistState } from "./wishlist.types";

const WISHLIST_QUERY_KEY = ["wishlist"] as const;

export function useWishlist() {
  const query = useQuery({
    queryKey: WISHLIST_QUERY_KEY,
    queryFn: (): Promise<WishlistState> =>
      invoke.site.loaders.wishlist() as Promise<WishlistState>,
    staleTime: 60_000,
    placeholderData: EMPTY_WISHLIST,
  });
  const wishlist = query.data ?? EMPTY_WISHLIST;
  return {
    wishlist,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    isInWishlist: (productID: string) =>
      wishlist.productIDs.includes(productID),
  };
}

interface ToggleWishlistInput {
  productID: string;
  productGroupID: string;
}

export function useToggleWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ToggleWishlistInput): Promise<WishlistState> =>
      invoke.site.actions.wishlist.submit(input) as Promise<WishlistState>,
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: WISHLIST_QUERY_KEY });
      const prev = qc.getQueryData<WishlistState>(WISHLIST_QUERY_KEY) ??
        EMPTY_WISHLIST;
      const next: WishlistState = prev.productIDs.includes(input.productID)
        ? {
          productIDs: prev.productIDs.filter((id) => id !== input.productID),
        }
        : { productIDs: [...prev.productIDs, input.productID] };
      qc.setQueryData(WISHLIST_QUERY_KEY, next);
      return { prev };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.prev) qc.setQueryData(WISHLIST_QUERY_KEY, ctx.prev);
    },
    onSuccess: (server) => qc.setQueryData(WISHLIST_QUERY_KEY, server),
  });
}
