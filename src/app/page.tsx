import Link from "next/link";
import { getProjectStats } from "@/lib/projects-repo";
import { listTemplates } from "@/lib/templates-repo";

export const dynamic = "force-dynamic";

const CONTEXT_TYPES = [
  { title: "Instructions", ar: "التعليمات", desc: "دور الوكيل الأساسي، أهدافه، وحدود عمله." },
  { title: "Knowledge", ar: "المعرفة", desc: "المستندات، المخططات المعمارية، وبيانات النطاق." },
  { title: "Memory", ar: "الذاكرة", desc: "سجل الجلسة القصير + الحالة الدائمة للمشروع." },
  { title: "Examples", ar: "الأمثلة", desc: "نماذج قليلة (few-shot) وأنماط مرجعية من الكود." },
  { title: "Tools", ar: "الأدوات", desc: "تعريفات دقيقة للـ APIs والسكربتات وخوادم MCP." },
  { title: "Guardrails", ar: "الضوابط", desc: "قيود صارمة، قواعد تنسيق، وتحقّقات أمان." },
];

const SDLC_PHASES = [
  { n: "01", title: "المتطلبات والتخطيط", desc: "من فكرة إلى PRD وقصص مستخدم وحالات حافة — يُنتجها هذا الأداة تلقائيًا." },
  { n: "02", title: "التصميم والمعمارية", desc: "قرارات المفاضلة (Trade-offs) موثّقة لتنفيذ متسق عبر كل الوحدات." },
  { n: "03", title: "التنفيذ", desc: "خطة مقسّمة لمهام بحجم مناسب للوكيل، بنمط Conductor أو Orchestrator." },
  { n: "04", title: "الاختبار والجودة", desc: "عقد الاختبارات والتقييمات (Tests + Evals) قبل كتابة أي كود." },
  { n: "05", title: "المراجعة والنشر", desc: "قوائم تحقق للمراجعة الآلية والبشرية وبوابات CI/CD." },
  { n: "06", title: "الصيانة والتطور", desc: "خطة لإبقاء الحزام (Harness) وسياق المشروع صحيًا مع الزمن." },
];

const SPECTRUM = [
  {
    name: "Vibe Coding",
    tag: "استكشاف سريع",
    points: ["مطالبات لغوية عفوية", "تحقق: \"هل يبدو أنه يعمل؟\"", "مناسب للنماذج الأولية والمشاريع الشخصية"],
    color: "from-amber-500/20 to-amber-500/5 border-amber-500/30",
  },
  {
    name: "Structured AI-Assisted",
    tag: "ميزات داخل مشروع قائم",
    points: ["مطالبات مفصّلة مع أمثلة وقيود", "مراجعة انتقائية للمسارات الحرجة", "اختبارات آلية + بوابات CI أساسية"],
    color: "from-sky-500/20 to-sky-500/5 border-sky-500/30",
  },
  {
    name: "Agentic Engineering",
    tag: "أنظمة إنتاجية",
    points: ["مواصفات رسمية ووثائق معمارية وملفات ذاكرة", "تحقق منهجي في كل مرحلة (اختبارات + تقييمات)", "مخاطرة منخفضة، مناسب للإنتاج الفعلي"],
    color: "from-fuchsia-500/20 to-fuchsia-500/5 border-fuchsia-500/30",
  },
];

export default async function HomePage() {
  const stats = await getProjectStats();
  const templates = await listTemplates();

  return (
    <main>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-20 pb-16 text-center">
        <p className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs text-indigo-300">
          مبني وفق ورقة Google البحثية — The New SDLC with Vibe Coding (2026)
        </p>
        <h1 className="mx-auto max-w-4xl text-[clamp(2rem,5vw,3.75rem)] font-extrabold leading-[1.15] text-white">
          حوّل فكرتك إلى <span className="bg-gradient-to-l from-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">حزمة توثيق كاملة</span>{" "}
          جاهزة لأي أداة Vibe Coding
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          صف مشروعك مرة واحدة. تحصل على PRD، معمارية، ملف قواعد للوكيل (AGENTS.md/CLAUDE.md)، حزمة سياق هندسي،
          خطة اختبارات وتقييمات، خطة تنفيذ بنموذج المصنع (Factory Model)، وقائمة مراجعة ونشر — بالإضافة إلى
          <strong className="text-white"> Prompt رئيسي واحد</strong> جاهز للصق مباشرة في Claude Code أو Cursor أو Codex أو Gemini CLI.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/builder"
            className="rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-indigo-500/25 transition hover:scale-[1.02]"
          >
            ابدأ ببناء حزمة مشروعك ←
          </Link>
          <Link
            href="/templates"
            className="rounded-xl border border-white/15 px-7 py-3.5 text-base font-semibold text-slate-200 transition hover:bg-white/5"
          >
            استخدم قالبًا جاهزًا
          </Link>
        </div>

        {/* Quick stats */}
        {stats.total > 0 && (
          <div className="mx-auto mt-12 flex flex-wrap items-center justify-center gap-6 rounded-2xl border border-white/10 bg-white/[0.02] px-8 py-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-slate-500">مشروع</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{stats.favorites}</p>
              <p className="text-xs text-slate-500">مفضل</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">{stats.thisWeek}</p>
              <p className="text-xs text-slate-500">هذا الأسبوع</p>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <Link href="/projects" className="text-sm text-indigo-400 hover:underline">
              عرض الكل ←
            </Link>
          </div>
        )}
      </section>

      {/* Quick templates */}
      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">ابدأ بسرعة مع قالب</h2>
          <Link href="/templates" className="text-sm text-indigo-400 hover:underline">
            عرض الكل ←
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
          {templates.slice(0, 7).map((t) => (
            <Link
              key={t.id}
              href={`/builder?template=${t.slug}`}
              className="group rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center transition hover:border-indigo-400/40 hover:bg-white/[0.05]"
            >
              <span className="text-2xl">{t.icon}</span>
              <p className="mt-2 text-xs font-semibold text-slate-200 group-hover:text-white">{t.nameAr}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Factory model */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-12">
          <h2 className="text-2xl font-bold text-white md:text-3xl">نموذج المصنع (The Factory Model)</h2>
          <p className="mt-3 max-w-3xl text-slate-400">
            الناتج الأساسي للمطوّر لم يعد الكود، بل <strong className="text-white">النظام الذي ينتج الكود</strong>: مواصفات
            وسياق، وكلاء ينفّذون، اختبارات وبوابات جودة، حلقات تغذية راجعة، وضوابط أمان. هذه الأداة تبني ذلك النظام كاملًا نيابة عنك.
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-5">
            {["مواصفات وسياق", "وكلاء تنفيذ", "اختبارات وبوابات جودة", "حلقات تغذية راجعة", "ضوابط أمان"].map((step, i) => (
              <div key={step} className="relative rounded-2xl border border-white/10 bg-[#0b0b16] p-5 text-center">
                <div className="mx-auto mb-3 grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold">
                  {i + 1}
                </div>
                <p className="text-sm font-semibold text-slate-100">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Spectrum */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-white md:text-3xl">من Vibe Coding إلى Agentic Engineering</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-400">
          الفارق الحقيقي ليس استخدام الذكاء الاصطناعي من عدمه، بل مقدار البنية والتحقق والحكم البشري المحيط بمخرجاته.
          تختار موضع مشروعك على هذا الطيف، فتُضبط صرامة كل مستند يُولَّد لك تلقائيًا.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {SPECTRUM.map((s) => (
            <div key={s.name} className={`rounded-2xl border bg-gradient-to-b p-6 ${s.color}`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">{s.tag}</p>
              <h3 className="mt-2 text-xl font-bold text-white">{s.name}</h3>
              <ul className="mt-4 space-y-2 text-sm text-slate-300">
                {s.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="text-indigo-300">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Context engineering */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 md:p-12">
          <h2 className="text-2xl font-bold text-white md:text-3xl">هندسة السياق: المهارة الحقيقية</h2>
          <p className="mt-3 max-w-3xl text-slate-400">
            جودة الكود المُولَّد بالذكاء الاصطناعي تعتمد على جودة السياق المُعطى للوكيل أكثر من ذكاء الصياغة. تبني هذه
            الأداة حزمة سياق كاملة بأنواعه الستة، مع فصل واضح بين السياق الثابت (Static) والديناميكي (Dynamic).
          </p>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CONTEXT_TYPES.map((c) => (
              <div key={c.title} className="rounded-2xl border border-white/10 bg-[#0b0b16] p-5">
                <p className="text-sm font-bold text-indigo-300">{c.title}</p>
                <p className="mt-1 text-base font-semibold text-white">{c.ar}</p>
                <p className="mt-2 text-sm text-slate-400">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SDLC phases */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-bold text-white md:text-3xl">دورة حياة تطوير جديدة (AI-Driven SDLC)</h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-slate-400">
          كل مرحلة من مراحل SDLC التقليدية أُعيد تشكيلها. الأداة تُنتج مستندًا مخصصًا لكل مرحلة تلقائيًا من مدخلاتك.
        </p>
        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SDLC_PHASES.map((p) => (
            <div key={p.n} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <span className="text-3xl font-black text-white/10">{p.n}</span>
              <h3 className="-mt-6 text-lg font-bold text-white">{p.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Harness */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 p-8 md:p-12">
          <h2 className="text-2xl font-bold text-white md:text-3xl">Agent = Model + Harness</h2>
          <p className="mt-3 max-w-3xl text-slate-400">
            النموذج مجرد محرك خام. ما يجعله وكيلًا فعليًا هو الحزام المحيط به: ملفات القواعد (AGENTS.md /
            CLAUDE.md / GEMINI.md)، الأدوات وخوادم MCP، بيئات التنفيذ الآمنة، منطق التنسيق، الضوابط والـ Hooks،
            والمراقبة (Observability). هذه الأداة تُنتج لك ملف الحزام جاهزًا حسب أداة الترميز التي تفضّلها.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/builder"
              className="rounded-xl bg-white px-7 py-3.5 text-base font-bold text-slate-950 shadow-xl transition hover:scale-[1.02]"
            >
              ابنِ حزام مشروعك الآن ←
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
