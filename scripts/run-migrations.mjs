#!/usr/bin/env node
/**
 * Applies pending Drizzle migrations to the production database during the
 * Vercel build (invoked by the `vercel-build` script in package.json, which
 * runs `node ./scripts/run-migrations.mjs && next build`).
 *
 * Why this exists: the app never creates Postgres tables at runtime
 * (src/db/index.ts only auto-creates SQLite tables), so a deployed app fails
 * with `42P01: relation "projects" does not exist` unless the committed
 * migrations in ./drizzle are applied to the Vercel-managed Postgres database.
 * This script applies them BEFORE `next build` so the tables exist before any
 * traffic hits the new deployment.
 *
 * Safety guarantees:
 * - Locally (`npm run build`) NODE_ENV is not "production" and VERCEL_ENV is
 *   absent, so this script prints "skipping" and exits 0 without ever touching
 *   a database. A local build NEVER requires a Postgres connection.
 * - If no Postgres connection string is present it also skips (exit 0).
 * - If a migration fails, the error is printed to stderr and the process exits
 *   1 so the deploy fails loudly instead of silently shipping a broken app.
 *
 * Idempotency: `drizzle-kit migrate` tracks already-applied migrations in the
 * `__drizzle_migrations` table, so re-running it on every deploy is safe and
 * only applies new migrations.
 */
import { execSync } from "node:child_process";

const hasDbUrl = Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL);
const isVercel = Boolean(process.env.VERCEL_ENV);
const isProduction = process.env.NODE_ENV === "production";

// Skip unless we have a Postgres connection string AND we are in a
// production/Vercel build context.
if (!hasDbUrl || (!isVercel && !isProduction)) {
  const reason = !hasDbUrl
    ? "DATABASE_URL / POSTGRES_URL not set"
    : "not a production or Vercel build (NODE_ENV and VERCEL_ENV unset)";
  console.log(`[run-migrations] skipping migrations: ${reason}`);
  process.exit(0);
}

console.log(
  `[run-migrations] production/Vercel build detected, applying pending Drizzle migrations...`
);

try {
  // Run the exact npm script already defined in package.json
  // ("drizzle-kit migrate" for drizzle-kit v0.31.x — the correct v0.3x syntax
  // for applying committed migrations from the configured `out` directory).
  // Using the npm script avoids any drizzle-kit version/syntax drift.
  execSync("npm run db:migrate", {
    stdio: "inherit",
    env: {
      ...process.env,
      // Make the Postgres dialect explicit for drizzle.config.ts in this
      // context (it is set for the whole build, mirroring the runtime).
      DATABASE_PROVIDER: process.env.DATABASE_PROVIDER || "postgres",
    },
  });
  console.log("[run-migrations] migrations applied successfully");
} catch (error) {
  console.error("[run-migrations] migrations FAILED:");
  console.error(error instanceof Error ? error.message : error);
  console.error(
    "[run-migrations] aborting the deploy: the database schema could not be applied."
  );
  process.exit(1);
}
