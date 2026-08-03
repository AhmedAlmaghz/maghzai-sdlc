"use client";

import { useState } from "react";
import {
  AI_MODEL_CATALOG,
  AI_PROVIDER_LABELS,
  APP_TYPE_LABELS,
  NON_FUNCTIONAL_OPTIONS,
  PREFERRED_AGENT_LABELS,
  SPECTRUM_LABELS,
  TEAM_CONTEXT_LABELS,
  defaultAiModel,
  type AiProvider,
  type AppType,
  type PreferredAgent,
  type ProjectInputs,
  type SpectrumPosition,
  type TeamContext,
} from "@/lib/types";

const EMPTY: ProjectInputs = {
  projectName: "",
  oneLiner: "",
  idea: "",
  appType: "web-app",
  targetUsers: "",
  keyFeatures: [""],
  nonFunctionalRequirements: [],
  techStackPreference: "",
  integrations: [],
  spectrumPosition: "structured",
  teamContext: "solo",
  timeline: "",
  constraints: "",
  preferredAgent: "claude-code",
  aiProvider: "disabled",
  aiModel: "deterministic",
  successMetrics: "",
};

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-200">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

const inputCls =
  "w-full rounded-xl border border-white/10 bg-[#0b0b16] px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20";

function TagList({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const [draft, setDraft] = useState("");

  function add() {
    const v = draft.trim();
    if (!v) return;
    onChange([...values, v]);
    setDraft("");
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          className={inputCls}
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <button
          type="button"
          onClick={add}
          className="shrink-0 rounded-xl border border-white/15 px-4 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
        >
          إضافة
        </button>
      </div>
      {values.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {values.map((v, i) => (
            <span
              key={`${v}-${i}`}
              className="flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-3 py-1 text-xs text-indigo-200"
            >
              {v}
              <button
                type="button"
                onClick={() => onChange(values.filter((_, idx) => idx !== i))}
                className="text-indigo-300 hover:text-white"
                aria-label="حذف"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function FeatureList({ values, onChange }: { values: string[]; onChange: (next: string[]) => void }) {
  return (
    <div className="space-y-2">
      {values.map((v, i) => (
        <div key={i} className="flex gap-2">
          <input
            className={inputCls}
            value={v}
            placeholder={`الميزة ${i + 1} (مثال: تسجيل دخول المستخدمين)`}
            onChange={(e) => {
              const next = [...values];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
          <button
            type="button"
            onClick={() => onChange(values.filter((_, idx) => idx !== i))}
            className="shrink-0 rounded-xl border border-white/15 px-3 text-sm text-slate-300 transition hover:bg-white/10"
            aria-label="حذف الميزة"
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...values, ""])}
        className="rounded-xl border border-dashed border-white/20 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-indigo-400/50 hover:text-white"
      >
        + إضافة ميزة أخرى
      </button>
    </div>
  );
}

export default function ProjectForm({
  initial,
  submitLabel = "ولّد حزمة المشروع",
  onSubmit,
}: {
  initial?: Partial<ProjectInputs>;
  submitLabel?: string;
  onSubmit: (inputs: ProjectInputs) => Promise<void>;
}) {
  const [values, setValues] = useState<ProjectInputs>({ ...EMPTY, ...initial });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ProjectInputs>(key: K, value: ProjectInputs[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function setAiProvider(provider: AiProvider) {
    setValues((v) => ({ ...v, aiProvider: provider, aiModel: defaultAiModel(provider) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!values.projectName.trim()) {
      setError("يرجى إدخال اسم المشروع.");
      return;
    }
    if (!values.idea.trim()) {
      setError("يرجى وصف الفكرة أو المشكلة التي يحلها المشروع.");
      return;
    }

    setSubmitting(true);
    try {
      const cleanedInputs = {
        ...values,
        keyFeatures: values.keyFeatures.map((f) => f.trim()).filter(Boolean),
      };
      await onSubmit(cleanedInputs);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="1. أساسيات المشروع" subtitle="اسم المشروع وفكرته الأساسية.">
        <Field label="اسم المشروع *">
          <input
            className={inputCls}
            value={values.projectName}
            onChange={(e) => set("projectName", e.target.value)}
            placeholder="مثال: منصة إدارة المهام لفرق العمل الصغيرة"
            required
          />
        </Field>
        <Field label="الفكرة بجملة واحدة" hint="نبذة قصيرة تُستخدم في كل المستندات المولّدة.">
          <input
            className={inputCls}
            value={values.oneLiner}
            onChange={(e) => set("oneLiner", e.target.value)}
            placeholder="مثال: أداة تساعد الفرق الصغيرة على تتبع المهام والمواعيد النهائية بسهولة"
          />
        </Field>
        <Field label="صف الفكرة أو المشكلة بالتفصيل *">
          <textarea
            className={`${inputCls} min-h-32`}
            value={values.idea}
            onChange={(e) => set("idea", e.target.value)}
            placeholder="اشرح المشكلة، لماذا هي مهمة، وما الذي يجعل حلك مختلفًا..."
            required
          />
        </Field>
        <Field label="نوع المشروع">
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
        </Field>
        <Field label="المستخدمون المستهدفون">
          <input
            className={inputCls}
            value={values.targetUsers}
            onChange={(e) => set("targetUsers", e.target.value)}
            placeholder="مثال: مدراء المشاريع في الشركات الناشئة"
          />
        </Field>
      </Section>

      <Section title="2. الميزات الأساسية" subtitle="كل ميزة تتحول تلقائيًا إلى قصة مستخدم بمعايير قبول في PRD.">
        <FeatureList values={values.keyFeatures} onChange={(v) => set("keyFeatures", v)} />
      </Section>

      <Section title="3. المتطلبات غير الوظيفية" subtitle="تُترجم إلى ضوابط (Guardrails) صارمة في الحزمة المولدة.">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {NON_FUNCTIONAL_OPTIONS.map((opt) => {
            const checked = values.nonFunctionalRequirements.includes(opt);
            return (
              <label
                key={opt}
                className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition ${checked
                    ? "border-indigo-400/60 bg-indigo-400/10 text-white"
                    : "border-white/10 bg-[#0b0b16] text-slate-300 hover:border-white/20"
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
      </Section>

      <Section title="4. التقنيات والتكاملات">
        <Field label="التقنيات المفضلة (اختياري)" hint="اتركه فارغًا لتحصل على اقتراح تقني تلقائي مناسب لنوع المشروع.">
          <input
            className={inputCls}
            value={values.techStackPreference}
            onChange={(e) => set("techStackPreference", e.target.value)}
            placeholder="مثال: Next.js + PostgreSQL"
          />
        </Field>
        <Field label="التكاملات الخارجية">
          <TagList
            values={values.integrations}
            onChange={(v) => set("integrations", v)}
            placeholder="مثال: Stripe، اضغط Enter أو زر الإضافة"
          />
        </Field>
      </Section>

      <Section
        title="5. موضع مشروعك على الطيف"
        subtitle="يحدد صرامة الاختبارات، المراجعة، وبوابات CI في كل المستندات المولّدة."
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {(Object.entries(SPECTRUM_LABELS) as [SpectrumPosition, string][]).map(([key, label]) => (
            <button
              type="button"
              key={key}
              onClick={() => set("spectrumPosition", key)}
              className={`rounded-2xl border p-4 text-right text-sm transition ${values.spectrumPosition === key
                  ? "border-fuchsia-400/60 bg-fuchsia-400/10 text-white"
                  : "border-white/10 bg-[#0b0b16] text-slate-300 hover:border-white/20"
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      <Section title="6. سياق الفريق وأداة الترميز ومولّد AI">
        <Field label="سياق الفريق">
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
        </Field>
        <Field label="أداة الترميز المفضلة" hint="يحدد اسم ملف قواعد الوكيل المولّد (مثل CLAUDE.md أو AGENTS.md).">
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
        </Field>
        <Field label="مزود AI للتوليد" hint="لا تُحفظ مفاتيح API هنا؛ يقرأ الخادم المفاتيح من متغيرات البيئة فقط.">
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
        </Field>
        <Field label="نموذج AI" hint="يمكن كتابة اسم نموذج مخصص عند استخدام واجهة OpenAI-compatible.">
          <input
            className={inputCls}
            value={values.aiModel}
            onChange={(e) => set("aiModel", e.target.value)}
            list="project-ai-models"
            disabled={values.aiProvider === "disabled"}
          />
          <datalist id="project-ai-models">
            {AI_MODEL_CATALOG[values.aiProvider].map((model) => (
              <option key={model.id} value={model.id}>
                {model.label}
              </option>
            ))}
          </datalist>
        </Field>
      </Section>

      <Section title="7. تفاصيل إضافية (اختياري)">
        <Field label="مقاييس النجاح">
          <textarea
            className={`${inputCls} min-h-20`}
            value={values.successMetrics}
            onChange={(e) => set("successMetrics", e.target.value)}
            placeholder="مثال: 100 مستخدم نشط أسبوعيًا خلال أول شهر"
          />
        </Field>
        <Field label="الجدول الزمني">
          <input
            className={inputCls}
            value={values.timeline}
            onChange={(e) => set("timeline", e.target.value)}
            placeholder="مثال: نسخة أولية خلال أسبوعين"
          />
        </Field>
        <Field label="قيود يجب مراعاتها">
          <textarea
            className={`${inputCls} min-h-20`}
            value={values.constraints}
            onChange={(e) => set("constraints", e.target.value)}
            placeholder="مثال: يجب الالتزام بميزانية استضافة منخفضة، أو الامتثال لمعايير معينة"
          />
        </Field>
      </Section>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 px-6 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/25 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "جارٍ التوليد…" : submitLabel}
      </button>
    </form>
  );
}
