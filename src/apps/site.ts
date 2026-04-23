export type Platform =
  | "vtex"
  | "vnda"
  | "shopify"
  | "wake"
  | "linx"
  | "nuvemshop"
  | "custom";

export const _platform: Platform = "shopify";

export const usePlatform = (): Platform => _platform;

export type AppContext = {
  device: "mobile" | "desktop" | "tablet";
  platform: Platform;
  invoke: (...args: any[]) => any;
};
