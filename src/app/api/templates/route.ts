import { listTemplates } from "@/lib/templates-repo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const templates = await listTemplates();
    return Response.json({ ok: true, templates });
  } catch (err) {
    console.error(err);
    return Response.json({ ok: false, error: "Failed to load templates" }, { status: 500 });
  }
}
