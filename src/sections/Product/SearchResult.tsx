export { default, loader } from "../../components/search/SearchResult";

// Eager so the section stays mounted across URL changes (filter/sort/page).
// Deferred sections re-resolve by propsHash and remount with a page-wide
// skeleton; eager sections receive new props from the route loader and only
// the products grid swaps to a skeleton via TanStack Router's loading state
// (see SearchResult.tsx). Filters/breadcrumb/sort stay visible the whole time.
export const eager = true;

// NOTE: deliberately NOT cached. The section loader injects `req.url` into
// props so Filters/Sort/Pagination can rebase commerce-loader URLs onto the
// current page path. The framework's section cache keys on props only, so
// caching would freeze the first request's URL across every subsequent page.
