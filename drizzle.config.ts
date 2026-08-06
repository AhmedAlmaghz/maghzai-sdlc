import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load environment variables from .env.local (Next.js convention)
config({ path: ".env.local", quiet: true });

const isProduction = process.env.NODE_ENV === "production";
const provider =
  process.env.DATABASE_PROVIDER === "postgres" || isProduction
    ? "postgresql"
    : "sqlite";

export default defineConfig({
  dialect: provider,
  schema: "./src/db/schema.ts",
  dbCredentials:
    provider === "postgresql"
      ? {
          url: process.env.DATABASE_URL ?? "",
        }
      : {
          url: process.env.SQLITE_DATABASE_PATH?.trim() || "./data/dev.db",
        },
});