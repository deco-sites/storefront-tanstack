import { AppContext } from "../../apps/site";
import { MINICART_DRAWER_ID, MINICART_FORM_ID } from "../../constants";
import { clx } from "~/sdk/clx";
import { formatPrice } from "@decocms/apps/commerce/sdk/formatPrice";
import { useComponent } from "../../sections/Component";
import Coupon from "./Coupon";
import FreeShippingProgressBar from "./FreeShippingProgressBar";
import CartItem, { Item } from "./Item";
import { useScript } from "@decocms/start/sdk/useScript";
export interface Minicart {
  /** Cart from the ecommerce platform */
  platformCart: Record<string, unknown>;
  /** Cart from storefront. This can be changed at your will */
  storefront: {
    items: Item[];
    total: number;
    subtotal: number;
    discounts: number;
    coupon?: string;
    locale: string;
    currency: string;
    enableCoupon?: boolean;
    freeShippingTarget: number;
    checkoutHref: string;
  };
}
const onLoad = (formID: string) => {
  const form = document.getElementById(formID) as HTMLFormElement;
  window.STOREFRONT.CART.dispatch(form);
  // view_cart event
  if (typeof IntersectionObserver !== "undefined") {
    new IntersectionObserver((items, observer) => {
      for (const item of items) {
        if (item.isIntersecting && item.target === form) {
          window.DECO.events.dispatch({
            name: "view_cart",
            params: window.STOREFRONT.CART.getCart(),
          });
          observer?.unobserve(item.target);
        }
      }
    }).observe(form);
  }
  // Disable form interactivity while cart is being submitted
  document.body.addEventListener(
    "htmx:before-send", // deno-lint-ignore no-explicit-any
    ({ detail: { elt } }: any) => {
      if (elt !== form) {
        return;
      }
      // Disable addToCart button interactivity
      document.querySelectorAll("div[data-cart-item]").forEach((container) => {
        container?.querySelectorAll("button")
          .forEach((node) => node.disabled = true);
        container?.querySelectorAll("input")
          .forEach((node) => node.disabled = true);
      });
    },
  );
};
const sendBeginCheckoutEvent = () => {
  window.DECO.events.dispatch({
    name: "being_checkout",
    params: window.STOREFRONT.CART.getCart(),
  });
};
export const action = async (_props: unknown, req: Request, ctx: AppContext) =>
  req.method === "PATCH"
    ? ({ cart: await ctx.invoke("site/loaders/minicart.ts") }) // error fallback
    : ({ cart: await ctx.invoke("site/actions/minicart/submit.ts") });
export function ErrorFallback() {
  return (
    <div className="flex flex-col grow justify-center items-center overflow-hidden w-full gap-2">
      <div className="flex flex-col gap-1 p-6 justify-center items-center">
        <span className="font-semibold">
          Error while updating cart
        </span>
        <span className="text-sm text-center">
          Click in the button below to retry or refresh the page
        </span>
      </div>

      <button
        type="button"
        className="btn btn-primary"
        hx-patch={useComponent(import.meta.url)}
        hx-swap="outerHTML"
        hx-target="closest div"
      >
        Retry
      </button>
    </div>
  );
}
export default function Cart(
  {
    cart: {
      platformCart,
      storefront: {
        items,
        total,
        subtotal,
        coupon,
        discounts,
        locale,
        currency,
        enableCoupon = true,
        freeShippingTarget,
        checkoutHref,
      },
    },
  }: {
    cart: Minicart;
  },
) {
  const count = items.length;
  return (
    <>
      <form
        className="contents"
        id={MINICART_FORM_ID}
        hx-sync="this:replace"
        hx-trigger="submit, change delay:300ms"
        hx-target="this"
        hx-indicator="this"
        hx-disabled-elt="this"
        hx-post={useComponent(import.meta.url)}
        hx-swap="outerHTML"
      >
        {/* Button to submit the form */}
        <button type="submit" hidden autoFocus />

        {/* Add to cart controllers */}
        <input name="add-to-cart" type="hidden" />
        <button type="submit" hidden name="action" value="add-to-cart" />

        {/* This contains the STOREFRONT cart. */}
        <input
          type="hidden"
          name="storefront-cart"
          value={encodeURIComponent(
            JSON.stringify({ coupon, currency, value: total, items }),
          )}
        />

        {/* This contains the platformCart cart from the commerce platform. Integrations usually use this value, like GTM, pixels etc */}
        <input
          type="hidden"
          name="platform-cart"
          value={encodeURIComponent(JSON.stringify(platformCart))}
        />

        <div
          className={clx(
            "flex flex-col flex-grow justify-center items-center overflow-hidden w-full",
            "[.htmx-request_&]:pointer-events-none [.htmx-request_&]:opacity-60 [.htmx-request_&]:cursor-wait transition-opacity duration-300",
          )}
        >
          {count === 0
            ? (
              <div className="flex flex-col gap-6">
                <span className="font-medium text-2xl">Your bag is empty</span>
                <label
                  htmlFor={MINICART_DRAWER_ID}
                  className="btn btn-outline no-animation"
                >
                  Choose products
                </label>
              </div>
            )
            : (
              <>
                {/* Free Shipping Bar */}
                <div className="px-2 py-4 w-full">
                  <FreeShippingProgressBar
                    total={total}
                    locale={locale}
                    currency={currency}
                    target={freeShippingTarget}
                  />
                </div>

                {/* Cart Items */}
                <ul
                  role="list"
                  className="mt-6 px-2 grow overflow-y-auto flex flex-col gap-6 w-full"
                >
                  {items.map((item, index) => (
                    <li>
                      <CartItem
                        item={item}
                        index={index}
                        locale={locale}
                        currency={currency}
                      />
                    </li>
                  ))}
                </ul>

                {/* Cart Footer */}
                <footer className="w-full">
                  {/* Subtotal */}
                  <div className="border-t border-base-200 py-2 flex flex-col">
                    {discounts > 0 && (
                      <div className="flex justify-between items-center px-4">
                        <span className="text-sm">Discounts</span>
                        <span className="text-sm">
                          {formatPrice(discounts, currency, locale)}
                        </span>
                      </div>
                    )}
                    <div className="w-full flex justify-between px-4 text-sm">
                      <span>Subtotal</span>
                      <output form={MINICART_FORM_ID}>
                        {formatPrice(subtotal, currency, locale)}
                      </output>
                    </div>
                    {enableCoupon && <Coupon coupon={coupon} />}
                  </div>

                  {/* Total */}
                  <div className="border-t border-base-200 pt-4 flex flex-col justify-end items-end gap-2 mx-4">
                    <div className="flex justify-between items-center w-full">
                      <span>Total</span>
                      <output
                        form={MINICART_FORM_ID}
                        className="font-medium text-xl"
                      >
                        {formatPrice(total, currency, locale)}
                      </output>
                    </div>
                    <span className="text-sm text-base-300">
                      Fees and shipping will be calculated at checkout
                    </span>
                  </div>

                  <div className="p-4">
                    <a
                      className="btn btn-primary w-full no-animation"
                      href={checkoutHref}
                      hx-on:click={useScript(sendBeginCheckoutEvent)}
                    >
                      <span className="[.htmx-request_&]:hidden">
                        Begin Checkout
                      </span>
                      <span className="[.htmx-request_&]:inline hidden loading loading-spinner" />
                    </a>
                  </div>
                </footer>
              </>
            )}
        </div>
      </form>
      <script
        type="module"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: useScript(onLoad, MINICART_FORM_ID),
        }}
      />
    </>
  );
}
