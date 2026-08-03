import { getSettings, updateSettings, resetSettings } from "@/lib/settings-repo";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getSettings();
    return Response.json({ ok: true, settings });
  } catch (err) {
    console.error(err);
    return Response.json({ ok: false, error: "Failed to load settings" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const settings = await updateSettings(body);
    return Response.json({ ok: true, settings });
  } catch (err) {
    console.error(err);
    return Response.json({ ok: false, error: "Failed to update settings" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const settings = await resetSettings();
    return Response.json({ ok: true, settings });
  } catch (err) {
    console.error(err);
    return Response.json({ ok: false, error: "Failed to reset settings" }, { status: 500 });
  }
}
