import { createServerFn } from "@tanstack/react-start";
import {
  deleteCookie,
  getRequest,
  getRequestProtocol,
  setCookie,
} from "@tanstack/react-start/server";
import {
  getShopifyClient,
  signIn as shopifySignIn,
  signUp as shopifySignUp,
  userLoader as shopifyUserLoader,
} from "@decocms/apps/shopify";
import type { Person } from "./user.types";

const CUSTOMER_COOKIE = "secure_customer_sig";
const ONE_WEEK_S = 7 * 24 * 60 * 60;

const toPerson = (
  u: Awaited<ReturnType<typeof shopifyUserLoader>>,
): Person | null => {
  if (!u) return null;
  return {
    "@id": u["@id"],
    email: u.email,
    givenName: u.givenName,
    familyName: u.familyName,
  };
};

const headersFromAccessToken = (accessToken: string): Headers => {
  const h = new Headers();
  h.set("cookie", `${CUSTOMER_COOKIE}=${accessToken}`);
  return h;
};

const persistAccessToken = (accessToken: string) => {
  // `secure` cookies are silently dropped by browsers on plain http://
  // (localhost is treated as a special case by Chrome/Firefox but not Safari).
  // Mirror the protocol so dev (http) and prod (https) both work.
  const isHttps = getRequestProtocol() === "https";
  setCookie(CUSTOMER_COOKIE, accessToken, {
    path: "/",
    maxAge: ONE_WEEK_S,
    httpOnly: true,
    sameSite: "lax",
    secure: isHttps,
  });
};

export const getUserServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<Person | null> => {
    const request = getRequest();
    const u = await shopifyUserLoader(request.headers);
    return toPerson(u);
  },
);

export const signInServerFn = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; password: string }) => input)
  .handler(async (ctx): Promise<Person | null> => {
    const request = getRequest();
    // Don't pass responseHeaders — we set the cookie ourselves below so the
    // `secure` flag matches the request protocol.
    const result = await shopifySignIn({
      email: ctx.data.email,
      password: ctx.data.password,
      requestHeaders: request.headers,
    });
    const token = result?.customerAccessTokenCreate?.customerAccessToken
      ?.accessToken;
    if (!token) {
      const msg = result?.customerAccessTokenCreate?.customerUserErrors?.[0]
        ?.message;
      throw new Error(msg ?? "Invalid email or password");
    }
    persistAccessToken(token);
    const u = await shopifyUserLoader(headersFromAccessToken(token));
    return toPerson(u);
  });

export const signUpServerFn = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      email: string;
      password: string;
      firstName?: string;
      lastName?: string;
    }) => input,
  )
  .handler(async (ctx): Promise<Person | null> => {
    const request = getRequest();

    const created = await shopifySignUp({
      email: ctx.data.email,
      password: ctx.data.password,
      firstName: ctx.data.firstName,
      lastName: ctx.data.lastName,
    });
    const errs = created?.customerCreate?.customerUserErrors;
    if (errs?.length) {
      throw new Error(errs[0].message ?? "Could not create account");
    }

    const signin = await shopifySignIn({
      email: ctx.data.email,
      password: ctx.data.password,
      requestHeaders: request.headers,
    });
    const token = signin?.customerAccessTokenCreate?.customerAccessToken
      ?.accessToken;
    if (!token) {
      throw new Error("Account created, but auto sign-in failed.");
    }
    persistAccessToken(token);
    const u = await shopifyUserLoader(headersFromAccessToken(token));
    return toPerson(u);
  });

export const signOutServerFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<null> => {
    deleteCookie(CUSTOMER_COOKIE, { path: "/" });
    return null;
  },
);

const RECOVER_PASSWORD_MUTATION = `
  mutation RecoverPassword($email: String!) {
    customerRecover(email: $email) {
      customerUserErrors { code field message }
    }
  }
`;

interface RecoverResult {
  customerRecover: {
    customerUserErrors: Array<{
      code?: string;
      field?: string[] | null;
      message: string;
    }>;
  };
}

export const recoverPasswordServerFn = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) => input)
  .handler(async (ctx): Promise<{ ok: true }> => {
    const client = getShopifyClient();
    const data = await client.query<RecoverResult>(
      RECOVER_PASSWORD_MUTATION,
      { email: ctx.data.email },
    );
    const errs = data?.customerRecover?.customerUserErrors;
    if (errs?.length) {
      throw new Error(errs[0].message ?? "Could not send recovery email.");
    }
    return { ok: true };
  });
