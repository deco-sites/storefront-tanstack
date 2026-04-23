import { clx } from "~/sdk/clx";

export default function SearchResultGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      className={clx(
        "grid items-start",
        "grid-cols-2 gap-2",
        "sm:grid-cols-4 sm:gap-10",
        "w-full",
      )}
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2">
          <div className="skeleton aspect-[3/4] w-full rounded" />
          <div className="skeleton h-4 w-3/4 rounded" />
          <div className="skeleton h-4 w-1/2 rounded" />
        </div>
      ))}
    </div>
  );
}
