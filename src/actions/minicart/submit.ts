// Phase 6 stub — platform-specific cart routing.
// The original Fresh implementation switched on `usePlatform()` to pick a
// backend adapter (VTEX/Shopify/Linx/Vnda/Wake/Nuvemshop). In the TanStack
// port, cart mutations will be wired through TanStack Start server functions
// + `@decocms/apps/<platform>/actions/cart/*`. For Phase 1 we only need this
// to typecheck; it is not referenced yet by any route.
import { type AppContext, usePlatform } from "../../apps/site";
import { type Minicart } from "../../components/minicart/Minicart";

interface CartForm {
  items: number[];
  coupon: string | null;
  action: string | null;
  platformCart: unknown;
  addToCart: unknown;
}

export interface CartSubmitActions<AC = unknown> {
  addToCart?: (props: CartForm, req: Request, ctx: AC) => Promise<Minicart>;
  setQuantity?: (props: CartForm, req: Request, ctx: AC) => Promise<Minicart>;
  setCoupon?: (props: CartForm, req: Request, ctx: AC) => Promise<Minicart>;
}

async function action(
  _props?: unknown,
  _req?: Request,
  _ctx?: AppContext,
): Promise<Minicart> {
  throw new Error(
    `minicart/submit not wired yet for platform=${usePlatform()} (Phase 6)`,
  );
}

export default action;
