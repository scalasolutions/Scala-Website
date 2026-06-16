CREATE TYPE "public"."quotation_status" AS ENUM('draft', 'sent', 'accepted', 'declined', 'expired', 'converted');--> statement-breakpoint
CREATE TABLE "quotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"quotation_number" text NOT NULL,
	"subtotal" bigint NOT NULL,
	"total" bigint NOT NULL,
	"discount_type" text,
	"discount_value" integer DEFAULT 0,
	"status" "quotation_status" DEFAULT 'draft' NOT NULL,
	"items_json" text NOT NULL,
	"included_pages_json" text,
	"sent_at" timestamp,
	"valid_until" timestamp,
	"converted_invoice_id" uuid,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "quotations_quotation_number_unique" UNIQUE("quotation_number")
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "hosting_plan_label" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "hosting_monthly_fee" bigint;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "hosting_included_hours" integer;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "hosting_support_overage_rate" bigint;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "hosting_free_launch" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "hosting_overage_notes" text;--> statement-breakpoint
ALTER TABLE "quotations" ADD CONSTRAINT "quotations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;