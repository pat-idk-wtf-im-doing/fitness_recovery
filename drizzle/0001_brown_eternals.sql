CREATE TYPE "public"."session_type" AS ENUM('training', 'casual');--> statement-breakpoint
ALTER TABLE "entries" ADD COLUMN "session_type" "session_type";