import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoke } from "../../runtime";
import type { AddressInput } from "../../actions/address/submit";
import { type AddressBookState, EMPTY_ADDRESS_BOOK } from "./address.types";

export const ADDRESS_QUERY_KEY = ["addresses"] as const;

export function useAddresses() {
  const query = useQuery({
    queryKey: ADDRESS_QUERY_KEY,
    queryFn: (): Promise<AddressBookState> =>
      invoke.site.loaders.address() as Promise<AddressBookState>,
    staleTime: 60_000,
    placeholderData: EMPTY_ADDRESS_BOOK,
  });
  return {
    addresses: (query.data ?? EMPTY_ADDRESS_BOOK).addresses,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
  };
}

// Mutations reconcile via onSuccess (the server assigns ids and enforces the
// single-default invariant, so an optimistic guess would be unreliable).
function useAddressMutation<TInput>(
  toOp: (input: TInput) => unknown,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TInput): Promise<AddressBookState> =>
      invoke.site.actions.address.submit(toOp(input)) as Promise<
        AddressBookState
      >,
    onSuccess: (state) => qc.setQueryData(ADDRESS_QUERY_KEY, state),
  });
}

export function useSaveAddress() {
  return useAddressMutation<AddressInput>((address) => ({
    op: "save",
    address,
  }));
}

export function useRemoveAddress() {
  return useAddressMutation<string>((id) => ({ op: "remove", id }));
}

export function useSetDefaultAddress() {
  return useAddressMutation<string>((id) => ({ op: "setDefault", id }));
}
