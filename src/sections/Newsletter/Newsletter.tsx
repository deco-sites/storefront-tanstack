import { useMutation } from "@tanstack/react-query";
import Icon from "../../components/ui/Icon";
import Section from "../../components/ui/Section";
import { invoke } from "../../runtime";
import type { SubscribeNewsletterResult } from "../../actions/newsletter/subscribe";
import { clx } from "~/sdk/clx";

export interface NoticeProps {
  /**
   * @title Title
   * @description Bold heading shown for this notice state
   */
  title?: string;
  /**
   * @title Description
   * @description Subtext explaining the notice state
   */
  description?: string;
}

export interface NoticeConfig {
  /**
   * @title Empty state
   * @description Initial pre-signup notice (call-to-action)
   */
  empty?: NoticeProps;
  /**
   * @title Success state
   * @description Notice shown after a successful subscription
   */
  success?: NoticeProps;
  /**
   * @title Failed state
   * @description Notice shown when the subscription request fails
   */
  failed?: NoticeProps;
}

export interface FormConfig {
  /**
   * @title Submit button label
   * @description Text on the signup CTA
   * @default "Sign up"
   */
  label?: string;
  /**
   * @title Email placeholder
   * @description Placeholder shown inside the email input
   * @default "Enter your email address"
   */
  placeholder?: string;
}

export interface Props {
  /**
   * @title Notices
   * @description Empty / success / failed notice copies
   */
  notices?: NoticeConfig;
  /**
   * @title Form
   * @description Submit label and placeholder copy
   */
  form?: FormConfig;
}

const DEFAULT_NOTICES = {
  empty: {
    title: "Get top deals, latest trends, and more.",
    description:
      "Receive our news and promotions in advance. Enjoy and get 10% off your first purchase. For more information click here.",
  },
  success: {
    title: "Thank you for subscribing!",
    description:
      "You're now signed up to receive the latest news, trends, and exclusive promotions directly to your inbox. Stay tuned!",
  },
  failed: {
    title: "Oops. Something went wrong!",
    description:
      "Something went wrong. Please try again. If the problem persists, please contact us.",
  },
} satisfies Required<NoticeConfig>;

async function subscribeNewsletter(email: string): Promise<void> {
  const result = (await invoke.site.actions.newsletter.subscribe({
    email,
  })) as SubscribeNewsletterResult | undefined;
  if (!result?.success) {
    throw new Error("Newsletter subscription failed");
  }
}

function Notice({ title, description }: NoticeProps) {
  return (
    <div className="flex flex-col justify-center items-center sm:items-start gap-4">
      <span className="text-3xl font-semibold text-center sm:text-start">
        {title}
      </span>
      <span className="text-sm font-normal text-base-400 text-center sm:text-start">
        {description}
      </span>
    </div>
  );
}

export default function Newsletter({ notices, form }: Props) {
  const empty = { ...DEFAULT_NOTICES.empty, ...notices?.empty };
  const success = { ...DEFAULT_NOTICES.success, ...notices?.success };
  const failed = { ...DEFAULT_NOTICES.failed, ...notices?.failed };
  const label = form?.label ?? "Sign up";
  const placeholder = form?.placeholder ?? "Enter your email address";

  const subscribe = useMutation({ mutationFn: subscribeNewsletter });

  if (subscribe.isSuccess || subscribe.isError) {
    const isSuccess = subscribe.isSuccess;
    return (
      <Section.Container className="bg-base-200">
        <div className="p-14 flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-10">
          <Icon
            size={80}
            className={clx(isSuccess ? "text-success" : "text-error")}
            id={isSuccess ? "check-circle" : "error"}
          />
          <div className="flex flex-col items-center sm:items-start gap-4">
            <Notice {...(isSuccess ? success : failed)} />
            {subscribe.isError && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => subscribe.reset()}
              >
                Try again
              </button>
            )}
          </div>
        </div>
      </Section.Container>
    );
  }

  return (
    <Section.Container className="bg-base-200">
      <div className="p-14 grid grid-flow-row sm:grid-cols-2 gap-10 sm:gap-20 place-items-center">
        <Notice {...empty} />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const email = `${data.get("email") ?? ""}`.trim();
            if (email) subscribe.mutate(email);
          }}
          className="flex flex-col sm:flex-row gap-4 w-full"
        >
          <input
            name="email"
            type="email"
            required
            className="input input-bordered grow"
            placeholder={placeholder}
            disabled={subscribe.isPending}
          />

          <button
            className="btn btn-primary"
            type="submit"
            disabled={subscribe.isPending}
          >
            {subscribe.isPending ? (
              <span className="loading loading-spinner" />
            ) : (
              <span>{label}</span>
            )}
          </button>
        </form>
      </div>
    </Section.Container>
  );
}

export const LoadingFallback = () => <Section.Placeholder height="412px" />;
