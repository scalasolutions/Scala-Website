CREATE TABLE "proposal_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"client_type" text,
	"sections_json" text,
	"default_payment_model" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "payment_model" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "payment_custom_stages_json" text;--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "sections_json" text;--> statement-breakpoint
ALTER TABLE "quotations" ADD COLUMN "proposal_template_id" uuid;