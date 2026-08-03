"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import Link from "next/link";
import type { AppType, ProjectRecord, SpectrumPosition } from "@/lib/types";

interface Props {
  projects: ProjectRecord[];
  total: number;
  initialSearch: string;
  initialAppType: string;
  initialSpectrum: string;
  initialFavoritesOnly: boolean;
  appTypeLabels: Record<AppType, string>;
  spectrumLabels: Record<SpectrumPosition, string>;
}

export default function ProjectsClient({
  projects,
  total,
  initialSearch,
  initialAppType,
  initialSpectrum,
  initialFavoritesOnly,
  appTypeLabels,
  spectrumLabels,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch);
  const [appType, setAppType] = useState(initialAppType);
  const [spectrum, setSpectrum] = useState(initialSpectrum);
  const [favoritesOnly, setFavoritesOnly] = useState(initialFavoritesOnly);

  function applyFilters() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (appType) params.set("appType", appType);
    if (spectrum) params.set("spectrum", spectrum);
    if (favoritesOnly) params.set("favorites", "true");
    startTransition(() => {
      router.push(`/projects?${params.toString()}`);
    });
  }

  function clearFilters() {
    setSearch("");
    setAppType("");
    setSpectrum("");
    setFavoritesOnly(false);
    startTransition(() => {
      router.push("/projects");
    });
  }

  async function toggleFavorite(e: React.MouseEvent, id: number) {
    e.preventDefault();
    e.stopPropagation();
    await fetch(`/api/projects/${id}/favorite`, { method: "POST" });
    router.refresh();
  }

  const hasFilters = search || appType || spectrum || favoritesOnly;

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">بحث</label>
            <input
              type="text"
              placeholder="ابحث بالاسم أو الوصف..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              className="w-full rounded-xl border border-white/10 bg-[#0b0b16] px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-indigo-400/60"
            />
          </div>
          <div className="w-40">
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">نوع المشروع</label>
            <select
              value={appType}
              onChange={(e) => setAppType(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0b0b16] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-400/60"
            >
              <option value="">الكل</option>
              {Object.entries(appTypeLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div className="w-44">
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">الطيف</label>
            <select
              value={spectrum}
              onChange={(e) => setSpectrum(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0b0b16] px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-indigo-400/60"
            >
              <option value="">الكل</option>
              {Object.entries(spectrumLabels).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.split("—")[0].trim()}
                </option>
              ))}
            </select>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-[#0b0b16] px-4 py-2.5 text-sm text-slate-300 transition hover:border-white/20">
            <input
              type="checkbox"
              checked={favoritesOnly}
              onChange={(e) => setFavoritesOnly(e.target.checked)}
              className="accent-fuchsia-500"
            />
            المفضلة فقط
          </label>
          <button
            onClick={applyFilters}
            disabled={isPending}
            className="rounded-xl bg-indigo-500/80 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
          >
            {isPending ? "..." : "تطبيق"}
          </button>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="rounded-xl border border-white/15 px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5"
            >
              مسح الفلاتر
            </button>
          )}
        </div>
        {total > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            عرض {projects.length} من {total} مشروع
          </p>
        )}
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-16 text-center">
          {hasFilters ? (
            <>
              <p className="text-lg font-semibold text-slate-200">لا توجد نتائج</p>
              <p className="mt-2 text-slate-500">جرب تعديل معايير البحث أو الفلاتر.</p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-slate-200">لا توجد مشاريع بعد</p>
              <p className="mt-2 text-slate-500">ابدأ ببناء أول حزمة مشروع لديك خلال دقائق.</p>
              <Link
                href="/builder"
                className="mt-6 inline-block rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 px-6 py-3 text-sm font-bold text-white"
              >
                ابدأ الآن
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="group relative rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-indigo-400/40 hover:bg-white/[0.05]"
            >
              <button
                onClick={(e) => toggleFavorite(e, p.id)}
                className={`absolute left-3 top-3 text-lg transition ${
                  p.isFavorite ? "text-amber-400" : "text-slate-600 hover:text-amber-400"
                }`}
                aria-label={p.isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
              >
                {p.isFavorite ? "★" : "☆"}
              </button>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-bold text-white group-hover:text-indigo-300">{p.name}</h2>
                <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-400">
                  v{p.version}
                </span>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-slate-400">{p.oneLiner || "بدون وصف"}</p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                <span className="rounded-full bg-indigo-400/10 px-2.5 py-1 text-indigo-200">
                  {appTypeLabels[p.appType]}
                </span>
                <span className="rounded-full bg-fuchsia-400/10 px-2.5 py-1 text-fuchsia-200">
                  {spectrumLabels[p.spectrumPosition].split("—")[0].trim()}
                </span>
              </div>
              <p className="mt-3 text-[10px] text-slate-600">
                {new Date(p.updatedAt).toLocaleDateString("ar-EG", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
