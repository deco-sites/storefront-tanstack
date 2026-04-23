/* eslint-disable react-compiler/react-compiler -- file uses misnamed deco helper (useComponent) that triggers react-hooks rule disable */
/**
 * Search form. Submits to /s?q=<term>; as the user types, suggestions are
 * fetched via HTMX (kept for now — the suggestions migration is its own task).
 */
import { useEffect, useId, useRef } from "react";
import { Suggestion } from "@decocms/apps/commerce/types";
import {
  SEARCHBAR_INPUT_FORM_ID,
  SEARCHBAR_POPUP_ID,
} from "../../../constants";
import { useComponent } from "../../../sections/Component";
import Icon from "../../ui/Icon";
import { Props as SuggestionProps } from "./Suggestions";
import { asResolved } from "~/types/deco";
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

const Suggestions = "./Suggestions.tsx";

export default function Searchbar(
  { placeholder = "What are you looking for?", loader }: SearchbarProps,
) {
  const slot = useId();
  const inputRef = useRef<HTMLInputElement>(null);

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
      window.DECO?.events.dispatch({
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
          <span className="loading loading-spinner loading-xs hidden [.htmx-request_&]:inline" />
          <Icon id="search" className="inline [.htmx-request_&]:hidden" />
        </button>
        <input
          ref={inputRef}
          autoFocus
          tabIndex={0}
          className="input input-bordered join-item grow"
          name={NAME}
          placeholder={placeholder}
          autoComplete="off"
          hx-target={`#${slot}`}
          // eslint-disable-next-line react-hooks/rules-of-hooks -- useComponent is a misnamed HTMX URL builder from @decocms/apps, not a React hook
          hx-post={loader && useComponent<SuggestionProps>(Suggestions, {
            loader: asResolved(loader),
          })}
          hx-trigger={`input changed delay:300ms, ${NAME}`}
          hx-indicator={`#${SEARCHBAR_INPUT_FORM_ID}`}
          hx-swap="innerHTML"
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
      <div id={slot} />
    </div>
  );
}
