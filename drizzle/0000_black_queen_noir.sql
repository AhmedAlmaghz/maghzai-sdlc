CREATE TABLE "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"one_liner" text DEFAULT '' NOT NULL,
	"spectrum_position" text DEFAULT 'structured' NOT NULL,
	"preferred_agent" text DEFAULT 'claude-code' NOT NULL,
	"app_type" text DEFAULT 'web-app' NOT NULL,
	"inputs" jsonb NOT NULL,
	"artifacts" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"is_favorite" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"name_ar" text NOT NULL,
	"description" text NOT NULL,
	"description_ar" text NOT NULL,
	"icon" text DEFAULT '📦' NOT NULL,
	"category" text DEFAULT 'general' NOT NULL,
	"inputs" jsonb NOT NULL,
	"is_built_in" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "templates_slug_unique" UNIQUE("slug")
);
