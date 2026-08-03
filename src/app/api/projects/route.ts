import { createProject, listProjects } from "@/lib/projects-repo";
import { parseProjectInputs, ValidationError } from "@/lib/validation";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search") || undefined;
    const appType = url.searchParams.get("appType") || undefined;
    const spectrumPosition = url.searchParams.get("spectrum") || undefined;
    const favoritesOnly = url.searchParams.get("favorites") === "true";

    const result = await listProjects({ search, appType, spectrumPosition, favoritesOnly });
    return Response.json({ ok: true, items: result.items, total: result.total });
  } catch (err) {
    console.error("GET /api/projects error:", err);
    return Response.json({ ok: false, error: "Failed to list projects" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json({ ok: false, error: "الطلب يجب أن يحتوي على JSON صحيح." }, { status: 400 });
    }

    const inputs = parseProjectInputs(body);
    const project = await createProject(inputs);
    return Response.json({ ok: true, project }, { status: 201 });
  } catch (err) {
    if (err instanceof ValidationError) {
      return Response.json({ ok: false, error: err.message }, { status: 400 });
    }
    console.error("POST /api/projects error:", err);
    return Response.json(
      { ok: false, error: "حدث خطأ أثناء إنشاء المشروع. يرجى المحاولة مرة أخرى." },
      { status: 500 }
    );
  }
}
