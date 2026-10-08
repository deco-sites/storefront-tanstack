import { createServerFn } from "@tanstack/react-start";
import { getRequest, getResponse } from "@tanstack/react-start/server";
import { z } from "zod";
import { isServerFnCall, markPrivate } from "../../server/private-response";
import { getCartCookie } from "../../vendor/shopify/utils/cart";
import addItems from "../../vendor/shopify/actions/cart/addItems";
import updateItems from "../../vendor/shopify/actions/cart/updateItems";
import { getCart } from "../../vendor/shopify/loaders/cart";
import { shopifyCartToCartState } from "./cart.shopify";
import { type CartState, EMPTY_CART } from "./cart.types";

// POST, not GET: the worker edge-caches GET server functions (and strips the
// buyer's cookies from them), which would always answer an empty cart.
export const getCartServerFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<CartState> => {
    markPrivate();
    const request = getRequest();
    // A visitor without a cart has an empty one. While a document renders, that's the answer: creating
    // a Shopify cart there would set a cart cookie on the page and keep it out of the edge cache for
    // every new visitor. The browser's own cart read, or the first add to cart, creates it.
    if (!isServerFnCall() && !getCartCookie(request.headers)) return EMPTY_CART;
    const response = getResponse();
    const cart = await getCart(request.headers, response.headers);
    return shopifyCartToCartState(cart);
  },
);

export const addItemServerFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ merchandiseId: z.string(), quantity: z.number().int().optional() }))
  .handler(async (ctx): Promise<CartState> => {
    const request = getRequest();
    const response = getResponse();
    const cart = await addItems({
      lines: {
        merchandiseId: ctx.data.merchandiseId,
        quantity: ctx.data.quantity ?? 1,
      },
      requestHeaders: request.headers,
      responseHeaders: response.headers,
    });
    return shopifyCartToCartState(cart);
  });

export const updateItemQuantityServerFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ lineId: z.string(), quantity: z.number().int().min(0) }))
  .handler(async (ctx): Promise<CartState> => {
    const request = getRequest();
    const response = getResponse();
    const cart = await updateItems({
      lines: [{ id: ctx.data.lineId, quantity: ctx.data.quantity }],
      requestHeaders: request.headers,
      responseHeaders: response.headers,
    });
    return shopifyCartToCartState(cart);
  });

export const removeItemServerFn = createServerFn({ method: "POST" })
  .inputValidator(z.object({ lineId: z.string() }))
  .handler(async (ctx): Promise<CartState> => {
    const request = getRequest();
    const response = getResponse();
    const cart = await updateItems({
      lines: [{ id: ctx.data.lineId, quantity: 0 }],
      requestHeaders: request.headers,
      responseHeaders: response.headers,
    });
    return shopifyCartToCartState(cart);
  });
