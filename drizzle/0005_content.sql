CREATE TABLE "content_items" (
	"collection" varchar(20) NOT NULL,
	"id" varchar(120) NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_items_collection_id_pk" PRIMARY KEY("collection","id")
);
