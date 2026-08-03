"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserSettings } from "@/lib/settings-repo";
import {
  AI_MODEL_CATALOG,
  AI_PROVIDER_LABELS,
  APP_TYPE_LABELS,
  PREFERRED_AGENT_LABELS,
  SPECTRUM_LABELS,
  TEAM_CONTEXT_LABELS,
  defaultAiModel,
  type AiProvider,
  type AppType,
  type PreferredAgent,
  type SpectrumPosition,
  type TeamContext,
} from "@/lib/types";

const inputCls =
  "w-full rounded-xl border border-white/10 bg-[#0b0b16] px-4 py-2.5 text-sm text-slate-100 outline-none transition focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20";

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
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
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

export default function SettingsClient({ initial }: { initial: UserSettings }) {
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resetting, setResetting] = useState(false);

  function set<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  function setAiProvider(provider: AiProvider) {
    setSettings((s) => ({ ...s, defaultAiProvider: provider, defaultAiModel: defaultAiModel(provider) }));
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!confirm("هل تريد إعادة الإعدادات للقيم الافتراضية؟")) return;
    setResetting(true);
    try {
      const res = await fetch("/api/settings", { method: "DELETE" });
      const data = await res.json();
      if (data.ok) {
        setSettings(data.settings);
      }
    } finally {
      setResetting(false);
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <Section title="القيم الافتراضية للمشاريع الجديدة" subtitle="ستُستخدم هذه القيم تلقائيًا عند بدء مشروع جديد.">
        <Field label="أداة الترميز الافتراضية">
          <select
            className={inputCls}
            value={settings.defaultAgent}
            onChange={(e) => set("defaultAgent", e.target.value as PreferredAgent)}
          >
            {Object.entries(PREFERRED_AGENT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        <Field label="موضع الطيف الافتراضي">
          <select
            className={inputCls}
            value={settings.defaultSpectrum}
            onChange={(e) => set("defaultSpectrum", e.target.value as SpectrumPosition)}
          >
            {Object.entries(SPECTRUM_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        <Field label="نوع المشروع الافتراضي">
          <select
            className={inputCls}
            value={settings.defaultAppType}
            onChange={(e) => set("defaultAppType", e.target.value as AppType)}
          >
            {Object.entries(APP_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        <Field label="سياق الفريق الافتراضي">
          <select
            className={inputCls}
            value={settings.defaultTeamContext}
            onChange={(e) => set("defaultTeamContext", e.target.value as TeamContext)}
          >
            {Object.entries(TEAM_CONTEXT_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="التقنيات الافتراضية (اختياري)"
          hint="اتركه فارغًا للاعتماد على الاقتراح التلقائي حسب نوع المشروع."
        >
          <input
            className={inputCls}
            value={settings.defaultTechStack}
            onChange={(e) => set("defaultTechStack", e.target.value)}
            placeholder="مثال: Next.js + PostgreSQL"
          />
        </Field>

        <Field label="مزود AI الافتراضي" hint="لا تحفظ هذه الإعدادات أي مفاتيح API؛ المفاتيح تبقى في متغيرات البيئة على الخادم.">
          <select
            className={inputCls}
            value={settings.defaultAiProvider}
            onChange={(e) => setAiProvider(e.target.value as AiProvider)}
          >
            {Object.entries(AI_PROVIDER_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>

        <Field label="نموذج AI الافتراضي" hint="يمكن استخدام اسم نموذج مخصص مع OpenAI-compatible providers.">
          <input
            className={inputCls}
            value={settings.defaultAiModel}
            onChange={(e) => set("defaultAiModel", e.target.value)}
            list="settings-ai-models"
            disabled={settings.defaultAiProvider === "disabled"}
          />
          <datalist id="settings-ai-models">
            {AI_MODEL_CATALOG[settings.defaultAiProvider].map((model) => (
              <option key={model.id} value={model.id}>
                {model.label}
              </option>
            ))}
          </datalist>
        </Field>
      </Section>

      <Section title="تفضيلات الواجهة">
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={settings.showWizardTips}
              onChange={(e) => set("showWizardTips", e.target.checked)}
              className="h-5 w-5 rounded border-white/20 bg-[#0b0b16] accent-indigo-500"
            />
            <span className="text-sm text-slate-200">عرض التلميحات والنصائح أثناء إنشاء المشروع</span>
          </label>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={settings.compactView}
              onChange={(e) => set("compactView", e.target.checked)}
              className="h-5 w-5 rounded border-white/20 bg-[#0b0b16] accent-indigo-500"
            />
            <span className="text-sm text-slate-200">العرض المضغوط لقائمة المشاريع</span>
          </label>
        </div>
      </Section>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "جارٍ الحفظ..." : saved ? "✓ تم الحفظ" : "حفظ الإعدادات"}
        </button>

        <button
          onClick={handleReset}
          disabled={resetting}
          className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
        >
          {resetting ? "..." : "إعادة للقيم الافتراضية"}
        </button>
      </div>
    </div>
  );
}
