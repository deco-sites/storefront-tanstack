import { createFileRoute } from "@tanstack/react-router";
import { decoMetaRoute } from "@decocms/start/routes";

export const Route = createFileRoute("/deco/meta")(decoMetaRoute);
