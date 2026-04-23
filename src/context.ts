import { createContext } from "react";

export interface AccountContextValue {
  name: string;
}

const Account = createContext<AccountContextValue>({
  name: "storefront-tanstack",
});

export default Account;
