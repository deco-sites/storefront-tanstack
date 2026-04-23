import { useEffect, useState } from "react";
import type { HTMLWidget } from "~/types/widgets";
import Section from "../../components/ui/Section";

export interface Props {
  /**
   * @title Text
   * @default Time left for a campaign to end with a link
   */
  text?: HTMLWidget;
  /**
   * @title Expires at date
   * @format datetime
   */
  expiresAt?: string;
  /**
   * @title Unit labels
   * @description Localizable labels for the days/hours/minutes/seconds counters
   */
  labels?: LabelsConfig;
}

export interface LabelsConfig {
  /**
   * @title Days label
   * @default "Days"
   */
  days?: string;
  /**
   * @title Hours label
   * @default "Hours"
   */
  hours?: string;
  /**
   * @title Minutes label
   * @default "Minutes"
   */
  minutes?: string;
  /**
   * @title Seconds label
   * @default "Seconds"
   */
  seconds?: string;
}

interface Delta {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

const computeDelta = (target: number): Delta => {
  const diff = target - Date.now();
  if (diff < 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((diff % (1000 * 60)) / 1000),
    expired: false,
  };
};

function TimeUnit(
  { value, label }: { value: number; label?: string },
) {
  return (
    <div className="flex flex-col items-center">
      <span className="countdown font-normal text-xl lg:text-2xl">
        <span
          className="text-6xl md:text-8xl font-thin text-base-content tracking-[-3px]"
          style={{ "--value": value } as React.CSSProperties}
        />
      </span>
      <span className="md:text-2xl text-base-content font-thin">
        {label ?? ""}
      </span>
    </div>
  );
}

function CampaignTimer({
  expiresAt = `${new Date()}`,
  labels = {
    days: "days",
    hours: "hours",
    minutes: "minutes",
    seconds: "seconds",
  },
  text = "",
}: Props) {
  const target = new Date(expiresAt).getTime();
  const [delta, setDelta] = useState<Delta>(() => computeDelta(target));

  useEffect(() => {
    if (delta.expired) return;
    const timer = setInterval(() => {
      const next = computeDelta(target);
      setDelta(next);
      if (next.expired) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [target, delta.expired]);

  return (
    <div>
      <div className="container mx-auto flex flex-col lg:flex-row lg:items-center lg:justify-center gap-4 py-16 sm:px-10 lg:gap-16">
        {delta.expired
          ? (
            <div
              className="text-sm text-center lg:text-xl lg:text-left lg:max-w-lg"
              dangerouslySetInnerHTML={{ __html: text || "Expired!" }}
            />
          )
          : (
            <div className="flex flex-wrap gap-8 lg:gap-16 items-center justify-center lg:justify-normal">
              <div className="grid grid-flow-col gap-5 sm:gap-10 md:gap-20 text-center auto-cols-max items-center">
                <TimeUnit value={delta.days} label={labels?.days} />
                <TimeUnit value={delta.hours} label={labels?.hours} />
                <TimeUnit value={delta.minutes} label={labels?.minutes} />
                <TimeUnit value={delta.seconds} label={labels?.seconds} />
              </div>
            </div>
          )}
      </div>
    </div>
  );
}
export const LoadingFallback = () => <Section.Placeholder height="635px" />;
export default CampaignTimer;
