import { resolveAiSelectionForRuntime } from "./ai-runtime";
import { generateSpecKit } from "./generator";
import type { AiProvider, ProjectInputs, SpecKitArtifacts } from "./types";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

// Constants
const AI_TIMEOUT_MS = Number(process.env.AI_GENERATION_TIMEOUT_MS ?? 120_000);

// Artifact keys for validation
const ARTIFACT_KEYS = [
    "prd",
    "architecture",
    "harnessRules",
    "contextBundle",
    "testEvalPlan",
    "implementationPlan",
    "reviewDeployChecklist",
    "maintenancePlan",
    "masterPrompt",
] as const;

type ArtifactKey = (typeof ARTIFACT_KEYS)[number];

// Custom error class for AI generation errors
class AiGenerationError extends Error {
    constructor(
        message: string,
        public readonly cause?: unknown
    ) {
        super(message);
        this.name = "AiGenerationError";
    }
}

// Environment variable helper
function env(name: string): string {
    return process.env[name]?.trim() ?? "";
}

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
    /^sk-[a-z]+key$/i,
    /^example[_-]/i,
    /^demo[_-]/i,
];

function isPlaceholderValue(value: string): boolean {
    const normalized = value.trim();
    return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(normalized));
}


function normalizeBaseUrl(rawValue: string, fallback: string, providerLabel: string): string {
    const candidate = rawValue.trim();
    const selected = candidate && !isPlaceholderValue(candidate) ? candidate : fallback;

    let url: URL;
    try {
        url = new URL(selected);
    } catch {
        throw new AiGenerationError(
            `${providerLabel} base URL is invalid. Configure a full http(s) URL or leave it empty to use ${fallback}.`
        );
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new AiGenerationError(
            `${providerLabel} base URL must start with http:// or https://. Configure a valid URL or leave it empty to use ${fallback}.`
        );
    }

    return url.toString().replace(/\/$/, "");
}

/**
 * Returns true when an API key string is a placeholder/example value that
 * should not be used for real requests.
 */
function isPlaceholderKey(value: string): boolean {
    const v = value.trim();
    if (!v) return true;
    return isPlaceholderValue(v);
}

function optionalBaseUrl(rawValue: string, providerLabel: string): string | null {
    const candidate = rawValue.trim();
    if (!candidate || isPlaceholderValue(candidate)) {
        return null;
    }

    let url: URL;
    try {
        url = new URL(candidate);
    } catch {
        throw new AiGenerationError(
            `${providerLabel} custom endpoint is invalid. Configure a full http(s) URL or leave it empty to use the official provider endpoint.`
        );
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new AiGenerationError(
            `${providerLabel} custom endpoint must start with http:// or https://, or be left empty to use the official provider endpoint.`
        );
    }

    return url.toString().replace(/\/$/, "");
}

function describeProviderFailure(providerLabel: string, baseUrl: string | null, err: unknown): AiGenerationError {
    const message = err instanceof Error ? err.message : "Unknown provider error.";
    const lower = message.toLowerCase();

    if (lower.includes("failed to parse url") || lower.includes("invalid url")) {
        return new AiGenerationError(
            `${providerLabel} produced an invalid request URL. Check that its base URL is a full http(s) URL and does not include placeholder text. Original error: ${message}`,
            err
        );
    }

    if (lower.includes("cannot connect") || lower.includes("econnrefused") || lower.includes("fetch failed")) {
        return new AiGenerationError(
            baseUrl
                ? `${providerLabel} could not connect to ${baseUrl}. If this is OpenCode/local-compatible, start the compatible server there or configure the correct base URL. Original error: ${message}`
                : `${providerLabel} could not connect to its API endpoint. Verify network access and provider configuration. Original error: ${message}`,
            err
        );
    }

    return new AiGenerationError(`${providerLabel} request failed: ${message}`, err);
}

// Zod schema for structured JSON response - validates all required artifacts
const artifactsSchema = z.object({
    prd: z.string().min(1),
    architecture: z.string().min(1),
    harnessRules: z.string().min(1),
    contextBundle: z.string().min(1),
    testEvalPlan: z.string().min(1),
    implementationPlan: z.string().min(1),
    reviewDeployChecklist: z.string().min(1),
    maintenancePlan: z.string().min(1),
    masterPrompt: z.string().min(1),
});

/**
 * Strip ```json … ``` or ``` … ``` markdown fences that some models wrap
 * their JSON output in, so that JSON.parse() succeeds.
 */
function stripJsonFences(text: string): string {
    const fenced = text.match(/^```(?:json)?\s*\n([\s\S]*?)\n```\s*$/m);
    return fenced ? fenced[1].trim() : text.trim();
}

// Types for the schema output
type ArtifactsSchema = z.infer<typeof artifactsSchema>;

// Add metadata to artifacts for tracking generation source
function withMetadata(
    artifacts: SpecKitArtifacts,
    inputs: ProjectInputs,
    mode: "deterministic" | "ai" | "fallback",
    error?: string,
    override?: { aiProvider: AiProvider; aiModel: string }
): SpecKitArtifacts {
    return {
        ...artifacts,
        metadata: {
            mode,
            aiProvider: override?.aiProvider ?? inputs.aiProvider,
            aiModel: override?.aiModel ?? inputs.aiModel,
            generatedAt: new Date().toISOString(),
            ...(error ? { error } : {}),
        },
    };
}

// Build the prompt for AI generation
function generationPrompt(inputs: ProjectInputs, deterministic: SpecKitArtifacts): string {
    const jsonShape = JSON.stringify(
        Object.fromEntries(ARTIFACT_KEYS.map((key) => [key, "<full markdown document>"])),
        null,
        2
    );

    return `You are an expert software architect and technical writer specialising in agentic AI-assisted development.
Your task is to generate a complete, professional-grade project specification package ("Spec Kit") for the following project.

## OUTPUT FORMAT
Return ONLY a single valid JSON object with this exact shape:
${jsonShape}

## HARD RULES
1. Output must be a single raw JSON object — NO markdown code fences, NO explanations before or after.
2. Every field must contain a COMPLETE, READY-TO-USE markdown document — not a placeholder or stub.
3. Never include API keys, secrets, passwords, or environment variable values in the output.
4. Write content primarily in Arabic, using English technical terms where it is standard practice (e.g. REST, API, JWT).
5. Preserve harnessFileName = "${deterministic.harnessFileName}" — do not change it.
6. All documents must be coherent with each other and with the project inputs below.

## DOCUMENT QUALITY STANDARDS
For each document, apply these professional standards:

### prd (Product Requirements Document)
- Executive summary with business context and value proposition
- User personas and detailed user stories in "As a [persona], I want [goal] so that [benefit]" format
- Functional requirements listed as numbered, testable acceptance criteria
- Non-functional requirements with measurable targets (e.g. p95 latency < 200ms)
- Out-of-scope items clearly listed
- Glossary of domain terms

### architecture (Technical Architecture Document)
- High-level system diagram described in Mermaid or ASCII
- Component breakdown with responsibilities
- Data flow and sequence diagrams for critical paths
- Database schema design with field types and relationships
- API contract overview (endpoints, methods, request/response shapes)
- Third-party integrations and their SDKs/APIs
- Infrastructure and deployment topology
- Security model (auth, authorisation, data protection)
- Scalability and caching strategy

### harnessRules (Agent Harness Rules — ${deterministic.harnessFileName})
- Project overview and tech stack
- Strict coding conventions and style guide
- File and folder naming conventions
- Commit message format
- Branch strategy
- Guardrails: what the agent MUST do and MUST NOT do
- Available MCP tools and local scripts
- Testing requirements before every commit

### contextBundle (Static Context Bundle)
- Project glossary
- Key business rules the agent must always respect
- Domain knowledge, edge cases, and gotchas
- Reference data and enumerations
- Links to relevant external documentation

### testEvalPlan (Test & Evaluation Plan)
- Testing strategy (unit, integration, e2e, performance)
- Test coverage targets
- Critical test scenarios with Given/When/Then format
- AI-output evaluation criteria (correctness, completeness, tone)
- Regression test checklist
- Performance benchmarks and load test parameters

### implementationPlan (Phased Implementation Plan)
- Phase-by-phase breakdown with clear milestones
- Per-phase task list with estimated effort
- Dependency graph between phases
- Definition of Done for each phase
- Risk register with mitigation strategies

### reviewDeployChecklist (Review & Deployment Checklist)
- Pre-code-review checklist
- Security review items
- Performance review items
- CI/CD pipeline steps
- Pre-deployment smoke tests
- Post-deployment monitoring and rollback procedure

### maintenancePlan (Maintenance & Evolution Plan)
- Monitoring and alerting setup
- On-call runbook for common incidents
- Dependency update cadence
- Feature flag and A/B test framework
- Technical debt tracking process
- Long-term scalability roadmap

### masterPrompt (Master Agent Prompt)
- A single, copy-paste-ready prompt that:
  * Gives the agent full project context
  * References all generated documents
  * Specifies the preferred agent (${inputs.preferredAgent}) and its harness file
  * States the first concrete task to start with
  * Includes success criteria for the first session

## PROJECT INPUTS
${JSON.stringify(inputs, null, 2)}

## DETERMINISTIC BASELINE (improve upon this — do not copy verbatim)
${JSON.stringify(deterministic, null, 2)}`;
}

// Generate with Google Gemini using AI SDK
async function generateWithGemini(model: string, prompt: string): Promise<ArtifactsSchema> {
    const apiKey = env("GEMINI_API_KEY") || env("GOOGLE_API_KEY");
    if (!apiKey || isPlaceholderKey(apiKey)) {
        throw new AiGenerationError("GEMINI_API_KEY or GOOGLE_API_KEY is not configured or is a placeholder value.");
    }

    // Check for custom Gemini endpoint (OpenAI-compatible). Placeholder values are ignored.
    const geminiBaseUrl = optionalBaseUrl(env("GEMINI_BASE_URL"), "Gemini");

    let aiModel;
    if (geminiBaseUrl) {
        // Use OpenAI-compatible client for custom endpoints
        const customClient = createOpenAI({
            apiKey,
            baseURL: geminiBaseUrl,
        });
        aiModel = customClient(model);
    } else {
        // Use official Google provider
        aiModel = google(model);
    }

    try {
        const result = await generateText({
            model: aiModel,
            prompt,
            temperature: 0.35,
        });

        // Parse and validate the JSON response (strip optional markdown fences)
        const rawText = stripJsonFences(result.text);
        const parsed = JSON.parse(rawText);
        return artifactsSchema.parse(parsed);
    } catch (err) {
        throw describeProviderFailure("Gemini", geminiBaseUrl, err);
    }
}

// Generate with any OpenAI-compatible API using AI SDK
async function generateWithOpenAiCompatibleClient({
    model,
    prompt,
    apiKey,
    baseUrl,
    defaultBaseUrl,
    providerLabel,
    missingCredentialsMessage,
}: {
    model: string;
    prompt: string;
    apiKey: string;
    baseUrl: string;
    defaultBaseUrl: string;
    providerLabel: string;
    missingCredentialsMessage: string;
}): Promise<ArtifactsSchema> {
    if (!apiKey || isPlaceholderKey(apiKey)) {
        throw new AiGenerationError(missingCredentialsMessage);
    }

    const normalizedBaseUrl = normalizeBaseUrl(baseUrl, defaultBaseUrl, providerLabel);
    const openaiClient = createOpenAI({
        apiKey,
        baseURL: normalizedBaseUrl,
    });

    const compatibleModel = openaiClient(model);

    try {
        const result = await generateText({
            model: compatibleModel,
            prompt,
            temperature: 0.35,
        });

        // Parse and validate the JSON response (strip optional markdown fences)
        const rawText = stripJsonFences(result.text);
        const parsed = JSON.parse(rawText);
        return artifactsSchema.parse(parsed);
    } catch (err) {
        throw describeProviderFailure(providerLabel, normalizedBaseUrl, err);
    }
}

// Generate with OpenAI-compatible API using AI SDK
async function generateWithOpenAiCompatible(model: string, prompt: string): Promise<ArtifactsSchema> {
    return generateWithOpenAiCompatibleClient({
        model,
        prompt,
        apiKey: env("OPENAI_API_KEY") || env("AI_OPENAI_API_KEY"),
        baseUrl: env("OPENAI_BASE_URL") || env("AI_OPENAI_BASE_URL"),
        defaultBaseUrl: "https://api.openai.com/v1",
        providerLabel: "OpenAI-compatible",
        missingCredentialsMessage: "OPENAI_API_KEY or AI_OPENAI_API_KEY is not configured.",
    });
}

// Generate with opencode as a configurable OpenAI-compatible provider.
async function generateWithOpenCode(model: string, prompt: string): Promise<ArtifactsSchema> {
    return generateWithOpenAiCompatibleClient({
        model,
        prompt,
        apiKey: env("OPENCODE_API_KEY") || env("AI_OPENCODE_API_KEY"),
        baseUrl: env("OPENCODE_BASE_URL") || env("AI_OPENCODE_BASE_URL"),
        defaultBaseUrl: "http://localhost:4096/v1",
        providerLabel: "OpenCode",
        missingCredentialsMessage: "OPENCODE_API_KEY or AI_OPENCODE_API_KEY is not configured.",
    });
}

// Generate with Mistral's OpenAI-compatible chat completions API.
async function generateWithMistral(model: string, prompt: string): Promise<ArtifactsSchema> {
    return generateWithOpenAiCompatibleClient({
        model,
        prompt,
        apiKey: env("MISTRAL_API_KEY") || env("AI_MISTRAL_API_KEY"),
        baseUrl: env("MISTRAL_BASE_URL") || env("AI_MISTRAL_BASE_URL"),
        defaultBaseUrl: "https://api.mistral.ai/v1",
        providerLabel: "Mistral",
        missingCredentialsMessage: "MISTRAL_API_KEY or AI_MISTRAL_API_KEY is not configured.",
    });
}

// Generate with Groq's OpenAI-compatible chat completions API.
async function generateWithGroq(model: string, prompt: string): Promise<ArtifactsSchema> {
    return generateWithOpenAiCompatibleClient({
        model,
        prompt,
        apiKey: env("GROQ_API_KEY") || env("AI_GROQ_API_KEY"),
        baseUrl: env("GROQ_BASE_URL") || env("AI_GROQ_BASE_URL"),
        defaultBaseUrl: "https://api.groq.com/openai/v1",
        providerLabel: "Groq",
        missingCredentialsMessage: "GROQ_API_KEY or AI_GROQ_API_KEY is not configured.",
    });
}

// Route to appropriate provider
async function callProvider(
    provider: AiProvider,
    model: string,
    prompt: string
): Promise<ArtifactsSchema> {
    if (provider === "gemini") {
        return generateWithGemini(model, prompt);
    }
    if (provider === "openai-compatible") {
        return generateWithOpenAiCompatible(model, prompt);
    }
    if (provider === "opencode") {
        return generateWithOpenCode(model, prompt);
    }
    if (provider === "mistral") {
        return generateWithMistral(model, prompt);
    }
    if (provider === "groq") {
        return generateWithGroq(model, prompt);
    }
    throw new AiGenerationError("AI generation is disabled.");
}

// Validate and normalize AI response artifacts
function validateArtifacts(
    value: unknown,
    fallback: SpecKitArtifacts
): SpecKitArtifacts {
    if (typeof value !== "object" || value === null) {
        throw new AiGenerationError("AI response must be a JSON object.");
    }

    const raw = value as Record<string, unknown>;
    const normalized: Partial<Record<ArtifactKey, string>> = {};

    for (const key of ARTIFACT_KEYS) {
        const next = raw[key];
        if (typeof next !== "string" || !next.trim()) {
            throw new AiGenerationError(
                `AI response is missing a non-empty ${key} string.`
            );
        }
        normalized[key] = next.trim().slice(0, 200_000);
    }

    // Preserve the original harnessFileName from the deterministic fallback
    return {
        ...(normalized as Omit<SpecKitArtifacts, "harnessFileName">),
        harnessFileName: fallback.harnessFileName,
    };
}

// Main export: Generate spec kit with AI fallback
export async function generateSpecKitWithAiFallback(
    inputs: ProjectInputs
): Promise<SpecKitArtifacts> {
    const deterministic = generateSpecKit(inputs);
    const resolved = resolveAiSelectionForRuntime(
        inputs.aiProvider,
        inputs.aiModel
    );

    // Log auto-selection if applicable
    if (resolved.reason) {
        console.info("AI generation provider auto-selected", {
            requestedProvider: inputs.aiProvider,
            requestedModel: inputs.aiModel,
            provider: resolved.aiProvider,
            model: resolved.aiModel,
            reason: resolved.reason,
        });
    }

    // Return deterministic if disabled
    if (resolved.aiProvider === "disabled") {
        return withMetadata(deterministic, inputs, "deterministic", undefined, resolved);
    }

    try {
        console.info("AI generation selected", {
            provider: resolved.aiProvider,
            model: resolved.aiModel,
        });

        const runtimeInputs = {
            ...inputs,
            aiProvider: resolved.aiProvider,
            aiModel: resolved.aiModel,
        };

        const raw = await callProvider(
            resolved.aiProvider,
            resolved.aiModel,
            generationPrompt(runtimeInputs, deterministic)
        );

        const aiArtifacts = validateArtifacts(raw, deterministic);
        return withMetadata(aiArtifacts, inputs, "ai", undefined, resolved);
    } catch (err) {
        const message =
            err instanceof Error ? err.message : "AI generation failed.";
        console.error(
            "AI generation unavailable; using deterministic fallback:",
            message
        );
        return withMetadata(deterministic, inputs, "fallback", message, resolved);
    }
}