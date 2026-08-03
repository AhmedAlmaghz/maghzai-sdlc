import { getProject } from "@/lib/projects-repo";
import JSZip from "jszip";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function slugify(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "project";
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await ctx.params;
  const id = parseId(rawId);
  if (id === null) return Response.json({ ok: false, error: "Invalid id" }, { status: 400 });

  const project = await getProject(id);
  if (!project) return Response.json({ ok: false, error: "Not found" }, { status: 404 });

  const zip = new JSZip();
  const a = project.artifacts;
  const specs = zip.folder("specs");
  specs?.file("prd.md", a.prd);
  specs?.file("architecture.md", a.architecture);
  specs?.file("context-bundle.md", a.contextBundle);
  specs?.file("test-eval-plan.md", a.testEvalPlan);
  specs?.file("implementation-plan.md", a.implementationPlan);
  specs?.file("review-deploy-checklist.md", a.reviewDeployChecklist);
  specs?.file("maintenance-plan.md", a.maintenancePlan);
  zip.file(a.harnessFileName, a.harnessRules);
  zip.file("MASTER_PROMPT.md", a.masterPrompt);
  zip.file(
    "metadata.json",
    JSON.stringify(
      {
        projectId: project.id,
        name: project.name,
        version: project.version,
        preferredAgent: project.preferredAgent,
        appType: project.appType,
        spectrumPosition: project.spectrumPosition,
        aiProvider: project.inputs.aiProvider ?? "disabled",
        aiModel: project.inputs.aiModel ?? "deterministic",
        generation: a.metadata ?? null,
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
  zip.file(
    "README.md",
    `# ${project.name} — Vibe Kit Factory export\n\nThis bundle was generated from the "Vibe Kit Factory" spec-kit builder, based on the\nVibe Coding <-> Agentic Engineering framework.\n\n## Generation metadata\n- Preferred coding agent: ${project.preferredAgent}\n- AI provider: ${project.inputs.aiProvider ?? "disabled"}\n- AI model: ${project.inputs.aiModel ?? "deterministic"}\n- Generation mode: ${a.metadata?.mode ?? "deterministic"}\n\n## How to use this\n1. Copy this entire folder into your empty project repository.\n2. Paste the contents of \`MASTER_PROMPT.md\` into your coding agent (${project.preferredAgent}).\n3. Let the agent read the \`specs/\` folder and the root rule file, then follow the workflow described in the master prompt.\n`
  );

  const raw = await zip.generateAsync({ type: "uint8array" });
  const buffer = new Uint8Array(raw.byteLength);
  buffer.set(raw);
  const asciiFilename = "spec-kit.zip";
  const utf8Filename = `${slugify(project.name)}-spec-kit.zip`;
  const blob = new Blob([buffer], { type: "application/zip" });

  return new Response(blob, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${asciiFilename}"; filename*=UTF-8''${encodeURIComponent(
        utf8Filename
      )}`,
    },
  });
}
