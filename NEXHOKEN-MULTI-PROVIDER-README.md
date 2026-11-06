# NEXHOKEN AI

NEXHOKEN AI is a customizable chat and voice assistant built with React, TypeScript, TanStack Start, Tailwind CSS, and the Vercel AI SDK. Its chat backend is provider-independent: switch between supported OpenAI-compatible AI services using server environment variables, without changing the frontend.

## Features

- Streaming AI chat through a configurable provider adapter
- Provider presets for Groq, OpenRouter, Google Gemini's OpenAI-compatible endpoint, and OpenAI
- Custom OpenAI-compatible endpoints through `AI_BASE_URL`
- Browser speech recognition and text-to-speech (browser support varies)
- Multiple local conversations and chat history
- Custom assistant name, personality, language, theme, accent, and voice settings
- Incognito mode for chats that should not be written to local chat history
- Responsive interface for desktop and mobile
- Vercel deployment using TanStack Start + Nitro
- Image-generation UI retained, while the image provider is deliberately deferred

## Architecture

The browser talks only to NEXHOKEN's own `/api/chat` endpoint. The server-side provider adapter in `src/lib/ai/provider.server.ts` selects a provider, base URL, model, and secret key from environment variables. Provider credentials are never sent to the browser.

The current adapter targets providers that expose an OpenAI-compatible **Chat Completions** API. Provider APIs and model availability can change; check the selected provider's documentation before configuring it. This is not a universal adapter for every proprietary API protocol.

## Supported provider presets

| `AI_PROVIDER` | Preset base URL | Default model |
| --- | --- | --- |
| `groq` | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` |
| `openrouter` | `https://openrouter.ai/api/v1` | `openai/gpt-4.1-mini` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai/` | `gemini-2.5-flash` |
| `openai` | `https://api.openai.com/v1` | `gpt-4.1-mini` |
| `custom` | Set `AI_BASE_URL` | Set `AI_MODEL` |

Presets are convenience defaults, not guarantees that a model is free, enabled for your account, or available in your region. For a provider's current model names, free quotas, billing, and API compatibility, consult that provider's official documentation.

Provider key dashboards: [Groq](https://console.groq.com/keys) · [OpenRouter](https://openrouter.ai/keys) · [Google AI Studio](https://aistudio.google.com/apikey) · [OpenAI](https://platform.openai.com/api-keys). Account eligibility, regional availability, free quotas, and billing rules are controlled by each provider.

## Requirements

- Node.js 20 or newer (Node.js 22 LTS recommended)
- npm
- An API key from one supported AI provider

NEXHOKEN itself does not issue API keys. The API key belongs to the provider you choose. Some providers offer limited free quotas; others require billing. Never assume free access or unlimited usage.

## Run locally

1. Clone your GitHub repository:

   ```bash
   git clone https://github.com/YOUR_USERNAME/nexhoken-ai.git
   cd nexhoken-ai
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the example environment file:

   **Windows PowerShell:**
   ```powershell
   Copy-Item .env.example .env
   ```

   **macOS/Linux:**
   ```bash
   cp .env.example .env
   ```

4. Edit `.env`. For example, with Groq:

   ```env
   AI_PROVIDER=groq
   AI_API_KEY=put_your_provider_key_here
   AI_MODEL=
   AI_BASE_URL=
   ```

   Leave `AI_MODEL` and `AI_BASE_URL` blank to use the preset defaults. Or override them with a model and base URL supported by your chosen provider.

5. Start the development server:

   ```bash
   npm run dev
   ```

Open the local URL printed by Vite (usually `http://localhost:3000`).

## Environment variables

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `AI_PROVIDER` | Yes | `groq` | Provider preset: `groq`, `openrouter`, `gemini`, `openai`, or `custom`. |
| `AI_API_KEY` | Yes | — | Secret API key issued by the selected provider. |
| `AI_MODEL` | No | Provider preset | Override the provider's default model ID. |
| `AI_BASE_URL` | Only for `custom` | Provider preset | Base URL for an OpenAI-compatible API. Can also override a preset URL. |

For `custom`, set all three: `AI_PROVIDER=custom`, `AI_API_KEY`, `AI_MODEL`, and `AI_BASE_URL`.

**Security:** Never put `AI_API_KEY` in a `VITE_` variable, frontend source file, Git commit, screenshot, or public issue. The `.env` file is ignored by Git. If a key is accidentally published, revoke it at the provider and create a new one.

## Deploy to Vercel

1. Push this project to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Keep the detected TanStack Start framework and default build settings.
4. Open **Project → Settings → Environment Variables**.
5. Add `AI_PROVIDER` and `AI_API_KEY`. Optionally add `AI_MODEL` and `AI_BASE_URL` if you want to override the preset.
6. Select the Production, Preview, and Development environments as appropriate.
7. Deploy or redeploy after changing environment variables.

The project includes `vercel.json` and the Nitro Vite plugin for TanStack Start deployment.

## Check deployment

- Visit `/api/health` on your deployed domain. It reports whether the server has a provider configured and shows the provider/model names. It never returns the API key.
- Send a test message in the chat.
- If chat fails, inspect Vercel **Deployments → latest deployment → Build Logs**, then **Logs** for runtime errors.

## Build and checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Run these checks after making changes. A successful deployment build does not guarantee the provider key, model access, or quota is valid; test a real chat request too.

## Where to make changes

| Task | File or folder |
| --- | --- |
| Chat interface | `src/components/ken/ChatWindow.tsx` |
| Main layout and sidebar | `src/components/ken/KenApp.tsx` |
| Settings UI | `src/components/ken/SettingsPanel.tsx` |
| Logo and image assets | `src/assets/` |
| Global styling | `src/styles.css` |
| Assistant settings and defaults | `src/lib/ken-settings.tsx` |
| Local chat history | `src/lib/threads.ts` |
| Voice input/output | `src/lib/speech.ts` |
| Chat API route | `src/routes/api/chat.ts` |
| Provider adapter | `src/lib/ai/provider.server.ts` |
| Chat orchestration and assistant instructions | `src/lib/ai/chat.server.ts` |
| Image-generation placeholder | `src/routes/api/image.ts` |
| Provider status endpoint | `src/routes/api/health.ts` |
| Page title and app metadata | `src/routes/__root.tsx` |
| Vercel build configuration | `vite.config.ts`, `vercel.json` |
| Dependencies and scripts | `package.json` |

## Data and privacy notes

- Conversations and assistant preferences are stored in the current browser's localStorage. They do not automatically sync between devices.
- This version does not include user accounts, a hosted database, or cloud chat synchronization.
- Chat prompts are sent from the NEXHOKEN server to the AI provider selected in environment variables. Review that provider's privacy, data-retention, and billing terms before sending sensitive information.
- Image generation is intentionally not connected in this release. The existing image control displays a clear not-enabled response until a separate image provider is added.
- Public chat endpoints can incur API usage. Before sharing the app widely, add rate limiting, abuse protection, and usage controls.

## License

No license is currently specified. Add a license file if you want to grant others explicit reuse rights.
