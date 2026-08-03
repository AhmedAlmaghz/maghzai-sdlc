import { getSettings } from "@/lib/settings-repo";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-indigo-300">الإعدادات</p>
        <h1 className="mt-2 text-3xl font-extrabold text-white">تخصيص تجربتك</h1>
        <p className="mt-2 text-slate-400">
          اضبط القيم الافتراضية لتسريع إنشاء المشاريع الجديدة.
        </p>
      </div>
      <SettingsClient initial={settings} />
    </main>
  );
}
