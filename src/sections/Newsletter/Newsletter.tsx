import { useMutation } from "@tanstack/react-query";
import Icon from "../../components/ui/Icon";
import Section from "../../components/ui/Section";
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

// TODO(phase-6): replace with a real subscribeNewsletterServerFn (createServerFn
// or invoke.site.actions.newsletter.subscribe) once the platform action lands.
async function subscribeNewsletter(_email: string): Promise<void> {
  throw new Error("Newsletter subscription not yet wired to a platform action.");
}

function Notice({ title, description }: NoticeProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 sm:items-start">
      <span className="text-center text-3xl font-semibold sm:text-start">{title}</span>
      <span className="text-base-400 text-center text-sm font-normal sm:text-start">
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
        <div className="flex flex-col items-center justify-center gap-5 p-14 sm:flex-row sm:gap-10">
          <Icon
            size={80}
            className={clx(isSuccess ? "text-success" : "text-error")}
            id={isSuccess ? "check-circle" : "error"}
          />
          <Notice {...(isSuccess ? success : failed)} />
        </div>
      </Section.Container>
    );
  }

  return (
    <Section.Container className="bg-base-200">
      <div className="grid grid-flow-row place-items-center gap-10 p-14 sm:grid-cols-2 sm:gap-20">
        <Notice {...empty} />

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const email = `${data.get("email") ?? ""}`.trim();
            if (email) subscribe.mutate(email);
          }}
          className="flex w-full flex-col gap-4 sm:flex-row"
        >
          <input
            name="email"
            type="email"
            required
            className="input-bordered input grow"
            placeholder={placeholder}
            disabled={subscribe.isPending}
          />

          <button className="btn btn-primary" type="submit" disabled={subscribe.isPending}>
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
