export type AiProvider = "openrouter" | "openai";

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  referer?: string;
  appTitle?: string;
}

const DEFAULT_OPENROUTER_MODEL = "openai/gpt-4o-mini";
const DEFAULT_OPENAI_MODEL = "gpt-4o-mini";

export function isAiConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY);
}

export function getAiConfig(): AiConfig | null {
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openRouterKey) {
    return {
      provider: "openrouter",
      apiKey: openRouterKey,
      baseUrl:
        process.env.OPENROUTER_BASE_URL?.trim() ||
        "https://openrouter.ai/api/v1",
      model:
        process.env.OPENROUTER_MODEL?.trim() ||
        process.env.AI_MODEL?.trim() ||
        DEFAULT_OPENROUTER_MODEL,
      referer: process.env.NEXT_PUBLIC_APP_URL?.trim(),
      appTitle: process.env.OPENROUTER_APP_NAME?.trim() || "Fast Cedu",
    };
  }

  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (openAiKey) {
    return {
      provider: "openai",
      apiKey: openAiKey,
      baseUrl: "https://api.openai.com/v1",
      model:
        process.env.OPENAI_MODEL?.trim() ||
        process.env.AI_MODEL?.trim() ||
        DEFAULT_OPENAI_MODEL,
    };
  }

  return null;
}

export function aiConfigErrorMessage(): string {
  return "Configurá OPENROUTER_API_KEY en .env.local (o OPENAI_API_KEY para OpenAI directo).";
}
