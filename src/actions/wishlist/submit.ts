import { type AppContext, usePlatform } from "../../apps/site";
import { type Wishlist } from "../../components/wishlist/Provider";

interface Props {
  productID: string;
  productGroupID: string;
}

// Phase 6 TODO: replace `any` with the real VTEX context once we re-export
// AppContextVTEX from @decocms/apps/vtex.
type AppContextVTEX = AppContext & { invoke: (...args: any[]) => any };

async function action(
  props: Props,
  _req?: Request,
  ctx: AppContext = {} as AppContext,
): Promise<Wishlist> {
  const { productID, productGroupID } = props;
  const platform = usePlatform();

  if (platform === "vtex") {
    const vtex = ctx as unknown as AppContextVTEX;

    const list: any[] = await vtex.invoke("vtex/loaders/wishlist.ts");
    const item = list.find((i: any) => i.sku === productID);

    try {
      const response = item
        ? await vtex.invoke(
          "vtex/actions/wishlist/removeItem.ts",
          { id: item.id },
        )
        : await vtex.invoke(
          "vtex/actions/wishlist/addItem.ts",
          { sku: productID, productId: productGroupID },
        );

      return {
        productIDs: response.map((item) => item.sku),
      };
    } catch {
      return {
        productIDs: list.map((item) => item.sku),
      };
    }
  }

  throw new Error(`Unsupported platform: ${platform}`);
}

export default action;
