import { formatPrice } from "@decocms/apps/commerce/sdk/formatPrice";
import { clx } from "~/sdk/clx";
import Image from "~/components/ui/Image";
import Icon from "../ui/Icon";
import { MINICART_DRAWER_ID } from "../../constants";
import {
  useCart,
  useRemoveCartItem,
  useUpdateCartItem,
  type CartItem,
  type CartState,
} from "../../platform/cart";

function QuantityStepper({ item }: { item: CartItem }) {
  const update = useUpdateCartItem();
  const pending = update.isPending && update.variables?.lineId === item.lineId;
  const set = (quantity: number) =>
    update.mutate({ lineId: item.lineId, quantity: Math.max(1, quantity) });
  return (
    <div className="join border border-base-200 rounded">
      <button
        type="button"
        className="join-item btn btn-ghost btn-sm no-animation"
        aria-label="Decrease quantity"
        disabled={pending || item.quantity <= 1}
        onClick={() => set(item.quantity - 1)}
      >
        -
      </button>
      <span className="join-item px-3 self-center text-sm min-w-[2ch] text-center">
        {item.quantity}
      </span>
      <button
        type="button"
        className="join-item btn btn-ghost btn-sm no-animation"
        aria-label="Increase quantity"
        disabled={pending}
        onClick={() => set(item.quantity + 1)}
      >
        +
      </button>
    </div>
  );
}

function CartLine({ item, currency }: { item: CartItem; currency: string }) {
  const remove = useRemoveCartItem();
  const removing = remove.isPending && remove.variables?.lineId === item.lineId;
  return (
    <li
      className={clx(
        "flex gap-3 py-3 border-b border-base-200 last:border-none",
        removing && "opacity-50 pointer-events-none",
      )}
    >
      {item.image ? (
        <Image
          className="rounded border border-base-200 w-16 h-16 object-cover"
          src={item.image.url}
          alt={item.image.alt ?? item.title}
          width={64}
          height={64}
          loading="lazy"
        />
      ) : (
        <div className="w-16 h-16 rounded bg-base-200" aria-hidden="true" />
      )}
      <div className="flex flex-col grow gap-1">
        <a
          href={`/${item.productHandle}`}
          className="text-sm font-medium line-clamp-2 hover:underline"
        >
          {item.title}
        </a>
        <div className="text-sm text-base-400">
          {formatPrice(item.price.amount, currency)}
        </div>
        <div className="flex items-center justify-between mt-1">
          <QuantityStepper item={item} />
          <button
            type="button"
            className="btn btn-ghost btn-xs no-animation"
            aria-label="Remove item"
            disabled={removing}
            onClick={() => remove.mutate({ lineId: item.lineId })}
          >
            <Icon id="trash" />
          </button>
        </div>
      </div>
    </li>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col gap-6 items-center justify-center grow">
      <span className="font-medium text-2xl">Your bag is empty</span>
      <label
        htmlFor={MINICART_DRAWER_ID}
        className="btn btn-outline no-animation cursor-pointer"
      >
        Choose products
      </label>
    </div>
  );
}

function Footer({ cart }: { cart: CartState }) {
  return (
    <footer className="w-full border-t border-base-200">
      <div className="px-4 py-4 flex justify-between items-center">
        <span className="text-sm">Subtotal</span>
        <span className="font-medium">
          {formatPrice(cart.subtotal.amount, cart.subtotal.currencyCode)}
        </span>
      </div>
      <div className="px-4 pb-2 text-xs text-base-400 text-right">
        Fees and shipping calculated at checkout
      </div>
      <div className="p-4">
        {cart.checkoutUrl ? (
          <a
            className="btn btn-primary w-full no-animation"
            href={cart.checkoutUrl}
          >
            Begin Checkout
          </a>
        ) : (
          <button type="button" className="btn btn-primary w-full" disabled>
            Begin Checkout
          </button>
        )}
      </div>
    </footer>
  );
}

export default function Minicart() {
  const { cart, isFetching } = useCart();
  const currency = cart.subtotal.currencyCode;

  return (
    <div
      className={clx(
        "flex flex-col h-full w-full",
        isFetching && "transition-opacity duration-150 opacity-80",
      )}
    >
      <div className="flex items-center justify-between border-b border-base-200 px-4 py-3">
        <h2 className="font-medium text-xl">Your bag</h2>
        <label
          htmlFor={MINICART_DRAWER_ID}
          aria-label="Close cart"
          className="btn btn-ghost btn-sm no-animation cursor-pointer"
        >
          <Icon id="close" />
        </label>
      </div>

      {cart.items.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <ul className="grow overflow-y-auto px-4">
            {cart.items.map((item) => (
              <CartLine key={item.lineId} item={item} currency={currency} />
            ))}
          </ul>
          <Footer cart={cart} />
        </>
      )}
    </div>
  );
}
