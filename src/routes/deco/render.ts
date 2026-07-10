import { createFileRoute } from "@tanstack/react-router";
import { decoRenderRouteConfig } from "@decocms/tanstack";

export const Route = createFileRoute("/deco/render")(decoRenderRouteConfig());
