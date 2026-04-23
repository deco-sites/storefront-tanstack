import { clx } from "~/sdk/clx";

export interface DiscountBadgeConfig {
  /**
   * @title Show badge
   * @default true
   */
  show?: boolean;
  /**
   * @title Label format
   * @description Use {percent} as placeholder (e.g. "{percent}% OFF")
   * @default "{percent} % off"
   */
  labelFormat?: string;
  /**
   * @title Text color
   * @format color-input
   * @default "#000000"
   */
  textColor?: string;
  /**
   * @title Background color
   * @format color-input
   * @default "#FFD70033"
   */
  backgroundColor?: string;
}

export interface Props {
  percent: number;
  config?: DiscountBadgeConfig;
}

export default function ProductDiscountBadge({ percent, config }: Props) {
  const merged = {
    show: true,
    labelFormat: "{percent} % off",
    textColor: "#000000",
    backgroundColor: "#FFD70033",
    ...config,
  };

  const active = merged.show && percent > 0;
  const label = merged.labelFormat.replace("{percent}", String(percent));

  return (
    <span
      className={clx(
        "text-sm/4 font-normal text-center rounded-badge px-2 py-1 w-fit",
        !active && "opacity-0 pointer-events-none",
      )}
      style={{ color: merged.textColor, backgroundColor: merged.backgroundColor }}
      aria-hidden={!active}
    >
      {label}
    </span>
  );
}
