// Shared types for the "Vibe Kit Factory" spec-kit generator.
// These model the structured intake (what the user tells us about the
// project they want to build) and the generated output bundle (the
// documents an agentic coding tool needs to build it end-to-end).

export type SpectrumPosition = "vibe" | "structured" | "agentic";

export type PreferredAgent =
  | "claude-code"
  | "gemini-cli"
  | "codex-cli"
  | "cursor"
  | "copilot-agent"
  | "other";

export type AppType =
  | "web-app"
  | "saas"
  | "mobile-app"
  | "api-backend"
  | "e-commerce"
  | "internal-tool"
  | "ai-agent"
  | "chrome-extension"
  | "other";

export type TeamContext = "solo" | "small-team" | "enterprise";

export type AiProvider = "disabled" | "gemini" | "openai-compatible" | "opencode" | "mistral" | "groq";

export interface AiModelOption {
  id: string;
  label: string;
  provider: AiProvider;
}

export interface GenerationMetadata {
  mode: "deterministic" | "ai" | "fallback";
  aiProvider: AiProvider;
  aiModel: string;
  generatedAt: string;
  error?: string;
}

export interface ProjectInputs {
  projectName: string;
  oneLiner: string;
  idea: string;
  appType: AppType;
  targetUsers: string;
  keyFeatures: string[];
  nonFunctionalRequirements: string[];
  techStackPreference: string;
  integrations: string[];
  spectrumPosition: SpectrumPosition;
  teamContext: TeamContext;
  timeline: string;
  constraints: string;
  preferredAgent: PreferredAgent;
  aiProvider: AiProvider;
  aiModel: string;
  successMetrics: string;
}

export interface SpecKitArtifacts {
  prd: string;
  architecture: string;
  harnessRules: string;
  harnessFileName: string;
  contextBundle: string;
  testEvalPlan: string;
  implementationPlan: string;
  reviewDeployChecklist: string;
  maintenancePlan: string;
  masterPrompt: string;
  metadata?: GenerationMetadata;
}

export interface ProjectRecord {
  id: number;
  name: string;
  oneLiner: string;
  spectrumPosition: SpectrumPosition;
  preferredAgent: PreferredAgent;
  appType: AppType;
  inputs: ProjectInputs;
  artifacts: SpecKitArtifacts;
  version: number;
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
}

export const AI_PROVIDER_LABELS: Record<AiProvider, string> = {
  disabled: "توليد محلي حتمي (بدون AI)",
  gemini: "Google Gemini",
  "openai-compatible": "OpenAI-compatible API",
  opencode: "OpenCode / opencode (OpenAI-compatible)",
  mistral: "Mistral AI",
  groq: "Groq",
};

export const AI_MODEL_CATALOG: Record<AiProvider, AiModelOption[]> = {
  disabled: [{ provider: "disabled", id: "deterministic", label: "Deterministic local generator" }],
  gemini: [
    { provider: "gemini", id: "gemini-3.1-flash-lite", label: "Gemini 3.1 Flash Lite (Recommended)" },
    { provider: "gemini", id: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
    { provider: "gemini", id: "gemini-3.1-flash-preview", label: "Gemini 3.1 Flash Preview" },

  ],
  "openai-compatible": [
    { provider: "openai-compatible", id: "gpt-4o-mini", label: "GPT-4o Mini (FreeModel default)" },
    { provider: "openai-compatible", id: "gpt-4o", label: "GPT-4o" },
    { provider: "openai-compatible", id: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
    { provider: "openai-compatible", id: "glm-5.2", label: "GLM-5.2 / compatible" },
    { provider: "openai-compatible", id: "local-model", label: "Custom compatible model" },
  ],
  opencode: [
    { provider: "opencode", id: "glm-5.2", label: "GLM 5.2 (Default)" },
    { provider: "opencode", id: "deepseek-v4-pro", label: "DeepSeek V4 Pro" },
    { provider: "opencode", id: "deepseek-v4-flash", label: "DeepSeek V4 Flash" },
    { provider: "opencode", id: "kimi-k3", label: "Kimi K3" },
    { provider: "opencode", id: "kimi-k2.7-code", label: "Kimi K2.7 Code" },
    { provider: "opencode", id: "qwen3.7-max", label: "Qwen 3.7 Max" },
    { provider: "opencode", id: "qwen3.7-plus", label: "Qwen 3.7 Plus" },
    { provider: "opencode", id: "grok-4.5", label: "Grok 4.5" },
    { provider: "opencode", id: "minimax-m3", label: "MiniMax M3" },
    { provider: "opencode", id: "mimo-v2-pro", label: "MiMo V2 Pro" },
  ],
  mistral: [
    { provider: "mistral", id: "mistral-large-latest", label: "Mistral Large Latest" },
    { provider: "mistral", id: "mistral-small-latest", label: "Mistral Small Latest" },
    { provider: "mistral", id: "codestral-latest", label: "Codestral Latest" },
  ],
  groq: [
    { provider: "groq", id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
    { provider: "groq", id: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
    { provider: "groq", id: "mixtral-8x7b-32768", label: "Mixtral 8x7B 32768" },
  ],
};

export function defaultAiModel(provider: AiProvider): string {
  return AI_MODEL_CATALOG[provider][0]?.id ?? "deterministic";
}

export function isKnownAiProvider(value: string): value is AiProvider {
  return (
    value === "disabled" ||
    value === "gemini" ||
    value === "openai-compatible" ||
    value === "opencode" ||
    value === "mistral" ||
    value === "groq"
  );
}

export const APP_TYPE_LABELS: Record<AppType, string> = {
  "web-app": "تطبيق ويب",
  saas: "منتج SaaS",
  "mobile-app": "تطبيق جوال",
  "api-backend": "واجهة برمجية / Backend",
  "e-commerce": "متجر إلكتروني",
  "internal-tool": "أداة داخلية",
  "ai-agent": "وكيل AI / منتج ذكاء اصطناعي",
  "chrome-extension": "إضافة متصفح",
  other: "أخرى",
};

export const TEAM_CONTEXT_LABELS: Record<TeamContext, string> = {
  solo: "مطوّر منفرد",
  "small-team": "فريق صغير",
  enterprise: "مؤسسة / فريق كبير",
};

export const PREFERRED_AGENT_LABELS: Record<PreferredAgent, string> = {
  "claude-code": "Claude Code",
  "gemini-cli": "Gemini CLI / Antigravity",
  "codex-cli": "Codex CLI",
  cursor: "Cursor",
  "copilot-agent": "GitHub Copilot Agent",
  other: "أداة أخرى",
};

export const SPECTRUM_LABELS: Record<SpectrumPosition, string> = {
  vibe: "Vibe Coding — استكشاف سريع / نموذج أولي",
  structured: "Structured AI-Assisted — ميزات ضمن مشروع قائم",
  agentic: "Agentic Engineering — نظام إنتاجي بمعايير صارمة",
};

export const NON_FUNCTIONAL_OPTIONS = [
  "الأداء وسرعة الاستجابة",
  "الأمان وحماية البيانات",
  "قابلية التوسع (Scalability)",
  "إمكانية الوصول (Accessibility)",
  "الامتثال التنظيمي (Compliance)",
  "دعم تعدد اللغات",
  "التوافر العالي (High Availability)",
  "قابلية الصيانة والتوسعة",
];
