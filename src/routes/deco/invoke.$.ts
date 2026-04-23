import { createFileRoute } from "@tanstack/react-router";
import { decoInvokeRoute } from "@decocms/start/routes";

export const Route = createFileRoute("/deco/invoke/$")(decoInvokeRoute);
