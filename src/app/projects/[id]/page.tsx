import { getProject } from "@/lib/projects-repo";
import ProjectDetailClient from "@/components/ProjectDetailClient";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const project = await getProject(id);
  if (!project) notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <ProjectDetailClient project={project} />
    </main>
  );
}
