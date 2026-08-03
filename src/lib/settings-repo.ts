import { databaseProvider, getPostgresPool, getSqliteClient } from "@/db";
import { resolveAiSelectionForRuntime } from "./ai-runtime";
import { defaultAiModel, isKnownAiProvider } from "./types";
import type { AiProvider, PreferredAgent, SpectrumPosition, AppType, TeamContext } from "./types";

export interface UserSettings {
  defaultAgent: PreferredAgent;
  defaultSpectrum: SpectrumPosition;
  defaultAppType: AppType;
  defaultTeamContext: TeamContext;
  defaultTechStack: string;
  defaultAiProvider: AiProvider;
  defaultAiModel: string;
  showWizardTips: boolean;
  language: "ar" | "en";
  compactView: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  defaultAgent: "claude-code",
  defaultSpectrum: "structured",
  defaultAppType: "web-app",
  defaultTeamContext: "solo",
  defaultTechStack: "",
  defaultAiProvider: "disabled",
  defaultAiModel: "deterministic",
  showWizardTips: true,
  language: "ar",
  compactView: false,
};

const SETTINGS_KEY = "user_preferences";

function normalizeSettings(value: Partial<UserSettings>): UserSettings {
  const merged = { ...DEFAULT_SETTINGS, ...value };
  const provider = isKnownAiProvider(merged.defaultAiProvider) ? merged.defaultAiProvider : "disabled";
  const model = typeof merged.defaultAiModel === "string" && merged.defaultAiModel.trim()
    ? merged.defaultAiModel.trim().slice(0, 120)
    : defaultAiModel(provider);

  const resolved = resolveAiSelectionForRuntime(provider, provider === "disabled" ? defaultAiModel(provider) : model);

  return {
    ...merged,
    defaultAiProvider: resolved.aiProvider,
    defaultAiModel: resolved.aiModel,
  };
}

export async function getSettings(): Promise<UserSettings> {
  if (databaseProvider === "sqlite") {
    const row = getSqliteClient()
      .prepare("SELECT value FROM settings WHERE key = ? LIMIT 1")
      .get(SETTINGS_KEY) as { value: string } | undefined;
    return row ? normalizeSettings(JSON.parse(row.value) as Partial<UserSettings>) : DEFAULT_SETTINGS;
  }

  const result = await getPostgresPool().query<{ value: Record<string, unknown> }>(
    "SELECT value FROM settings WHERE key = $1 LIMIT 1",
    [SETTINGS_KEY]
  );

  if (result.rows.length === 0) {
    return DEFAULT_SETTINGS;
  }

  return normalizeSettings(result.rows[0].value as Partial<UserSettings>);
}

export async function updateSettings(partial: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getSettings();
  const updated = normalizeSettings({ ...current, ...partial });

  if (databaseProvider === "sqlite") {
    getSqliteClient().prepare(`
      INSERT INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP
    `).run(SETTINGS_KEY, JSON.stringify(updated));
    return updated;
  }

  await getPostgresPool().query(
    `
      INSERT INTO settings (key, value)
      VALUES ($1, $2::jsonb)
      ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_at = NOW()
    `,
    [SETTINGS_KEY, JSON.stringify(updated)]
  );

  return updated;
}

export async function resetSettings(): Promise<UserSettings> {
  if (databaseProvider === "sqlite") {
    getSqliteClient().prepare("DELETE FROM settings WHERE key = ?").run(SETTINGS_KEY);
    return DEFAULT_SETTINGS;
  }

  await getPostgresPool().query("DELETE FROM settings WHERE key = $1", [SETTINGS_KEY]);
  return DEFAULT_SETTINGS;
}
