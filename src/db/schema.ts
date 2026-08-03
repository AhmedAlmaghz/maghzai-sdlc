import { integer, jsonb, pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";

// A single "Spec Kit" generated from the Vibe-Coding -> Agentic-Engineering
// framework described in "The New SDLC with Vibe Coding" (Osmani, Saboo,
// Kartakis - Google, 2026). Each project stores the structured intake
// answers (`inputs`) and the fully generated artifact bundle (`artifacts`)
// so it can be revisited, regenerated, or exported at any time.
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  oneLiner: text("one_liner").notNull().default(""),
  spectrumPosition: text("spectrum_position").notNull().default("structured"),
  preferredAgent: text("preferred_agent").notNull().default("claude-code"),
  appType: text("app_type").notNull().default("web-app"),

  // Full structured intake (ProjectInputs) captured from the wizard.
  inputs: jsonb("inputs").notNull().$type<Record<string, unknown>>(),

  // Full generated artifact bundle (SpecKitArtifacts): PRD, architecture,
  // harness rule file, context bundle, test/eval plan, implementation plan,
  // review & deployment checklist, maintenance plan, and the master prompt.
  artifacts: jsonb("artifacts").notNull().$type<Record<string, unknown>>(),

  version: integer("version").notNull().default(1),
  isFavorite: boolean("is_favorite").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// User settings stored in database for persistence across sessions
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: jsonb("value").notNull().$type<Record<string, unknown>>(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Project templates for quick-start scenarios
export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  description: text("description").notNull(),
  descriptionAr: text("description_ar").notNull(),
  icon: text("icon").notNull().default("📦"),
  category: text("category").notNull().default("general"),
  inputs: jsonb("inputs").notNull().$type<Record<string, unknown>>(),
  isBuiltIn: boolean("is_built_in").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
