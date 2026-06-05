CREATE TYPE "public"."client_task_status" AS ENUM('to_prepare', 'in_progress', 'achieved');--> statement-breakpoint
CREATE TYPE "public"."subscription_type" AS ENUM('static', 'dynamic');--> statement-breakpoint
ALTER TYPE "public"."invoice_status" ADD VALUE 'partially_paid' BEFORE 'past_due';--> statement-breakpoint
CREATE TABLE "capital_injections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"founder_name" text NOT NULL,
	"amount" bigint NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "client_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "client_task_status" DEFAULT 'to_prepare' NOT NULL,
	"target_date" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"amount" bigint NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"payer" text DEFAULT 'company' NOT NULL,
	"notes" text,
	"receipt_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_line_presets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"price" bigint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_page_presets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"page_key" text NOT NULL,
	"section_key" text NOT NULL,
	"content" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "partners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"company_name" text,
	"referral_rate" integer DEFAULT 10 NOT NULL,
	"bank_details" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"founder_name" text NOT NULL,
	"amount" bigint NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "subscription_type" "subscription_type";--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "subscription_months" integer DEFAULT 12;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "subscription_start_date" timestamp;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "portal_password" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "portal_password_is_private" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "sourced_by" text DEFAULT 'organic' NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "tc_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "tc_signed_at" timestamp;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "tc_custom_terms" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "sla_custom_terms" text;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "env_rotation_interval" integer DEFAULT 6 NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "env_rotation_last_at" timestamp;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "stability_check_interval" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "stability_check_last_at" timestamp;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "expectations_check_interval" integer DEFAULT 3 NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "expectations_check_last_at" timestamp;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "amount_paid" bigint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "proof_of_payment_url" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "included_pages_json" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "dp_at" timestamp;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "discount_type" text;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "discount_value" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "received_by" text DEFAULT 'company' NOT NULL;--> statement-breakpoint
ALTER TABLE "client_tasks" ADD CONSTRAINT "client_tasks_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;