import { deleteProject, getProject, regenerateProject } from "@/lib/projects-repo";
import { parseProjectInputs, ValidationError } from "@/lib/validation";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await ctx.params;
  const id = parseId(rawId);
  if (id === null) return Response.json({ ok: false, error: "معرّف غير صالح" }, { status: 400 });

  try {
    const project = await getProject(id);
    if (!project) return Response.json({ ok: false, error: "المشروع غير موجود" }, { status: 404 });
    return Response.json({ ok: true, project });
  } catch (err) {
    console.error("GET /api/projects/[id] error:", err);
    return Response.json({ ok: false, error: "فشل تحميل المشروع" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await ctx.params;
  const id = parseId(rawId);
  if (id === null) return Response.json({ ok: false, error: "معرّف غير صالح" }, { status: 400 });

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { ok: false, error: "الطلب يجب أن يحتوي على JSON صحيح." },
        { status: 400 }
      );
    }

    const inputs = parseProjectInputs(body);
    const project = await regenerateProject(id, inputs);

    if (!project) {
      return Response.json({ ok: false, error: "المشروع غير موجود" }, { status: 404 });
    }

    return Response.json({ ok: true, project });
  } catch (err) {
    if (err instanceof ValidationError) {
      return Response.json({ ok: false, error: err.message }, { status: 400 });
    }
    console.error("PUT /api/projects/[id] error:", err);
    return Response.json(
      { ok: false, error: "حدث خطأ أثناء تحديث المشروع. يرجى المحاولة مرة أخرى." },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await ctx.params;
  const id = parseId(rawId);
  if (id === null) return Response.json({ ok: false, error: "معرّف غير صالح" }, { status: 400 });

  try {
    const deleted = await deleteProject(id);
    if (!deleted) return Response.json({ ok: false, error: "المشروع غير موجود" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/projects/[id] error:", err);
    return Response.json(
      { ok: false, error: "فشل حذف المشروع" },
      { status: 500 }
    );
  }
}
