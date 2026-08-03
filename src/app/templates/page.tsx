import { listTemplates, type ProjectTemplate } from "@/lib/templates-repo";
import Link from "next/link";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
  saas: "SaaS",
  ecommerce: "التجارة الإلكترونية",
  ai: "الذكاء الاصطناعي",
  internal: "الأدوات الداخلية",
  backend: "الخدمات الخلفية",
  mobile: "تطبيقات الجوال",
  extension: "إضافات المتصفح",
  general: "عام",
};

function TemplateCard({ t }: { t: ProjectTemplate }) {
  return (
    <Link
      href={`/builder?template=${t.slug}`}
      className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-indigo-400/40 hover:bg-white/[0.05]"
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl">{t.icon}</span>
        <div>
          <h2 className="text-lg font-bold text-white group-hover:text-indigo-300">{t.nameAr}</h2>
          <p className="text-xs text-slate-500">{t.name}</p>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-400">{t.descriptionAr}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">
          {CATEGORY_LABELS[t.category] || t.category}
        </span>
        <span className="text-xs text-indigo-400 opacity-0 transition group-hover:opacity-100">
          استخدم هذا القالب ←
        </span>
      </div>
    </Link>
  );
}

export default async function TemplatesPage() {
  const templates = await listTemplates();

  // Group by category
  const byCategory: Record<string, ProjectTemplate[]> = {};
  for (const t of templates) {
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category].push(t);
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <div className="mb-10 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-300">القوالب الجاهزة</p>
        <h1 className="mt-2 text-3xl font-extrabold text-white md:text-4xl">ابدأ بسرعة مع قالب مُعَدّ مسبقًا</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-400">
          اختر قالبًا يناسب نوع مشروعك، وسيتم ملء معظم الحقول تلقائيًا — يمكنك تعديلها قبل التوليد.
        </p>
      </div>

      {Object.entries(byCategory).map(([cat, items]) => (
        <div key={cat} className="mb-10">
          <h2 className="mb-4 text-lg font-bold text-slate-200">{CATEGORY_LABELS[cat] || cat}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((t) => (
              <TemplateCard key={t.id} t={t} />
            ))}
          </div>
        </div>
      ))}

      <div className="mt-12 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center">
        <p className="text-slate-400">لا تجد ما تبحث عنه؟</p>
        <Link
          href="/builder"
          className="mt-4 inline-block rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 px-6 py-3 text-sm font-bold text-white"
        >
          ابدأ من الصفر
        </Link>
      </div>
    </main>
  );
}
