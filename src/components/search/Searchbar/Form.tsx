/**
 * Search form. Submits to /s?q=<term>; as the user types (debounced), product
 * suggestions are fetched through the commerce product-list loader on
 * /deco/invoke and rendered below the input.
 */
import { useEffect, useRef, useState } from "react";
import type { Product, Suggestion } from "@decocms/apps-commerce/types";
import {
  SEARCHBAR_INPUT_FORM_ID,
  SEARCHBAR_POPUP_ID,
} from "../../../constants";
import { invoke } from "../../../runtime";
import Icon from "../../ui/Icon";
import Suggestions from "./Suggestions";
import { type Resolved } from "~/types/deco";

// When user clicks on the search button, navigate it to
export const ACTION = "/s";
// Querystring param used when navigating the user
export const NAME = "q";

export interface SearchbarProps {
  /**
   * @title Placeholder
   * @description Search bar default placeholder message
   * @default What are you looking for?
   */
  placeholder?: string;
  /** @description Loader to run when suggesting new elements */
  loader: Resolved<Suggestion | null>;
}

const SUGGESTIONS_COUNT = 6;
const SUGGESTIONS_DELAY_MS = 300;

// Shopify's ProductList loader returns urls like "undefined/products/<slug>"
// when it has no store origin; keep only the path so links resolve.
const fixUrl = (url?: string) => url?.replace(/^.*?(?=\/products\/)/, "");

const fetchSuggestion = async (query: string): Promise<Suggestion> => {
  const products = (await invoke.shopify.loaders.ProductList({
    props: { query, count: SUGGESTIONS_COUNT },
  })) as Product[] | null;
  return {
    searches: [],
    products: (products ?? []).map((product) => ({
      ...product,
      url: fixUrl(product.url),
      isVariantOf: product.isVariantOf && {
        ...product.isVariantOf,
        hasVariant: product.isVariantOf.hasVariant.map((v) => ({
          ...v,
          url: fixUrl(v.url),
        })),
      },
    })),
  };
};

export default function Searchbar(
  { placeholder = "What are you looking for?" }: SearchbarProps,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  useEffect(() => {
    const query = term.trim();
    if (!query) {
      setSuggestion(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      fetchSuggestion(query)
        .then((result) => !cancelled && setSuggestion(result))
        .catch(() => !cancelled && setSuggestion(null))
        .finally(() => !cancelled && setLoading(false));
    }, SUGGESTIONS_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isK = e.key === "k" || e.key === "K";
      if (e.metaKey && isK) {
        const popup = document.getElementById(
          SEARCHBAR_POPUP_ID,
        ) as HTMLInputElement | null;
        if (popup) {
          popup.checked = true;
          inputRef.current?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const onSubmit = () => {
    const term = inputRef.current?.value;
    if (term) {
      // `dispatch` exists at runtime (set up by the framework's DECO.events
      // bootstrap), but @decocms/apps' ambient Window.DECO type only declares
      // `subscribe`. Cast through the real shape to dispatch programmatically.
      const events = window.DECO?.events as unknown as
        | { dispatch?: (event: unknown) => void }
        | undefined;
      events?.dispatch?.({
        name: "search",
        params: { search_term: term },
      });
    }
  };

  return (
    <div
      className="w-full grid gap-8 px-4 py-6"
      style={{ gridTemplateRows: "min-content auto" }}
    >
      <form
        id={SEARCHBAR_INPUT_FORM_ID}
        action={ACTION}
        className="join"
        onSubmit={onSubmit}
      >
        <button
          type="submit"
          className="btn join-item btn-square no-animation"
          aria-label="Search"
          form={SEARCHBAR_INPUT_FORM_ID}
          tabIndex={-1}
        >
          {loading
            ? <span className="loading loading-spinner loading-xs" />
            : <Icon id="search" className="inline" />}
        </button>
        <input
          ref={inputRef}
          autoFocus
          tabIndex={0}
          className="input input-bordered join-item grow"
          name={NAME}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => setTerm(e.currentTarget.value)}
        />
        <label
          className="join-item btn btn-ghost btn-square hidden sm:inline-flex no-animation"
          htmlFor={SEARCHBAR_POPUP_ID}
          aria-label="Toggle searchbar"
        >
          <Icon id="close" />
        </label>
      </form>

      {/* Suggestions slot */}
      <div>
        {suggestion && <Suggestions suggestion={suggestion} />}
      </div>
    </div>
  );
}
