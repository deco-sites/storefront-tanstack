export { default, loader } from "../../components/ui/CategoryBanner";

// Reserve the banner's real height to avoid CLS while the URL-matched banner
// resolves: the image is 360x120 on mobile and 1440x200 on desktop.
export const LoadingFallback = () => (
  <div
    className="w-full h-[120px] sm:h-[200px] bg-base-200"
    style={{ contentVisibility: "auto", containIntrinsicSize: "200px" }}
  />
);
