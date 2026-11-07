import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AddressInput, AddressOp } from "../../actions/address/submit";
import { type AddressBookState, EMPTY_ADDRESS_BOOK } from "./address.types";
import { $siteActionsAddressSubmit, $siteLoadersAddress } from "../../server/invoke.functions";

export const ADDRESS_QUERY_KEY = ["addresses"] as const;

export function useAddresses() {
  const query = useQuery({
    queryKey: ADDRESS_QUERY_KEY,
    queryFn: (): Promise<AddressBookState> =>
      $siteLoadersAddress() as Promise<AddressBookState>,
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
  toOp: (input: TInput) => AddressOp,
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: TInput): Promise<AddressBookState> =>
      $siteActionsAddressSubmit({ data: toOp(input) }) as Promise<
        AddressBookState
      >,
    onSuccess: (state) => qc.setQueryData(ADDRESS_QUERY_KEY, state),
  });
}

export function useSaveAddress() {
  return useAddressMutation<AddressInput>((address) => ({
    op: "save" as const,
    address,
  }));
}

export function useRemoveAddress() {
  return useAddressMutation<string>((id) => ({ op: "remove" as const, id }));
}

export function useSetDefaultAddress() {
  return useAddressMutation<string>((id) => ({ op: "setDefault" as const, id }));
}
