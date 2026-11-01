CREATE TYPE "public"."contribution_kind" AS ENUM('story', 'photo', 'business', 'event', 'correction', 'other');--> statement-breakpoint
CREATE TYPE "public"."contribution_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "contributions" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" "contribution_kind" NOT NULL,
	"status" "contribution_status" DEFAULT 'pending' NOT NULL,
	"name" varchar(120) NOT NULL,
	"contact" varchar(200),
	"village" varchar(120),
	"title" varchar(200) NOT NULL,
	"message" text NOT NULL,
	"photos" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"lang" varchar(2) DEFAULT 'vi' NOT NULL,
	"consent" boolean DEFAULT false NOT NULL,
	"ip_hash" varchar(64),
	"admin_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "contributions_status_created_idx" ON "contributions" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "contributions_ip_created_idx" ON "contributions" USING btree ("ip_hash","created_at");