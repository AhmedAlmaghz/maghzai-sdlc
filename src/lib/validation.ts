import { defaultAiModel, isKnownAiProvider } from "./types";
import type {
  AiProvider,
  AppType,
  PreferredAgent,
  ProjectInputs,
  SpectrumPosition,
  TeamContext,
} from "./types";

const APP_TYPES: AppType[] = [
  "web-app",
  "saas",
  "mobile-app",
  "api-backend",
  "e-commerce",
  "internal-tool",
  "ai-agent",
  "chrome-extension",
  "other",
];

const SPECTRUM_POSITIONS: SpectrumPosition[] = ["vibe", "structured", "agentic"];
const TEAM_CONTEXTS: TeamContext[] = ["solo", "small-team", "enterprise"];
const AI_PROVIDERS: AiProvider[] = ["disabled", "gemini", "openai-compatible", "opencode", "mistral", "groq"];
const PREFERRED_AGENTS: PreferredAgent[] = [
  "claude-code",
  "gemini-cli",
  "codex-cli",
  "cursor",
  "copilot-agent",
  "other",
];

export class ValidationError extends Error { }

function str(value: unknown, field: string, { required = false } = {}): string {
  if (value === undefined || value === null) {
    if (required) throw new ValidationError(`${field} is required`);
    return "";
  }
  if (typeof value !== "string") throw new ValidationError(`${field} must be a string`);
  const trimmed = value.trim();
  if (required && !trimmed) throw new ValidationError(`${field} is required`);
  return trimmed.slice(0, 8000);
}

function strArray(value: unknown, field: string): string[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new ValidationError(`${field} must be an array`);
  return value
    .filter((v): v is string => typeof v === "string")
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 50);
}

function oneOf<T extends string>(value: unknown, allowed: T[], field: string, fallback: T): T {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new ValidationError(`${field} must be one of: ${allowed.join(", ")}`);
  }
  return value as T;
}

export function normalizeAiSelection(providerValue: unknown, modelValue: unknown): {
  aiProvider: AiProvider;
  aiModel: string;
} {
  const aiProvider = oneOf(providerValue, AI_PROVIDERS, "aiProvider", "disabled");
  const rawModel = str(modelValue, "aiModel").slice(0, 120);
  const aiModel = aiProvider === "disabled" ? defaultAiModel(aiProvider) : rawModel || defaultAiModel(aiProvider);

  if (!isKnownAiProvider(aiProvider)) {
    throw new ValidationError("aiProvider is invalid");
  }

  return { aiProvider, aiModel };
}

export function parseProjectInputs(body: unknown): ProjectInputs {
  if (typeof body !== "object" || body === null) {
    throw new ValidationError("Request body must be a JSON object");
  }
  const b = body as Record<string, unknown>;

  const projectName = str(b.projectName, "projectName", { required: true });
  if (projectName.length > 200) throw new ValidationError("projectName is too long");

  const ai = normalizeAiSelection(b.aiProvider, b.aiModel);

  return {
    projectName,
    oneLiner: str(b.oneLiner, "oneLiner"),
    idea: str(b.idea, "idea", { required: true }),
    appType: oneOf(b.appType, APP_TYPES, "appType", "web-app"),
    targetUsers: str(b.targetUsers, "targetUsers"),
    keyFeatures: strArray(b.keyFeatures, "keyFeatures"),
    nonFunctionalRequirements: strArray(b.nonFunctionalRequirements, "nonFunctionalRequirements"),
    techStackPreference: str(b.techStackPreference, "techStackPreference"),
    integrations: strArray(b.integrations, "integrations"),
    spectrumPosition: oneOf(b.spectrumPosition, SPECTRUM_POSITIONS, "spectrumPosition", "structured"),
    teamContext: oneOf(b.teamContext, TEAM_CONTEXTS, "teamContext", "solo"),
    timeline: str(b.timeline, "timeline"),
    constraints: str(b.constraints, "constraints"),
    preferredAgent: oneOf(b.preferredAgent, PREFERRED_AGENTS, "preferredAgent", "claude-code"),
    aiProvider: ai.aiProvider,
    aiModel: ai.aiModel,
    successMetrics: str(b.successMetrics, "successMetrics"),
  };
}
