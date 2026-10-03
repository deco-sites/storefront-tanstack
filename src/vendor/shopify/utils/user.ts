// Vendored from @decocms/apps-shopify 7.20.7 (utils/user.ts). Cart, session and sign-in flows live in the site in the next major (/next/upstream-clients#what-a-client-is). It's your code now.
import { getCookies, setCookie } from "./cookies";

const CUSTOMER_COOKIE = "secure_customer_sig";

const ONE_WEEK_MS = 7 * 24 * 3600 * 1_000;

export const getUserCookie = (headers: Headers): string | undefined => {
  const cookies = getCookies(headers);

  return cookies[CUSTOMER_COOKIE];
};

export const setUserCookie = (headers: Headers, accessToken: string) => {
  setCookie(headers, {
    name: CUSTOMER_COOKIE,
    value: accessToken,
    path: "/",
    expires: new Date(Date.now() + ONE_WEEK_MS),
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
  });
};
