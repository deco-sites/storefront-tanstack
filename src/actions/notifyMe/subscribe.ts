import { usePlatform } from "../../apps/site";

export interface NotifyMeProps {
  /** SKU/variant the shopper wants a back-in-stock alert for. */
  skuId: string;
  email: string;
  name?: string;
}

export interface NotifyMeResult {
  success: boolean;
}

async function action(props: NotifyMeProps): Promise<NotifyMeResult> {
  const skuId = props?.skuId?.trim();
  const email = props?.email?.trim();
  // Public invoke endpoint — validate here, not just via the form.
  if (!skuId) throw new Error("skuId is required");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("a valid email is required");
  }

  const platform = usePlatform();

  if (platform === "vtex") {
    // TODO(consumer): wire the real VTEX back-in-stock endpoint, e.g.
    //   await invoke("vtex/actions/notifyme.ts", { skuId, name: props.name, email });
  }
  if (platform === "wake") {
    // TODO(consumer): wire the wake back-in-stock endpoint here.
  }
  // Default (neutral template): no email backend, so this is a documented
  // stub that confirms the UX. Platforms wire a real provider above.

  return { success: true };
}

export default action;
