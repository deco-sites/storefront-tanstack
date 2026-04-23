export interface CartItemPrice {
  amount: number;
  currencyCode: string;
}

export interface CartItem {
  /** Cart line ID — use for update/remove operations. */
  lineId: string;
  /** Merchandise/variant ID — what was added. */
  merchandiseId: string;
  title: string;
  productHandle: string;
  image?: { url: string; alt?: string };
  price: CartItemPrice;
  compareAtPrice?: CartItemPrice;
  quantity: number;
}

export interface CartState {
  id: string | null;
  items: CartItem[];
  subtotal: CartItemPrice;
  total: CartItemPrice;
  checkoutUrl: string | null;
  totalQuantity: number;
}

export const EMPTY_CART: CartState = {
  id: null,
  items: [],
  subtotal: { amount: 0, currencyCode: "USD" },
  total: { amount: 0, currencyCode: "USD" },
  checkoutUrl: null,
  totalQuantity: 0,
};
