"use client";

import { useState } from "react";
import type { SpecKitArtifacts } from "@/lib/types";
import Markdown from "./Markdown";

interface Tab {
  key: string;
  label: string;
  filename: string;
  content: string;
  isPrompt?: boolean;
}

export default function SpecKitViewer({
  artifacts,
  projectId,
}: {
  artifacts: SpecKitArtifacts;
  projectId: number;
}) {
  const tabs: Tab[] = [
    { key: "masterPrompt", label: "🚀 Prompt الرئيسي", filename: "MASTER_PROMPT.md", content: artifacts.masterPrompt, isPrompt: true },
    { key: "prd", label: "المتطلبات (PRD)", filename: "prd.md", content: artifacts.prd },
    { key: "architecture", label: "المعمارية", filename: "architecture.md", content: artifacts.architecture },
    { key: "harness", label: `ملف الوكيل (${artifacts.harnessFileName})`, filename: artifacts.harnessFileName, content: artifacts.harnessRules },
    { key: "context", label: "حزمة السياق", filename: "context-bundle.md", content: artifacts.contextBundle },
    { key: "tests", label: "الاختبارات والتقييمات", filename: "test-eval-plan.md", content: artifacts.testEvalPlan },
    { key: "implementation", label: "خطة التنفيذ", filename: "implementation-plan.md", content: artifacts.implementationPlan },
    { key: "review", label: "المراجعة والنشر", filename: "review-deploy-checklist.md", content: artifacts.reviewDeployChecklist },
    { key: "maintenance", label: "الصيانة", filename: "maintenance-plan.md", content: artifacts.maintenancePlan },
  ];

  const [active, setActive] = useState(tabs[0].key);
  const [copied, setCopied] = useState(false);
  const current = tabs.find((t) => t.key === active) ?? tabs[0];

  async function copy() {
    await navigator.clipboard.writeText(current.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function downloadCurrent() {
    const blob = new Blob([current.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = current.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className="flex flex-wrap gap-1.5 border-b border-white/10 p-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
            className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${active === t.key
                ? t.isPrompt
                  ? "bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white"
                  : "bg-white/10 text-white"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-3">
        <div>
          <p className="font-mono text-xs text-slate-500">{current.filename}</p>
          {artifacts.metadata ? (
            <p className="mt-1 text-xs text-slate-500">
              {artifacts.metadata.mode} · {artifacts.metadata.aiProvider} · {artifacts.metadata.aiModel}
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copy}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
          >
            {copied ? "✅ تم النسخ" : "📋 نسخ"}
          </button>
          <button
            onClick={downloadCurrent}
            className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
          >
            ⬇️ تنزيل الملف
          </button>
          <a
            href={`/api/projects/${projectId}/export`}
            className="rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 px-3 py-1.5 text-xs font-bold text-white transition hover:opacity-90"
          >
            📦 تنزيل الحزمة كاملة (.zip)
          </a>
        </div>
      </div>

      <div className="max-h-[70vh] overflow-y-auto p-6">
        {current.isPrompt ? (
          <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-slate-300">
            {current.content}
          </pre>
        ) : (
          <Markdown content={current.content} />
        )}
      </div>
    </div>
  );
}
