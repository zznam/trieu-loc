CREATE TABLE "reactions" (
	"target" varchar(160) NOT NULL,
	"ip_hash" varchar(64) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reactions_target_ip_hash_pk" PRIMARY KEY("target","ip_hash")
);
