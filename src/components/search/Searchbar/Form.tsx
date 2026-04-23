/**
 * We use a custom route at /s?q= to perform the search. This component
 * redirects the user to /s?q={term} when the user either clicks on the
 * button or submits the form. Make sure this page exists in deco.cx/admin
 * of yout site. If not, create a new page on this route and add the appropriate
 * loader.
 *
 * Note that this is the most performatic way to perform a search, since
 * no JavaScript is shipped to the browser!
 */
import { Suggestion } from "@decocms/apps/commerce/types";
import {
  SEARCHBAR_INPUT_FORM_ID,
  SEARCHBAR_POPUP_ID,
} from "../../../constants";
import { useId } from "react";
import { useComponent } from "../../../sections/Component";
import Icon from "../../ui/Icon";
import { Props as SuggestionProps } from "./Suggestions";
import { useScript } from "@decocms/start/sdk/useScript";
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
const script = (formId: string, name: string, popupId: string) => {
  const form = document.getElementById(formId) as HTMLFormElement | null;
  const input = form?.elements.namedItem(name) as HTMLInputElement | null;
  form?.addEventListener("submit", () => {
    const search_term = input?.value;
    if (search_term) {
      window.DECO.events.dispatch({
        name: "search",
        params: { search_term },
      });
    }
  });
  // Keyboard event listeners
  addEventListener("keydown", (e: KeyboardEvent) => {
    const isK = e.key === "k" || e.key === "K" || e.keyCode === 75;
    // Open Searchbar on meta+k
    if (e.metaKey === true && isK) {
      const input = document.getElementById(popupId) as HTMLInputElement | null;
      if (input) {
        input.checked = true;
        document.getElementById(formId)?.focus();
      }
    }
  });
};
const Suggestions = "./Suggestions.tsx";
export default function Searchbar(
  { placeholder = "What are you looking for?", loader }: SearchbarProps,
) {
  const slot = useId();
  return (
    <div
      className="w-full grid gap-8 px-4 py-6"
      style={{ gridTemplateRows: "min-content auto" }}
    >
      <form id={SEARCHBAR_INPUT_FORM_ID} action={ACTION} className="join">
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
          autoFocus
          tabIndex={0}
          className="input input-bordered join-item grow"
          name={NAME}
          placeholder={placeholder}
          autoComplete="off"
          hx-target={`#${slot}`}
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

      {/* Send search events as the user types */}
      <script
        type="module"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: useScript(
            script,
            SEARCHBAR_INPUT_FORM_ID,
            NAME,
            SEARCHBAR_POPUP_ID,
          ),
        }}
      />
    </div>
  );
}
