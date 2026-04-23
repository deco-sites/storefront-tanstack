import { AnalyticsEvent } from "@decocms/apps/commerce/types";

export interface Options<E extends AnalyticsEvent> {
  event: E;
  on: "click" | "view" | "change";
}

export const useSendEvent = <E extends AnalyticsEvent>({ event, on }: Options<E>) => ({
  "data-event": encodeURIComponent(JSON.stringify(event)),
  "data-event-trigger": on,
});
