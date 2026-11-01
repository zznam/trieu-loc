ALTER TABLE "contributions" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "contributions" ADD COLUMN "original" jsonb;--> statement-breakpoint
ALTER TABLE "contributions" ADD COLUMN "village_id" varchar(60);--> statement-breakpoint
ALTER TABLE "contributions" ADD COLUMN "event_date" date;--> statement-breakpoint
ALTER TABLE "contributions" ADD COLUMN "event_days" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "contributions" ADD COLUMN "event_location" varchar(200);--> statement-breakpoint
ALTER TABLE "contributions" ADD COLUMN "business_category" varchar(80);--> statement-breakpoint
ALTER TABLE "contributions" ADD COLUMN "business_phone" varchar(40);--> statement-breakpoint
CREATE INDEX "contributions_kind_published_idx" ON "contributions" USING btree ("kind","published_at");--> statement-breakpoint
-- Keep already-approved, consented photos visible in the gallery under the new publish rule.
UPDATE "contributions" SET "published_at" = COALESCE("reviewed_at", now()) WHERE "kind" = 'photo' AND "status" = 'approved' AND "consent" = true;
