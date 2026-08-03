import { toggleFavorite } from "@/lib/projects-repo";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await ctx.params;
  const id = parseId(rawId);
  if (id === null) return Response.json({ ok: false, error: "Invalid id" }, { status: 400 });

  try {
    const project = await toggleFavorite(id);
    if (!project) return Response.json({ ok: false, error: "Not found" }, { status: 404 });
    return Response.json({ ok: true, isFavorite: project.isFavorite });
  } catch (err) {
    console.error(err);
    return Response.json({ ok: false, error: "Failed to toggle favorite" }, { status: 500 });
  }
}
