CREATE TYPE "public"."message_kind" AS ENUM('guestbook', 'comment');--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"kind" "message_kind" NOT NULL,
	"target" varchar(160),
	"status" "contribution_status" DEFAULT 'pending' NOT NULL,
	"name" varchar(80) NOT NULL,
	"place" varchar(80),
	"message" text NOT NULL,
	"lang" varchar(2) DEFAULT 'vi' NOT NULL,
	"ip_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE INDEX "messages_kind_status_created_idx" ON "messages" USING btree ("kind","status","created_at");--> statement-breakpoint
CREATE INDEX "messages_target_status_idx" ON "messages" USING btree ("target","status");--> statement-breakpoint
CREATE INDEX "messages_ip_created_idx" ON "messages" USING btree ("ip_hash","created_at");