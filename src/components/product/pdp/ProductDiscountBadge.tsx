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
  /**
   * Hide the badge while a variant navigation is pending — the next
   * variant's percent may differ, so we avoid showing the stale value.
   */
  isLoading?: boolean;
}

export default function ProductDiscountBadge({ percent, config, isLoading }: Props) {
  const merged = {
    show: true,
    labelFormat: "{percent} % off",
    textColor: "#000000",
    backgroundColor: "#FFD70033",
    ...config,
  };

  const active = merged.show && percent > 0 && !isLoading;
  const label = merged.labelFormat.replace("{percent}", String(percent));

  return (
    <span
      className={clx(
        "rounded-badge w-fit px-2 py-1 text-center text-sm/4 font-normal",
        !active && "pointer-events-none opacity-0",
      )}
      style={{ color: merged.textColor, backgroundColor: merged.backgroundColor }}
      aria-hidden={!active}
    >
      {label}
    </span>
  );
}
