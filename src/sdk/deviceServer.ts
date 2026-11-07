import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { detectDevice } from "@decocms/compat-v7/device";

export const getDeviceFromServer = createServerFn({ method: "GET" }).handler(
  async () => {
    const ua = getRequestHeader("user-agent") ?? "";
    return detectDevice(ua);
  },
);
