import { aiConfigErrorMessage, getAiConfig } from "./config";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export async function createChatCompletion(input: {
  messages: ChatMessage[];
  temperature?: number;
  jsonMode?: boolean;
}): Promise<string> {
  const config = getAiConfig();
  if (!config) {
    throw new Error(aiConfigErrorMessage());
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  };

  if (config.provider === "openrouter") {
    if (config.referer) {
      headers["HTTP-Referer"] = config.referer;
    }
    if (config.appTitle) {
      headers["X-OpenRouter-Title"] = config.appTitle;
    }
  }

  const body: Record<string, unknown> = {
    model: config.model,
    messages: input.messages,
    temperature: input.temperature ?? 0.15,
  };

  if (input.jsonMode) {
    body.response_format = { type: "json_object" };
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    const label = config.provider === "openrouter" ? "OpenRouter" : "OpenAI";
    throw new Error(`${label} error ${response.status}: ${err.slice(0, 300)}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("La IA no devolvió una respuesta");
  }

  return content;
}
