import type { SKU } from "@decocms/apps/vtex/utils/types";
import ShippingSimulationForm from "../../shipping/Form";

export interface Props {
  sku: string;
  seller?: string;
}

export default function ProductShipping({ sku, seller = "1" }: Props) {
  const items: SKU[] = [{ id: Number(sku), quantity: 1, seller }];
  return (
    <div className="mt-8">
      <ShippingSimulationForm items={items} />
    </div>
  );
}
