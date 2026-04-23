import { usePlatform } from "../../apps/site";

export interface ShippingMethod {
  id: string;
  name: string;
  /** Estimated delivery in business days. */
  days: number;
  /** Price in major units of `currency`. 0 = free. */
  price: number;
  /** ISO-4217 currency code (e.g. "USD", "BRL"). */
  currency: string;
}

export interface ShippingSimulation {
  postalCode: string;
  methods: ShippingMethod[];
}

interface Props {
  postalCode: string;
}

const sanitize = (s: string) => (s ?? "").replace(/\D+/g, "");

async function action(
  props: Props,
  _req?: Request,
): Promise<ShippingSimulation> {
  const cep = sanitize(props.postalCode);
  if (cep.length < 4) throw new Error("Invalid postal code");

  const platform = usePlatform();

  if (platform === "vtex") {
    // TODO(consumer): call VTEX shipping simulator (sla simulation),
    // map response to ShippingMethod[].
  }
  if (platform === "shopify") {
    // TODO(consumer): create a draft cart with the line item(s),
    // run buyerIdentityUpdate with this postal code, read deliveryGroups.
  }
  if (platform === "wake") {
    // TODO(consumer): wire wake shipping endpoint here.
  }

  // Default: deterministic mock so the demo works without a backend.
  // Remove this fallback once a real platform branch is implemented.
  const seed = Number.parseInt(cep.slice(0, 3) || "0", 10) || 0;
  const baseDays = 2 + (seed % 7);

  const methods: ShippingMethod[] = [
    {
      id: "standard",
      name: "Standard shipping",
      days: baseDays + 2,
      price: 19.9,
      currency: "USD",
    },
    {
      id: "express",
      name: "Express shipping",
      days: Math.max(1, baseDays - 1),
      price: 39.9,
      currency: "USD",
    },
    {
      id: "free",
      name: "Free shipping",
      days: baseDays + 5,
      price: 0,
      currency: "USD",
    },
  ];

  return { postalCode: cep, methods };
}

export default action;
