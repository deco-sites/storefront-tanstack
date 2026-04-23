import type { Product } from "@decocms/apps/commerce/types";
import { AppContext } from "../../apps/site";
import { useComponent } from "../../sections/Component";

export interface Props {
  productID: Product["productID"];
}

export const action = async (props: Props, req: Request, ctx: AppContext) => {
  const form = await req.formData();

  const name = `${form.get("name") ?? ""}`;
  const email = `${form.get("email") ?? ""}`;
  await (ctx as any).invoke("vtex/actions/notifyme.ts", {
    skuId: props.productID,
    name,
    email,
  });

  return props;
};

export default function Notify({ productID }: Props) {
  return (
    <form
      className="form-control justify-start gap-2"
      hx-sync="this:replace"
      hx-indicator="this"
      hx-swap="none"
      hx-post={useComponent<Props>(import.meta.url, { productID })}
    >
      <span className="text-base">This product is currently unavailable</span>
      <span className="text-sm">Notify me when it's back in stock</span>

      <input placeholder="Name" className="input-bordered input" name="name" />
      <input placeholder="Email" className="input-bordered input" name="email" />

      <button type="button" className="no-animation btn btn-primary">
        <span className="inline [.htmx-request_&]:hidden">Submit</span>
        <span className="loading hidden loading-xs loading-spinner [.htmx-request_&]:inline" />
      </button>
    </form>
  );
}
