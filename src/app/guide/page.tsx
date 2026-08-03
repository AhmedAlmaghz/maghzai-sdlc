import Link from "next/link";

const WORKFLOW_STEPS = [
  {
    n: 1,
    title: "صف فكرة مشروعك",
    desc: "أدخل اسم المشروع، وصف الفكرة، الميزات الأساسية، والمتطلبات غير الوظيفية.",
    icon: "💡",
  },
  {
    n: 2,
    title: "اختر موضعك على الطيف",
    desc: "Vibe Coding للنماذج الأولية، Agentic Engineering للأنظمة الإنتاجية — يحدد صرامة المستندات.",
    icon: "📊",
  },
  {
    n: 3,
    title: "احصل على الحزمة الكاملة",
    desc: "PRD، معمارية، ملف قواعد الوكيل، حزمة سياق، خطة اختبارات، خطة تنفيذ، وPrompt رئيسي.",
    icon: "📦",
  },
  {
    n: 4,
    title: "سلّم الـ Prompt للوكيل",
    desc: "انسخ الـ Master Prompt والصقه في Claude Code أو Cursor أو Gemini CLI، ودعه يبني المشروع.",
    icon: "🚀",
  },
];

const ARTIFACTS = [
  {
    name: "PRD (Product Requirements Document)",
    desc: "وثيقة متطلبات المنتج: قصص المستخدمين، معايير القبول، حالات الحافة، ومقاييس النجاح.",
    file: "specs/prd.md",
  },
  {
    name: "Architecture & Design",
    desc: "الستاك التقني، التصميم العام، نموذج البيانات، هيكل المجلدات، والقرارات المعمارية.",
    file: "specs/architecture.md",
  },
  {
    name: "Agent Rule File",
    desc: "ملف القواعد للوكيل (CLAUDE.md / AGENTS.md / GEMINI.md) — السياق الثابت الذي يُحمّل دائمًا.",
    file: "CLAUDE.md أو ما يناسب أداتك",
  },
  {
    name: "Context Bundle",
    desc: "حزمة السياق الهندسي بأنواعه الستة: التعليمات، المعرفة، الذاكرة، الأمثلة، الأدوات، الضوابط.",
    file: "specs/context-bundle.md",
  },
  {
    name: "Test & Eval Plan",
    desc: "خطة الاختبارات والتقييمات: مصفوفة الاختبارات لكل ميزة، هرم الاختبارات، ومعايير 'Definition of Done'.",
    file: "specs/test-eval-plan.md",
  },
  {
    name: "Implementation Plan",
    desc: "خطة التنفيذ بنموذج المصنع: المراحل، وضع Conductor vs Orchestrator لكل مرحلة.",
    file: "specs/implementation-plan.md",
  },
  {
    name: "Review & Deploy Checklist",
    desc: "قوائم تحقق للمراجعة الآلية والبشرية، بوابات CI/CD، الـ Guardrails، وخطة النشر.",
    file: "specs/review-deploy-checklist.md",
  },
  {
    name: "Maintenance Plan",
    desc: "خطة الصيانة والتطور: المسؤوليات المستمرة، بروتوكول الـ Refactor الآمن، صحة السياق طويلة المدى.",
    file: "specs/maintenance-plan.md",
  },
  {
    name: "Master Prompt",
    desc: "الـ Prompt الرئيسي الذي يجمع كل ما سبق في تعليمات واحدة جاهزة للصق في أي أداة Vibe Coding.",
    file: "MASTER_PROMPT.md",
  },
];

const TIPS = [
  "كلما كان وصف الفكرة أوضح، كانت المستندات المولّدة أفضل. لا تبخل في التفاصيل.",
  "حدد 3-7 ميزات أساسية لـ MVP. كل ميزة تتحول إلى قصة مستخدم كاملة.",
  "اختر المتطلبات غير الوظيفية بعناية — تتحول إلى ضوابط صارمة في ملف قواعد الوكيل.",
  "استخدم القوالب الجاهزة لتوفير الوقت، ثم عدّل حسب حاجتك.",
  "راجع الـ Master Prompt قبل إعطائه للوكيل — تأكد أنه يعكس رؤيتك.",
  "أعد توليد الحزمة إذا تغيرت المتطلبات — كل إصدار يُحفظ.",
];

export default function GuidePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-14">
      <div className="mb-12 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-300">دليل الاستخدام</p>
        <h1 className="mt-2 text-3xl font-extrabold text-white md:text-4xl">كيف تستخدم Vibe Kit Factory</h1>
        <p className="mx-auto mt-3 max-w-2xl text-slate-400">
          دليل سريع لفهم سير العمل، المستندات المولّدة، وأفضل الممارسات.
        </p>
      </div>

      {/* Workflow */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-white">سير العمل</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW_STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-center"
            >
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/20 text-2xl">
                {s.icon}
              </div>
              <p className="text-xs font-bold text-indigo-300">الخطوة {s.n}</p>
              <h3 className="mt-1 text-base font-bold text-white">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Artifacts */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-white">المستندات المولّدة</h2>
        <div className="space-y-3">
          {ARTIFACTS.map((a) => (
            <div
              key={a.name}
              className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-white">{a.name}</h3>
                  <p className="mt-1 text-sm text-slate-400">{a.desc}</p>
                </div>
                <code className="shrink-0 rounded bg-white/5 px-2 py-1 font-mono text-xs text-slate-500">
                  {a.file}
                </code>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tips */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-white">نصائح للاستخدام الأمثل</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {TIPS.map((tip, i) => (
            <div
              key={i}
              className="flex gap-3 rounded-xl border border-indigo-400/20 bg-indigo-400/5 p-4"
            >
              <span className="text-lg text-indigo-300">💡</span>
              <p className="text-sm text-slate-300">{tip}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Framework reference */}
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
        <h2 className="text-xl font-bold text-white">الإطار النظري</h2>
        <p className="mt-2 text-slate-400">
          هذه الأداة مبنية وفق إطار عمل ورقة &quot;The New SDLC with Vibe Coding&quot; (Osmani, Saboo, Kartakis — Google, 2026)
          التي تصف التحول من كتابة الكود إلى التعبير عن النية، ومن المطوّر كمنفّذ إلى المطوّر كمهندس أنظمة.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-sm font-bold text-indigo-300">Factory Model</p>
            <p className="mt-1 text-xs text-slate-400">
              الناتج الأساسي للمطوّر هو النظام الذي ينتج الكود، لا الكود نفسه.
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-sm font-bold text-fuchsia-300">Context Engineering</p>
            <p className="mt-1 text-xs text-slate-400">
              جودة الكود المولّد تعتمد على جودة السياق، لا ذكاء الصياغة.
            </p>
          </div>
          <div className="rounded-xl bg-white/5 p-4">
            <p className="text-sm font-bold text-amber-300">Harness Engineering</p>
            <p className="mt-1 text-xs text-slate-400">
              Agent = Model + Harness. الحزام المحيط بالنموذج هو ما يجعله وكيلًا فعليًا.
            </p>
          </div>
        </div>
      </section>

      <div className="mt-12 text-center">
        <Link
          href="/builder"
          className="inline-block rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-indigo-500/25 transition hover:scale-[1.02]"
        >
          ابدأ ببناء مشروعك الآن ←
        </Link>
      </div>
    </main>
  );
}
