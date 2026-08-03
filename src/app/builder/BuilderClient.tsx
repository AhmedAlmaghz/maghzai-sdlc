"use client";

import { useState } from "react";
import type { UserSettings } from "@/lib/settings-repo";
import type { ProjectTemplate } from "@/lib/templates-repo";
import type {
  AiProvider,
  AppType,
  PreferredAgent,
  ProjectInputs,
  SpectrumPosition,
  TeamContext,
} from "@/lib/types";
import {
  AI_MODEL_CATALOG,
  AI_PROVIDER_LABELS,
  APP_TYPE_LABELS,
  NON_FUNCTIONAL_OPTIONS,
  PREFERRED_AGENT_LABELS,
  SPECTRUM_LABELS,
  TEAM_CONTEXT_LABELS,
  defaultAiModel,
} from "@/lib/types";

const STEPS = [
  { id: 1, title: "الفكرة الأساسية", desc: "اسم المشروع ووصفه" },
  { id: 2, title: "الميزات", desc: "الميزات الأساسية والمتطلبات" },
  { id: 3, title: "التقنيات", desc: "الستاك والتكاملات" },
  { id: 4, title: "الضبط", desc: "الطيف والفريق والأداة" },
];

const inputCls =
  "w-full rounded-xl border border-white/10 bg-[#0b0b16] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20";

function buildInitial(
  settings: UserSettings,
  template: ProjectTemplate | null
): ProjectInputs {
  const base: ProjectInputs = {
    projectName: "",
    oneLiner: "",
    idea: "",
    appType: settings.defaultAppType,
    targetUsers: "",
    keyFeatures: [""],
    nonFunctionalRequirements: [],
    techStackPreference: settings.defaultTechStack,
    integrations: [],
    spectrumPosition: settings.defaultSpectrum,
    teamContext: settings.defaultTeamContext,
    timeline: "",
    constraints: "",
    preferredAgent: settings.defaultAgent,
    aiProvider: settings.defaultAiProvider,
    aiModel: settings.defaultAiModel,
    successMetrics: "",
  };

  if (template) {
    return {
      ...base,
      ...template.inputs,
      keyFeatures:
        template.inputs.keyFeatures && template.inputs.keyFeatures.length > 0
          ? template.inputs.keyFeatures
          : [""],
    };
  }

  return base;
}

export default function BuilderClient({
  settings,
  template,
}: {
  settings: UserSettings;
  template: ProjectTemplate | null;
}) {
  const [step, setStep] = useState(1);
  const [values, setValues] = useState<ProjectInputs>(() => buildInitial(settings, template));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [integration, setIntegration] = useState("");

  function set<K extends keyof ProjectInputs>(key: K, value: ProjectInputs[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function setAiProvider(provider: AiProvider) {
    setValues((v) => ({ ...v, aiProvider: provider, aiModel: defaultAiModel(provider) }));
  }

  function canProceed(): boolean {
    if (step === 1) {
      return values.projectName.trim().length > 0 && values.idea.trim().length > 0;
    }
    return true;
  }

  async function handleSubmit() {
    setError(null);
    if (!values.projectName.trim()) {
      setError("يرجى إدخال اسم المشروع.");
      setStep(1);
      return;
    }
    if (!values.idea.trim()) {
      setError("يرجى وصف الفكرة أو المشكلة.");
      setStep(1);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...values,
        keyFeatures: values.keyFeatures.map((f) => f.trim()).filter(Boolean),
      };

      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error("استجابة غير متوقعة من الخادم. يرجى المحاولة مرة أخرى.");
      }

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "فشل إنشاء المشروع.");
      }
      // Use window.location for guaranteed navigation
      window.location.href = `/projects/${data.project.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8 text-center">
        {template && (
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-400/10 px-3 py-1 text-xs text-indigo-300">
            <span>{template.icon}</span>
            <span>قالب: {template.nameAr}</span>
          </p>
        )}
        <h1 className="text-3xl font-extrabold text-white md:text-4xl">
          {template ? `إنشاء ${template.nameAr}` : "مشروع جديد"}
        </h1>
        <p className="mt-2 text-slate-400">
          {settings.showWizardTips
            ? "أجب على الأسئلة خطوة بخطوة، ثم احصل على حزمة توثيق كاملة جاهزة للـ Vibe Coding."
            : "أكمل البيانات ثم اضغط توليد."}
        </p>
      </div>

      {/* Steps indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setStep(s.id)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${step === s.id
              ? "bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-white"
              : step > s.id
                ? "bg-white/10 text-slate-300"
                : "bg-white/5 text-slate-500"
              }`}
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-black/20 text-xs">
              {step > s.id ? "✓" : s.id}
            </span>
            <span className="hidden sm:inline">{s.title}</span>
          </button>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white">الفكرة الأساسية</h2>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-200">اسم المشروع *</label>
              <input
                className={inputCls}
                value={values.projectName}
                onChange={(e) => set("projectName", e.target.value)}
                placeholder="مثال: منصة إدارة المهام لفرق العمل الصغيرة"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-200">
                الفكرة بجملة واحدة
              </label>
              <input
                className={inputCls}
                value={values.oneLiner}
                onChange={(e) => set("oneLiner", e.target.value)}
                placeholder="مثال: أداة تساعد الفرق الصغيرة على تتبع المهام بسهولة"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-200">
                صف الفكرة أو المشكلة بالتفصيل *
              </label>
              <textarea
                className={`${inputCls} min-h-32`}
                value={values.idea}
                onChange={(e) => set("idea", e.target.value)}
                placeholder="اشرح المشكلة، لماذا هي مهمة، وما الذي يجعل حلك مختلفًا..."
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-200">نوع المشروع</label>
                <select
                  className={inputCls}
                  value={values.appType}
                  onChange={(e) => set("appType", e.target.value as AppType)}
                >
                  {Object.entries(APP_TYPE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-200">
                  المستخدمون المستهدفون
                </label>
                <input
                  className={inputCls}
                  value={values.targetUsers}
                  onChange={(e) => set("targetUsers", e.target.value)}
                  placeholder="مثال: مدراء المشاريع في الشركات الناشئة"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white">الميزات والمتطلبات</h2>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">
                الميزات الأساسية
              </label>
              <p className="mb-3 text-xs text-slate-500">
                كل ميزة تتحول تلقائيًا إلى قصة مستخدم (User Story) بمعايير قبول في PRD.
              </p>
              <div className="space-y-2">
                {values.keyFeatures.map((f, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      className={inputCls}
                      value={f}
                      placeholder={`الميزة ${i + 1}`}
                      onChange={(e) => {
                        const next = [...values.keyFeatures];
                        next[i] = e.target.value;
                        set("keyFeatures", next);
                      }}
                    />
                    {values.keyFeatures.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          set(
                            "keyFeatures",
                            values.keyFeatures.filter((_, idx) => idx !== i)
                          )
                        }
                        className="shrink-0 rounded-xl border border-white/15 px-3 text-slate-400 hover:bg-white/10"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => set("keyFeatures", [...values.keyFeatures, ""])}
                  className="rounded-xl border border-dashed border-white/20 px-4 py-2 text-sm text-slate-400 hover:border-indigo-400/50 hover:text-white"
                >
                  + إضافة ميزة
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">
                المتطلبات غير الوظيفية
              </label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {NON_FUNCTIONAL_OPTIONS.map((opt) => {
                  const checked = values.nonFunctionalRequirements.includes(opt);
                  return (
                    <label
                      key={opt}
                      className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition ${checked
                        ? "border-indigo-400/60 bg-indigo-400/10 text-white"
                        : "border-white/10 bg-[#0b0b16] text-slate-400 hover:border-white/20"
                        }`}
                    >
                      <input
                        type="checkbox"
                        className="accent-indigo-500"
                        checked={checked}
                        onChange={() =>
                          set(
                            "nonFunctionalRequirements",
                            checked
                              ? values.nonFunctionalRequirements.filter((o) => o !== opt)
                              : [...values.nonFunctionalRequirements, opt]
                          )
                        }
                      />
                      {opt}
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-200">مقاييس النجاح</label>
              <input
                className={inputCls}
                value={values.successMetrics}
                onChange={(e) => set("successMetrics", e.target.value)}
                placeholder="مثال: 100 مستخدم نشط أسبوعيًا خلال أول شهر"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white">التقنيات والتكاملات</h2>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-200">
                التقنيات المفضلة (اختياري)
              </label>
              <p className="mb-2 text-xs text-slate-500">
                اتركه فارغًا لتحصل على اقتراح تقني تلقائي مناسب لنوع المشروع.
              </p>
              <input
                className={inputCls}
                value={values.techStackPreference}
                onChange={(e) => set("techStackPreference", e.target.value)}
                placeholder="مثال: Next.js + PostgreSQL + Stripe"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-200">
                التكاملات الخارجية
              </label>
              <div className="flex gap-2">
                <input
                  className={inputCls}
                  value={integration}
                  placeholder="مثال: Stripe — اضغط Enter للإضافة"
                  onChange={(e) => setIntegration(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && integration.trim()) {
                      e.preventDefault();
                      set("integrations", [...values.integrations, integration.trim()]);
                      setIntegration("");
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (integration.trim()) {
                      set("integrations", [...values.integrations, integration.trim()]);
                      setIntegration("");
                    }
                  }}
                  className="shrink-0 rounded-xl border border-white/15 px-4 text-sm text-slate-300 hover:bg-white/10"
                >
                  إضافة
                </button>
              </div>
              {values.integrations.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {values.integrations.map((v, i) => (
                    <span
                      key={`${v}-${i}`}
                      className="flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1 text-xs text-indigo-200"
                    >
                      {v}
                      <button
                        onClick={() =>
                          set(
                            "integrations",
                            values.integrations.filter((_, idx) => idx !== i)
                          )
                        }
                        className="text-indigo-300 hover:text-white"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-200">الجدول الزمني</label>
                <input
                  className={inputCls}
                  value={values.timeline}
                  onChange={(e) => set("timeline", e.target.value)}
                  placeholder="مثال: نسخة أولية خلال أسبوعين"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-200">قيود</label>
                <input
                  className={inputCls}
                  value={values.constraints}
                  onChange={(e) => set("constraints", e.target.value)}
                  placeholder="مثال: ميزانية استضافة منخفضة"
                />
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-white">الضبط النهائي</h2>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-200">
                موضعك على طيف Vibe Coding ↔ Agentic Engineering
              </label>
              <p className="mb-3 text-xs text-slate-500">
                يحدد صرامة الاختبارات والمراجعة وبوابات CI في كل المستندات المولّدة.
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {(Object.entries(SPECTRUM_LABELS) as [SpectrumPosition, string][]).map(
                  ([key, label]) => (
                    <button
                      type="button"
                      key={key}
                      onClick={() => set("spectrumPosition", key)}
                      className={`rounded-2xl border p-4 text-right text-sm transition ${values.spectrumPosition === key
                        ? "border-fuchsia-400/60 bg-fuchsia-400/10 text-white"
                        : "border-white/10 bg-[#0b0b16] text-slate-400 hover:border-white/20"
                        }`}
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-200">سياق الفريق</label>
                <select
                  className={inputCls}
                  value={values.teamContext}
                  onChange={(e) => set("teamContext", e.target.value as TeamContext)}
                >
                  {Object.entries(TEAM_CONTEXT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-200">
                  أداة الترميز المفضلة
                </label>
                <select
                  className={inputCls}
                  value={values.preferredAgent}
                  onChange={(e) => set("preferredAgent", e.target.value as PreferredAgent)}
                >
                  {Object.entries(PREFERRED_AGENT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-200">مزود AI للتوليد</label>
                <p className="mb-2 text-xs text-slate-500">المفاتيح لا تُحفظ في الإعدادات؛ يقرأها الخادم من متغيرات البيئة.</p>
                <select
                  className={inputCls}
                  value={values.aiProvider}
                  onChange={(e) => setAiProvider(e.target.value as AiProvider)}
                >
                  {Object.entries(AI_PROVIDER_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-200">نموذج AI</label>
                <p className="mb-2 text-xs text-slate-500">يمكن إدخال اسم نموذج مخصص للواجهات المتوافقة مع OpenAI.</p>
                <input
                  className={inputCls}
                  value={values.aiModel}
                  onChange={(e) => set("aiModel", e.target.value)}
                  list="builder-ai-models"
                  disabled={values.aiProvider === "disabled"}
                />
                <datalist id="builder-ai-models">
                  {AI_MODEL_CATALOG[values.aiProvider].map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.label}
                    </option>
                  ))}
                </datalist>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between gap-4">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/5"
            >
              ← السابق
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="rounded-xl bg-indigo-500/80 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              التالي →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 px-8 py-3 text-base font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "جارٍ التوليد..." : "🚀 ولّد حزمة المشروع"}
            </button>
          )}
        </div>
      </div>

      {/* Tips */}
      {settings.showWizardTips && (
        <div className="mt-6 rounded-2xl border border-indigo-400/20 bg-indigo-400/5 p-5">
          <p className="text-sm font-semibold text-indigo-200">💡 نصيحة</p>
          <p className="mt-1 text-sm text-slate-400">
            {step === 1 &&
              "كلما كان وصف الفكرة أوضح وأشمل، كانت المستندات المولّدة أفضل. صف المشكلة والحل المقترح بتفصيل."}
            {step === 2 &&
              "حاول تحديد 3-7 ميزات أساسية لـ MVP. كل ميزة ستتحول إلى قصة مستخدم كاملة مع معايير قبول."}
            {step === 3 &&
              "لست مضطرًا لتحديد التقنيات — الأداة تقترح ستاك مناسب تلقائيًا حسب نوع المشروع."}
            {step === 4 &&
              "اختر 'Agentic Engineering' إذا كان المشروع للإنتاج الفعلي، و'Vibe Coding' للنماذج الأولية السريعة."}
          </p>
        </div>
      )}
    </div>
  );
}
