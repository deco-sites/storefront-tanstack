import { createFileRoute } from "@tanstack/react-router";
import { decoInvokeRouteConfig } from "@decocms/tanstack";

export const Route = createFileRoute("/deco/invoke/$")(decoInvokeRouteConfig());
