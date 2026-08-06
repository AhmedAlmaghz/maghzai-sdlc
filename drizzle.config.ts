import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load environment variables from .env.local (Next.js convention)
config({ path: ".env.local", quiet: true });

const isProduction = process.env.NODE_ENV === "production";

// Use the PostgreSQL dialect whenever any Postgres connection string is
// present (Vercel Postgres exposes POSTGRES_URL; DATABASE_URL is used by
// the app runtime and can also be supplied manually).
const provider =
  process.env.DATABASE_PROVIDER === "postgres" ||
    isProduction ||
    Boolean(process.env.DATABASE_URL) ||
    Boolean(process.env.POSTGRES_URL)
    ? "postgresql"
    : "sqlite";

const postgresUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "";

export default defineConfig({
  dialect: provider,
  schema: "./src/db/schema.ts",
  // Generated migration SQL files are committed under ./drizzle so they can be
  // applied to the production database with `drizzle-kit migrate`.
  out: "./drizzle",
  dbCredentials:
    provider === "postgresql"
      ? {
        url: postgresUrl,
      }
      : {
        url: process.env.SQLITE_DATABASE_PATH?.trim() || "./data/dev.db",
      },
});
