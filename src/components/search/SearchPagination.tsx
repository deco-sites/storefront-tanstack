import { Link } from "@tanstack/react-router";
import { clx } from "~/sdk/clx";
import { rebaseToSearch } from "~/sdk/url";
import Icon from "../ui/Icon";

type NavTarget = { to: string; search: Record<string, string> };

export interface Props {
  currentPage: number;
  prev?: NavTarget;
  next?: NavTarget;
  variant: "show-more" | "pagination";
}

export function rebasePaginationHrefs(
  prevHref: string | undefined,
  nextHref: string | undefined,
  base: string,
) {
  return {
    prev: rebaseToSearch(prevHref, base),
    next: rebaseToSearch(nextHref, base),
  };
}

export default function SearchPagination({
  currentPage,
  prev,
  next,
  variant,
}: Props) {
  if (variant === "show-more") {
    return (
      <div className="flex flex-col items-center gap-4">
        {prev ? (
          <Link
            to={prev.to}
            search={prev.search}
            preload="intent"
            rel="prev"
            className="btn btn-ghost"
          >
            Show Less
          </Link>
        ) : null}
        {next ? (
          <Link
            to={next.to}
            search={next.search}
            preload="intent"
            rel="next"
            className="btn btn-ghost"
          >
            Show More
          </Link>
        ) : null}
      </div>
    );
  }

  return (
    <div className="join">
      <Link
        to={prev?.to ?? "#"}
        search={prev?.search}
        preload="intent"
        rel="prev"
        aria-label="previous page"
        aria-disabled={!prev}
        className={clx("btn btn-ghost join-item", !prev && "btn-disabled")}
      >
        <Icon id="chevron-right" className="rotate-180" />
      </Link>
      <span className="btn btn-ghost join-item">Page {currentPage}</span>
      <Link
        to={next?.to ?? "#"}
        search={next?.search}
        preload="intent"
        rel="next"
        aria-label="next page"
        aria-disabled={!next}
        className={clx("btn btn-ghost join-item", !next && "btn-disabled")}
      >
        <Icon id="chevron-right" />
      </Link>
    </div>
  );
}
