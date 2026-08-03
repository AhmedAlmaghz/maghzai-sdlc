import { getSettings } from "@/lib/settings-repo";
import { getTemplate } from "@/lib/templates-repo";
import BuilderClient from "./BuilderClient";

export const dynamic = "force-dynamic";

export default async function BuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const params = await searchParams;
  const settings = await getSettings();
  const template = params.template ? await getTemplate(params.template) : null;

  return (
    <main className="mx-auto max-w-4xl px-6 py-14">
      <BuilderClient settings={settings} template={template} />
    </main>
  );
}
