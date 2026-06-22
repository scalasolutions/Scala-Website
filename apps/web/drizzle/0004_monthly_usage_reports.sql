CREATE TABLE IF NOT EXISTS "client_usage_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"month" text NOT NULL,
	"visits" integer DEFAULT 0 NOT NULL,
	"bandwidth_gb" double precision DEFAULT 0 NOT NULL,
	"storage_gb" double precision DEFAULT 0 NOT NULL,
	"peak_cpu_cores" double precision DEFAULT 0 NOT NULL,
	"peak_ram_mb" integer DEFAULT 0 NOT NULL,
	"status_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "client_usage_reports" ADD CONSTRAINT "client_usage_reports_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
