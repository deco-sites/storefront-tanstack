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
    <div className="join rounded border border-base-200">
      <button
        type="button"
        className="no-animation btn join-item btn-ghost btn-sm"
        aria-label="Decrease quantity"
        disabled={pending || item.quantity <= 1}
        onClick={() => set(item.quantity - 1)}
      >
        -
      </button>
      <span className="join-item min-w-[2ch] self-center px-3 text-center text-sm">
        {item.quantity}
      </span>
      <button
        type="button"
        className="no-animation btn join-item btn-ghost btn-sm"
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
        "flex gap-3 border-b border-base-200 py-3 last:border-none",
        removing && "pointer-events-none opacity-50",
      )}
    >
      {item.image ? (
        <Image
          className="h-16 w-16 rounded border border-base-200 object-cover"
          src={item.image.url}
          alt={item.image.alt ?? item.title}
          width={64}
          height={64}
          loading="lazy"
        />
      ) : (
        <div className="h-16 w-16 rounded bg-base-200" aria-hidden="true" />
      )}
      <div className="flex grow flex-col gap-1">
        <a
          href={`/${item.productHandle}`}
          className="line-clamp-2 text-sm font-medium hover:underline"
        >
          {item.title}
        </a>
        <div className="text-base-400 text-sm">{formatPrice(item.price.amount, currency)}</div>
        <div className="mt-1 flex items-center justify-between">
          <QuantityStepper item={item} />
          <button
            type="button"
            className="no-animation btn btn-ghost btn-xs"
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
    <div className="flex grow flex-col items-center justify-center gap-6">
      <span className="text-2xl font-medium">Your bag is empty</span>
      <label htmlFor={MINICART_DRAWER_ID} className="no-animation btn cursor-pointer btn-outline">
        Choose products
      </label>
    </div>
  );
}

function Footer({ cart }: { cart: CartState }) {
  return (
    <footer className="w-full border-t border-base-200">
      <div className="flex items-center justify-between px-4 py-4">
        <span className="text-sm">Subtotal</span>
        <span className="font-medium">
          {formatPrice(cart.subtotal.amount, cart.subtotal.currencyCode)}
        </span>
      </div>
      <div className="text-base-400 px-4 pb-2 text-right text-xs">
        Fees and shipping calculated at checkout
      </div>
      <div className="p-4">
        {cart.checkoutUrl ? (
          <a className="no-animation btn w-full btn-primary" href={cart.checkoutUrl}>
            Begin Checkout
          </a>
        ) : (
          <button type="button" className="btn w-full btn-primary" disabled>
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
        "flex h-full w-full flex-col",
        isFetching && "opacity-80 transition-opacity duration-150",
      )}
    >
      <div className="flex items-center justify-between border-b border-base-200 px-4 py-3">
        <h2 className="text-xl font-medium">Your bag</h2>
        <label
          htmlFor={MINICART_DRAWER_ID}
          aria-label="Close cart"
          className="no-animation btn cursor-pointer btn-ghost btn-sm"
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
