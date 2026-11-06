import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { z } from "zod";

import { createAIChatModel, getAIProviderConfig } from "./provider.server";

const bodySchema = z.object({
  messages: z.array(z.any()).min(1).max(100),
  threadId: z.string().min(4).max(64).regex(/^[a-zA-Z0-9_-]+$/),
  model: z.string().max(120).optional(),
  persona: z
    .object({
      name: z.string().max(40).default("Ken"),
      personality: z.string().max(1500).default(""),
      language: z.string().max(40).default("English"),
    })
    .optional(),
});

function buildInstructions(persona?: { name: string; personality: string; language: string }) {
  const name = persona?.name?.trim() || "Ken";
  const personality = persona?.personality?.trim() || "Friendly, warm, clear and concise.";
  const language = persona?.language?.trim() || "English";

  return [
    `You are ${name}, the AI assistant of NEXHOKEN AI (Project Ken, symbol 肯).`,
    `Personality and style: ${personality}`,
    `Default reply language: ${language}. If the user writes or speaks in another language, reply in that language instead.`,
    "Creator: you were created by Muhammad Ashik, known online as KenXeo. If anyone asks who created, built or made you, say so proudly.",
    "You are an all-round helper: coding and debugging, homework and step-by-step explanations, math, writing, planning, studying, research, advice and creative ideas. Teach clearly; for homework, explain the steps.",
    "If the user wants a picture, explain that image generation is not enabled in this deployment yet.",
    "Use Markdown for structure and fenced code blocks with a language tag for code.",
    "Your replies may be read aloud, so keep them conversational and avoid huge tables unless asked.",
  ].join("\n");
}

function providerErrorMessage(error: unknown) {
  const status = (error as { statusCode?: number; status?: number })?.statusCode ??
    (error as { status?: number })?.status;
  if (status === 401 || status === 403) return "The configured AI provider rejected the API key. Check AI_API_KEY and provider settings.";
  if (status === 404) return "The configured model was not found by this provider. Check AI_MODEL and the provider's model list.";
  if (status === 429) return "The AI provider is rate-limiting requests or the account has reached its usage limit. Try again later.";
  return "Ken couldn't complete that reply. Check the provider configuration and try again.";
}

export async function handleChat(request: Request) {
  const config = getAIProviderConfig();
  if (!config) {
    return Response.json(
      { error: "AI is not configured. Add AI_API_KEY and choose an AI_PROVIDER in your local .env file or Vercel environment variables. See README.md for provider examples." },
      { status: 503 },
    );
  }

  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid chat request. Please refresh and try again." }, { status: 400 });
  }

  const messages = parsed.messages as UIMessage[];
  // Generated images are kept in the browser and are not sent back to the text model.
  const modelInput = messages.map((message) => ({
    ...message,
    parts: message.parts.filter((part) => part.type === "text"),
  }));

  try {
    const model = createAIChatModel(parsed.model);
    if (!model) {
      return Response.json({ error: "AI provider configuration is incomplete. Check AI_PROVIDER, AI_API_KEY, AI_MODEL and AI_BASE_URL." }, { status: 503 });
    }

    const result = streamText({
      model,
      system: buildInstructions(parsed.persona),
      messages: await convertToModelMessages(modelInput),
      abortSignal: request.signal,
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      onError: (error) => {
        console.error(`[NEXHOKEN chat:${config.provider}] Provider error:`, error);
        return providerErrorMessage(error);
      },
    });
  } catch (error) {
    console.error(`[NEXHOKEN chat:${config.provider}] Request failed:`, error);
    return Response.json({ error: providerErrorMessage(error) }, { status: 502 });
  }
}
