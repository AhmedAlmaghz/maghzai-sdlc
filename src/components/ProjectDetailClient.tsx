"use client";

import { useState } from "react";
import ProjectForm from "./ProjectForm";
import SpecKitViewer from "./SpecKitViewer";
import {
  AI_PROVIDER_LABELS,
  APP_TYPE_LABELS,
  PREFERRED_AGENT_LABELS,
  SPECTRUM_LABELS,
  TEAM_CONTEXT_LABELS,
  type ProjectInputs,
  type ProjectRecord,
} from "@/lib/types";

async function safeFetch(
  url: string,
  opts: RequestInit
): Promise<{ ok: boolean; data: Record<string, unknown> | null; error: string | null }> {
  try {
    const res = await fetch(url, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        Accept: "application/json",
      },
    });
    const text = await res.text();
    let data: Record<string, unknown> | null = null;
    try {
      data = JSON.parse(text);
    } catch {
      return {
        ok: false,
        data: null,
        error: "استجابة غير متوقعة من الخادم. يرجى تحديث الصفحة والمحاولة مرة أخرى.",
      };
    }
    if (!res.ok) {
      return {
        ok: false,
        data,
        error: (data?.error as string) || `خطأ من الخادم (${res.status})`,
      };
    }
    return { ok: true, data, error: null };
  } catch {
    return {
      ok: false,
      data: null,
      error: "تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.",
    };
  }
}

export default function ProjectDetailClient({
  project: initialProject,
}: {
  project: ProjectRecord;
}) {
  const [project, setProject] = useState(initialProject);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(initialProject.isFavorite);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleUpdate(inputs: ProjectInputs) {
    const { ok, data, error } = await safeFetch(`/api/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inputs),
    });

    if (!ok || !data) {
      throw new Error(error || "فشل تحديث المشروع.");
    }

    // Update local state instead of router.refresh()
    const updated = data.project as unknown as ProjectRecord;
    setProject(updated);
    setEditing(false);
    setSuccessMsg("تم تحديث المشروع وإعادة توليد الحزمة بنجاح ✓");
    setTimeout(() => setSuccessMsg(null), 4000);
  }

  async function handleDelete() {
    if (!confirm("هل أنت متأكد من حذف هذا المشروع؟ لا يمكن التراجع عن هذا الإجراء."))
      return;
    setDeleting(true);
    const { ok } = await safeFetch(`/api/projects/${project.id}`, {
      method: "DELETE",
    });
    if (ok) {
      window.location.href = "/projects";
    } else {
      setDeleting(false);
      alert("تعذر حذف المشروع.");
    }
  }

  async function toggleFavorite() {
    setIsFavorite((v) => !v);
    await safeFetch(`/api/projects/${project.id}/favorite`, { method: "POST" });
  }

  const inputs = project.inputs;

  return (
    <div className="space-y-6">
      {/* Success message */}
      {successMsg && (
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-3 text-sm font-semibold text-green-300">
          {successMsg}
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              onClick={toggleFavorite}
              className={`mt-1 text-2xl transition ${isFavorite ? "text-amber-400" : "text-slate-600 hover:text-amber-400"
                }`}
              aria-label={isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
            >
              {isFavorite ? "★" : "☆"}
            </button>
            <div>
              <h1 className="text-2xl font-extrabold text-white md:text-3xl">
                {project.name}
              </h1>
              <p className="mt-2 max-w-2xl text-slate-400">
                {project.oneLiner || "بدون وصف مختصر"}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => setEditing((v) => !v)}
              className="rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              {editing ? "إغلاق التعديل" : "✏️ تعديل"}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-xl border border-red-500/30 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
            >
              {deleting ? "..." : "🗑️"}
            </button>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-indigo-400/10 px-3 py-1.5 text-indigo-200">
            {APP_TYPE_LABELS[project.appType]}
          </span>
          <span className="rounded-full bg-fuchsia-400/10 px-3 py-1.5 text-fuchsia-200">
            {SPECTRUM_LABELS[project.spectrumPosition].split("—")[0].trim()}
          </span>
          <span className="rounded-full bg-white/5 px-3 py-1.5 text-slate-300">
            {PREFERRED_AGENT_LABELS[project.preferredAgent]}
          </span>
          <span className="rounded-full bg-white/5 px-3 py-1.5 text-slate-300">
            {TEAM_CONTEXT_LABELS[inputs.teamContext]}
          </span>
          <span className="rounded-full bg-white/5 px-3 py-1.5 text-slate-300">
            {AI_PROVIDER_LABELS[inputs.aiProvider ?? "disabled"]} · {inputs.aiModel ?? "deterministic"}
          </span>
          <span className="rounded-full bg-white/5 px-3 py-1.5 text-slate-500">
            v{project.version}
          </span>
        </div>
      </div>

      {/* Quick summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">الميزات</p>
          <p className="mt-1 text-xl font-bold text-white">
            {inputs.keyFeatures.filter(Boolean).length}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">التكاملات</p>
          <p className="mt-1 text-xl font-bold text-white">
            {inputs.integrations.length || 0}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">
            المتطلبات غير الوظيفية
          </p>
          <p className="mt-1 text-xl font-bold text-white">
            {inputs.nonFunctionalRequirements.length || 0}
          </p>
        </div>
      </div>

      {editing && (
        <div className="rounded-2xl border border-indigo-400/30 bg-indigo-400/5 p-6 md:p-8">
          <h2 className="mb-6 text-lg font-bold text-white">تعديل مدخلات المشروع</h2>
          <ProjectForm
            initial={project.inputs}
            submitLabel="حفظ وإعادة توليد الحزمة"
            onSubmit={handleUpdate}
          />
        </div>
      )}

      <SpecKitViewer artifacts={project.artifacts} projectId={project.id} />
    </div>
  );
}
