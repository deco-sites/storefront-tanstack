/**
 * User Hook — wire to invoke.site.loaders for your platform's user API.
 */
import { signal } from "~/sdk/signal";

export interface User {
  "@id": string;
  email: string;
  givenName?: string;
  familyName?: string;
}

const user = signal<User | null>(null);
const loading = signal(false);

export function useUser() {
  return { user, loading };
}

export default useUser;
