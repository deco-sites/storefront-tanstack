import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getUserServerFn,
  recoverPasswordServerFn,
  signInServerFn,
  signOutServerFn,
  signUpServerFn,
} from "./user.actions";
import type { Person, UserState } from "./user.types";

export const USER_QUERY_KEY = ["user"] as const;

export function useUser() {
  const query = useQuery({
    queryKey: USER_QUERY_KEY,
    queryFn: () => getUserServerFn(),
    staleTime: 60_000,
    placeholderData: null,
  });
  const user: Person | null = query.data ?? null;
  return {
    user,
    isAuthenticated: !!user?.email,
    isLoading: query.isLoading,
    error: query.error,
  };
}

export function useSignIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      signInServerFn({ data: input }),
    onSuccess: (user: UserState) => {
      qc.setQueryData(USER_QUERY_KEY, user);
    },
  });
}

export function useSignUp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    }) => signUpServerFn({ data: input }),
    onSuccess: (user: UserState) => {
      qc.setQueryData(USER_QUERY_KEY, user);
    },
  });
}

export function useSignOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => signOutServerFn(),
    onSuccess: () => {
      qc.setQueryData(USER_QUERY_KEY, null);
    },
  });
}

export function useRecoverPassword() {
  return useMutation({
    mutationFn: (input: { email: string }) =>
      recoverPasswordServerFn({ data: input }),
  });
}
