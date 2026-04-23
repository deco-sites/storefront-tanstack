import { createServerFn } from "@tanstack/react-start";
import { getRequest, getResponse } from "@tanstack/react-start/server";
import { addItems, getCart, updateItems } from "@decocms/apps/shopify";
import { shopifyCartToCartState } from "./cart.shopify";
import type { CartState } from "./cart.types";

export const getCartServerFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<CartState> => {
    const request = getRequest();
    const response = getResponse();
    const cart = await getCart(request.headers, response.headers);
    return shopifyCartToCartState(cart);
  },
);

export const addItemServerFn = createServerFn({ method: "POST" })
  .inputValidator((input: { merchandiseId: string; quantity?: number }) => input)
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
  .inputValidator((input: { lineId: string; quantity: number }) => input)
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
  .inputValidator((input: { lineId: string }) => input)
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
