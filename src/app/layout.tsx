import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo" });

export const metadata: Metadata = {
  title: "Vibe Kit Factory — من الفكرة إلى Vibe Coding جاهز",
  description:
    "أداة تُحوّل فكرتك إلى حزمة توثيق كاملة (متطلبات، معمارية، سياق، اختبارات، خطة تنفيذ، Prompt رئيسي) جاهزة لتسليمها لأي أداة Vibe Coding أو Agentic Engineering، اعتمادًا على إطار عمل ورقة \"The New SDLC with Vibe Coding\".",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable} data-scroll-behavior="smooth">
      <body className="min-h-screen bg-[#06060c] font-[family-name:var(--font-cairo)] text-slate-100 antialiased">
        <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(99,102,241,0.25),transparent)]" />
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#06060c]/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm">
                ⚙️
              </span>
              Vibe Kit Factory
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/" className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white">
                الرئيسية
              </Link>
              <Link href="/projects" className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white">
                مشاريعي
              </Link>
              <Link href="/templates" className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white">
                القوالب
              </Link>
              <Link href="/guide" className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white">
                الدليل
              </Link>
              <Link href="/settings" className="rounded-lg px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white">
                ⚙️
              </Link>
              <Link
                href="/builder"
                className="mr-1 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 px-4 py-2 font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:opacity-90"
              >
                ابدأ مشروعًا جديدًا
              </Link>
            </nav>
          </div>
        </header>
        {children}
        <footer className="mt-24 border-t border-white/10 py-10 text-center text-sm text-slate-500">
          <p>
            Vibe Kit Factory — مبني وفق إطار عمل ورقة{" "}
            <span className="text-slate-300">&quot;The New SDLC with Vibe Coding&quot;</span> (Osmani, Saboo, Kartakis — Google, 2026)
          </p>
        </footer>
      </body>
    </html>
  );
}
