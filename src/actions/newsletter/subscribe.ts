import { usePlatform } from "../../apps/site";
import { readNewsletterCookie, serializeNewsletterCookie } from "../../loaders/_cookie";

export interface SubscribeNewsletterProps {
  email: string;
}

export interface SubscribeNewsletterResult {
  success: boolean;
  email: string;
}

async function action(
  props: SubscribeNewsletterProps,
  request: Request,
  responseHeaders: Headers,
): Promise<SubscribeNewsletterResult> {
  const email = props?.email?.trim();
  // The server function is publicly POST-able, so validate here too (not just
  // via the form's type=email). Keep it minimal — a basic shape check.
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("a valid email is required");
  }

  const platform = usePlatform();

  if (platform === "vtex") {
    // TODO(consumer): real VTEX newsletter opt-in, e.g.
    //   await invoke("vtex/actions/newsletter/subscribe.ts", { email });
  }
  if (platform === "shopify") {
    // TODO(consumer): Shopify has no Storefront newsletter endpoint — integrate
    // a marketing provider (Klaviyo, Mailchimp, Resend) or set acceptsMarketing
    // on a customer mutation.
  }
  if (platform === "wake") {
    // TODO(consumer): wire wake newsletter endpoint here.
  }

  // Default: cookie-backed so the demo persists per-browser without a backend.
  // Idempotent — re-subscribing the same email is a no-op success.
  const emails = readNewsletterCookie(request);
  if (!emails.includes(email)) emails.push(email);

  responseHeaders.append("Set-Cookie", serializeNewsletterCookie(emails));
  return { success: true, email };
}

export default action;
