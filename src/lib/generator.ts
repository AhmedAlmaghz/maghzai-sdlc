import type { ProjectInputs, SpecKitArtifacts, SpectrumPosition, PreferredAgent } from "./types";

/* -------------------------------------------------------------------------
 * Vibe Kit Factory — Spec-Kit generator
 *
 * This module operationalizes the framework from "The New SDLC with Vibe
 * Coding" (Osmani, Saboo, Kartakis — Google, 2026):
 *   - The Vibe Coding <-> Agentic Engineering spectrum (Table 1)
 *   - The six types of context (Instructions, Knowledge, Memory, Examples,
 *     Tools, Guardrails) and the static/dynamic context split
 *   - Harness Engineering (rule files, tools/MCP, sandboxes, orchestration,
 *     guardrails/hooks, observability)
 *   - The Factory Model (specs -> agents -> tests/evals -> feedback loops)
 *   - The reshaped SDLC phases (Requirements & Planning, Design &
 *     Architecture, Implementation, Testing & QA, Code Review & Deployment,
 *     Maintenance & Evolution)
 *   - Conductor vs Orchestrator developer modes
 *
 * Given a structured project intake, it deterministically compiles a full
 * "spec kit": a bundle of documents an agentic coding tool (Claude Code,
 * Gemini CLI/Antigravity, Codex CLI, Cursor, Copilot Agent, ...) can consume
 * to build the entire project end to end, plus one consolidated master
 * prompt ready to paste into that tool.
 * ---------------------------------------------------------------------- */

function harnessFileName(agent: PreferredAgent): string {
  switch (agent) {
    case "claude-code":
      return "CLAUDE.md";
    case "gemini-cli":
      return "GEMINI.md";
    case "codex-cli":
      return "AGENTS.md";
    case "cursor":
      return ".cursor/rules/project.mdc";
    case "copilot-agent":
      return ".github/copilot-instructions.md";
    default:
      return "AGENTS.md";
  }
}

function agentLabel(agent: PreferredAgent): string {
  switch (agent) {
    case "claude-code":
      return "Claude Code";
    case "gemini-cli":
      return "Gemini CLI / Antigravity";
    case "codex-cli":
      return "Codex CLI";
    case "cursor":
      return "Cursor";
    case "copilot-agent":
      return "GitHub Copilot Agent";
    default:
      return "your coding agent of choice";
  }
}

interface Rigor {
  verification: string;
  testingBar: string;
  reviewBar: string;
  ciGate: string;
  riskProfile: string;
  autonomy: string;
}

const RIGOR: Record<SpectrumPosition, Rigor> = {
  vibe: {
    verification: '"Does it seem to work?" — run it, eyeball the output, ship if it looks right.',
    testingBar: "Smoke-test the happy path manually. Automated tests are optional for this pass.",
    reviewBar: "Self-review only. Skim the diff for anything obviously wrong before committing.",
    ciGate: "No CI gate required. Optional lint-on-save is enough.",
    riskProfile: "High tolerance for disposable code. Treat this as a prototype, not production.",
    autonomy: "Let the agent run long stretches unsupervised; correct course only when something breaks.",
  },
  structured: {
    verification:
      "Manual testing plus spot-checks of critical paths. The developer reviews AI output before merging.",
    testingBar:
      "Automated unit tests for new logic + at least one integration test per feature. Edge cases called out explicitly in the eval plan below must be covered.",
    reviewBar:
      "Selective human review of critical paths (auth, payments, data writes) and a full read of anything touching shared modules.",
    ciGate: "CI must run lint + typecheck + unit tests on every PR. Merges blocked on failure.",
    riskProfile: "Moderate risk. This ships to real users; human judgment gates key checkpoints.",
    autonomy:
      "Operate in Conductor mode for ambiguous or unfamiliar sections; switch to Orchestrator mode for well-specified, repetitive tasks.",
  },
  agentic: {
    verification:
      "Systematic verification at every stage: automated test suites, CI/CD gates, and LM-judge evals for non-deterministic behavior. No output ships on 'looks right' alone.",
    testingBar:
      "Comprehensive automated test suites (unit, integration, e2e) written BEFORE implementation, plus an eval suite with explicit rubrics for task success, tool-use quality, trajectory compliance, and hallucination rate. Tests and evals are the contract with the agent.",
    reviewBar:
      "Comprehensive human review of architecture and all boundary/security-sensitive code. AI-first-pass review (bugs, style, vulnerabilities, perf) required before a human ever looks at the diff.",
    ciGate:
      "Full CI/CD gate: lint, typecheck, unit + integration + e2e tests, security scan, and eval-suite regression run required before merge. No exceptions for production branches.",
    riskProfile:
      "Low risk tolerance. This is a production system teams depend on — treat every gap between 'seems to work' and 'works under all conditions' as a shipped incident waiting to happen.",
    autonomy:
      "Default to Orchestrator mode: define success criteria and constraints, let agents iterate against tests/evals, and reserve direct (Conductor) intervention for architecture and ambiguous requirements only.",
  },
};

function stackSuggestion(inputs: ProjectInputs): string {
  if (inputs.techStackPreference.trim()) {
    return inputs.techStackPreference.trim();
  }
  switch (inputs.appType) {
    case "web-app":
    case "saas":
    case "internal-tool":
      return "Next.js (App Router) + TypeScript + Tailwind CSS, PostgreSQL + Drizzle ORM, deployed on a managed Node host";
    case "api-backend":
      return "Node.js (TypeScript) or Python (FastAPI) REST/GraphQL service, PostgreSQL, containerized deployment behind an API gateway";
    case "mobile-app":
      return "React Native + Expo (TypeScript), shared design system, REST/GraphQL API backed by PostgreSQL";
    case "e-commerce":
      return "Next.js storefront + TypeScript + Tailwind CSS, PostgreSQL + Drizzle ORM, Stripe for payments, headless product/inventory service";
    case "ai-agent":
      return "Python + Google Agent Development Kit (ADK) or LangGraph for orchestration, MCP servers for tool access, vector store for retrieval, Agent Engine / Cloud Run for deployment";
    case "chrome-extension":
      return "Manifest V3 + TypeScript, a lightweight background service worker, and a small API backend if server state is needed";
    default:
      return "Next.js (App Router) + TypeScript + Tailwind CSS, PostgreSQL + Drizzle ORM";
  }
}

function bulletList(items: string[], fallback = "- (none specified — agent should ask before assuming)"): string {
  const cleaned = items.map((i) => i.trim()).filter(Boolean);
  if (cleaned.length === 0) return fallback;
  return cleaned.map((i) => `- ${i}`).join("\n");
}

function numberedList(items: string[]): string {
  const cleaned = items.map((i) => i.trim()).filter(Boolean);
  return cleaned.map((i, idx) => `${idx + 1}. ${i}`).join("\n");
}

/* ---------------------------- PRD ---------------------------- */

function buildPRD(inputs: ProjectInputs, rigor: Rigor): string {
  const features = inputs.keyFeatures.filter((f) => f.trim());
  const featureStories = features
    .map(
      (f, idx) =>
        `### US-${idx + 1}: ${f}\n- **As a** ${inputs.targetUsers || "user"}, **I want** ${f.toLowerCase()}, **so that** I can accomplish my goal effectively.\n- **Acceptance criteria:**\n  - [ ] Happy path works end to end and is covered by an automated test.\n  - [ ] At least one edge case / failure mode is identified and handled explicitly (empty input, network failure, unauthorized access, etc.).\n  - [ ] UI/response states cover loading, empty, error, and success.`
    )
    .join("\n\n");

  return `# Product Requirements Document — ${inputs.projectName}

> Generated by Vibe Kit Factory, following the Requirements & Planning phase of the
> AI-driven SDLC: requirements as a conversation between humans and AI that produces
> specification and initial implementation together, not a document thrown over a wall.

## 1. One-line pitch
${inputs.oneLiner || "(not provided)"}

## 2. Problem & context
${inputs.idea || "(not provided)"}

## 3. Target users
${inputs.targetUsers || "(not specified — agent should ask before assuming a persona)"}

## 4. Success metrics
${inputs.successMetrics || "(not specified — define at least one measurable outcome before implementation starts)"}

## 5. Scope: application type
${inputs.appType}

## 6. Core features & user stories
${featureStories || "_No features listed yet — decompose the one-line pitch into 3-7 discrete user stories before implementation._"}

## 7. Non-functional requirements
${bulletList(inputs.nonFunctionalRequirements)}

## 8. Third-party integrations
${bulletList(inputs.integrations)}

## 9. Constraints
${inputs.constraints || "(none specified)"}

## 10. Timeline
${inputs.timeline || "(not specified)"}

## 11. Out of scope (explicit non-goals)
- Anything not listed under "Core features" above is out of scope for v1 unless the human explicitly approves scope changes.
- The agent must flag scope creep rather than silently expanding the feature set.

## 12. Verification bar for this phase
${rigor.verification}

## 13. Open questions for the agent to raise (do not silently assume)
${numberedList([
  "Any ambiguous business rule inside a user story above.",
  "Any feature that implies data retention, privacy, or compliance obligations not covered in Non-functional requirements.",
  "Any integration that requires credentials/secrets — confirm the exact environment variable names expected.",
])}
`;
}

/* ------------------------ Architecture ------------------------ */

function buildArchitecture(inputs: ProjectInputs, rigor: Rigor): string {
  const stack = stackSuggestion(inputs);
  return `# Architecture & Technical Design — ${inputs.projectName}

> Design and architecture remain the most human-centric phase: trade-offs (consistency vs.
> availability, complexity vs. flexibility, build vs. buy) depend on business context AI cannot
> fully infer. This document fixes those trade-offs so the agent can implement consistently
> across every module instead of re-deciding architecture file by file.

## 1. Recommended stack
${stack}

## 2. High-level system design
- **Client layer:** renders UI, calls the application's own API layer only (never third-party
  secrets directly from the browser).
- **Application layer:** owns business logic, input validation, and orchestration of any
  external integrations (${bulletList(inputs.integrations, "- none")}).
- **Data layer:** PostgreSQL (or the store implied by the stack above) accessed through a
  single ORM/client, with all schema changes versioned in source control.
- **Cross-cutting concerns:** authentication/authorization, observability/logging, and
  configuration/secrets management must be implemented once and reused everywhere —
  never duplicated per feature.

## 3. Data model (starting point — refine per feature)
List the core entities implied by the features below, then define primary keys, relationships,
and indexes before writing implementation code:
${bulletList(inputs.keyFeatures, "- (derive entities from the PRD's user stories)")}

## 4. Folder / module structure (adapt to the chosen stack)
\`\`\`
/app or /src
  /app or /pages        -> routes / screens
  /components           -> shared UI building blocks
  /lib or /services      -> business logic, integrations, generator/validation logic
  /db                    -> schema, migrations, query layer
  /api                   -> HTTP handlers / route handlers
  /tests                 -> unit, integration, e2e specs
  AGENTS.md / CLAUDE.md / GEMINI.md -> harness rule file (see Harness section)
\`\`\`

## 5. Key architectural decisions & trade-offs
${numberedList([
  "State management: prefer server-driven state over client-only state for anything that must survive a refresh or be shared across devices.",
  "Consistency vs. availability: default to strong consistency (single primary DB) unless a feature explicitly requires eventual consistency at scale.",
  "Build vs. buy: use managed/off-the-shelf services for auth, payments, and email unless there is a stated reason to build them in-house.",
  "Error handling: fail loudly in development, fail gracefully (with user-facing messaging and structured logs) in production.",
])}

## 6. Non-functional requirements mapped to design decisions
${bulletList(
  inputs.nonFunctionalRequirements.map(
    (n) => `${n} → address explicitly in the relevant module's implementation notes and tests`
  ),
  "- none specified"
)}

## 7. Risk profile for this build
${rigor.riskProfile}

## 8. What the agent should NOT decide unilaterally
- Introducing a new framework/language not listed in the stack above.
- Changing the data model of an already-shipped feature without a migration plan.
- Adding a new third-party dependency that handles secrets, payments, or personal data.

Escalate these to the human instead of guessing.
`;
}

/* --------------------------- Harness --------------------------- */

function buildHarnessRules(inputs: ProjectInputs, rigor: Rigor): string {
  const stack = stackSuggestion(inputs);
  return `# ${inputs.projectName} — Agent Rule File

<!--
  This file is the STATIC context for every coding agent working in this repo
  (per "Context Engineering: the real skill" — static context is always
  loaded: system instructions, rule files, global memory, persona). Keep it
  short and dense. Add a rule every time an agent does something it should
  not do again.
-->

## Stack
${stack}

## Conventions
- Language/formatting: match the existing linter/formatter config; never hand-roll a style.
- Naming: descriptive, no abbreviations beyond established project idioms.
- Commits: small, single-purpose, imperative mood ("add", not "added").
- Every new feature ships with tests in the same PR — no "tests later" commits.

## Hard rules (never break these)
1. Never invent an npm/pip package that doesn't exist — verify it's real and used elsewhere in the project or explicitly approved.
2. Never commit secrets, API keys, or \`.env\` values. Read secrets from environment variables only.
3. Never silently change the public API/data model of a shipped feature — propose a migration.
4. Never mark a task done without running the test suite and the lint/typecheck gate.
5. If a requirement is ambiguous, ask a clarifying question in the PR description instead of guessing.

## Workflow
1. Read the PRD and Architecture doc in \`/specs\` before starting any task.
2. Write or update tests/evals FIRST for the task at hand (see Test & Eval Plan).
3. Implement the smallest change that makes the tests pass.
4. Run: lint → typecheck → tests → build. All must pass before requesting review.
5. Summarize what changed and why in the PR/commit description, referencing the user story ID.

## Verification bar for this project
${rigor.verification}

## Review bar
${rigor.reviewBar}

## CI gate
${rigor.ciGate}

## Preferred coding agent
${agentLabel(inputs.preferredAgent)} — this file follows that tool's rule-file convention
(\`${harnessFileName(inputs.preferredAgent)}\`). If a different agent is used, copy this content
into that agent's expected rule file without changing the substance.
`;
}

/* ------------------------ Context bundle ------------------------ */

function buildContextBundle(inputs: ProjectInputs): string {
  return `# Context Engineering Bundle — ${inputs.projectName}

> The quality of AI-generated code depends less on clever prompts and more on the quality
> of context provided. This bundle enumerates the six context types every agent needs
> (Instructions, Knowledge, Memory, Examples, Tools, Guardrails), and marks each as
> **static** (always loaded) or **dynamic** (loaded on demand) so token budget is spent
> deliberately.

## 1. Instructions (static)
The agent's core role, goals, and operational boundaries for this project:
- Build **${inputs.projectName}**: ${inputs.oneLiner || inputs.idea || "(describe the product)"}.
- Primary users: ${inputs.targetUsers || "(not specified)"}.
- Operate at spectrum position **${inputs.spectrumPosition}** — see the rule file for the
  exact verification/review bar this implies.

## 2. Knowledge (dynamic — retrieved on demand)
- The PRD (\`specs/prd.md\`) and Architecture doc (\`specs/architecture.md\`) generated alongside
  this bundle.
- Domain data implied by the integrations below: ${bulletList(inputs.integrations, "- none")}.
- Any existing codebase conventions discovered while exploring the repo (treat as
  higher-priority than generic best practices).

## 3. Memory
- **Short-term (session):** what changed in the current task, referenced by user-story ID.
- **Long-term (persistent):** the rule file (${harnessFileName(inputs.preferredAgent)}), the
  Architecture doc, and a running \`CHANGELOG.md\` the agent updates after each merged task.

## 4. Examples (dynamic — load when relevant to the current task)
- Reference implementation of the first completed feature as the canonical pattern for
  file structure, naming, and testing style.
- Any few-shot examples added to \`/examples\` for tricky domain logic
  (e.g., pricing rules, permission checks) — add one the first time an agent gets it wrong twice.

## 5. Tools (static list, dynamic invocation)
- Package manager, test runner, and linter/typechecker for the chosen stack.
- Database CLI/ORM commands for schema migrations.
- Any MCP servers or APIs required by the integrations: ${bulletList(inputs.integrations, "- none")}.
- CI pipeline commands (lint, typecheck, test, build) — the agent must know how to run these locally before pushing.

## 6. Guardrails (static — hard constraints)
- Non-functional requirements are hard constraints, not suggestions: ${bulletList(
    inputs.nonFunctionalRequirements,
    "- none specified"
  )}.
- Constraints from stakeholders: ${inputs.constraints || "(none specified)"}.
- Never bypass the CI gate described in the rule file, even for "small" changes.

## Static vs. dynamic context — this project's boundary
| Context type   | Static (always loaded)                          | Dynamic (loaded on demand)                     |
|-----------------|--------------------------------------------------|-------------------------------------------------|
| Instructions    | Role, goals, spectrum position, hard rules        | —                                                 |
| Knowledge       | Project name, one-liner                           | PRD/Architecture sections relevant to current task |
| Memory          | Rule file, changelog pointer                      | Session-specific diff/history                     |
| Examples        | —                                                  | Pattern-matched example for the current task type |
| Tools           | Tool/command inventory                            | Actual tool call + result for the current step    |
| Guardrails      | Non-functional requirements, constraints          | Task-specific validation rules                     |

Review and version this boundary like any other config — it is a first-class architectural
decision, not an afterthought.
`;
}

/* --------------------------- Tests/Evals --------------------------- */

function buildTestEvalPlan(inputs: ProjectInputs, rigor: Rigor): string {
  const features = inputs.keyFeatures.filter((f) => f.trim());
  const testRows = features
    .map(
      (f) =>
        `| ${f} | Unit + integration test for the happy path | Edge case: invalid/empty input, unauthorized access, dependency failure | Eval: does the output match the acceptance criteria in the PRD? |`
    )
    .join("\n");

  return `# Test & Eval Plan — ${inputs.projectName}

> "Write the tests and evals before generating the code. Together they are the contract with
> the AI." Tests verify the deterministic parts of the system; evals verify the parts that are
> not deterministic (did the agent take the right trajectory, choose the right tools, produce a
> response that meets the quality bar).

## Testing bar for this project
${rigor.testingBar}

## Per-feature test matrix
| Feature | Required tests | Edge cases to cover | Eval question |
|---|---|---|---|
${testRows || "| (add features in the intake form to auto-generate rows) | | | |"}

## Test pyramid
1. **Unit tests** — pure functions, validation logic, data transformations.
2. **Integration tests** — API routes/handlers against a real (test) database.
3. **End-to-end tests** — critical user journeys (${bulletList(features.slice(0, 3), "- primary user journey")}).

## Eval suite (for non-deterministic / agent-driven behavior)
Only required at the "structured" and "agentic" spectrum positions — build it if any part of
this product involves an LLM/agent making decisions (routing, generation, retrieval, tool use).
- **Task success:** did the final output satisfy the PRD's acceptance criteria?
- **Tool-use quality:** did the agent call the right tool with the right arguments?
- **Trajectory compliance:** did it follow the intended steps, or skip required verification?
- **Hallucination rate:** did it reference files, packages, or APIs that don't exist?
- **Response quality:** does a human or LM-judge rubric score the output as acceptable?

## Continuous quality flywheel
${numberedList([
  "Evaluate against the benchmark/test suite.",
  "Diagnose failures by clustering root causes (not one-off patches).",
  "Optimize the prompt, tool definition, or rule file responsible.",
  "Verify the fix against a regression suite.",
  "Monitor production traffic/logs for new failure modes and feed them back into step 1.",
])}

## Definition of done for any task
- [ ] Tests written before or alongside implementation, not after.
- [ ] All tests + evals (if applicable) pass locally and in CI.
- [ ] Edge cases from the matrix above are explicitly handled, not just the happy path.
- [ ] No regression in previously passing tests.
`;
}

/* --------------------------- Implementation plan --------------------------- */

function buildImplementationPlan(inputs: ProjectInputs, rigor: Rigor): string {
  const features = inputs.keyFeatures.filter((f) => f.trim());
  const phase0 = [
    "Scaffold the project using the stack in the Architecture doc.",
    "Wire up the database connection, base schema, and health check.",
    "Set up lint, typecheck, test runner, and CI pipeline (empty but green).",
    `Add the harness rule file (${harnessFileName(inputs.preferredAgent)}) at the repo root.`,
  ];

  const featurePhases = features.map((f, idx) => {
    const mode = idx % 2 === 0 ? "Orchestrator" : "Conductor";
    return `### Phase ${idx + 2}: ${f}
- **Mode:** ${mode} ${
      mode === "Orchestrator"
        ? "(well-specified — assign to the agent, review the diff and test results)"
        : "(ambiguous/critical — direct the agent step by step, review each change)"
    }
- **Tasks:**
  1. Write/extend the data model needed for "${f}".
  2. Write failing tests + (if applicable) evals from the Test & Eval Plan.
  3. Implement until tests pass.
  4. Update the PRD/Architecture docs if reality diverged from the plan.
  5. Open a PR referencing user story US-${idx + 1}.
- **Exit criteria:** tests green, CI gate passes, feature manually verified against acceptance criteria.`;
  });

  return `# Implementation Plan — Factory Model — ${inputs.projectName}

> "The developer's primary output is not code — it's the system that produces code." This
> plan decomposes the project into agent-sized units so the factory (specs -> agents ->
> tests/evals -> feedback loops -> guardrails) can run with minimal human hand-holding,
> while keeping humans in charge of architecture and correctness.

## Autonomy posture for this project
${rigor.autonomy}

## Phase 1: Bootstrap
${bulletList(phase0)}

${featurePhases.join("\n\n") || "_Add features in the intake form to auto-generate phased tasks._"}

## Final phase: Hardening
${bulletList([
  "Run the full test + eval suite and fix any flaky tests.",
  "Run a security review pass (dependency audit, secrets scan, authz checks).",
  "Verify all non-functional requirements from the PRD are demonstrably met.",
  "Write/update the README with setup, run, and deploy instructions.",
])}

## Task sizing rule of thumb
Keep every task small enough that an agent can complete it, run the full test suite, and open
a reviewable PR in a single session. If a task needs more than ~5 files touched or spans more
than one feature area, split it before assigning it to an agent.
`;
}

/* --------------------------- Review & deployment --------------------------- */

function buildReviewDeployChecklist(inputs: ProjectInputs, rigor: Rigor): string {
  return `# Code Review, Deployment & Guardrails Checklist — ${inputs.projectName}

## AI first-pass review (before a human looks at the diff)
${bulletList([
  "Bugs and logic errors",
  "Style/convention violations against the rule file",
  "Security vulnerabilities (injection, authz bypass, secret leakage)",
  "Performance red flags (N+1 queries, unbounded loops, missing indexes)",
  "Hallucinated imports/packages/APIs",
])}

## Human review bar
${rigor.reviewBar}

## CI/CD gate
${rigor.ciGate}

## Guardrails / hooks (deterministic checks the agent cannot skip)
${bulletList([
  "Pre-commit: lint + format + secret scan.",
  "Pre-merge: full test suite + typecheck + build.",
  "Pre-deploy: migration dry-run against a staging database copy.",
  "Post-deploy: health check must return 200 before traffic is shifted.",
])}

## Deployment plan
${numberedList([
  "Deploy to a staging environment first; run smoke tests against it.",
  "Roll out to production behind a feature flag or canary if the change is risky.",
  "Monitor error rates and latency for the first hour after release.",
  "Have a documented rollback command ready before deploying.",
])}

## Observability
${bulletList([
  "Structured logs for every request/agent action, including inputs and decisions made.",
  "Traces for multi-step agent tasks (which tools were called, in what order, with what result).",
  "Cost/latency metering if any LLM calls are part of the runtime product.",
  "Alerting on error-rate spikes and failed health checks.",
])}

## Maintenance triggers
- Dependency updates: review monthly, patch security advisories immediately.
- Rule file drift: update ${harnessFileName(inputs.preferredAgent)} the moment an agent repeats a
  mistake — that's the signal a rule is missing.
- Re-run the eval suite whenever the underlying model or prompt changes.

## Constraints to respect throughout
${inputs.constraints || "(none specified)"}
`;
}

/* --------------------------- Maintenance --------------------------- */

function buildMaintenancePlan(inputs: ProjectInputs): string {
  return `# Maintenance & Evolution Plan — ${inputs.projectName}

> Code once "too risky to touch" can now be safely read, understood, and modified with agent
> assistance — but only if the harness (rules, tests, evals, observability) stays healthy.

## Ongoing responsibilities
${bulletList([
  "Keep the PRD and Architecture docs in sync with what actually shipped — treat drift as a bug.",
  "Review and prune the rule file quarterly; remove rules that no longer apply, add ones the agent needed but didn't have.",
  "Re-run the full eval suite after any model/provider change.",
  "Track technical debt explicitly in a TODO/backlog rather than letting agents silently work around it.",
])}

## Safe-refactor protocol for legacy/unfamiliar code
${numberedList([
  "Ask the agent to summarize the module's current behavior and produce characterization tests first.",
  "Only then request the refactor, with the characterization tests as the regression safety net.",
  "Review the diff against the summary produced in step 1 to catch behavior changes.",
])}

## Long-term context health
- Keep static context (rule file, persona) lean — move anything task-specific into
  on-demand "skills" or reference docs instead of bloating the always-loaded context.
- Periodically audit token spend: route deterministic, low-complexity tasks (test generation,
  lint fixes, changelog entries) to smaller/cheaper models; reserve frontier models for
  requirements, architecture, and first-pass implementation of new features.

## Project metadata
- Preferred agent: ${agentLabel(inputs.preferredAgent)}
- Spectrum position: ${inputs.spectrumPosition}
- Application type: ${inputs.appType}
`;
}

/* --------------------------- Master prompt --------------------------- */

function buildMasterPrompt(inputs: ProjectInputs, artifacts: Omit<SpecKitArtifacts, "masterPrompt">): string {
  const rigor = RIGOR[inputs.spectrumPosition];
  return `You are acting as an agentic software engineering system (${agentLabel(
    inputs.preferredAgent
  )}) operating under the "Factory Model": you are not just writing code, you are executing a
system of specs, tests, and guardrails that a human has already designed. Build the following
project end to end.

PROJECT: ${inputs.projectName}
ONE-LINER: ${inputs.oneLiner || "(see full brief below)"}
SPECTRUM POSITION: ${inputs.spectrumPosition} — ${rigor.riskProfile}

============================================================
1) FIRST, WRITE THESE FILES TO THE REPO EXACTLY AS PROVIDED
============================================================
- specs/prd.md              <- Product Requirements Document (below)
- specs/architecture.md      <- Architecture & Technical Design (below)
- specs/context-bundle.md    <- Context Engineering Bundle (below)
- specs/test-eval-plan.md    <- Test & Eval Plan (below)
- specs/implementation-plan.md <- Implementation Plan / Factory Model (below)
- specs/review-deploy-checklist.md <- Review, Deployment & Guardrails Checklist (below)
- specs/maintenance-plan.md  <- Maintenance & Evolution Plan (below)
- ${harnessFileName(inputs.preferredAgent)}  <- Agent rule file / static context (below) — place at repo root

============================================================
2) THEN, FOLLOW THIS WORKFLOW (do not skip steps)
============================================================
1. Read every file above before writing any implementation code.
2. Scaffold the project using the stack specified in architecture.md.
3. For each feature in implementation-plan.md, in order:
   a. Write or extend the data model it needs.
   b. Write the tests/evals for it FIRST, from test-eval-plan.md.
   c. Implement the smallest change that makes those tests pass.
   d. Run lint, typecheck, tests, and build — all must be green.
   e. Update specs/*.md if reality diverged from the plan, and note why.
4. Apply the review & deployment checklist before considering any feature "done".
5. If a requirement is ambiguous, STOP and ask a clarifying question instead of guessing.
6. Never invent packages, APIs, or files that don't exist. Verify before using.
7. Never commit secrets — read them from environment variables only.

============================================================
3) VERIFICATION BAR FOR THIS BUILD
============================================================
${rigor.verification}
Testing bar: ${rigor.testingBar}
Review bar: ${rigor.reviewBar}
CI gate: ${rigor.ciGate}

============================================================
4) FULL SPEC KIT
============================================================

--- specs/prd.md ---
${artifacts.prd}

--- specs/architecture.md ---
${artifacts.architecture}

--- specs/context-bundle.md ---
${artifacts.contextBundle}

--- specs/test-eval-plan.md ---
${artifacts.testEvalPlan}

--- specs/implementation-plan.md ---
${artifacts.implementationPlan}

--- specs/review-deploy-checklist.md ---
${artifacts.reviewDeployChecklist}

--- specs/maintenance-plan.md ---
${artifacts.maintenancePlan}

--- ${artifacts.harnessFileName} ---
${artifacts.harnessRules}

============================================================
5) START NOW
============================================================
Begin with Phase 1 (Bootstrap) from implementation-plan.md. Report back after each phase with
what changed, which tests were added, and whether everything is green before moving to the
next phase.
`;
}

export function generateSpecKit(inputs: ProjectInputs): SpecKitArtifacts {
  const rigor = RIGOR[inputs.spectrumPosition];

  const prd = buildPRD(inputs, rigor);
  const architecture = buildArchitecture(inputs, rigor);
  const harnessRules = buildHarnessRules(inputs, rigor);
  const contextBundle = buildContextBundle(inputs);
  const testEvalPlan = buildTestEvalPlan(inputs, rigor);
  const implementationPlan = buildImplementationPlan(inputs, rigor);
  const reviewDeployChecklist = buildReviewDeployChecklist(inputs, rigor);
  const maintenancePlan = buildMaintenancePlan(inputs);
  const fileName = harnessFileName(inputs.preferredAgent);

  const base = {
    prd,
    architecture,
    harnessRules,
    harnessFileName: fileName,
    contextBundle,
    testEvalPlan,
    implementationPlan,
    reviewDeployChecklist,
    maintenancePlan,
  };

  const masterPrompt = buildMasterPrompt(inputs, base);

  return { ...base, masterPrompt };
}
