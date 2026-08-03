import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Pool } from "pg";

export type DatabaseProvider = "sqlite" | "postgres";

const isProduction = process.env.NODE_ENV === "production";
export const databaseProvider: DatabaseProvider = process.env.DATABASE_PROVIDER === "postgres" || isProduction
  ? "postgres"
  : "sqlite";

const sqlitePath = process.env.SQLITE_DATABASE_PATH?.trim() || "./data/dev.db";
const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __researchToolPostgresPool?: Pool;
  __researchToolSqlite?: Database.Database;
};

function createSqliteClient() {
  mkdirSync(dirname(sqlitePath), { recursive: true });
  const client = new Database(sqlitePath);
  client.pragma("journal_mode = WAL");
  client.pragma("foreign_keys = ON");
  ensureSqliteSchema(client);
  return client;
}

function ensureSqliteSchema(client: Database.Database) {
  client.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      one_liner TEXT NOT NULL DEFAULT '',
      spectrum_position TEXT NOT NULL DEFAULT 'structured',
      preferred_agent TEXT NOT NULL DEFAULT 'claude-code',
      app_type TEXT NOT NULL DEFAULT 'web-app',
      inputs TEXT NOT NULL,
      artifacts TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      name_ar TEXT NOT NULL,
      description TEXT NOT NULL,
      description_ar TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'box',
      category TEXT NOT NULL DEFAULT 'general',
      inputs TEXT NOT NULL,
      is_built_in INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export function getSqliteClient() {
  if (databaseProvider !== "sqlite") {
    throw new Error("SQLite client requested while DATABASE_PROVIDER is postgres");
  }

  const client = globalForDb.__researchToolSqlite ?? createSqliteClient();

  if (!isProduction) {
    globalForDb.__researchToolSqlite = client;
  }

  return client;
}

export function getPostgresPool() {
  if (databaseProvider !== "postgres") {
    throw new Error("PostgreSQL pool requested while DATABASE_PROVIDER is sqlite");
  }

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required when DATABASE_PROVIDER=postgres or NODE_ENV=production");
  }

  const pool = globalForDb.__researchToolPostgresPool ?? new Pool({ connectionString: databaseUrl });

  if (!isProduction) {
    globalForDb.__researchToolPostgresPool = pool;
  }

  return pool;
}

export async function pingDatabase() {
  if (databaseProvider === "sqlite") {
    getSqliteClient().prepare("select 1").get();
    return;
  }

  await getPostgresPool().query("select 1");
}
