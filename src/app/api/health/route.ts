import { pingDatabase, databaseProvider } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await pingDatabase();
    return Response.json({ ok: true, databaseProvider });
  } catch {
    return Response.json({ ok: false, databaseProvider }, { status: 500 });
  }
}
