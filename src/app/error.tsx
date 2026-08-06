"use client";

import { useEffect } from "react";

/**
 * Root error boundary for the app. In production, Next.js masks the original
 * Server Component error message ("The specific message is omitted in
 * production builds...") and only keeps a `digest`. The full underlying error
 * (e.g. `42P01: relation "projects" does not exist` or
 * `DATABASE_URL is required...`) is logged by the Next.js server with the same
 * digest. Logging the digest here lets you match it in
 * Vercel Dashboard -> Project -> Logs to retrieve the real error.
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      "[Server Component render error] digest=",
      error.digest ?? "(no digest)",
      "\nmessage=",
      error.message,
      "\ncause=",
      error.cause ?? "(no cause)"
    );
  }, [error]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-24 text-center">
      <p className="text-6xl">⚠️</p>
      <h1 className="mt-6 text-2xl font-extrabold text-white">حدث خطأ أثناء عرض الصفحة</h1>
      <p className="mt-3 text-slate-400">
        تعذّر تحميل الصفحة من الخادم. إذا استمرت المشكلة، انسخ معرّف الخطأ (digest) أدناه وابحث عنه في سجلّات Vercel
        للاطلاع على الخطأ الحقيقي.
      </p>
      {error.digest ? (
        <p className="mt-4 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-400">
          digest: <code className="text-indigo-300">{error.digest}</code>
        </p>
      ) : null}
      <button
        onClick={reset}
        className="mt-8 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 px-6 py-3 text-sm font-bold text-white"
      >
        إعادة المحاولة
      </button>
    </main>
  );
}
