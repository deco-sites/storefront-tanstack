import ShippingSimulator, {
  type Props as ShippingSimulatorProps,
} from "../../shipping/ShippingSimulator";

export type ShippingConfig = ShippingSimulatorProps;

export default function ProductShipping(props: ShippingConfig) {
  return (
    <div className="mt-8">
      <ShippingSimulator {...props} />
    </div>
  );
}
