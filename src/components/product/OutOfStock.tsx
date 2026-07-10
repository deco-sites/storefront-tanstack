import { useMutation } from "@tanstack/react-query";
import type { Product } from "@decocms/apps-commerce/types";
import { invoke } from "../../runtime";
import { useUser } from "../../platform/user";
import type { NotifyMeResult } from "../../actions/notifyMe/subscribe";

export interface Props {
  productID: Product["productID"];
}

export default function OutOfStock({ productID }: Props) {
  const { user } = useUser();
  const notify = useMutation({
    mutationFn: async (input: { email: string; name?: string }) => {
      const result = (await invoke.site.actions.notifyMe.subscribe({
        skuId: productID,
        email: input.email,
        name: input.name,
      })) as NotifyMeResult | undefined;
      if (!result?.success) throw new Error("Notify request failed");
      return result;
    },
  });

  if (notify.isSuccess) {
    return (
      <div className="form-control gap-2">
        <span className="text-base">You're on the list!</span>
        <span className="text-sm text-base-400">
          We'll email you when this product is back in stock.
        </span>
      </div>
    );
  }

  return (
    <form
      className="form-control justify-start gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        const email = `${data.get("email") ?? ""}`.trim();
        const name = `${data.get("name") ?? ""}`.trim();
        if (email) notify.mutate({ email, name });
      }}
    >
      <span className="text-base">This product is currently unavailable</span>
      <span className="text-sm">Notify me when it's back in stock</span>

      <input placeholder="Name" className="input input-bordered" name="name" />
      <input
        placeholder="Email"
        type="email"
        required
        className="input input-bordered"
        name="email"
        defaultValue={user?.email ?? ""}
      />

      <button
        type="submit"
        className="btn btn-primary no-animation"
        disabled={notify.isPending}
      >
        {notify.isPending
          ? <span className="loading loading-spinner loading-xs" />
          : <span>Submit</span>}
      </button>

      {notify.isError && (
        <span className="text-sm text-error">
          Something went wrong. Please try again.
        </span>
      )}
    </form>
  );
}
