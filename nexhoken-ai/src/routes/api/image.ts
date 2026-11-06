import { createFileRoute } from "@tanstack/react-router";

/** Image generation is intentionally deferred; the UI can be wired to a
 * separate image provider later without coupling it to the chat provider. */
export const Route = createFileRoute("/api/image")({
  server: {
    handlers: {
      POST: async () => Response.json(
        { error: "Image generation is not enabled yet. NEXHOKEN chat works independently; image generation will be added as a separate provider later." },
        { status: 501 },
      ),
    },
  },
});
