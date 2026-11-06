import { createFileRoute } from "@tanstack/react-router";
import { getPublicProviderStatus } from "@/lib/ai/provider.server";

export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: () => Response.json({ app: "NEXHOKEN AI", ...getPublicProviderStatus() }),
    },
  },
});
