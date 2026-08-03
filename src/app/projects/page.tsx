import { listProjects, getProjectStats } from "@/lib/projects-repo";
import { APP_TYPE_LABELS, SPECTRUM_LABELS } from "@/lib/types";
import Link from "next/link";
import ProjectsClient from "./ProjectsClient";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; appType?: string; spectrum?: string; favorites?: string }>;
}) {
  const params = await searchParams;
  const { items: projects, total } = await listProjects({
    search: params.search,
    appType: params.appType,
    spectrumPosition: params.spectrum,
    favoritesOnly: params.favorites === "true",
  });

  const stats = await getProjectStats();

  return (
    <main className="mx-auto max-w-6xl px-6 py-14">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-300">مشاريعي</p>
          <h1 className="mt-2 text-3xl font-extrabold text-white">حزم المشاريع المولّدة</h1>
          <p className="mt-1 text-sm text-slate-500">
            {stats.total} مشروع • {stats.favorites} مفضل • {stats.thisWeek} هذا الأسبوع
          </p>
        </div>
        <Link
          href="/builder"
          className="rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:opacity-90"
        >
          + مشروع جديد
        </Link>
      </div>

      <ProjectsClient
        projects={projects}
        total={total}
        initialSearch={params.search || ""}
        initialAppType={params.appType || ""}
        initialSpectrum={params.spectrum || ""}
        initialFavoritesOnly={params.favorites === "true"}
        appTypeLabels={APP_TYPE_LABELS}
        spectrumLabels={SPECTRUM_LABELS}
      />
    </main>
  );
}
