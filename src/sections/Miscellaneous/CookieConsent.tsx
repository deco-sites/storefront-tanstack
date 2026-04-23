import { useEffect, useState } from "react";
import { HTMLWidget } from "~/types/widgets";
import { clx } from "~/sdk/clx";

const STORAGE_KEY = "store-cookie-consent";
const ACCEPTED = "accepted";

export interface PolicyConfig {
  /**
   * @title Policy link text
   * @description Anchor text shown next to the consent message
   * @default "Learn more about our privacy policy"
   */
  text?: string;
  /**
   * @title Policy URL
   * @description Internal link to the privacy policy page
   * @default "/privacy-policy"
   */
  link?: string;
}

export interface ButtonsConfig {
  /**
   * @title Accept label
   * @description Confirms cookie usage and dismisses the banner
   * @default "Accept"
   */
  allowText: string;
  /**
   * @title Dismiss label
   * @description Closes the banner without accepting (re-shown next visit)
   * @default "Close"
   */
  cancelText?: string;
}

export interface LayoutConfig {
  /**
   * @title Banner position
   * @description Where the banner sticks at the bottom of the viewport
   * @default "Expanded"
   */
  position?: "Expanded" | "Left" | "Center" | "Right";
  /**
   * @title Content layout
   * @description Stack the message and buttons in a row or column
   * @default "Tiled"
   */
  content?: "Tiled" | "Piled up";
}

export interface Props {
  /**
   * @title Title
   * @description Heading shown at the top of the consent banner
   * @default "Cookies"
   */
  title?: string;
  /**
   * @title Body
   * @description Rich-text consent message
   */
  text?: HTMLWidget;
  /**
   * @title Privacy policy
   * @description Link shown beneath the message
   */
  policy?: PolicyConfig;
  /**
   * @title Buttons
   * @description Accept / dismiss button labels
   */
  buttons?: ButtonsConfig;
  /**
   * @title Layout
   * @description Banner position and content arrangement
   */
  layout?: LayoutConfig;
}

function CookieConsent({
  title = "Cookies",
  text = "We collect visit statistics to improve your browsing experience.",
  policy = {
    text: "Learn more about our privacy policy",
    link: "/privacy-policy",
  },
  buttons = {
    allowText: "Accept",
    cancelText: "Close",
  },
}: Props) {
  // visible drives a CSS transform — we don't render the DOM until first scroll
  // so consenting visitors don't pay layout cost on every page.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === ACCEPTED) return;
    const onScroll = () => setVisible(true);
    addEventListener("scroll", onScroll, { once: true, passive: true });
    return () => removeEventListener("scroll", onScroll);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, ACCEPTED);
    setVisible(false);
  };

  return (
    <div
      className={clx(
        "transform-gpu transition fixed bottom-0 w-screen z-50 sm:flex",
        "sm:bottom-2 sm:justify-center",
        visible ? "translate-y-0" : "translate-y-[200%]",
      )}
    >
      <div
        className={clx(
          "p-4 mx-4 my-2 flex flex-col gap-4 shadow bg-base-100 rounded border border-base-200",
          "sm:flex-row sm:items-end",
        )}
      >
        <div className={clx("flex-auto flex flex-col gap-4", "sm:gap-2")}>
          <h3 className="text-xl">{title}</h3>
          {text && (
            <div
              className="text-base"
              dangerouslySetInnerHTML={{ __html: text }}
            />
          )}

          <a href={policy.link} className="text-sm link link-secondary">
            {policy.text}
          </a>
        </div>

        <div className="flex flex-col gap-2">
          <button type="button" className="btn" onClick={accept}>
            {buttons.allowText}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setVisible(false)}
          >
            {buttons.cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}
export const LoadingFallback = () => null;
export default CookieConsent;
