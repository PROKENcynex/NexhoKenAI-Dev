# NEXHOKEN AI — project notes

- This is an independent React + TypeScript application built with TanStack Start.
- The app is deployed with Vercel using the Nitro Vite plugin.
- Chat requests flow through `src/routes/api/chat.ts` to `src/lib/ai/chat.server.ts`.
- The provider adapter in `src/lib/ai/provider.server.ts` supports OpenAI-compatible chat endpoints. Configure `AI_PROVIDER`, `AI_API_KEY`, and optional `AI_MODEL` / `AI_BASE_URL` on the server only.
- Never expose provider credentials in frontend code or variables prefixed with `VITE_`.
- Image generation is intentionally deferred; the existing composer control remains visible but disabled.
- Threads and assistant customization are stored in the browser's localStorage. There is no account system or cloud chat database in this version.
- Voice input/output uses the browser Web Speech API. Browser and device support varies.
- Accent color is driven by the `--hue` CSS variable in `src/styles.css`.
- Generated route files such as `src/routeTree.gen.ts` are maintained by TanStack Router.
