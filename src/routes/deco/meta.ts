import { createFileRoute } from "@tanstack/react-router";
import { decoMetaRouteConfig } from "@decocms/tanstack";

export const Route = createFileRoute("/deco/meta")(decoMetaRouteConfig());
