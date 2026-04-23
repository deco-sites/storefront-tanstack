import { createFileRoute } from "@tanstack/react-router";
import { decoRenderRoute } from "@decocms/start/routes";

export const Route = createFileRoute("/deco/render")(decoRenderRoute);
