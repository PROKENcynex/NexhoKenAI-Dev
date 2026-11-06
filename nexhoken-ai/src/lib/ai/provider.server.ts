import { createOpenAI } from "@ai-sdk/openai";

/**
 * NEXHOKEN's provider adapter uses the OpenAI-compatible Chat Completions
 * interface. Switch providers with server environment variables; no frontend
 * changes are needed. Provider API keys are never exposed to the browser.
 */
const PROVIDER_PRESETS = {
  openai: {
    baseURL: "https://api.openai.com/v1",
    defaultModel: "gpt-4.1-mini",
  },
  groq: {
    baseURL: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
  },
  openrouter: {
    baseURL: "https://openrouter.ai/api/v1",
    defaultModel: "openai/gpt-4.1-mini",
  },
  gemini: {
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    defaultModel: "gemini-2.5-flash",
  },
} as const;

export type ProviderName = keyof typeof PROVIDER_PRESETS | "custom";

export interface AIProviderConfig {
  provider: ProviderName;
  model: string;
  baseURL: string;
  apiKey: string;
}

export function getAIProviderConfig(): AIProviderConfig | null {
  const providerValue = (process.env["AI_PROVIDER"] || "groq").trim().toLowerCase();
  const provider = (providerValue in PROVIDER_PRESETS || providerValue === "custom"
    ? providerValue
    : "custom") as ProviderName;
  const preset = provider === "custom" ? undefined : PROVIDER_PRESETS[provider];
  const apiKey = process.env["AI_API_KEY"]?.trim();
  const baseURL = process.env["AI_BASE_URL"]?.trim() || preset?.baseURL || "";
  const model = process.env["AI_MODEL"]?.trim() || preset?.defaultModel || "";

  if (!apiKey || !baseURL || !model) return null;
  return { provider, model, baseURL, apiKey };
}

export function createAIChatModel(modelOverride?: string) {
  const config = getAIProviderConfig();
  if (!config) return null;

  const provider = createOpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    ...(config.provider === "openrouter" ? { headers: { "X-Title": "NEXHOKEN AI" } } : {}),
  });

  return provider.chat(modelOverride?.trim() || config.model);
}

export function getPublicProviderStatus() {
  const config = getAIProviderConfig();
  return {
    configured: Boolean(config),
    provider: config?.provider ?? null,
    model: config?.model ?? null,
  };
}
