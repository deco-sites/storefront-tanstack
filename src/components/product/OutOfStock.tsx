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
      <span className="text-base">Este produto está indisponivel no momento</span>
      <span className="text-sm">Avise-me quando estiver disponivel</span>

      <input placeholder="Nome" className="input input-bordered" name="name" />
      <input placeholder="Email" className="input input-bordered" name="email" />

      <button type="button" className="btn btn-primary no-animation">
        <span className="[.htmx-request_&]:hidden inline">Enviar</span>
        <span className="[.htmx-request_&]:inline hidden loading loading-spinner loading-xs" />
      </button>
    </form>
  );
}
