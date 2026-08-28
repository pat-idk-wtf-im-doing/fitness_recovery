CREATE TYPE "public"."field_type" AS ENUM('number', 'text', 'select', 'scale');--> statement-breakpoint
CREATE TYPE "public"."intensity" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TABLE "entries" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_date" date NOT NULL,
	"pain_rating" smallint NOT NULL,
	"steps" integer,
	"carbs_g" integer,
	"intensity" "intensity",
	"sleep_hours" numeric(3, 1),
	"soreness_areas" text[],
	"hydration_ml" integer,
	"rpe" smallint,
	"comments" text,
	"custom" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "field_definitions" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"label" text NOT NULL,
	"type" "field_type" NOT NULL,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"unit" text,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "entries_session_date_key" ON "entries" USING btree ("session_date");--> statement-breakpoint
CREATE INDEX "entries_session_date_idx" ON "entries" USING btree ("session_date");--> statement-breakpoint
CREATE UNIQUE INDEX "field_definitions_key_key" ON "field_definitions" USING btree ("key");