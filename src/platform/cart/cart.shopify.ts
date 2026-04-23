import type { ShopifyCart } from "@decocms/apps/shopify";
import { EMPTY_CART, type CartItem, type CartState } from "./cart.types";

const parseMoney = (m?: { amount: string; currencyCode: string }) =>
  m ? { amount: Number(m.amount), currencyCode: m.currencyCode } : undefined;

export function shopifyCartToCartState(cart: ShopifyCart | null): CartState {
  if (!cart) return EMPTY_CART;

  const items: CartItem[] = cart.lines.nodes.map((line) => ({
    lineId: line.id,
    merchandiseId: line.merchandise.id,
    title: line.merchandise.product.title,
    productHandle: line.merchandise.product.handle,
    image: line.merchandise.image
      ? {
          url: line.merchandise.image.url,
          alt: line.merchandise.image.altText ?? undefined,
        }
      : undefined,
    price: {
      amount: Number(line.merchandise.price.amount),
      currencyCode: line.merchandise.price.currencyCode,
    },
    compareAtPrice: parseMoney(line.cost?.compareAtAmountPerQuantity ?? undefined),
    quantity: line.quantity,
  }));

  return {
    id: cart.id,
    items,
    subtotal: parseMoney(cart.cost.subtotalAmount) ?? EMPTY_CART.subtotal,
    total: parseMoney(cart.cost.totalAmount) ?? EMPTY_CART.total,
    checkoutUrl: cart.checkoutUrl,
    totalQuantity: cart.totalQuantity,
  };
}
