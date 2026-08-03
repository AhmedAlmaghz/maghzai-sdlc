import { defaultAiModel, isKnownAiProvider } from "./types";
import type { AiProvider } from "./types";

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

/** Placeholder patterns that should NOT be treated as real credentials */
const PLACEHOLDER_PATTERNS = [
  /^optional[_-]/i,
  /^alternative[_-]/i,
  /^your[_-]/i,
  /^your\s/i,
  /placeholder/i,
  /_endpoint$/i,
  /endpoint_here$/i,
  /_key_here$/i,
  /_api_key_here$/i,
  /^example[_-]/i,
  /^demo[_-]/i,
];

function isRealCredential(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  return !PLACEHOLDER_PATTERNS.some((p) => p.test(v));
}

export function hasGeminiCredentials(): boolean {
  return isRealCredential(env("GEMINI_API_KEY")) || isRealCredential(env("GOOGLE_API_KEY"));
}

export function hasOpenAiCompatibleCredentials(): boolean {
  return isRealCredential(env("OPENAI_API_KEY")) || isRealCredential(env("AI_OPENAI_API_KEY"));
}

export function hasOpenCodeCredentials(): boolean {
  return isRealCredential(env("OPENCODE_API_KEY")) || isRealCredential(env("AI_OPENCODE_API_KEY"));
}

export function hasMistralCredentials(): boolean {
  return isRealCredential(env("MISTRAL_API_KEY")) || isRealCredential(env("AI_MISTRAL_API_KEY"));
}

export function hasGroqCredentials(): boolean {
  return isRealCredential(env("GROQ_API_KEY")) || isRealCredential(env("AI_GROQ_API_KEY"));
}

export function defaultOpenAiCompatibleModel(): string {
  return env("OPENAI_MODEL") || env("AI_OPENAI_MODEL") || defaultAiModel("openai-compatible");
}

export function defaultOpenCodeModel(): string {
  return env("OPENCODE_MODEL") || env("AI_OPENCODE_MODEL") || defaultAiModel("opencode");
}

export function defaultMistralModel(): string {
  return env("MISTRAL_MODEL") || env("AI_MISTRAL_MODEL") || defaultAiModel("mistral");
}

export function defaultGroqModel(): string {
  return env("GROQ_MODEL") || env("AI_GROQ_MODEL") || defaultAiModel("groq");
}

function firstConfiguredProvider(): { aiProvider: AiProvider; aiModel: string } | null {
  if (hasGeminiCredentials()) return { aiProvider: "gemini", aiModel: defaultAiModel("gemini") };
  if (hasOpenAiCompatibleCredentials()) return { aiProvider: "openai-compatible", aiModel: defaultOpenAiCompatibleModel() };
  if (hasOpenCodeCredentials()) return { aiProvider: "opencode", aiModel: defaultOpenCodeModel() };
  if (hasMistralCredentials()) return { aiProvider: "mistral", aiModel: defaultMistralModel() };
  if (hasGroqCredentials()) return { aiProvider: "groq", aiModel: defaultGroqModel() };
  return null;
}

function hasCredentialsForProvider(provider: AiProvider): boolean {
  if (provider === "disabled") return false;
  if (provider === "gemini") return hasGeminiCredentials();
  if (provider === "openai-compatible") return hasOpenAiCompatibleCredentials();
  if (provider === "opencode") return hasOpenCodeCredentials();
  if (provider === "mistral") return hasMistralCredentials();
  if (provider === "groq") return hasGroqCredentials();
  return false;
}

export function resolveAiSelectionForRuntime(provider: AiProvider, model: string): {
  aiProvider: AiProvider;
  aiModel: string;
  reason?: string;
} {
  const aiProvider = isKnownAiProvider(provider) ? provider : "disabled";
  const aiModel = model.trim() || defaultAiModel(aiProvider);

  if (aiProvider !== "disabled" && !hasCredentialsForProvider(aiProvider)) {
    const fallback = firstConfiguredProvider();
    if (fallback) {
      return {
        ...fallback,
        reason: `${aiProvider} credentials are missing and ${fallback.aiProvider} credentials are configured.`,
      };
    }
  }

  if (aiProvider === "disabled") {
    const fallback = firstConfiguredProvider();
    if (fallback) {
      return {
        ...fallback,
        reason: `${fallback.aiProvider} credentials are configured and AI generation was disabled.`,
      };
    }
  }

  return {
    aiProvider,
    aiModel: aiProvider === "disabled" ? defaultAiModel(aiProvider) : aiModel,
  };
}
