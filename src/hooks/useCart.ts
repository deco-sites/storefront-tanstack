// Phase 6 stub — VTEX cart hook.
// The full implementation (with orderForm persistence, add/remove/update items,
// coupon + attachment flows) will be wired to a TanStack Start server function
// `src/server/invoke.ts` once Phase 6 lands. For now the hook exists only so
// that dynamic `~/hooks/useCart` imports resolve — the shape is intentionally
// minimal and any caller that hits it will see a clear runtime error.
import type { OrderForm, OrderFormItem } from "@decocms/apps/vtex/types";

export type { OrderForm, OrderFormItem };

export function itemToAnalyticsItem(item: OrderFormItem & { coupon?: string }, index: number) {
  return {
    item_id: item.productId,
    item_group_id: item.productId,
    item_name: item.name ?? item.skuName ?? "",
    item_variant: item.skuName,
    item_brand: item.additionalInfo?.brandName ?? "",
    price: (item.sellingPrice ?? item.price ?? 0) / 100,
    discount: Number(((item.listPrice - item.sellingPrice) / 100).toFixed(2)),
    quantity: item.quantity,
    coupon: item.coupon,
    affiliation: item.seller,
    index,
  };
}

export function resetCart() {
  /* Phase 6 */
}

export function useCart() {
  throw new Error(
    "useCart is not yet wired — commerce hooks land in Phase 6 (see Plan § Phase 6).",
  );
}
